"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import QRCode from "qrcode";
import { ContinueButton } from "@/components/ui/Field";
import type { CoAppRelationship } from "@/lib/types";

type Props = {
  primaryFirstName: string;
  primaryLastName: string;
  primaryEmail: string;
  relationship: CoAppRelationship | "";
  setRelationship: (r: CoAppRelationship) => void;
  inviteToken: string;
  inviteLink: string;
  invitePhone: string;
  setInviteState: (s: { token: string; link: string; phone: string }) => void;
  onNext: () => void;
};

const RELATIONSHIP_OPTIONS: { value: CoAppRelationship; label: string; icon: string }[] = [
  { value: "spouse", label: "Spouse", icon: "💍" },
  { value: "relative", label: "Relative", icon: "👨‍👩‍👧" },
  { value: "partner", label: "Partner", icon: "🤝" },
  { value: "other", label: "Other", icon: "👤" },
];

const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export default function PageCoAppInvite({
  primaryFirstName,
  primaryLastName,
  primaryEmail,
  relationship,
  setRelationship,
  inviteToken,
  inviteLink,
  invitePhone,
  setInviteState,
  onNext,
}: Props) {
  const [phone, setPhone] = useState(invitePhone);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  // Whenever a link exists, render its QR. The link only changes when invite is (re)sent.
  useEffect(() => {
    if (!inviteLink) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(inviteLink, { errorCorrectionLevel: "M", margin: 1, scale: 6 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [inviteLink]);

  const phoneDigits = phone.replace(/\D/g, "");
  const canSend = !!relationship && phoneDigits.length === 10 && !sending;
  const hasSent = !!inviteToken && !!inviteLink;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/coapp/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryFirstName,
          primaryLastName,
          primaryEmail,
          relationship,
          coApplicantPhone: phoneDigits,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Could not send the invite. Please try again.");
      }
      setInviteState({ token: body.token, link: body.link, phone: phoneDigits });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the invite.");
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      // Clipboard API can be blocked — silently no-op; user can long-press to copy.
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Invite your co-applicant</h1>
        <p className="text-muted text-sm">
          They&apos;ll fill out their own portion on their phone. You won&apos;t need to enter
          their info here.
        </p>
      </div>

      <div>
        <p className="text-xs text-muted mb-2">Relationship to co-applicant</p>
        <div className="grid grid-cols-2 gap-3">
          {RELATIONSHIP_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04 }}
              onClick={() => setRelationship(opt.value)}
              disabled={hasSent}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                relationship === opt.value
                  ? "border-accent bg-accent/10"
                  : "border-card-border hover:border-muted"
              }`}
            >
              <span className="text-xl">{opt.icon}</span>
              <span
                className={`text-sm font-medium ${
                  relationship === opt.value ? "text-accent" : "text-foreground"
                }`}
              >
                {opt.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-muted mb-1.5 flex items-center gap-2">
          <span>Co-applicant&apos;s mobile phone</span>
          <span className="text-error">*</span>
        </label>
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="(555) 123-4567"
          maxLength={14}
          disabled={hasSent}
        />
        <p className="text-[11px] text-muted mt-1.5">
          We&apos;ll send a one-time link to this number so they can complete their portion.
        </p>
      </div>

      {!hasSent && (
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="w-full py-3.5 rounded-xl bg-accent text-black font-semibold hover:bg-accent-dark transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? "Sending link…" : "Send link"}
        </button>
      )}

      {hasSent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-success/30 bg-success/5 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Link sent to {formatPhone(invitePhone)}</p>
              <p className="text-xs text-muted mt-0.5">
                Or have your co-applicant scan the code below if they&apos;re with you.
              </p>
            </div>
          </div>

          {qrDataUrl && (
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-3 rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Co-applicant invite QR code" className="w-48 h-48" />
              </div>
              <button
                onClick={handleCopy}
                className="text-[11px] text-muted hover:text-accent transition-colors underline underline-offset-2"
              >
                {linkCopied ? "Copied!" : "Copy link instead"}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {error && <p className="text-xs text-error">{error}</p>}

      <ContinueButton onClick={onNext} disabled={!hasSent}>
        {hasSent ? "Continue" : "Send the link to continue"}
      </ContinueButton>
    </div>
  );
}
