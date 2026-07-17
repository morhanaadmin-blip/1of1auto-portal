/**
 * SSN handling for lender-facing records.
 *
 * Stored digits-only, matching how intake already treats phone and EIN. The PDF
 * re-formats on render (see `fSSN` in pdf-generator.ts), so the stored value
 * never needs dashes.
 */

/** Strip formatting. Mirrors sanitizeEIN / sanitizePhoneNumber at intake. */
export function sanitizeSSN(value: string): string {
  return value.replace(/\D/g, "");
}

export type SSNCheck = { ok: true; value: string } | { ok: false; error: string };

/**
 * Structural check for an admin-entered SSN, returning the digits-only form.
 *
 * Deliberately permissive about the 9xx range: those are ITINs, which are
 * legitimate on a credit application for a non-citizen buyer. Only combinations
 * that are never issued are rejected — enough to catch a fat-fingered entry
 * without blocking a real applicant.
 */
export function normalizeSSN(input: string): SSNCheck {
  const digits = sanitizeSSN(input);
  if (digits.length !== 9) {
    return { ok: false, error: `SSN must be 9 digits — got ${digits.length}.` };
  }
  if (digits.startsWith("000") || digits.startsWith("666")) {
    return { ok: false, error: `SSN cannot start with ${digits.slice(0, 3)}.` };
  }
  if (digits.slice(3, 5) === "00") {
    return { ok: false, error: "SSN middle two digits cannot be 00." };
  }
  if (digits.slice(5) === "0000") {
    return { ok: false, error: "SSN last four digits cannot be 0000." };
  }
  return { ok: true, value: digits };
}
