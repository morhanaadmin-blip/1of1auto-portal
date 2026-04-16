"use client";

import { motion } from "motion/react";
import { ContinueButton } from "@/components/ui/Field";
import type { ApplicationMode } from "@/lib/types";

type Props = {
  mode: ApplicationMode;
  setMode: (mode: ApplicationMode) => void;
  onNext: () => void;
};

const OPTIONS: { value: ApplicationMode; title: string; description: string; icon: string }[] = [
  {
    value: "individual",
    title: "Just me",
    description: "Standard individual application",
    icon: "👤",
  },
  {
    value: "co-applicant",
    title: "Add co-applicant",
    description: "Spouse or joint signer",
    icon: "👥",
  },
  {
    value: "business",
    title: "Business application",
    description: "Lease under business name",
    icon: "🏢",
  },
];

export default function PageCoAppOrBusiness({ mode, setMode, onNext }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Application type</h1>
        <p className="text-muted text-sm">How would you like to structure this application?</p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            onClick={() => setMode(opt.value)}
            className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
              mode === opt.value
                ? "border-accent bg-accent/10"
                : "border-card-border hover:border-muted"
            }`}
          >
            <span className="text-2xl">{opt.icon}</span>
            <div className="flex-1">
              <p className={`font-semibold ${mode === opt.value ? "text-accent" : "text-foreground"}`}>
                {opt.title}
              </p>
              <p className="text-xs text-muted mt-0.5">{opt.description}</p>
            </div>
            {mode === opt.value && (
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </motion.button>
        ))}
      </div>

      <ContinueButton onClick={onNext}>Continue</ContinueButton>
    </div>
  );
}
