"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

/**
 * Netflix-style reveal — the logo IS the animation.
 *
 * Phase 1 (0–0.8s): Two giant slashes (blue + silver) streak across the full
 *   viewport diagonally, crossing at center. Blue from top-right, silver from
 *   bottom-left. They are huge — spanning the entire page width. Motion blur.
 *
 * Phase 2 (0.8–1.6s): "1 OF 1" text slams in at massive scale (3x),
 *   filling the center. Subtle chromatic aberration on impact. The slashes
 *   start shrinking toward their final positions.
 *
 * Phase 3 (1.6–2.4s): Everything converges — slashes + text all scale DOWN
 *   simultaneously into the final logo composition. Like collapsing an
 *   expanded view into an icon (Netflix reveal pattern).
 *
 * Phase 4 (2.4–2.8s): Final logo holds, subtle glow pulse starts, gold
 *   shimmer sweeps across once.
 *
 * Phase 5 (2.8s+): Tagline fades in, then invitation + CTA.
 */
export default function HomeIntro() {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),   // slashes begin entering huge
      setTimeout(() => setPhase(2), 800),   // text slams in
      setTimeout(() => setPhase(3), 1600),  // collapse to final logo
      setTimeout(() => setPhase(4), 2400),  // final polish — shimmer
      setTimeout(() => setPhase(5), 3000),  // tagline + CTA
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // SVG slash — parallelogram shape matching the logo
  // skewX(-20deg) applied to make diagonals
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 py-12 relative overflow-hidden">
      {/* ——— PHASE 1–3: Giant slashes animating across the viewport ——— */}

      {/* Blue slash — from top-right, streaks across, lands in position */}
      <motion.div
        className="fixed pointer-events-none z-20"
        initial={{
          top: "-20%",
          left: "80%",
          width: "30vw",
          height: "120vh",
          opacity: 0,
          rotate: -20,
          filter: "blur(6px)",
        }}
        animate={
          phase === 0
            ? { opacity: 0 }
            : phase < 3
              ? { // Crossing phase — big, moving, blurred
                  opacity: 1,
                  top: "10%",
                  left: "30%",
                  width: "40vw",
                  height: "80vh",
                  rotate: -20,
                  filter: "blur(2px)",
                }
              : { // Final logo position — small, sharp
                  opacity: 1,
                  top: "50%",
                  left: "50%",
                  width: "60px",
                  height: "180px",
                  translateX: "-50%",
                  translateY: "-100%",
                  rotate: -20,
                  filter: "blur(0px)",
                }
        }
        transition={{
          duration: phase < 3 ? 0.8 : 1.0,
          ease: phase < 3 ? [0.22, 1, 0.36, 1] : [0.65, 0, 0.35, 1],
        }}
        style={{
          background: "linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)",
          borderRadius: "4px",
        }}
      />

      {/* Silver slash — from bottom-left, parallel to blue */}
      <motion.div
        className="fixed pointer-events-none z-20"
        initial={{
          bottom: "-20%",
          right: "80%",
          width: "30vw",
          height: "120vh",
          opacity: 0,
          rotate: -20,
          filter: "blur(6px)",
        }}
        animate={
          phase === 0
            ? { opacity: 0 }
            : phase < 3
              ? {
                  opacity: 1,
                  bottom: "10%",
                  right: "30%",
                  width: "40vw",
                  height: "80vh",
                  rotate: -20,
                  filter: "blur(2px)",
                }
              : {
                  opacity: 1,
                  bottom: "50%",
                  right: "50%",
                  width: "60px",
                  height: "180px",
                  translateX: "50%",
                  translateY: "100%",
                  rotate: -20,
                  filter: "blur(0px)",
                }
        }
        transition={{
          duration: phase < 3 ? 0.8 : 1.0,
          ease: phase < 3 ? [0.22, 1, 0.36, 1] : [0.65, 0, 0.35, 1],
          delay: phase < 3 ? 0.08 : 0,
        }}
        style={{
          background: "linear-gradient(180deg, #e5e7eb 0%, #94a3b8 100%)",
          borderRadius: "4px",
        }}
      />

      {/* Impact flash when slashes cross — Phase 2 start */}
      <AnimatePresence>
        {phase === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.2, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-white pointer-events-none z-30"
          />
        )}
      </AnimatePresence>

      {/* ——— GIANT "1 OF 1" text — slams in Phase 2, collapses Phase 3 ——— */}
      <motion.div
        className="fixed pointer-events-none z-30 flex items-center justify-center top-1/2 left-1/2 font-black text-white select-none"
        style={{
          translateX: "-50%",
          translateY: "-50%",
          fontSize: "18vw",
          letterSpacing: "-0.05em",
          fontFamily: "system-ui, -apple-system, sans-serif",
          whiteSpace: "nowrap",
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={
          phase < 2
            ? { opacity: 0, scale: 0.5 }
            : phase === 2
              ? { opacity: 1, scale: 1, filter: "blur(0px)" }
              : { opacity: 0, scale: 0.15, filter: "blur(2px)" } // collapse into logo position
        }
        transition={{
          opacity: { duration: 0.3 },
          scale: {
            type: phase === 2 ? "spring" : "tween",
            stiffness: 140,
            damping: 12,
            duration: phase < 2 ? 0 : 1.0,
            ease: [0.65, 0, 0.35, 1],
          },
        }}
      >
        1 OF 1
      </motion.div>

      {/* ——— FINAL LOGO — fades in as SVG elements converge ——— */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: phase >= 3 ? 1 : 0,
          scale: phase >= 3 ? 1 : 0.8,
        }}
        transition={{
          opacity: { duration: 0.8, delay: phase >= 3 ? 0.6 : 0 },
          scale: {
            type: "spring",
            stiffness: 180,
            damping: 22,
            delay: phase >= 3 ? 0.6 : 0,
          },
        }}
      >
        <div className="relative" style={{ width: 260, height: 260 }}>
          <Image
            src="/logo-transparent.png"
            alt="1 OF 1 AUTO"
            width={260}
            height={260}
            priority
            className="object-contain select-none relative z-10"
            draggable={false}
          />

          {/* Breathing glow after converge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: phase >= 4 ? [0.2, 0.45, 0.2] : 0,
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(201, 168, 76, 0.35) 0%, transparent 60%)",
              filter: "blur(30px)",
              zIndex: 0,
            }}
          />

          {/* Single shimmer pass once */}
          {phase === 4 && (
            <motion.div
              initial={{ x: "-120%", opacity: 0 }}
              animate={{ x: "120%", opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                background:
                  "linear-gradient(110deg, transparent 40%, rgba(255, 220, 140, 0.6) 50%, transparent 60%)",
                mixBlendMode: "overlay",
              }}
            />
          )}
        </div>
      </motion.div>

      {/* ——— Tagline + CTA ——— */}
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">
        <AnimatePresence>
          {phase >= 4 && (
            <motion.p
              initial={{ opacity: 0, y: 12, letterSpacing: "0.15em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.35em" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="mt-4 text-[11px] uppercase text-accent font-medium"
            >
              Like No Other
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="mt-14 space-y-6 w-full"
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
      </div>
    </main>
  );
}
