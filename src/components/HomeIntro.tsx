"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

export default function HomeIntro() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),   // glow bloom
      setTimeout(() => setPhase(2), 500),   // logo rises
      setTimeout(() => setPhase(3), 1400),  // sweep
      setTimeout(() => setPhase(4), 2600),  // CTA
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 py-12 relative overflow-hidden">

      {/* Glow — no blur filter, just opacity on a gradient div */}
      <motion.div
        className="absolute pointer-events-none"
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : {}}
        transition={{ duration: 2, ease: "easeOut" }}
        style={{
          width: 480,
          height: 480,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,168,76,0.18) 0%, rgba(74,144,226,0.08) 50%, transparent 70%)",
          willChange: "opacity",
        }}
      />

      {/* Logo — opacity + translateY only */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 1, willChange: "transform, opacity" }}
      >
        <Image
          src="/logo-mark.png"
          alt="1 OF 1 AUTO"
          width={290}
          height={290}
          priority
          className="object-contain select-none"
          draggable={false}
        />

        {/* Light sweep — translateX only */}
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div
              initial={{ x: "-110%" }}
              animate={{ x: "110%" }}
              exit={{}}
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%)",
                borderRadius: 8,
                pointerEvents: "none",
                willChange: "transform",
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* CTA */}
      <AnimatePresence>
        {phase >= 4 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 space-y-5 w-full max-w-sm text-center"
            style={{ willChange: "transform, opacity" }}
          >
            <div className="space-y-0.5">
              <p className="text-sm" style={{ color: "#666" }}>
                You&apos;ve been invited by a
              </p>
              <p className="text-sm font-medium text-white">
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
