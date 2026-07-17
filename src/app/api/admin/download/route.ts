import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return new NextResponse("Missing path", { status: 400 });
  }

  // Prevent path traversal; strip query string (signed URL tokens from Supabase)
  const safePath = path.replace(/\.\./g, "").replace(/^\/+/, "").split("?")[0];

  const { data, error } = await supabase.storage
    .from("Applications")
    .createSignedUrl(safePath, 3600);

  if (error || !data?.signedUrl) {
    return new NextResponse("File not found", { status: 404 });
  }

  try {
    const res = await fetch(data.signedUrl);
    if (!res.ok) {
      return new NextResponse("File not found", { status: 404 });
    }

    const buffer = await res.arrayBuffer();
    const filename = safePath.split("/").pop() || "download";
    const contentType = filename.endsWith(".pdf") ? "application/pdf" : (res.headers.get("content-type") || "application/octet-stream");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch {
    return new NextResponse("Download failed", { status: 500 });
  }
}
