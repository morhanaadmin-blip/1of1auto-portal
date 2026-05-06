"use client";

import { useEffect } from "react";
import { motion } from "motion/react";

type Props = {
  onComplete: () => void;
};

/**
 * Premium intro animation.
 * Phase 1 (0–0.6s): Blue slash from top-right, silver slash from bottom-left, cross at center.
 * Phase 2 (0.6–1.3s): "1 OF 1" text reveals letter-by-letter with spring scale.
 * Phase 3 (1.3–2.0s): Full lockup holds, then fades out.
 */
export default function LogoIntro({ onComplete }: Props) {
  // Last animation finishes at ~2.0s (shimmer at 1.1 + 0.7 + tagline at 1.3 + 0.5)
  // Wait 2.8s total to let everything settle before handing off to the form
  useEffect(() => {
    const timer = setTimeout(onComplete, 2800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
    >
      <div className="relative w-[320px] h-[200px] flex items-center justify-center">
        {/* Blue slash — top-right to center */}
        <motion.div
          className="absolute w-14 h-44 rounded-sm"
          style={{
            background: "linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)",
            transform: "skewX(-20deg)",
            top: "-10%",
            left: "35%",
          }}
          initial={{ x: 400, y: -300, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 18,
            delay: 0.1,
          }}
        />

        {/* Silver slash — bottom-left to center */}
        <motion.div
          className="absolute w-14 h-44 rounded-sm"
          style={{
            background: "linear-gradient(180deg, #e5e7eb 0%, #9ca3af 100%)",
            transform: "skewX(-20deg)",
            top: "-10%",
            left: "53%",
          }}
          initial={{ x: -400, y: 300, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 18,
            delay: 0.2,
          }}
        />

        {/* "1 OF 1" text — reveals between the slashes */}
        <motion.div
          className="relative z-10 flex items-center gap-1 text-white font-black tracking-tighter select-none"
          style={{ fontSize: "4.5rem", lineHeight: 1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.1 }}
        >
          {["1", "O", "F", "1"].map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.7 + i * 0.08,
                type: "spring",
                stiffness: 200,
                damping: 16,
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* Shimmer overlay — passes across the text */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, transparent 40%, rgba(255,215,128,0.4) 50%, transparent 60%, transparent 100%)",
            mixBlendMode: "overlay",
          }}
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ delay: 1.1, duration: 0.7, ease: "easeInOut" }}
        />
      </div>

      {/* Subtle tagline fade-in below */}
      <motion.p
        className="absolute bottom-32 text-xs tracking-[0.4em] uppercase text-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.5 }}
      >
        Luxury Automotive Brokerage
      </motion.p>
    </motion.div>
  );
}
