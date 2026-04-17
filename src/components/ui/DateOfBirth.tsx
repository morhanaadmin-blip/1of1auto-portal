"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Date of Birth — 3 separate inputs (Month / Day / Year).
 *
 * Key fix: Day + Year fields use uncontrolled local state during typing,
 * only calling parent onChange on blur. This prevents the cursor-position
 * shifting bug on iOS where re-renders reset the cursor mid-typing.
 */

type Props = {
  value: string; // ISO: YYYY-MM-DD
  onChange: (iso: string) => void;
  required?: boolean;
  autoFilled?: boolean;
  label?: string;
};

const MONTHS = [
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

function parse(iso: string): [string, string, string] {
  if (!iso) return ["", "", ""];
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? [m[2], m[3], m[1]] : ["", "", ""];
}

function toISO(month: string, day: string, year: string): string {
  if (!month || !day || !year || year.length < 4) return "";
  return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export default function DateOfBirth({
  value,
  onChange,
  required,
  autoFilled,
  label = "Date of birth",
}: Props) {
  const [initMonth, initDay, initYear] = parse(value);
  const [month, setMonth] = useState(initMonth);
  const [day, setDay] = useState(initDay);
  const [year, setYear] = useState(initYear);
  const lastExternalValue = useRef(value);

  // Sync when value is set externally (e.g. from OCR) — NOT during user typing
  useEffect(() => {
    if (value !== lastExternalValue.current && value) {
      const [m, d, y] = parse(value);
      if (m || d || y) {
        setMonth(m);
        setDay(d);
        setYear(y);
      }
      lastExternalValue.current = value;
    }
  }, [value]);

  // Month select emits immediately (select = no cursor issue)
  const handleMonth = (v: string) => {
    setMonth(v);
    const iso = toISO(v, day, year);
    if (iso) {
      lastExternalValue.current = iso;
      onChange(iso);
    }
  };

  // Day + Year — update local only during typing; emit on blur
  const handleDayChange = (raw: string) => {
    setDay(raw.replace(/\D/g, "").slice(0, 2));
  };
  const handleYearChange = (raw: string) => {
    setYear(raw.replace(/\D/g, "").slice(0, 4));
  };

  const handleBlur = () => {
    const iso = toISO(month, day, year);
    if (iso) {
      lastExternalValue.current = iso;
      onChange(iso);
    }
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
        {/* Month — native <select>, works on all platforms */}
        <select
          value={month}
          onChange={(e) => handleMonth(e.target.value)}
          aria-label="Month"
        >
          <option value="">Month</option>
          {MONTHS.map((m) => (
            <option key={m.v} value={m.v}>{m.l}</option>
          ))}
        </select>

        {/* Day — numeric text input, emits on blur */}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          placeholder="Day"
          value={day}
          onChange={(e) => handleDayChange(e.target.value)}
          onBlur={handleBlur}
          className="text-center"
          aria-label="Day"
          autoComplete="off"
        />

        {/* Year — numeric text input, emits on blur */}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          placeholder="Year"
          value={year}
          onChange={(e) => handleYearChange(e.target.value)}
          onBlur={handleBlur}
          className="text-center"
          aria-label="Year"
          autoComplete="off"
        />
      </div>
    </div>
  );
}
