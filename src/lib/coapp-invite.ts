import crypto from "crypto";

export function generateInviteToken(): string {
  // 24 bytes → 32 url-safe chars. Cryptographically random.
  return crypto.randomBytes(24).toString("base64url");
}

export function buildInviteLink(token: string, req?: Request): string {
  const fromEnv =
    (process.env.NEXT_PUBLIC_APP_URL || "").trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.trim()}` : "");
  const origin = fromEnv || (req ? new URL(req.url).origin : "");
  return `${origin}/apply/coapp/${token}`;
}

type SmsResult = { sent: boolean; reason?: string };

/**
 * Sends the co-applicant invite SMS via Twilio. If Twilio creds are missing,
 * we skip silently so the rest of the flow (QR + on-screen link) still works.
 */
export async function sendCoAppInviteSms(args: {
  toPhone: string;
  primaryName: string;
  link: string;
}): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  if (!sid || !token || !from) {
    return { sent: false, reason: "twilio-not-configured" };
  }

  const to = args.toPhone.startsWith("+")
    ? args.toPhone
    : `+1${args.toPhone.replace(/\D/g, "")}`;

  const body =
    `${args.primaryName} invited you to be their co-applicant on a 1 OF 1 AUTO application. ` +
    `Tap to complete your portion (takes ~3 min): ${args.link}`;

  try {
    // Dynamic import — twilio package adds ~10MB to the bundle; loading lazily keeps
    // the main /api/submit cold-start fast for the much more common individual flow.
    const { default: twilio } = await import("twilio");
    const client = twilio(sid, token);
    await client.messages.create({ to, from, body });
    return { sent: true };
  } catch (err) {
    console.error("Twilio SMS failed:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "send-failed" };
  }
}
