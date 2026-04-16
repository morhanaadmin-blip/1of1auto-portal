import { NextRequest, NextResponse } from "next/server";

/**
 * Driver's license OCR via Claude Vision.
 * Uses ANTHROPIC_API_KEY. No additional dependencies — calls the REST API directly.
 * Extracts: firstName, middleName, lastName, dob (ISO YYYY-MM-DD), licenseNumber, address.
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
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        extracted: EMPTY,
        note: "OCR unavailable — enter details manually",
      });
    }

    const extracted = await extractWithClaude(file, apiKey);
    return NextResponse.json({ success: true, extracted });
  } catch (err) {
    console.error("OCR error:", err);
    return NextResponse.json({
      success: true,
      extracted: EMPTY,
      note: "OCR failed — enter details manually",
    });
  }
}

async function extractWithClaude(file: File, apiKey: string): Promise<Extracted> {
  // Convert file to base64
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mediaType = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";

  const prompt = `Extract data from this US driver's license image. Return ONLY a JSON object with these exact keys:
{
  "firstName": "given name / first name",
  "middleName": "middle name or empty string",
  "lastName": "family name / last name / surname",
  "dob": "date of birth in YYYY-MM-DD format",
  "licenseNumber": "driver's license number / DL# / LIC#",
  "address": "full address as it appears on the license"
}

Rules:
- Use the EXACT spelling from the license
- DOB must be YYYY-MM-DD (e.g. 1985-03-15). If month is written as abbreviation, convert.
- If a field is not visible or unreadable, use empty string ""
- Return ONLY the JSON, no markdown, no prose, no code fences
- Do NOT hallucinate values — if uncertain, return empty string for that field`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("Anthropic API error:", res.status, errText);
    return EMPTY;
  }

  const data = await res.json();
  const text: string = data?.content?.[0]?.text || "";

  // Try to parse JSON out of the response (trim any accidental prose/code fences)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return EMPTY;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      firstName: typeof parsed.firstName === "string" ? parsed.firstName : "",
      middleName: typeof parsed.middleName === "string" ? parsed.middleName : "",
      lastName: typeof parsed.lastName === "string" ? parsed.lastName : "",
      dob: typeof parsed.dob === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.dob) ? parsed.dob : "",
      licenseNumber: typeof parsed.licenseNumber === "string" ? parsed.licenseNumber : "",
      address: typeof parsed.address === "string" ? parsed.address : "",
    };
  } catch {
    return EMPTY;
  }
}
