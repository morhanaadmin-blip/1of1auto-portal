"use client";

import { useEffect, useState, use as usePromise } from "react";
import { AnimatePresence, motion } from "motion/react";
import Header from "@/components/Header";
import PageScan from "@/components/steps/PageScan";
import PageConfirm from "@/components/steps/PageConfirm";
import PageHousing from "@/components/steps/PageHousing";
import PageIncome from "@/components/steps/PageIncome";
import PageEmployment from "@/components/steps/PageEmployment";
import { emptyPerson, type PersonData, type CoAppRelationship } from "@/lib/types";

type Step =
  | "intro"
  | "scan"
  | "confirm"
  | "housing"
  | "income"
  | "employment"
  | "submitting"
  | "done"
  | "expired"
  | "not-found";

const PROGRESS_STEPS: Step[] = [
  "scan",
  "confirm",
  "housing",
  "income",
  "employment",
];

type InviteMeta = {
  primaryFirstName: string;
  primaryLastName: string;
  relationship: CoAppRelationship;
  alreadySubmitted: boolean;
};

const RELATIONSHIP_LABEL: Record<CoAppRelationship, string> = {
  spouse: "spouse",
  relative: "relative",
  partner: "partner",
  other: "co-applicant",
};

export default function CoAppEntryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = usePromise(params);
  const [step, setStep] = useState<Step>("intro");
  const [meta, setMeta] = useState<InviteMeta | null>(null);
  const [metaError, setMetaError] = useState("");
  const [person, setPerson] = useState<PersonData>(emptyPerson());
  const [submitError, setSubmitError] = useState("");

  // Fetch invite metadata on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/coapp/${token}`);
        if (!cancelled) {
          if (res.status === 404) {
            setStep("not-found");
            return;
          }
          if (!res.ok) {
            setMetaError("Could not load this invite. Please try again later.");
            return;
          }
          const body = (await res.json()) as InviteMeta;
          if (body.alreadySubmitted) {
            setStep("expired");
            return;
          }
          setMeta(body);
        }
      } catch {
        if (!cancelled) setMetaError("Network error loading invite.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const updatePerson = (fields: Partial<PersonData>) => {
    setPerson((prev) => ({ ...prev, ...fields }));
  };

  const next = () => {
    switch (step) {
      case "intro":
        setStep("scan");
        break;
      case "scan":
        setStep("confirm");
        break;
      case "confirm":
        setStep("housing");
        break;
      case "housing":
        setStep("income");
        break;
      case "income":
        setStep("employment");
        break;
      case "employment":
        void submit();
        break;
    }
  };

  const submit = async () => {
    setStep("submitting");
    setSubmitError("");
    try {
      const fd = new FormData();
      // Strip the File slot from JSON; it's sent separately if present.
      const personForJson: PersonData = {
        ...person,
        licenseFile: null,
        licenseImage: person.licenseImage, // base64 preview survives serialization
      };
      fd.append("coapp", JSON.stringify(personForJson));
      if (person.licenseFile) {
        fd.append("license", person.licenseFile);
      } else if (person.licenseImage) {
        // Convert base64 preview to a File so storage holds an actual image asset.
        try {
          const blob = dataUrlToBlob(person.licenseImage);
          if (blob) fd.append("license", new File([blob], "coapp-license.jpg", { type: blob.type }));
        } catch {
          // Non-fatal — submission still goes through; license can be supplied later.
        }
      }
      const res = await fetch(`/api/coapp/${token}/submit`, {
        method: "POST",
        body: fd,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Submit failed");
      setStep("done");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submit failed");
      setStep("employment");
    }
  };

  if (metaError) {
    return <CenteredMessage title="Something went wrong" body={metaError} />;
  }
  if (step === "not-found") {
    return (
      <CenteredMessage
        title="Invite not found"
        body="This link looks invalid or expired. Please ask the primary applicant to send a new one."
      />
    );
  }
  if (step === "expired") {
    return (
      <CenteredMessage
        title="Already completed"
        body="Looks like this co-applicant portion was already submitted. If that wasn't you, contact 1 OF 1 AUTO."
      />
    );
  }
  if (!meta) {
    return <CenteredMessage title="Loading…" body="One sec — loading your invite." />;
  }
  if (step === "done") {
    return (
      <CenteredMessage
        title="All done — thank you!"
        body={`Your portion has been submitted to ${meta.primaryFirstName}'s application. You're free to close this tab.`}
        success
      />
    );
  }
  if (step === "submitting") {
    return <CenteredMessage title="Submitting…" body="Sending your info securely." />;
  }
  if (step === "intro") {
    return (
      <IntroPage
        primaryName={`${meta.primaryFirstName} ${meta.primaryLastName}`.trim()}
        relationshipLabel={RELATIONSHIP_LABEL[meta.relationship] || "co-applicant"}
        onStart={() => setStep("scan")}
      />
    );
  }

  // Steps 1–5: progress + step component
  const currentIdx = PROGRESS_STEPS.indexOf(step);
  return (
    <main className="min-h-screen flex flex-col">
      <Header step={currentIdx >= 0 ? currentIdx : 0} totalSteps={PROGRESS_STEPS.length} />
      <div className="flex-1 w-full max-w-lg mx-auto px-5 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {step === "scan" && (
              <PageScan person={person} update={updatePerson} onNext={next} isCoApp />
            )}
            {step === "confirm" && (
              <PageConfirm person={person} update={updatePerson} isPrimary={false} onNext={next} />
            )}
            {step === "housing" && (
              <PageHousing person={person} update={updatePerson} onNext={next} />
            )}
            {step === "income" && (
              <PageIncome person={person} update={updatePerson} onNext={next} />
            )}
            {step === "employment" && (
              <PageEmployment person={person} update={updatePerson} onNext={next} />
            )}
          </motion.div>
        </AnimatePresence>

        {submitError && (
          <p className="mt-4 text-sm text-error text-center">{submitError}</p>
        )}
      </div>
    </main>
  );
}

function IntroPage({
  primaryName,
  relationshipLabel,
  onStart,
}: {
  primaryName: string;
  relationshipLabel: string;
  onStart: () => void;
}) {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 w-full max-w-lg mx-auto px-5 py-12 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-accent mb-2">
              Co-applicant portion
            </p>
            <h1 className="text-3xl font-bold mb-2">Hi — let&apos;s finish this together.</h1>
            <p className="text-muted">
              {primaryName} added you as their {relationshipLabel} on a 1 OF 1 AUTO application.
              We just need a few details from you. Takes about 3 minutes.
            </p>
          </div>

          <ul className="space-y-2 text-sm text-muted">
            <li>— Scan your driver&apos;s license</li>
            <li>— Confirm your info</li>
            <li>— Housing, income, employment</li>
            <li>— No payment needed on your end</li>
          </ul>

          <button
            onClick={onStart}
            className="w-full py-3.5 rounded-xl bg-accent text-black font-semibold hover:bg-accent-dark transition-all active:scale-[0.98]"
          >
            Start
          </button>
        </motion.div>
      </div>
    </main>
  );
}

function CenteredMessage({
  title,
  body,
  success,
}: {
  title: string;
  body: string;
  success?: boolean;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md text-center space-y-3"
      >
        <h1 className={`text-2xl font-bold ${success ? "text-success" : ""}`}>{title}</h1>
        <p className="text-muted text-sm">{body}</p>
      </motion.div>
    </main>
  );
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [header, b64] = dataUrl.split(",");
    if (!b64) return null;
    const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  } catch {
    return null;
  }
}
