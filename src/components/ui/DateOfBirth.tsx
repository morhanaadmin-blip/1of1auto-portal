"use client";

import { useState, useEffect } from "react";

/**
 * Date of Birth — 3 separate inputs (Month / Day / Year).
 * Uses standard HTML elements for maximum mobile compatibility.
 * Avoids native <input type="date"> which forces scrolling from current year.
 */

type Props = {
  value: string; // ISO: YYYY-MM-DD
  onChange: (iso: string) => void;
  required?: boolean;
  autoFilled?: boolean;
  label?: string;
};

const MONTHS: { v: string; l: string }[] = [
  { v: "01", l: "January" },
  { v: "02", l: "February" },
  { v: "03", l: "March" },
  { v: "04", l: "April" },
  { v: "05", l: "May" },
  { v: "06", l: "June" },
  { v: "07", l: "July" },
  { v: "08", l: "August" },
  { v: "09", l: "September" },
  { v: "10", l: "October" },
  { v: "11", l: "November" },
  { v: "12", l: "December" },
];

function parseISO(iso: string): { y: string; m: string; d: string } {
  if (!iso || typeof iso !== "string") return { y: "", m: "", d: "" };
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { y: "", m: "", d: "" };
  return { y: match[1], m: match[2], d: match[3] };
}

export default function DateOfBirth({
  value,
  onChange,
  required,
  autoFilled,
  label = "Date of birth",
}: Props) {
  const parsed = parseISO(value);
  // Keep local state so users can type partial values (like "1" for year) without
  // them being wiped by the parent's "not a valid ISO" filter.
  const [m, setM] = useState(parsed.m);
  const [d, setD] = useState(parsed.d);
  const [y, setY] = useState(parsed.y);

  // Sync when value changes from outside (e.g. OCR fills it in)
  useEffect(() => {
    const p = parseISO(value);
    if (p.m || p.d || p.y) {
      setM(p.m);
      setD(p.d);
      setY(p.y);
    }
  }, [value]);

  const emitChange = (nm: string, nd: string, ny: string) => {
    if (nm && nd && ny.length === 4) {
      const mm = nm.padStart(2, "0");
      const dd = nd.padStart(2, "0");
      onChange(`${ny}-${mm}-${dd}`);
    } else {
      // Partial — still emit something so parent state can track
      onChange(ny && nm && nd ? `${ny.padStart(4, "0")}-${nm.padStart(2, "0")}-${nd.padStart(2, "0")}` : "");
    }
  };

  const handleMonth = (v: string) => {
    setM(v);
    emitChange(v, d, y);
  };

  const handleDay = (raw: string) => {
    const clean = raw.replace(/\D/g, "").slice(0, 2);
    setD(clean);
    emitChange(m, clean, y);
  };

  const handleYear = (raw: string) => {
    const clean = raw.replace(/\D/g, "").slice(0, 4);
    setY(clean);
    emitChange(m, d, clean);
  };

  return (
    <div>
      <label className="text-xs text-muted mb-1.5 flex items-center gap-2">
        <span>{label}</span>
        {required && <span className="text-error">*</span>}
        {autoFilled && value && (
          <span className="text-[10px] uppercase tracking-wider text-accent/70">Auto-filled</span>
        )}
      </label>
      <div className="grid grid-cols-[1.4fr_0.8fr_1fr] gap-2">
        <select
          value={m}
          onChange={(e) => handleMonth(e.target.value)}
          aria-label="Month"
        >
          <option value="">Month</option>
          {MONTHS.map((opt) => (
            <option key={opt.v} value={opt.v}>
              {opt.l}
            </option>
          ))}
        </select>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          placeholder="Day"
          value={d}
          onChange={(e) => handleDay(e.target.value)}
          className="text-center"
          aria-label="Day"
        />
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          placeholder="Year"
          value={y}
          onChange={(e) => handleYear(e.target.value)}
          className="text-center"
          aria-label="Year"
        />
      </div>
    </div>
  );
}
