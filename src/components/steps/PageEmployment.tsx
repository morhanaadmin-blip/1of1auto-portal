"use client";

import { Field, Select, ContinueButton } from "@/components/ui/Field";
import type { PersonData } from "@/lib/types";

type Props = {
  person: PersonData;
  update: (fields: Partial<PersonData>) => void;
  onNext: () => void;
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
].map((s) => ({ value: s, label: s }));

const YEAR_OPTIONS = Array.from({ length: 81 }, (_, i) => ({
  value: String(i),
  label: i === 1 ? "1 year" : `${i} years`,
}));

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i),
  label: i === 1 ? "1 month" : `${i} months`,
}));

export default function PageEmployment({ person, update, onNext }: Props) {
  const canContinue =
    !!person.occupation &&
    !!person.employerName &&
    !!person.employerPhone &&
    (person.yearsWorked !== "" || person.monthsWorked !== "");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold mb-1">Employment</h1>
        <p className="text-muted text-sm">Current job details.</p>
      </div>

      <Field
        label="Occupation"
        value={person.occupation}
        onChange={(v) => update({ occupation: v })}
        placeholder="e.g. Marketing Director"
        required
      />

      <Field
        label="Employer name"
        value={person.employerName}
        onChange={(v) => update({ employerName: v })}
        placeholder="Company name"
        required
      />

      <Field
        label="Employer street address"
        value={person.employerStreet}
        onChange={(v) => update({ employerStreet: v })}
        placeholder="123 Main St"
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Field
            label="City"
            value={person.employerCity}
            onChange={(v) => update({ employerCity: v })}
          />
        </div>
        <Select
          label="State"
          value={person.employerState}
          onChange={(v) => update({ employerState: v })}
          options={US_STATES}
        />
      </div>

      <Field
        label="Employer ZIP"
        value={person.employerZip}
        onChange={(v) => update({ employerZip: v })}
        inputMode="numeric"
        maxLength={5}
      />

      <Field
        label="Employer phone"
        value={person.employerPhone}
        onChange={(v) => update({ employerPhone: v })}
        type="tel"
        inputMode="tel"
        required
      />

      <div>
        <label className="text-xs text-muted mb-1.5 flex items-center gap-2">
          <span>How long have you worked there (years of service)?</span>
          <span className="text-error">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label=""
            value={person.yearsWorked}
            onChange={(v) => update({ yearsWorked: v })}
            options={YEAR_OPTIONS}
          />
          <Select
            label=""
            value={person.monthsWorked}
            onChange={(v) => update({ monthsWorked: v })}
            options={MONTH_OPTIONS}
          />
        </div>
      </div>

      <ContinueButton onClick={onNext} disabled={!canContinue} />
    </div>
  );
}
