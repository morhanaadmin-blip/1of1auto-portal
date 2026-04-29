"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { ApplicationData } from "@/lib/types";

type Props = {
  data: ApplicationData;
};

export default function PageConfirmation({ data }: Props) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full text-center space-y-8"
      >
        <Image
          src="/logo-transparent.png"
          alt="1 OF 1 AUTO"
          width={100}
          height={50}
          className="mx-auto object-contain"
        />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
          className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto"
        >
          <svg className="w-12 h-12 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h1 className="text-3xl font-bold mb-2">You&apos;re in</h1>
          <p className="text-muted">
            Thanks {data.primary.firstName}. A 1 OF 1 AUTO representative has your application and will review personally.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="border border-card-border rounded-xl p-5 text-sm space-y-3 text-left"
        >
          <div className="flex justify-between">
            <span className="text-muted">Applicant</span>
            <span>{data.primary.firstName} {data.primary.lastName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Type</span>
            <span className="capitalize">{data.mode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Deposit</span>
            <span className="text-accent font-semibold">$99 paid</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Status</span>
            <span className="text-success">Submitted</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="space-y-2 pt-2"
        >
          <p className="text-sm text-muted">Questions before then?</p>
          <a
            href="tel:+19547701177"
            className="inline-flex items-center gap-2 text-accent font-semibold hover:text-accent-dark"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            (954) 770-1177
          </a>
        </motion.div>
      </motion.div>
    </main>
  );
}
