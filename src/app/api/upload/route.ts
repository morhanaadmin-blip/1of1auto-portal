import { NextRequest, NextResponse } from "next/server";

/**
 * Driver's license OCR via Claude Vision.
 * Returns extracted fields + debug info so we can diagnose any failures end-to-end.
 */

type Extracted = {
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  licenseNumber: string;
  address: string;
};

const EMPTY: Extracted = {
  firstName: "",
  middleName: "",
  lastName: "",
  dob: "",
  licenseNumber: "",
  address: "",
};

export async function POST(req: NextRequest) {
  const debug: Record<string, unknown> = {};
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    debug.fileName = file.name;
    debug.fileSize = file.size;
    debug.fileType = file.type;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    debug.keyPresent = !!apiKey;
    debug.keyLength = apiKey?.length || 0;

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        extracted: EMPTY,
        note: "OCR unavailable — no API key configured. Enter manually.",
        debug,
      });
    }

    const result = await extractWithClaude(file, apiKey, debug);
    return NextResponse.json({
      success: true,
      extracted: result,
      debug,
    });
  } catch (err) {
    console.error("OCR error:", err);
    debug.error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      success: true,
      extracted: EMPTY,
      note: "OCR failed — enter details manually",
      debug,
    });
  }
}

async function extractWithClaude(
  file: File,
  apiKey: string,
  debug: Record<string, unknown>
): Promise<Extracted> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  // Normalize media type — iOS sometimes sends "image/heic" which Claude doesn't
  // accept. Default to JPEG since browsers almost always produce that for photos.
  let mediaType = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
  if (mediaType === "image/heic" || mediaType === "image/heif") {
    // Claude supports jpeg/png/gif/webp — HEIC must be transcoded. Fall back to
    // sending as jpeg (most iOS photos are also saved as jpeg in-browser).
    mediaType = "image/jpeg";
  }
  debug.mediaType = mediaType;
  debug.base64Length = base64.length;

  const prompt = `You are looking at a US driver's license. Extract the following fields and return ONLY a JSON object (no prose, no code fences, no markdown):

{
  "firstName": "given/first name exactly as printed",
  "middleName": "middle name or initial, or empty string",
  "lastName": "family/last name exactly as printed",
  "dob": "date of birth as YYYY-MM-DD (e.g. 1985-03-15)",
  "licenseNumber": "the driver's license number / DL# / LIC#",
  "address": "full street address as one line (Street, City, State ZIP)"
}

Rules:
- Return ONLY the JSON object, nothing else
- Do NOT hallucinate — if a field is unclear, return empty string ""
- DOB must be YYYY-MM-DD format even if printed differently on license`;

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
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
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });
  } catch (networkErr) {
    debug.networkError = networkErr instanceof Error ? networkErr.message : String(networkErr);
    return EMPTY;
  }

  debug.apiStatus = res.status;

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    debug.apiError = errText.slice(0, 500);
    console.error("Anthropic API error:", res.status, errText);
    return EMPTY;
  }

  const data = await res.json();
  const text: string = data?.content?.[0]?.text || "";
  debug.rawResponsePreview = text.slice(0, 300);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    debug.parseError = "no JSON object found in response";
    return EMPTY;
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      firstName: typeof parsed.firstName === "string" ? parsed.firstName : "",
      middleName: typeof parsed.middleName === "string" ? parsed.middleName : "",
      lastName: typeof parsed.lastName === "string" ? parsed.lastName : "",
      dob:
        typeof parsed.dob === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.dob)
          ? parsed.dob
          : "",
      licenseNumber: typeof parsed.licenseNumber === "string" ? parsed.licenseNumber : "",
      address: typeof parsed.address === "string" ? parsed.address : "",
    };
  } catch (parseErr) {
    debug.parseError = parseErr instanceof Error ? parseErr.message : String(parseErr);
    return EMPTY;
  }
}
