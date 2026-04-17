"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

/**
 * 1 OF 1 AUTO — Premium Logo Animation (7-Phase Spec)
 *
 * Phase 1: Launch         (0–300ms)   Blue+Silver fly in from opposite corners → center
 * Phase 2: Expansion      (300–600ms) Both expand outward toward viewport edges
 * Phase 3: Collapse       (600–900ms) Snap back to center with subtle rotation
 * Phase 4: Text fade      (900–1100ms) "1 OF 1 AUTO" fades in below mark
 * Phase 5: Tagline fade   (1100–1300ms) "Like No Other" fades in below text
 * Phase 6: Hold           (1300–2000ms) All elements static
 * Phase 7: Transition     (2000ms+)    Invitation copy + button reveal
 *
 * Colors: Blue #4A90E2, Silver #D3D3D3
 * Performance: GPU-accelerated transforms, 60fps target
 * Responsive: mobile = 80% viewport, 25% faster timings
 */

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    setMobile(window.innerWidth < 768);
  }, []);
  return mobile;
}

export default function HomeIntro() {
  const isMobile = useIsMobile();
  const speed = isMobile ? 0.75 : 1; // 25% faster on mobile

  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = (ms: number) => ms * speed;
    const timers = [
      setTimeout(() => setPhase(1), t(50)),     // launch
      setTimeout(() => setPhase(2), t(300)),    // expansion
      setTimeout(() => setPhase(3), t(600)),    // collapse
      setTimeout(() => setPhase(4), t(900)),    // text
      setTimeout(() => setPhase(5), t(1100)),   // tagline
      setTimeout(() => setPhase(6), t(1300)),   // hold
      setTimeout(() => setPhase(7), t(2000)),   // reveal CTA
    ];
    return () => timers.forEach(clearTimeout);
  }, [speed]);

  // Shared parallelogram style
  const slashBase: React.CSSProperties = {
    position: "absolute",
    borderRadius: "3px",
    willChange: "transform, opacity",
  };

  // Animation param helper
  const dur = useCallback(
    (ms: number) => (ms / 1000) * speed,
    [speed]
  );

  // Responsive sizing
  const vw = isMobile ? "80vw" : "100vw";
  const slashW = isMobile ? "100px" : "120px";
  const slashH = isMobile ? "80px" : "100px";

  // Phase-driven position/scale for BLUE slash
  const blueAnim = useMemo(() => {
    switch (phase) {
      case 0: return { x: "-50vw", y: "-50vh", scale: 1.2, rotate: -45, opacity: 0 };
      case 1: return { x: "0", y: "0", scale: 1, rotate: -45, opacity: 1 };       // center
      case 2: return { x: "-40vw", y: "35vh", scale: 1.5, rotate: -45, opacity: 1 }; // expand to bottom-left
      default: return { x: "-30px", y: "-10px", scale: 1, rotate: -45, opacity: 1 }; // final resting
    }
  }, [phase]);

  // Phase-driven position/scale for SILVER slash
  const silverAnim = useMemo(() => {
    switch (phase) {
      case 0: return { x: "50vw", y: "-50vh", scale: 1.2, rotate: -45, opacity: 0 };
      case 1: return { x: "0", y: "0", scale: 1, rotate: -45, opacity: 1 };        // center
      case 2: return { x: "40vw", y: "35vh", scale: 1.5, rotate: -45, opacity: 1 }; // expand to bottom-right
      default: return { x: "30px", y: "-10px", scale: 1, rotate: -45, opacity: 1 }; // final resting
    }
  }, [phase]);

  // Easing per phase
  const getEasing = (p: number): [number, number, number, number] => {
    if (p <= 1) return [0.16, 1, 0.3, 1];       // ease-out (launch)
    if (p === 2) return [0.45, 0, 0.55, 1];      // ease-in-out (expansion)
    return [0.65, 0, 0.35, 1];                    // ease-in (collapse)
  };

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  if (reducedMotion) {
    return <StaticFallback />;
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 py-12 relative overflow-hidden">
      {/* ——— PARALLELOGRAM ANIMATION STAGE ——— */}
      <div className="relative flex items-center justify-center" style={{ width: 260, height: 200 }}>
        {/* BLUE parallelogram — #4A90E2 */}
        <motion.div
          style={{
            ...slashBase,
            width: slashW,
            height: slashH,
            background: "linear-gradient(135deg, #4A90E2 0%, #3A7BD5 100%)",
            left: "50%",
            top: "50%",
            marginLeft: "-60px",
            marginTop: "-50px",
          }}
          initial={{ x: "-50vw", y: "-50vh", scale: 1.2, rotate: -45, opacity: 0 }}
          animate={{
            ...blueAnim,
            rotate: phase >= 3 && phase < 4 ? -38 : -45, // subtle 7° rotation on collapse
          }}
          transition={{
            duration: dur(300),
            ease: getEasing(phase) as [number, number, number, number],
          }}
        />

        {/* SILVER parallelogram — #D3D3D3 */}
        <motion.div
          style={{
            ...slashBase,
            width: slashW,
            height: slashH,
            background: "linear-gradient(135deg, #E8E8E8 0%, #B0B0B0 100%)",
            left: "50%",
            top: "50%",
            marginLeft: "0px",
            marginTop: "-50px",
          }}
          initial={{ x: "50vw", y: "-50vh", scale: 1.2, rotate: -45, opacity: 0 }}
          animate={{
            ...silverAnim,
            rotate: phase >= 3 && phase < 4 ? -52 : -45, // subtle 7° counter-rotation
          }}
          transition={{
            duration: dur(300),
            ease: getEasing(phase) as [number, number, number, number],
            delay: phase <= 1 ? 0.04 : 0,
          }}
        />

        {/* Final logo PNG — fades in after collapse completes */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 3 ? 1 : 0 }}
          transition={{ duration: 0.4, delay: phase >= 3 ? 0.1 : 0 }}
        >
          <Image
            src="/logo-transparent.png"
            alt="1 OF 1 AUTO"
            width={220}
            height={220}
            priority
            className="object-contain select-none"
            draggable={false}
          />
        </motion.div>
      </div>

      {/* ——— Phase 4: "1 OF 1 AUTO" text ——— */}
      <motion.h1
        className="text-white font-bold text-center select-none mt-3"
        style={{ fontSize: isMobile ? "1.6rem" : "2rem", letterSpacing: "0.08em" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: phase >= 4 ? 1 : 0, y: phase >= 4 ? 0 : 8 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        1 OF 1 AUTO
      </motion.h1>

      {/* ——— Phase 5: "Like No Other" tagline ——— */}
      <motion.p
        className="text-center select-none mt-2"
        style={{
          fontSize: isMobile ? "0.8rem" : "1rem",
          color: "#4A90E2",
          letterSpacing: "0.25em",
          fontWeight: 300,
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: phase >= 5 ? 1 : 0, y: phase >= 5 ? 0 : 6 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        Like No Other
      </motion.p>

      {/* ——— Phase 7: Invitation + CTA ——— */}
      <AnimatePresence>
        {phase >= 7 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-14 space-y-6 w-full max-w-sm text-center"
          >
            <div className="space-y-1">
              <p className="text-sm text-muted">You&apos;ve been invited by a</p>
              <p className="text-sm text-foreground font-medium">
                1 OF 1 AUTO Representative.
              </p>
            </div>
            <Link
              href="/apply"
              className="inline-block w-full bg-accent text-black font-semibold py-3.5 px-6 rounded-xl text-center hover:bg-accent-dark transition-all active:scale-[0.98] shadow-lg shadow-accent/20"
            >
              Start Application
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/** Static fallback for prefers-reduced-motion */
function StaticFallback() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <Image
        src="/logo-transparent.png"
        alt="1 OF 1 AUTO"
        width={220}
        height={220}
        priority
        className="object-contain"
      />
      <h1 className="text-white font-bold text-2xl mt-3" style={{ letterSpacing: "0.08em" }}>
        1 OF 1 AUTO
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#4A90E2", letterSpacing: "0.25em" }}>
        Like No Other
      </p>
      <div className="mt-14 space-y-6 w-full max-w-sm text-center">
        <div className="space-y-1">
          <p className="text-sm text-muted">You&apos;ve been invited by a</p>
          <p className="text-sm text-foreground font-medium">1 OF 1 AUTO Representative.</p>
        </div>
        <Link
          href="/apply"
          className="inline-block w-full bg-accent text-black font-semibold py-3.5 px-6 rounded-xl text-center hover:bg-accent-dark transition-all active:scale-[0.98]"
        >
          Start Application
        </Link>
      </div>
    </main>
  );
}
