"use client";

import { motion } from "motion/react";
import { ContinueButton } from "@/components/ui/Field";
import type { ApplicationData, DocumentData } from "@/lib/types";

type Props = {
  data: ApplicationData;
  updateDocs: (fields: Partial<DocumentData>) => void;
  onNext: () => void;
};

function DocUploader({
  label,
  description,
  file,
  required,
  onFile,
}: {
  label: string;
  description: string;
  file: File | null;
  required: boolean;
  onFile: (f: File) => void;
}) {
  return (
    <motion.label
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`block border rounded-xl p-4 cursor-pointer transition-all ${
        file
          ? "border-accent bg-accent/5"
          : "border-card-border hover:border-muted hover:bg-card/30"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{label}</span>
          {required && <span className="text-[10px] uppercase tracking-wider text-accent">Required</span>}
        </div>
        {file ? (
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </div>
      <p className="text-xs text-muted mb-2">{description}</p>
      {file && <p className="text-xs text-accent truncate">{file.name}</p>}
      <input
        type="file"
        accept="image/*,.pdf"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </motion.label>
  );
}

export default function PageDocuments({ data, updateDocs, onNext }: Props) {
  // Conditional requirements
  const needsUtilityBill = data.primary.registeringAddressSame === false;
  const needsBusinessLicense = data.mode === "business";

  const canContinue =
    !!data.documents.insurance &&
    !!data.documents.registration &&
    (!needsUtilityBill || !!data.documents.utilityBill) &&
    (!needsBusinessLicense || !!data.documents.businessLicense);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold mb-1">Documents</h1>
        <p className="text-muted text-sm">
          Photo or PDF works. Camera preferred on mobile.
        </p>
      </div>

      <div className="space-y-3">
        <DocUploader
          label="Current auto insurance"
          description="Your insurance declaration page or card"
          file={data.documents.insurance}
          required={true}
          onFile={(f) => updateDocs({ insurance: f })}
        />

        <DocUploader
          label="Current registration"
          description="Registration for your current vehicle (for tag transfer)"
          file={data.documents.registration}
          required={true}
          onFile={(f) => updateDocs({ registration: f })}
        />

        {needsUtilityBill && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <DocUploader
              label="Utility bill"
              description="Proof of residence at your registering address (not on license)"
              file={data.documents.utilityBill}
              required={true}
              onFile={(f) => updateDocs({ utilityBill: f })}
            />
          </motion.div>
        )}

        {needsBusinessLicense && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <DocUploader
              label="Business registration"
              description="SunBiz certificate or equivalent state registration"
              file={data.documents.businessLicense}
              required={true}
              onFile={(f) => updateDocs({ businessLicense: f })}
            />
          </motion.div>
        )}
      </div>

      <ContinueButton onClick={onNext} disabled={!canContinue}>
        Continue
      </ContinueButton>
    </div>
  );
}
