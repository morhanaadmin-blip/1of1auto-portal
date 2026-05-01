"use client";

import { Field, Select, ContinueButton } from "@/components/ui/Field";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
].map((s) => ({ value: s, label: s }));
import DateOfBirth from "@/components/ui/DateOfBirth";
import type { BusinessData } from "@/lib/types";

type Props = {
  business: BusinessData;
  update: (fields: Partial<BusinessData>) => void;
  onNext: () => void;
};

export default function PageBusiness({ business, update, onNext }: Props) {
  const canContinue =
    !!business.legalName &&
    !!business.title &&
    !!business.ein &&
    !!business.phone &&
    !!business.address &&
    !!business.city &&
    !!business.state &&
    !!business.zip &&
    !!business.establishedDate &&
    !!business.stateOfIncorporation &&
    !!business.yearsInBusiness &&
    !!business.bankName &&
    !!business.bankAccountNumber;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold mb-1">Business information</h1>
        <p className="text-muted text-sm">Tell us about the business on the lease.</p>
      </div>

      <Field
        label="Legal business name"
        value={business.legalName}
        onChange={(v) => update({ legalName: v })}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Your title"
          value={business.title}
          onChange={(v) => update({ title: v })}
          placeholder="Owner / CEO / etc."
          required
        />
        <Field
          label="% ownership"
          value={business.ownershipPercent}
          onChange={(v) => update({ ownershipPercent: v })}
          placeholder="100"
          inputMode="numeric"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Tax ID (EIN)"
          value={business.ein}
          onChange={(v) => update({ ein: v })}
          placeholder="XX-XXXXXXX"
          required
        />
        <Field
          label="Business phone"
          value={business.phone}
          onChange={(v) => update({ phone: v })}
          type="text"
          inputMode="tel"
          required
        />
      </div>

      <Field
        label="Business address"
        value={business.address}
        onChange={(v) => update({ address: v })}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Apt / Suite #"
          value={business.suite}
          onChange={(v) => update({ suite: v })}
        />
        <Field
          label="P.O. Box"
          value={business.poBox}
          onChange={(v) => update({ poBox: v })}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Field
            label="City"
            value={business.city}
            onChange={(v) => update({ city: v })}
            required
          />
        </div>
        <Select
          label="State"
          value={business.state}
          onChange={(v) => update({ state: v })}
          options={US_STATES}
          required
        />
      </div>

      <Field
        label="ZIP code"
        value={business.zip}
        onChange={(v) => update({ zip: v })}
        inputMode="numeric"
        maxLength={5}
        required
      />

      <DateOfBirth
        label="Date business established"
        value={business.establishedDate}
        onChange={(v) => update({ establishedDate: v })}
        required
      />

      <Select
        label="State of incorporation"
        value={business.stateOfIncorporation}
        onChange={(v) => update({ stateOfIncorporation: v })}
        options={US_STATES}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="# of employees"
          value={business.numEmployees}
          onChange={(v) => update({ numEmployees: v })}
          inputMode="numeric"
        />
        <Field
          label="Years in business"
          value={business.yearsInBusiness}
          onChange={(v) => update({ yearsInBusiness: v })}
          inputMode="numeric"
          required
        />
      </div>

      {/* Bank Information Section */}
      <div className="pt-4 border-t border-card-border">
        <h2 className="text-sm font-semibold mb-3 text-muted uppercase tracking-wider">Banking</h2>

        <div className="space-y-4">
          <Field
            label="Bank name"
            value={business.bankName}
            onChange={(v) => update({ bankName: v })}
            required
          />

          <Field
            label="Checking account #"
            value={business.bankAccountNumber}
            onChange={(v) => update({ bankAccountNumber: v })}
            inputMode="numeric"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Contact at bank"
              value={business.bankContactName}
              onChange={(v) => update({ bankContactName: v })}
            />
            <Field
              label="Contact phone"
              value={business.bankContactPhone}
              onChange={(v) => update({ bankContactPhone: v })}
              type="text"
              inputMode="tel"
            />
          </div>
        </div>
      </div>

      <ContinueButton onClick={onNext} disabled={!canContinue}>
        Continue
      </ContinueButton>
    </div>
  );
}
