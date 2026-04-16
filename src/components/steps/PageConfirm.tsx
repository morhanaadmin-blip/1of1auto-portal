"use client";

import { motion } from "motion/react";
import { Field, ContinueButton } from "@/components/ui/Field";
import type { PersonData } from "@/lib/types";

type Props = {
  person: PersonData;
  update: (fields: Partial<PersonData>) => void;
  isPrimary: boolean; // primary applicant asks address question; co-applicant does not
  onNext: () => void;
};

export default function PageConfirm({ person, update, isPrimary, onNext }: Props) {
  const canContinue =
    !!person.firstName &&
    !!person.lastName &&
    !!person.email &&
    !!person.phone &&
    !!person.dob &&
    (!isPrimary || person.registeringAddressSame !== null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Confirm your information</h1>
        <p className="text-muted text-sm">
          Review the details below. Fix anything that&apos;s not correct.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field
          label="First name"
          value={person.firstName}
          onChange={(v) => update({ firstName: v })}
          required
          autoFilled
        />
        <Field
          label="Middle"
          value={person.middleName}
          onChange={(v) => update({ middleName: v })}
          autoFilled
        />
        <Field
          label="Last name"
          value={person.lastName}
          onChange={(v) => update({ lastName: v })}
          required
          autoFilled
        />
      </div>

      <Field
        label="Email"
        value={person.email}
        onChange={(v) => update({ email: v })}
        type="email"
        inputMode="email"
        required
        autoFilled
      />

      <Field
        label="Cell phone"
        value={person.phone}
        onChange={(v) => update({ phone: v })}
        type="tel"
        inputMode="tel"
        required
        autoFilled
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Date of birth"
          value={person.dob}
          onChange={(v) => update({ dob: v })}
          type="date"
          required
          autoFilled
        />
        <Field
          label="Social security #"
          value={person.ssn}
          onChange={(v) => update({ ssn: v })}
          placeholder="XXX-XX-XXXX"
          inputMode="numeric"
          required
        />
      </div>

      <Field
        label="Driver's license #"
        value={person.licenseNumber}
        onChange={(v) => update({ licenseNumber: v })}
        autoFilled
      />

      <div>
        <label className="text-xs text-muted mb-1.5 flex items-center gap-2">
          <span>Address (on license)</span>
          {person.licenseAddress && (
            <span className="text-[10px] uppercase tracking-wider text-accent/70">Auto-filled</span>
          )}
        </label>
        <textarea
          value={person.licenseAddress}
          onChange={(e) => update({ licenseAddress: e.target.value })}
          rows={2}
          className="resize-none"
        />
      </div>

      {/* CRITICAL BRANCH — only shown for primary applicant */}
      {isPrimary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border border-card-border rounded-xl p-4 bg-card/40"
        >
          <p className="text-sm font-medium mb-3">
            Is this your registering address?
          </p>
          <p className="text-xs text-muted mb-4">
            This is where the vehicle will be registered. If different from your license, we&apos;ll need a utility bill.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => update({ registeringAddressSame: true, registeringAddress: person.licenseAddress })}
              className={`py-3 rounded-lg border transition-all font-medium ${
                person.registeringAddressSame === true
                  ? "border-accent text-accent bg-accent/10"
                  : "border-card-border text-muted hover:border-foreground hover:text-foreground"
              }`}
            >
              Yes, same
            </button>
            <button
              onClick={() => update({ registeringAddressSame: false })}
              className={`py-3 rounded-lg border transition-all font-medium ${
                person.registeringAddressSame === false
                  ? "border-accent text-accent bg-accent/10"
                  : "border-card-border text-muted hover:border-foreground hover:text-foreground"
              }`}
            >
              No, different
            </button>
          </div>

          {person.registeringAddressSame === false && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4"
            >
              <label className="text-xs text-muted mb-1.5 block">Registering address</label>
              <textarea
                value={person.registeringAddress}
                onChange={(e) => update({ registeringAddress: e.target.value })}
                placeholder="Street, City, State ZIP"
                rows={2}
                className="resize-none"
              />
              <p className="text-[11px] text-accent mt-2">
                You&apos;ll need to upload a utility bill on the documents page.
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      <ContinueButton onClick={onNext} disabled={!canContinue}>
        Continue
      </ContinueButton>
    </div>
  );
}
