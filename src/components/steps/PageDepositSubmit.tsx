"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { ApplicationData } from "@/lib/types";

type Props = {
  data: ApplicationData;
  setData: (updater: (prev: ApplicationData) => ApplicationData) => void;
  submit: () => Promise<void>;
  submitting: boolean;
};

export default function PageDepositSubmit({ data, setData, submit, submitting }: Props) {
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const handleCheckout = async () => {
    // Check for test mode
    const isTestMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("test");
    if (isTestMode) {
      setData((prev) => ({ ...prev, depositPaid: true, stripeSessionId: "test_mode" }));
      return;
    }

    setProcessing(true);
    setPaymentError("");
    try {
      const res = await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-checkout",
          email: data.primary.email,
          name: `${data.primary.firstName} ${data.primary.lastName}`,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Payment setup failed");
      }
      if (json.url) {
        // Save application state before leaving the page.
        // File objects cannot survive JSON serialization — strip them to null.
        // licenseImage (base64 data URL) is a string and CAN survive — keep it so
        // the DL photo can be reconstructed on submit without asking the customer again.
        const dataToSave = {
          ...data,
          primary: { ...data.primary, licenseFile: null }, // keep licenseImage
          coApplicant: data.coApplicant
            ? { ...data.coApplicant, licenseFile: null } // keep coApplicant.licenseImage
            : null,
          documents: {
            ...data.documents,
            insurance: null,
            registration: null,
            driverLicensePhoto: null,
            utilityBill: null,
            businessLicense: null,
          },
        };
        localStorage.setItem("1of1_app_data", JSON.stringify(dataToSave));
        window.location.href = json.url;
      } else {
        // Dev mode: Stripe not configured
        setData((prev) => ({ ...prev, depositPaid: true, stripeSessionId: "dev_test" }));
      }
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Payment setup failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Deposit & submit</h1>
        <p className="text-muted text-sm">Last step. Secure your broker engagement.</p>
      </div>

      {!data.depositPaid ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-card-border rounded-xl p-5 space-y-4"
        >
          <div className="flex justify-between items-baseline">
            <span className="text-muted text-sm">Service Commitment Fee</span>
            <span className="text-3xl font-bold">$99</span>
          </div>
          <ul className="text-xs text-muted space-y-1.5">
            <li>— Applied toward broker service</li>
            <li>— Refundable if we can&apos;t close your deal</li>
            <li>— Initiates your exclusive engagement</li>
            <li>— Secures priority attention from Mor</li>
          </ul>
          <button
            onClick={handleCheckout}
            disabled={processing}
            className="w-full py-3.5 rounded-xl bg-accent text-black font-semibold hover:bg-accent-dark transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {processing ? "Setting up secure payment..." : "Pay $99 securely"}
          </button>
          {paymentError && (
            <p className="text-xs text-error">{paymentError}</p>
          )}
          <p className="text-[11px] text-muted text-center">
            Powered by Stripe. Your card details are encrypted and never stored.
          </p>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-success/30 bg-success/5 rounded-xl p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold">Deposit received</p>
              <p className="text-xs text-muted">$99 applied to your engagement</p>
            </div>
          </motion.div>

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-accent text-black font-bold text-lg hover:bg-accent-dark transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {submitting ? "Submitting application..." : "Submit application"}
          </button>
        </>
      )}
    </div>
  );
}
