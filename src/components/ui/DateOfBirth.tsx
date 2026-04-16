"use client";

/**
 * Date of Birth field — Month/Day/Year separated inputs.
 * Much faster than native <input type="date"> on mobile, which forces the
 * user to scroll from current year backward. Stores as ISO YYYY-MM-DD.
 */

type Props = {
  value: string; // ISO: YYYY-MM-DD
  onChange: (iso: string) => void;
  required?: boolean;
  autoFilled?: boolean;
  label?: string;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function parseISO(iso: string): { y: string; m: string; d: string } {
  if (!iso) return { y: "", m: "", d: "" };
  const [y, m, d] = iso.split("-");
  return { y: y || "", m: m || "", d: d || "" };
}

function toISO(y: string, m: string, d: string): string {
  if (!y || !m || !d) return "";
  return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export default function DateOfBirth({ value, onChange, required, autoFilled, label = "Date of birth" }: Props) {
  const { y, m, d } = parseISO(value);

  const setMonth = (newM: string) => onChange(toISO(y, newM, d));
  const setDay = (newD: string) => onChange(toISO(y, m, newD));
  const setYear = (newY: string) => {
    const cleaned = newY.replace(/\D/g, "").slice(0, 4);
    onChange(toISO(cleaned, m, d));
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
      <div className="grid grid-cols-[1.3fr_1fr_1.2fr] gap-2">
        <select value={m} onChange={(e) => setMonth(e.target.value)}>
          <option value="">Month</option>
          {MONTHS.map((name, i) => (
            <option key={i} value={String(i + 1).padStart(2, "0")}>
              {name}
            </option>
          ))}
        </select>
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="Day"
          value={d}
          onChange={(e) => setDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
          className="text-center"
        />
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="Year"
          value={y}
          onChange={(e) => setYear(e.target.value)}
          className="text-center"
        />
      </div>
    </div>
  );
}
