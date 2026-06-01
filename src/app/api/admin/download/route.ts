import { NextRequest, NextResponse } from "next/server";

const STORAGE_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Applications`;

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get("pw");
  if (password !== process.env.ADMIN_PASSWORD) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return new NextResponse("Missing path", { status: 400 });
  }

  // Prevent path traversal
  const safePath = path.replace(/\.\./g, "").replace(/^\/+/, "");
  const url = `${STORAGE_BASE}/${safePath}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return new NextResponse("File not found", { status: 404 });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const filename = safePath.split("/").pop() || "download";

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
