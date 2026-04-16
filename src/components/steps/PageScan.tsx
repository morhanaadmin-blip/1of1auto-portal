"use client";

import { useState, useRef } from "react";
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

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
        const ex = result.extracted;
        const anyFilled = ex.firstName || ex.lastName || ex.dob || ex.licenseNumber || ex.address;
        update({
          firstName: ex.firstName || person.firstName,
          middleName: ex.middleName || person.middleName,
          lastName: ex.lastName || person.lastName,
          dob: ex.dob || person.dob,
          licenseNumber: ex.licenseNumber || person.licenseNumber,
          licenseAddress: ex.address || person.licenseAddress,
        });
        if (!anyFilled) {
          setError(
            result.note ||
              "Couldn't read all fields — you can fill them in manually on the next page."
          );
        }
      } else {
        setError(result.note || "Scan returned no data — fill in manually on next page.");
      }
    } catch (err) {
      setError(
        `Scan failed: ${err instanceof Error ? err.message : "unknown error"}. Enter details manually on the next page.`
      );
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

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl aspect-[1.6/1] overflow-hidden transition-all ${
          person.licenseImage
            ? "border-accent bg-accent/5"
            : "border-card-border bg-card/50"
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
                <p className="text-accent text-sm font-medium mt-4">Reading your license...</p>
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
          <div className="flex flex-col items-center justify-center p-8">
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
            <p className="text-foreground font-medium mb-1">License photo</p>
            <p className="text-xs text-muted text-center">Take a photo or choose from your library</p>
          </div>
        )}
      </motion.div>

      {/* Two separate buttons so iOS Safari reliably shows camera vs library */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={scanning}
          className="py-3 rounded-xl border border-card-border hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Take photo
        </button>
        <button
          onClick={() => libraryInputRef.current?.click()}
          disabled={scanning}
          className="py-3 rounded-xl border border-card-border hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          From library
        </button>
      </div>

      {/* Hidden inputs — one forces camera, one opens library */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-xs text-error">{error}</p>}

      {/* Always show Continue button — scan is optional; user can proceed and enter manually */}
      <ContinueButton onClick={onNext} disabled={scanning}>
        {person.licenseImage ? "Continue" : "Skip & enter manually"}
      </ContinueButton>
    </div>
  );
}
