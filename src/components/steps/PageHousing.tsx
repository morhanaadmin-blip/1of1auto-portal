"use client";

import { Field, Select, ContinueButton } from "@/components/ui/Field";
import type { PersonData, HousingStatus } from "@/lib/types";

type Props = {
  person: PersonData;
  update: (fields: Partial<PersonData>) => void;
  onNext: () => void;
};

const YEAR_OPTIONS = Array.from({ length: 81 }, (_, i) => ({
  value: String(i),
  label: i === 1 ? "1 year" : `${i} years`,
}));

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i),
  label: i === 1 ? "1 month" : `${i} months`,
}));

export default function PageHousing({ person, update, onNext }: Props) {
  const canContinue =
    (person.yearsAtAddress !== "" || person.monthsAtAddress !== "") &&
    !!person.housingStatus &&
    !!person.monthlyHousingPayment;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Housing</h1>
        <p className="text-muted text-sm">Tell us about your current residence.</p>
      </div>

      <div>
        <label className="text-xs text-muted mb-1.5 flex items-center gap-2">
          <span>How long have you lived at this address?</span>
          <span className="text-error">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label=""
            value={person.yearsAtAddress}
            onChange={(v) => update({ yearsAtAddress: v })}
            options={YEAR_OPTIONS}
          />
          <Select
            label=""
            value={person.monthsAtAddress}
            onChange={(v) => update({ monthsAtAddress: v })}
            options={MONTH_OPTIONS}
          />
        </div>
      </div>

      <Select
        label="Housing status"
        value={person.housingStatus}
        onChange={(v) => update({ housingStatus: v as HousingStatus })}
        required
        options={[
          { value: "own", label: "Own" },
          { value: "mortgage", label: "Mortgage" },
          { value: "rent", label: "Rent" },
          { value: "family", label: "Live with family" },
          { value: "other", label: "Other" },
        ]}
      />

      <Field
        label="Monthly payment"
        value={person.monthlyHousingPayment}
        onChange={(v) => update({ monthlyHousingPayment: v })}
        placeholder="$"
        inputMode="numeric"
        required
      />

      <ContinueButton onClick={onNext} disabled={!canContinue} />
    </div>
  );
}
