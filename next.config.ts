import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit reads font files from its own node_modules directory at runtime.
  // Without this, Vercel bundles the package and the font paths break — all
  // PDFs fail silently and come out null.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
