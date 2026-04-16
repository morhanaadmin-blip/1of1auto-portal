"use client";

/**
 * Moody atmospheric background.
 * Layered radial gradients with slow ambient motion — inspired by TIP's mesh shader vibe.
 * Pure CSS, no dependencies, GPU-accelerated, zero perf cost.
 */
export default function MoodyBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
    >
      {/* Base dark layer */}
      <div className="absolute inset-0 bg-background" />

      {/* Blue glow — top left (from logo slashes) */}
      <div
        className="absolute rounded-full blur-[120px] opacity-25 animate-blob-1"
        style={{
          width: "60vw",
          height: "60vw",
          top: "-20%",
          left: "-15%",
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, rgba(59, 130, 246, 0) 70%)",
        }}
      />

      {/* Silver/white glow — bottom right */}
      <div
        className="absolute rounded-full blur-[140px] opacity-15 animate-blob-2"
        style={{
          width: "70vw",
          height: "70vw",
          bottom: "-25%",
          right: "-20%",
          background:
            "radial-gradient(circle, rgba(200, 200, 220, 0.5) 0%, rgba(200, 200, 220, 0) 70%)",
        }}
      />

      {/* Gold accent glow — center mid-top */}
      <div
        className="absolute rounded-full blur-[160px] opacity-10 animate-blob-3"
        style={{
          width: "50vw",
          height: "50vw",
          top: "20%",
          left: "30%",
          background:
            "radial-gradient(circle, rgba(201, 168, 76, 0.6) 0%, rgba(201, 168, 76, 0) 70%)",
        }}
      />

      {/* Subtle grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Top vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/80" />
    </div>
  );
}
