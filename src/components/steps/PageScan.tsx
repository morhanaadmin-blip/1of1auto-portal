"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { PersonData } from "@/lib/types";
import { ContinueButton } from "@/components/ui/Field";

type Props = {
  person: PersonData;
  update: (fields: Partial<PersonData>) => void;
  onNext: () => void;
  isCoApp?: boolean;
};

export default function PageScan({ person, update, onNext, isCoApp }: Props) {
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => update({ licenseImage: reader.result as string, licenseFile: file });
    reader.readAsDataURL(file);

    // OCR
    setScanning(true);
    setError("");
    setScanComplete(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();

      if (result.success && result.extracted) {
        update({
          firstName: result.extracted.firstName || person.firstName,
          middleName: result.extracted.middleName || person.middleName,
          lastName: result.extracted.lastName || person.lastName,
          dob: result.extracted.dob || person.dob,
          licenseNumber: result.extracted.licenseNumber || person.licenseNumber,
          licenseAddress: result.extracted.address || person.licenseAddress,
        });
      }
    } catch {
      setError("Couldn't read your license automatically — you can still continue and enter details manually on the next page.");
    } finally {
      setScanning(false);
      setScanComplete(true);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-2xl font-bold mb-2">
          {isCoApp ? "Co-applicant's license" : "Let's get started"}
        </h1>
        <p className="text-muted text-sm">
          {isCoApp
            ? "Scan the co-applicant's driver's license to continue."
            : "Scan your driver's license. We'll use it to pre-fill the rest of the application."}
        </p>
      </motion.div>

      <motion.label
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all aspect-[1.6/1] overflow-hidden ${
          person.licenseImage
            ? "border-accent bg-accent/5"
            : "border-card-border hover:border-muted hover:bg-card/50"
        }`}
      >
        {person.licenseImage ? (
          <>
            <img
              src={person.licenseImage}
              alt="License"
              className="absolute inset-0 w-full h-full object-cover rounded-2xl"
            />
            {scanning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-background/80 rounded-2xl flex flex-col items-center justify-center"
              >
                <motion.div
                  className="h-0.5 w-full absolute"
                  style={{
                    background: "linear-gradient(90deg, transparent, #c9a84c, transparent)",
                  }}
                  animate={{ top: ["10%", "90%", "10%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <p className="text-accent text-sm font-medium mt-4">Scanning...</p>
              </motion.div>
            )}
            {scanComplete && !scanning && (
              <div className="absolute top-3 right-3 bg-success text-background rounded-full p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </>
        ) : (
          <>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="mb-4"
            >
              <svg className="w-14 h-14 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth={1.5} />
                <circle cx="8" cy="12" r="2" strokeWidth={1.5} />
                <line x1="13" y1="10" x2="18" y2="10" strokeWidth={1.5} strokeLinecap="round" />
                <line x1="13" y1="14" x2="18" y2="14" strokeWidth={1.5} strokeLinecap="round" />
              </svg>
            </motion.div>
            <p className="text-foreground font-medium mb-1">Tap to scan license</p>
            <p className="text-xs text-muted">Front of ID, camera or photo</p>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </motion.label>

      {error && <p className="text-xs text-error">{error}</p>}

      {/* Always show Continue button — scan is optional; user can proceed and enter manually */}
      <ContinueButton onClick={onNext} disabled={scanning}>
        {person.licenseImage ? "Continue" : "Skip & enter manually"}
      </ContinueButton>
    </div>
  );
}
