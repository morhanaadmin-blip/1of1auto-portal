"use client";

import Image from "next/image";
import { motion } from "motion/react";

type Props = {
  step: number;
  totalSteps: number;
};

export default function Header({ step, totalSteps }: Props) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="px-6 py-3 border-b border-card-border/60 sticky top-0 z-40 backdrop-blur-xl bg-background/70"
    >
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Logo — uses a fixed-size container with proper centering to avoid edge artifacts */}
        <div className="relative h-10 w-24 flex items-center">
          <Image
            src="/logo-dark.png"
            alt="1 OF 1 AUTO"
            width={96}
            height={40}
            priority
            className="object-contain"
            style={{ maxHeight: "100%", width: "auto" }}
          />
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              className="h-1 rounded-full"
              initial={{ width: "0.75rem" }}
              animate={{
                width: i === step ? "1.5rem" : "0.5rem",
                backgroundColor:
                  i <= step ? "var(--color-accent)" : "var(--color-card-border)",
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </motion.header>
  );
}
