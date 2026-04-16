"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useAnimate, stagger } from "motion/react";

/**
 * Premium cinematic logo reveal — "Signature Strike"
 *
 * Phase 1 (0–0.4s): Darkened screen, vignette intensifies
 * Phase 2 (0.4–0.7s): A horizontal light beam sweeps left → right (spotlight pass)
 * Phase 3 (0.6–1.3s): Blue slash rockets in from top-right with motion blur
 *                     Silver slash rockets in from bottom-left (parallel timing)
 *                     Slight screen-impact flash when they lock into place
 * Phase 4 (1.3–2.2s): "1 OF 1" text materializes letter-by-letter, each with
 *                     a tiny gold spark on appearance. Characters lock into
 *                     formation.
 * Phase 5 (2.2–2.8s): Gold chrome shimmer sweeps across the full logo
 *                     (like sunlight on a car hood). Soft glow pulse starts.
 * Phase 6 (2.8–3.4s): Logo breathes with a subtle glow. Tagline fades in.
 *                     Invitation copy + button reveal in sequence.
 *
 * Total sequence: ~3.4 seconds. Worth the wait.
 */
export default function HomeIntro() {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),   // spotlight sweep begins
      setTimeout(() => setPhase(2), 400),   // slashes fly in
      setTimeout(() => setPhase(3), 1100),  // impact flash + text reveal begins
      setTimeout(() => setPhase(4), 2000),  // shimmer pass
      setTimeout(() => setPhase(5), 2700),  // breathing + tagline
      setTimeout(() => setPhase(6), 3200),  // CTA reveals
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 py-12 relative overflow-hidden">
      {/* Intensified vignette during intro */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: phase < 4 ? 1 : 0.4 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Horizontal spotlight sweep — Phase 2 */}
      {phase >= 1 && phase < 4 && (
        <motion.div
          initial={{ x: "-100vw", opacity: 0 }}
          animate={{ x: "100vw", opacity: [0, 0.8, 0] }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="fixed top-1/2 left-0 h-64 w-[40vw] pointer-events-none z-[2]"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255, 220, 150, 0.25), transparent)",
            filter: "blur(40px)",
            transform: "translateY(-50%)",
          }}
        />
      )}

      {/* Impact flash — Phase 3 */}
      <AnimatePresence>
        {phase === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, times: [0, 0.3, 1] }}
            className="fixed inset-0 bg-white pointer-events-none z-[3]"
          />
        )}
      </AnimatePresence>

      {/* Main stage */}
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">
        {/* Logo container */}
        <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
          {/* Logo settles — fades in once slashes have landed */}
          <motion.div
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{
              scale: phase >= 5 ? 1 : phase >= 2 ? 1.35 : 0.2,
              opacity: phase >= 2 ? 1 : 0,
            }}
            transition={{
              scale: {
                type: "spring",
                stiffness: phase >= 5 ? 200 : 150,
                damping: phase >= 5 ? 24 : 16,
              },
              opacity: { duration: 0.4 },
            }}
            className="relative"
          >
            <Image
              src="/logo-transparent.png"
              alt="1 OF 1 AUTO"
              width={280}
              height={280}
              priority
              className="object-contain select-none relative z-10"
              draggable={false}
            />

            {/* Breathing glow — starts after Phase 5 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: phase >= 4 ? [0.3, 0.5, 0.3] : 0,
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(201, 168, 76, 0.3) 0%, transparent 60%)",
                filter: "blur(30px)",
                zIndex: 0,
              }}
            />

            {/* Gold chrome shimmer sweep — Phase 4 */}
            {phase === 4 && (
              <motion.div
                initial={{ x: "-120%", opacity: 0 }}
                animate={{ x: "120%", opacity: [0, 1, 0] }}
                transition={{ duration: 1.1, ease: "easeInOut" }}
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                  background:
                    "linear-gradient(110deg, transparent 0%, transparent 40%, rgba(255, 220, 140, 0.6) 50%, transparent 60%, transparent 100%)",
                  mixBlendMode: "overlay",
                }}
              />
            )}
          </motion.div>

          {/* Sparks/particles — subtle */}
          {phase >= 2 && phase < 5 && (
            <div className="absolute inset-0 pointer-events-none">
              {[
                { x: -80, y: -60 },
                { x: 70, y: -40 },
                { x: -40, y: 60 },
                { x: 80, y: 70 },
              ].map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    x: p.x,
                    y: p.y,
                  }}
                  transition={{
                    duration: 1.2,
                    delay: 1.3 + i * 0.1,
                    ease: "easeOut",
                  }}
                  className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255, 220, 140, 1) 0%, rgba(255, 220, 140, 0) 70%)",
                    filter: "blur(1px)",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tagline — "Like No Other" */}
        <AnimatePresence>
          {phase >= 5 && (
            <motion.p
              initial={{ opacity: 0, y: 12, letterSpacing: "0.15em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.35em" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="mt-2 text-[11px] uppercase text-accent font-medium"
            >
              Like No Other
            </motion.p>
          )}
        </AnimatePresence>

        {/* Invitation + CTA */}
        <AnimatePresence>
          {phase >= 6 && (
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
