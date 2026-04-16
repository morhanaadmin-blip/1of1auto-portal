"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

/**
 * Homepage intro sequence:
 * 1. Logo pops in center (small → big, spring physics)
 * 2. Logo settles into final position (slight scale-down, stays centered-upper)
 * 3. "Like No Other" tagline reveals
 * 4. Invitation copy appears
 * 5. Button appears
 *
 * Total sequence: ~2.5 seconds before user can interact.
 * No animation replay on /apply navigation.
 */
export default function HomeIntro() {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    // Orchestrate the reveal
    const timers = [
      setTimeout(() => setPhase(1), 1200), // logo settles
      setTimeout(() => setPhase(2), 1700), // tagline
      setTimeout(() => setPhase(3), 2400), // invitation + button
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 py-12 relative">
      <div className="flex flex-col items-center text-center w-full max-w-sm">
        {/* LOGO — pops in, scales down into position */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{
            scale: phase === 0 ? 1.6 : 1,
            opacity: 1,
          }}
          transition={{
            scale: {
              type: "spring",
              stiffness: phase === 0 ? 140 : 180,
              damping: phase === 0 ? 14 : 22,
              delay: phase === 0 ? 0.1 : 0,
            },
            opacity: { duration: 0.4 },
          }}
          className="relative"
        >
          <Image
            src="/logo-dark.png"
            alt="1 OF 1 AUTO"
            width={240}
            height={120}
            priority
            className="object-contain select-none"
            draggable={false}
          />
        </motion.div>

        {/* TAGLINE — "Like No Other" */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.p
              initial={{ opacity: 0, y: 10, letterSpacing: "0.2em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.3em" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="mt-6 text-xs uppercase text-accent font-medium"
              style={{ letterSpacing: "0.3em" }}
            >
              Like No Other
            </motion.p>
          )}
        </AnimatePresence>

        {/* INVITATION + BUTTON */}
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mt-16 space-y-6 w-full"
            >
              <div className="space-y-1">
                <p className="text-sm text-muted">You&apos;ve been invited by a</p>
                <p className="text-sm text-foreground font-medium">
                  1 OF 1 AUTO Representative.
                </p>
              </div>

              <Link
                href="/apply"
                className="inline-block w-full bg-accent text-black font-semibold py-3.5 px-6 rounded-xl text-center hover:bg-accent-dark transition-all active:scale-[0.98] shadow-lg shadow-accent/10"
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
