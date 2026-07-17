import { encrypt } from "@/lib/crypto";
import { normalizeSSN } from "@/lib/ssn";

/**
 * Server-side allowlist for admin edits.
 *
 * The admin UI keeps its own EDITABLE_FIELDS list, but that is a UI affordance —
 * the edit endpoint is reachable by anyone holding the admin password, so the
 * authoritative check lives here. Keep the two lists in sync.
 */
export const EDITABLE_PLAIN_FIELDS = [
  "licenseAddress",
  "licenseCity",
  "licenseState",
  "licenseZip",
  "registeringAddress",
  "employerName",
  "employerStreet",
  "employerCity",
  "employerState",
  "employerZip",
  "occupation",
] as const;

/** Allowlisted fields that must be encrypted at rest, the way intake writes them. */
export const EDITABLE_ENCRYPTED_FIELDS = ["ssn"] as const;

const ALLOWED_FIELDS = new Set<string>([
  ...EDITABLE_PLAIN_FIELDS,
  ...EDITABLE_ENCRYPTED_FIELDS,
]);

export type PatchResult =
  | { ok: true; patch: Record<string, string> }
  | { ok: false; error: string };

/**
 * Validate, normalize and encrypt one side's patch before it touches the blob.
 *
 * Sensitive values are encrypted here because both read paths fall through to
 * plaintext when a value doesn't look encrypted — so a plaintext SSN written to
 * application_json would never raise an error anywhere, it would just quietly
 * persist in the clear.
 */
export function preparePatch(
  raw: Record<string, string> | undefined,
  who: string
): PatchResult {
  const patch: Record<string, string> = {};
  for (const [field, value] of Object.entries(raw ?? {})) {
    if (!ALLOWED_FIELDS.has(field)) {
      return { ok: false, error: `${who}: "${field}" is not an editable field.` };
    }
    // Blank means "keep original" — the editor says so, and this is what stops a
    // cleared input from wiping a value the admin never meant to touch.
    if (value.trim() === "") continue;

    if (field === "ssn") {
      const check = normalizeSSN(value);
      if (!check.ok) return { ok: false, error: `${who}: ${check.error}` };
      patch[field] = encrypt(check.value);
      continue;
    }
    patch[field] = value.trim();
  }
  return { ok: true, patch };
}
