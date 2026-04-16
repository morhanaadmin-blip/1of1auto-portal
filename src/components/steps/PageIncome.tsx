"use client";

import { Field, ContinueButton } from "@/components/ui/Field";
import type { PersonData } from "@/lib/types";

type Props = {
  person: PersonData;
  update: (fields: Partial<PersonData>) => void;
  onNext: () => void;
};

export default function PageIncome({ person, update, onNext }: Props) {
  const canContinue = !!person.annualIncome || !!person.monthlyIncome;

  const handleAnnual = (v: string) => {
    update({
      annualIncome: v,
      monthlyIncome: v ? Math.round(parseFloat(v.replace(/[^\d.]/g, "") || "0") / 12).toString() : "",
    });
  };

  const handleMonthly = (v: string) => {
    update({
      monthlyIncome: v,
      annualIncome: v ? Math.round(parseFloat(v.replace(/[^\d.]/g, "") || "0") * 12).toString() : "",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Income</h1>
        <p className="text-muted text-sm">Enter annual or monthly — we&apos;ll calculate the other.</p>
      </div>

      <Field
        label="Annual salary"
        value={person.annualIncome}
        onChange={handleAnnual}
        placeholder="$"
        inputMode="numeric"
      />

      <div className="text-center text-xs text-muted">— or —</div>

      <Field
        label="Monthly salary"
        value={person.monthlyIncome}
        onChange={handleMonthly}
        placeholder="$"
        inputMode="numeric"
      />

      <ContinueButton onClick={onNext} disabled={!canContinue} />
    </div>
  );
}
