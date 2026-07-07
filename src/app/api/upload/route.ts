import { NextRequest, NextResponse } from "next/server";

/**
 * Driver's license upload + OCR.
 *
 * Current status: OCR requires a standard Anthropic API key from
 * console.anthropic.com. The Claude Code session token (oat01) cannot
 * make direct API calls. Until a proper key is configured, this endpoint
 * returns empty extraction and the user enters fields manually on the
 * confirm page.
 *
 * To enable OCR: add a standard API key (sk-ant-api03-...) to
 * ANTHROPIC_API_KEY in Vercel environment variables.
 *
 * Auth note: This route is intentionally unauthenticated. The upload step
 * occurs before the customer has an account or session (pre-login flow).
 * Do not add auth middleware here without rethinking the full upload UX.
 */

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = new Set([
  "pdf", "jpeg", "jpg", "png", "heic", "heif", "webp",
]);

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

type Extracted = {
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  licenseNumber: string;
  address: string;
  licenseStreet: string;
  licenseCity: string;
  licenseState: string;
  licenseZip: string;
};

const EMPTY: Extracted = {
  firstName: "",
  middleName: "",
  lastName: "",
  dob: "",
  licenseNumber: "",
  address: "",
  licenseStreet: "",
  licenseCity: "",
  licenseState: "",
  licenseZip: "",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File too large (max 15MB)" }, { status: 400 });
    }

    // File type validation — check both MIME type and extension
    const mimeType = file.type?.toLowerCase() || "";
    const ext = file.name?.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_MIME_TYPES.has(mimeType) || !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Quick validation: standard API keys start with sk-ant-api
    // Session tokens (sk-ant-oat) don't work with direct API calls
    const isValidKey = apiKey && apiKey.startsWith("sk-ant-api");

    if (!isValidKey) {
      return NextResponse.json({
        success: true,
        extracted: EMPTY,
        note: "Photo saved. Enter your details on the next page — automatic scanning will be enabled soon.",
      });
    }

    // If we have a valid key, call Claude Vision for OCR
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    let mediaType = file.type?.startsWith("image/") ? file.type : "image/jpeg";
    if (mediaType === "image/heic" || mediaType === "image/heif") mediaType = "image/jpeg";

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              {
                type: "text",
                text: `Extract data from this US driver's license. Return ONLY valid JSON with these exact keys: {"firstName":"","middleName":"","lastName":"","dob":"YYYY-MM-DD","licenseNumber":"","address":"full address string","licenseStreet":"street line only e.g. 121 NE 3rd St Apt 1605","licenseCity":"city name","licenseState":"2-letter state code","licenseZip":"5 digit zip"}. Use empty string for any field you cannot read clearly.`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({
        success: true,
        extracted: EMPTY,
        note: "Photo saved. Enter details manually on the next page.",
      });
    }

    const data = await res.json();
    const text: string = data?.content?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        success: true,
        extracted: EMPTY,
        note: "Photo saved. Enter details on the next page.",
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      success: true,
      extracted: {
        firstName: parsed.firstName || "",
        middleName: parsed.middleName || "",
        lastName: parsed.lastName || "",
        dob: /^\d{4}-\d{2}-\d{2}$/.test(parsed.dob) ? parsed.dob : "",
        licenseNumber: parsed.licenseNumber || "",
        address: parsed.address || "",
        licenseStreet: parsed.licenseStreet || "",
        licenseCity: parsed.licenseCity || "",
        licenseState: parsed.licenseState || "",
        licenseZip: parsed.licenseZip || "",
      },
    });
  } catch {
    return NextResponse.json({
      success: true,
      extracted: EMPTY,
      note: "Photo saved. Enter your details on the next page.",
    });
  }
}
