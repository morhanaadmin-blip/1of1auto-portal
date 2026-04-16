"use client";

import { motion } from "motion/react";
import { Field, Select, ContinueButton } from "@/components/ui/Field";
import DateOfBirth from "@/components/ui/DateOfBirth";
import type { PersonData } from "@/lib/types";

type Props = {
  person: PersonData;
  update: (fields: Partial<PersonData>) => void;
  isPrimary: boolean;
  onNext: () => void;
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
].map((s) => ({ value: s, label: s }));

/**
 * Parse a license address string into street/city/state/zip.
 * Example: "123 MAIN ST MIAMI FL 33312" or "123 Main St, Miami, FL 33312"
 */
function parseAddress(raw: string): { street: string; city: string; state: string; zip: string } {
  if (!raw) return { street: "", city: "", state: "", zip: "" };
  const trimmed = raw.trim();
  // Match trailing state + zip: STATE ZIP at end
  const stateZipMatch = trimmed.match(/(.*?)[,\s]+([A-Z]{2})[,\s]+(\d{5}(?:-\d{4})?)\s*$/i);
  if (stateZipMatch) {
    const before = stateZipMatch[1].trim().replace(/,$/, "").trim();
    // Try to split street and city — typically last comma or 2+ spaces separates them
    const commaParts = before.split(",").map((s) => s.trim()).filter(Boolean);
    if (commaParts.length >= 2) {
      const street = commaParts.slice(0, -1).join(", ");
      const city = commaParts[commaParts.length - 1];
      return { street, city, state: stateZipMatch[2].toUpperCase(), zip: stateZipMatch[3] };
    }
    // No commas: guess — last 1-3 words are city
    const words = before.split(/\s+/);
    if (words.length >= 2) {
      const cityWordCount = words.length <= 3 ? 1 : 2;
      const city = words.slice(-cityWordCount).join(" ");
      const street = words.slice(0, -cityWordCount).join(" ");
      return { street, city, state: stateZipMatch[2].toUpperCase(), zip: stateZipMatch[3] };
    }
    return { street: before, city: "", state: stateZipMatch[2].toUpperCase(), zip: stateZipMatch[3] };
  }
  return { street: trimmed, city: "", state: "", zip: "" };
}

export default function PageConfirm({ person, update, isPrimary, onNext }: Props) {
  // Parse DL address into structured components if fields aren't populated
  const addr = parseAddress(person.licenseAddress);
  const street = (person as unknown as Record<string, string>).licenseStreet ?? addr.street;
  const city = (person as unknown as Record<string, string>).licenseCity ?? addr.city;
  const stateCode = (person as unknown as Record<string, string>).licenseState ?? addr.state;
  const zip = (person as unknown as Record<string, string>).licenseZip ?? addr.zip;

  const updateAddressPart = (part: "street" | "city" | "state" | "zip", val: string) => {
    const current = { street, city, state: stateCode, zip };
    current[part] = val;
    const full = `${current.street}${current.city ? ", " + current.city : ""}${current.state ? ", " + current.state : ""}${current.zip ? " " + current.zip : ""}`;
    update({ licenseAddress: full });
  };

  // Missing-field hints — show what's blocking progression
  const missing: string[] = [];
  if (!person.firstName) missing.push("first name");
  if (!person.lastName) missing.push("last name");
  if (!person.email) missing.push("email");
  if (!person.phone) missing.push("phone");
  if (!person.dob) missing.push("date of birth");
  if (isPrimary && person.registeringAddressSame === null) missing.push("registering address answer");

  const canContinue = missing.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Confirm your information</h1>
        <p className="text-muted text-sm">
          Review the details below. Fix anything that&apos;s not correct.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="First name" value={person.firstName} onChange={(v) => update({ firstName: v })} required autoFilled />
        <Field label="Middle" value={person.middleName} onChange={(v) => update({ middleName: v })} autoFilled />
        <Field label="Last name" value={person.lastName} onChange={(v) => update({ lastName: v })} required autoFilled />
      </div>

      <Field label="Email" value={person.email} onChange={(v) => update({ email: v })} type="email" inputMode="email" required autoFilled />
      <Field label="Cell phone" value={person.phone} onChange={(v) => update({ phone: v })} type="tel" inputMode="tel" required autoFilled />

      <DateOfBirth value={person.dob} onChange={(v) => update({ dob: v })} required autoFilled />

      <Field label="Social security #" value={person.ssn} onChange={(v) => update({ ssn: v })} placeholder="XXX-XX-XXXX" inputMode="numeric" required />

      <Field label="Driver's license #" value={person.licenseNumber} onChange={(v) => update({ licenseNumber: v })} autoFilled />

      {/* Address — split into structured fields to match other pages */}
      <div>
        <label className="text-xs text-muted mb-1.5 flex items-center gap-2">
          <span>Address on license</span>
          {person.licenseAddress && (
            <span className="text-[10px] uppercase tracking-wider text-accent/70">Auto-filled</span>
          )}
        </label>
        <div className="space-y-3">
          <Field label="Street" value={street} onChange={(v) => updateAddressPart("street", v)} placeholder="123 Main St" />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="City" value={city} onChange={(v) => updateAddressPart("city", v)} />
            </div>
            <Select
              label="State"
              value={stateCode}
              onChange={(v) => updateAddressPart("state", v)}
              options={US_STATES}
            />
          </div>
          <Field label="ZIP" value={zip} onChange={(v) => updateAddressPart("zip", v)} inputMode="numeric" maxLength={10} />
        </div>
      </div>

      {/* Registering address branch — only for primary */}
      {isPrimary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border border-card-border rounded-xl p-4 bg-card/40"
        >
          <p className="text-sm font-medium mb-3">Is this your registering address?</p>
          <p className="text-xs text-muted mb-4">
            This is where the vehicle will be registered. If different, we&apos;ll need a utility bill.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() =>
                update({ registeringAddressSame: true, registeringAddress: person.licenseAddress })
              }
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
              <Field
                label="Registering address"
                value={person.registeringAddress}
                onChange={(v) => update({ registeringAddress: v })}
                placeholder="Street, City, State ZIP"
              />
              <p className="text-[11px] text-accent mt-2">
                You&apos;ll need to upload a utility bill on the documents page.
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Missing-field hint so user knows exactly what's needed */}
      {missing.length > 0 && (
        <p className="text-xs text-muted text-center">
          Still needed: <span className="text-error">{missing.join(", ")}</span>
        </p>
      )}

      <ContinueButton onClick={onNext} disabled={!canContinue} />
    </div>
  );
}
