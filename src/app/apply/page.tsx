"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import Header from "@/components/Header";
import HomeIntro from "@/components/HomeIntro";
import PageScan from "@/components/steps/PageScan";
import PageConfirm from "@/components/steps/PageConfirm";
import PageHousing from "@/components/steps/PageHousing";
import PageIncome from "@/components/steps/PageIncome";
import PageEmployment from "@/components/steps/PageEmployment";
import PageCoAppOrBusiness from "@/components/steps/PageCoAppOrBusiness";
import PageBusiness from "@/components/steps/PageBusiness";
import PageDocuments from "@/components/steps/PageDocuments";
import PageAgreement from "@/components/steps/PageAgreement";
import PageDepositSubmit from "@/components/steps/PageDepositSubmit";
import PageConfirmation from "@/components/steps/PageConfirmation";
import {
  emptyApplication,
  emptyPerson,
  emptyBusiness,
  type ApplicationData,
  type PersonData,
} from "@/lib/types";

/**
 * Flow routing:
 * 0  = DL Scan (primary)
 * 1  = Confirm Info (primary) — asks "is DL address your registering address?"
 * 2  = Housing (primary, skip if DL != registering address and utility flagged)
 * 3  = Income (primary)
 * 4  = Employment (primary)
 * 5  = Co-Applicant or Business branching decision
 * 5a = Co-App DL Scan → Confirm → Housing → Income → Employment (no address question)
 * 5b = Business Info → Bank Info → Housing → Income → Employment
 * 6  = Documents (conditionally includes utility bill + business license)
 * 7  = Agreement + Signature
 * 8  = Deposit + Submit
 * 9  = Confirmation (after submit)
 */

type Step =
  | "scan-primary"
  | "confirm-primary"
  | "housing-primary"
  | "income-primary"
  | "employment-primary"
  | "co-or-business"
  | "scan-coapp"
  | "confirm-coapp"
  | "housing-coapp"
  | "income-coapp"
  | "employment-coapp"
  | "business-info"
  | "housing-business"
  | "income-business"
  | "employment-business"
  | "documents"
  | "agreement"
  | "deposit"
  | "confirmation";

function ApplyFlow() {
  const searchParams = useSearchParams();
  const [showIntro, setShowIntro] = useState(true);
  const [step, setStep] = useState<Step>("scan-primary");
  const [data, setData] = useState<ApplicationData>(emptyApplication());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reuploadBanner, setReuploadBanner] = useState(false);

  // Handle payment return from Stripe OR pre-fill from CRM URL params
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success" || paymentStatus === "cancel") {
      // Restore saved application state after Stripe redirect
      // localStorage survives external redirects on mobile; sessionStorage does not
      const saved = localStorage.getItem("1of1_app_data");
      if (saved) {
        try {
          const savedData = JSON.parse(saved);
          const restored = paymentStatus === "success"
            ? { ...savedData, depositPaid: true, stripeSessionId: "stripe_verified" }
            : savedData;
          setData(restored);
          localStorage.removeItem("1of1_app_data");

          // Insurance/registration Files are lost on Stripe redirect — route back to re-upload.
          // DL is recovered from licenseImage (data URL survives JSON), so no re-upload needed.
          const docs = restored.documents;
          const missingRequired =
            (!docs.insurance && !docs.insuranceOptional) ||
            (!docs.registration && !docs.registrationOptional);
          if (missingRequired) {
            setReuploadBanner(true);
            setStep("documents");
          } else {
            setStep("deposit");
          }
        } catch {
          setStep("deposit");
        }
      } else if (paymentStatus === "success") {
        // State was lost (e.g. mobile browser cleared storage) but payment went through —
        // still mark deposit paid so the user isn't charged twice
        setData((prev) => ({ ...prev, depositPaid: true, stripeSessionId: "stripe_verified" }));
        setStep("deposit");
      }
    } else {
      // Pre-fill primary applicant from URL (CRM data Mor provides)
      setData((prev) => ({
        ...prev,
        primary: {
          ...prev.primary,
          firstName: searchParams.get("fn") || "",
          middleName: searchParams.get("mn") || "",
          lastName: searchParams.get("ln") || "",
          email: searchParams.get("email") || "",
          phone: searchParams.get("phone") || "",
        },
      }));
    }
  }, [searchParams]);

  const updatePrimary = (fields: Partial<PersonData>) => {
    setData((prev) => ({ ...prev, primary: { ...prev.primary, ...fields } }));
    setError("");
  };

  const updateCoApp = (fields: Partial<PersonData>) => {
    setData((prev) => ({
      ...prev,
      coApplicant: { ...(prev.coApplicant || emptyPerson()), ...fields },
    }));
    setError("");
  };

  const updateBusiness = (fields: Partial<ApplicationData["business"]>) => {
    setData((prev) => ({
      ...prev,
      business: { ...(prev.business || emptyBusiness()), ...fields } as ApplicationData["business"],
    }));
    setError("");
  };

  const updateDocuments = (fields: Partial<ApplicationData["documents"]>) => {
    setData((prev) => ({ ...prev, documents: { ...prev.documents, ...fields } }));
    setError("");
  };

  const updateAgreement = (fields: Partial<ApplicationData["agreement"]>) => {
    setData((prev) => ({ ...prev, agreement: { ...prev.agreement, ...fields } }));
    setError("");
  };

  /**
   * setMode — switches application type WITHOUT wiping data.
   * Creates empty co-applicant/business only if one doesn't already exist.
   * Previously-entered co-applicant and business data is preserved even when
   * the user toggles mode back and forth.
   */
  const setMode = (mode: ApplicationData["mode"]) => {
    setData((prev) => ({
      ...prev,
      mode,
      coApplicant:
        mode === "co-applicant"
          ? prev.coApplicant || emptyPerson()
          : prev.coApplicant, // preserve even when switching away
      business:
        mode === "business"
          ? prev.business || emptyBusiness()
          : prev.business, // preserve even when switching away
    }));
  };

  // Navigation logic — spec-driven branching
  const next = () => {
    switch (step) {
      case "scan-primary":
        setStep("confirm-primary");
        break;
      case "confirm-primary":
        setStep("housing-primary");
        break;
      case "housing-primary":
        setStep("income-primary");
        break;
      case "income-primary":
        setStep("employment-primary");
        break;
      case "employment-primary":
        setStep("co-or-business");
        break;
      case "co-or-business":
        if (data.mode === "co-applicant") setStep("scan-coapp");
        else if (data.mode === "business") setStep("business-info");
        else setStep("documents");
        break;
      case "scan-coapp":
        setStep("confirm-coapp");
        break;
      case "confirm-coapp":
        setStep("housing-coapp");
        break;
      case "housing-coapp":
        setStep("income-coapp");
        break;
      case "income-coapp":
        setStep("employment-coapp");
        break;
      case "employment-coapp":
        setStep("documents");
        break;
      case "business-info":
        setStep("documents");
        break;
      case "documents":
        setStep("agreement");
        break;
      case "agreement":
        setStep("deposit");
        break;
      case "deposit":
        setStep("confirmation");
        break;
    }
  };

  const back = () => {
    switch (step) {
      case "confirm-primary": setStep("scan-primary"); break;
      case "housing-primary": setStep("confirm-primary"); break;
      case "income-primary": setStep("housing-primary"); break;
      case "employment-primary": setStep("income-primary"); break;
      case "co-or-business": setStep("employment-primary"); break;
      case "scan-coapp": setStep("co-or-business"); break;
      case "confirm-coapp": setStep("scan-coapp"); break;
      case "housing-coapp": setStep("confirm-coapp"); break;
      case "income-coapp": setStep("housing-coapp"); break;
      case "employment-coapp": setStep("income-coapp"); break;
      case "business-info": setStep("co-or-business"); break;
      case "housing-business": setStep("business-info"); break;
      case "income-business": setStep("housing-business"); break;
      case "employment-business": setStep("income-business"); break;
      case "documents":
        if (data.mode === "co-applicant") setStep("employment-coapp");
        else if (data.mode === "business") setStep("business-info");
        else setStep("co-or-business");
        break;
      case "agreement": setStep("documents"); break;
      case "deposit": setStep("agreement"); break;
    }
  };

  // Reconstruct a File from a base64 data URL (used to recover DL scan after Stripe redirect).
  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const [header, b64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new File([arr], filename, { type: mime });
  };

  // Compress image files to keep total payload under Vercel's 4.5MB limit.
  // Skips non-image files (PDFs) unchanged. Falls back to original on any error.
  const compressFile = async (file: File, maxKB = 900): Promise<File> => {
    try {
      if (!file.type.startsWith("image/") || file.size <= maxKB * 1024) return file;
      return await new Promise((resolve) => {
        const img = new Image();
        let url: string;
        try { url = URL.createObjectURL(file); } catch { resolve(file); return; }
        img.onload = () => {
          URL.revokeObjectURL(url);
          try {
            const maxDim = 1920;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
              const ratio = Math.min(maxDim / width, maxDim / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) { resolve(file); return; }
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }) : file),
              "image/jpeg",
              0.75
            );
          } catch { resolve(file); }
        };
        img.onerror = () => { try { URL.revokeObjectURL(url); } catch {} resolve(file); };
        img.src = url;
      });
    } catch {
      return file;
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      // If licenseFile was lost on Stripe redirect, recover it from the licenseImage data URL
      const primaryLicenseFile = data.primary.licenseFile
        ?? (data.primary.licenseImage ? dataURLtoFile(data.primary.licenseImage, "primary-license.jpg") : null);
      const coappLicenseFile = data.coApplicant?.licenseFile
        ?? (data.coApplicant?.licenseImage ? dataURLtoFile(data.coApplicant.licenseImage, "coapp-license.jpg") : null)
        ?? null;

      // Compress images before upload to stay under Vercel's 4.5MB body limit
      const [primaryLicense, coappLicense, insurance, registration, utilityBill, dlPhoto, bizLicense] =
        await Promise.all([
          primaryLicenseFile ? compressFile(primaryLicenseFile) : null,
          coappLicenseFile ? compressFile(coappLicenseFile) : null,
          data.documents.insurance ? compressFile(data.documents.insurance) : null,
          data.documents.registration ? compressFile(data.documents.registration) : null,
          data.documents.utilityBill ? compressFile(data.documents.utilityBill) : null,
          data.documents.driverLicensePhoto ? compressFile(data.documents.driverLicensePhoto) : null,
          data.documents.businessLicense ? compressFile(data.documents.businessLicense) : null,
        ]);

      const formData = new FormData();
      formData.append("application", JSON.stringify({
        ...data,
        primary: { ...data.primary, licenseFile: null, licenseImage: null, dlPhotoTracking: null },
        coApplicant: data.coApplicant
          ? { ...data.coApplicant, licenseFile: null, licenseImage: null, dlPhotoTracking: null }
          : null,
        documents: { ...data.documents, driverLicensePhoto: null },
      }));

      if (primaryLicense) formData.append("primary_license", primaryLicense);
      if (coappLicense) formData.append("coapp_license", coappLicense);
      if (insurance) formData.append("insurance", insurance);
      if (registration) formData.append("registration", registration);
      if (utilityBill) formData.append("utility_bill", utilityBill);
      if (dlPhoto) formData.append("driver_license_photo", dlPhoto);
      if (bizLicense) formData.append("business_license", bizLicense);

      const res = await fetch("/api/submit", { method: "POST", body: formData });

      // Parse response safely — non-JSON (e.g. Vercel 413) would crash res.json()
      let body: Record<string, unknown>;
      try {
        body = await res.json();
      } catch {
        if (res.status === 413) throw new Error("Files are too large. Please try again — images will be compressed automatically.");
        throw new Error(`Server error (${res.status}). Please try again.`);
      }

      if (!res.ok) {
        throw new Error((body.error as string) || "Submission failed");
      }

      // Check for upload errors even if submission was "successful"
      if (body.uploadErrors && Object.keys(body.uploadErrors as object).length > 0) {
        const errorList = Object.entries(body.uploadErrors as Record<string, string>)
          .map(([file, err]) => `${file}: ${err}`)
          .join("\n");
        throw new Error(`File upload failed:\n${errorList}`);
      }

      next();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate total steps + current step index for progress bar
  const getStepIndex = (): [number, number] => {
    const primarySteps = ["scan-primary", "confirm-primary", "housing-primary", "income-primary", "employment-primary"];
    const decisionStep = ["co-or-business"];
    const coAppSteps = ["scan-coapp", "confirm-coapp", "housing-coapp", "income-coapp", "employment-coapp"];
    const businessSteps = ["business-info", "housing-business", "income-business", "employment-business"];
    const endSteps = ["documents", "agreement", "deposit"];

    const baseTotal = primarySteps.length + decisionStep.length;
    let total = baseTotal;
    if (data.mode === "co-applicant") total += coAppSteps.length;
    if (data.mode === "business") total += businessSteps.length;
    total += endSteps.length;

    const allInOrder = [
      ...primarySteps,
      ...decisionStep,
      ...(data.mode === "co-applicant" ? coAppSteps : []),
      ...(data.mode === "business" ? businessSteps : []),
      ...endSteps,
    ];
    const current = allInOrder.indexOf(step as string);
    return [current >= 0 ? current : 0, total];
  };

  const [currentIdx, totalSteps] = getStepIndex();

  if (showIntro) {
    return <HomeIntro onComplete={() => setShowIntro(false)} />;
  }

  if (step === "confirmation") {
    return <PageConfirmation data={data} />;
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header step={currentIdx} totalSteps={totalSteps} />

      <div className="flex-1 w-full max-w-lg mx-auto px-5 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Render the correct step component */}
            {step === "scan-primary" && (
              <PageScan person={data.primary} update={updatePrimary} onNext={next} />
            )}
            {step === "confirm-primary" && (
              <PageConfirm person={data.primary} update={updatePrimary} isPrimary={true} onNext={next} />
            )}
            {step === "housing-primary" && (
              <PageHousing person={data.primary} update={updatePrimary} onNext={next} />
            )}
            {step === "income-primary" && (
              <PageIncome person={data.primary} update={updatePrimary} onNext={next} />
            )}
            {step === "employment-primary" && (
              <PageEmployment person={data.primary} update={updatePrimary} onNext={next} />
            )}
            {step === "co-or-business" && (
              <PageCoAppOrBusiness mode={data.mode} setMode={setMode} onNext={next} />
            )}
            {step === "scan-coapp" && data.coApplicant && (
              <PageScan person={data.coApplicant} update={updateCoApp} onNext={next} isCoApp={true} />
            )}
            {step === "confirm-coapp" && data.coApplicant && (
              <PageConfirm person={data.coApplicant} update={updateCoApp} isPrimary={false} onNext={next} />
            )}
            {step === "housing-coapp" && data.coApplicant && (
              <PageHousing person={data.coApplicant} update={updateCoApp} onNext={next} />
            )}
            {step === "income-coapp" && data.coApplicant && (
              <PageIncome person={data.coApplicant} update={updateCoApp} onNext={next} />
            )}
            {step === "employment-coapp" && data.coApplicant && (
              <PageEmployment person={data.coApplicant} update={updateCoApp} onNext={next} />
            )}
            {step === "business-info" && (
              <PageBusiness business={data.business!} update={updateBusiness} onNext={next} />
            )}
            {step === "housing-business" && (
              <PageHousing person={data.primary} update={updatePrimary} onNext={next} />
            )}
            {step === "income-business" && (
              <PageIncome person={data.primary} update={updatePrimary} onNext={next} />
            )}
            {step === "employment-business" && (
              <PageEmployment person={data.primary} update={updatePrimary} onNext={next} />
            )}
            {step === "documents" && (
              <>
                {reuploadBanner && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent"
                  >
                    <strong>One more step.</strong> Your $99 payment went through. Please re-attach your documents below to complete your submission.
                  </motion.div>
                )}
                <PageDocuments
                  data={data}
                  updateDocs={updateDocuments}
                  onNext={() => { setReuploadBanner(false); next(); }}
                />
              </>
            )}
            {step === "agreement" && (
              <PageAgreement agreement={data.agreement} update={updateAgreement} onNext={next} />
            )}
            {step === "deposit" && (
              <PageDepositSubmit
                data={data}
                setData={setData}
                submit={submit}
                submitting={submitting}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-sm text-error text-center"
          >
            {error}
          </motion.p>
        )}

        {step !== "scan-primary" && step !== "scan-coapp" && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={back}
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted">Loading...</div>}>
      <ApplyFlow />
    </Suspense>
  );
}
