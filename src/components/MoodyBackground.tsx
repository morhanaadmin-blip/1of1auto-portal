"use client";

/**
 * Moody atmospheric background — strengthened for TIP-level presence.
 * Layered radial gradients + noise + slow ambient motion. Pure CSS, GPU-accelerated.
 */
export default function MoodyBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* Base dark layer */}
      <div className="absolute inset-0 bg-background" />

      {/* Large blue atmosphere — top-left quadrant */}
      <div
        className="absolute rounded-full blur-[100px] animate-blob-1"
        style={{
          width: "75vw",
          height: "75vw",
          top: "-25%",
          left: "-20%",
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.55) 0%, rgba(59, 130, 246, 0.15) 35%, rgba(59, 130, 246, 0) 70%)",
          opacity: 0.65,
        }}
      />

      {/* Deep purple-violet mid — shift the atmosphere */}
      <div
        className="absolute rounded-full blur-[120px] animate-blob-4"
        style={{
          width: "60vw",
          height: "60vw",
          top: "25%",
          left: "10%",
          background:
            "radial-gradient(circle, rgba(88, 28, 135, 0.4) 0%, rgba(88, 28, 135, 0) 70%)",
          opacity: 0.5,
        }}
      />

      {/* Silver / white ambient — right side */}
      <div
        className="absolute rounded-full blur-[130px] animate-blob-2"
        style={{
          width: "80vw",
          height: "80vw",
          bottom: "-30%",
          right: "-25%",
          background:
            "radial-gradient(circle, rgba(180, 190, 210, 0.4) 0%, rgba(180, 190, 210, 0) 70%)",
          opacity: 0.4,
        }}
      />

      {/* Gold accent — center, pulses subtly */}
      <div
        className="absolute rounded-full blur-[140px] animate-blob-3"
        style={{
          width: "55vw",
          height: "55vw",
          top: "30%",
          left: "30%",
          background:
            "radial-gradient(circle, rgba(201, 168, 76, 0.35) 0%, rgba(201, 168, 76, 0) 70%)",
          opacity: 0.35,
        }}
      />

      {/* Deep blue bottom-left — gives the vignette depth */}
      <div
        className="absolute rounded-full blur-[110px] animate-blob-5"
        style={{
          width: "55vw",
          height: "55vw",
          bottom: "-15%",
          left: "-10%",
          background:
            "radial-gradient(circle, rgba(30, 64, 175, 0.5) 0%, rgba(30, 64, 175, 0) 70%)",
          opacity: 0.5,
        }}
      />

      {/* Grain texture — gives it a filmic quality */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Strong vignette — top darkens, edges pull in for cinematic feel */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Top gradient band — mirrors TIP's deep-night feel */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,5,15,0.7) 0%, transparent 30%, transparent 70%, rgba(5,5,15,0.5) 100%)",
        }}
      />
    </div>
  );
}
