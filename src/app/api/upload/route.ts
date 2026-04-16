import { NextRequest, NextResponse } from "next/server";

/**
 * Handles driver's license scan + OCR extraction.
 * Returns extracted fields: firstName, middleName, lastName, dob, licenseNumber, address.
 *
 * Production: integrate Google Vision API, Mindee, or AWS Textract.
 * Cost: ~$0.05–0.10 per scan.
 *
 * For now: returns a placeholder structure. The DL scan UI will still preview
 * the image and auto-advance to the confirmation page where user can review/edit.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // TODO: Replace this placeholder with real OCR when API key is configured
    const ocrKey = process.env.GOOGLE_VISION_API_KEY || process.env.MINDEE_API_KEY;

    if (ocrKey && process.env.OCR_PROVIDER === "mindee") {
      return await runMindeeOCR(file);
    }

    // Placeholder: return empty extraction so user enters manually on confirm page
    return NextResponse.json({
      success: true,
      extracted: {
        firstName: "",
        middleName: "",
        lastName: "",
        dob: "",
        licenseNumber: "",
        address: "",
      },
      note: "OCR provider not configured — manual entry required on next page",
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}

async function runMindeeOCR(file: File) {
  // Mindee US Driver License API
  // https://docs.mindee.com/extraction/us-driver-license
  try {
    const apiKey = process.env.MINDEE_API_KEY!;
    const buffer = Buffer.from(await file.arrayBuffer());
    const form = new FormData();
    form.append("document", new Blob([new Uint8Array(buffer)]), file.name);

    const res = await fetch(
      "https://api.mindee.net/v1/products/mindee/us_driver_license/v1/predict",
      {
        method: "POST",
        headers: { Authorization: `Token ${apiKey}` },
        body: form,
      }
    );

    if (!res.ok) throw new Error("Mindee API error");
    const data = await res.json();
    const prediction = data.document?.inference?.prediction;

    return NextResponse.json({
      success: true,
      extracted: {
        firstName: prediction?.first_name?.value || "",
        middleName: prediction?.middle_name?.value || "",
        lastName: prediction?.last_name?.value || "",
        dob: prediction?.date_of_birth?.value || "",
        licenseNumber: prediction?.driver_license_id?.value || "",
        address: prediction?.address?.value || "",
      },
    });
  } catch (err) {
    console.error("Mindee OCR failed:", err);
    return NextResponse.json({
      success: true,
      extracted: {
        firstName: "",
        middleName: "",
        lastName: "",
        dob: "",
        licenseNumber: "",
        address: "",
      },
      note: "OCR failed, continue with manual entry",
    });
  }
}
