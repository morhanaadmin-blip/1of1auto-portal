"use client";

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  autoFilled?: boolean;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
  maxLength?: number;
};

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  autoFilled,
  inputMode,
  maxLength,
}: FieldProps) {
  return (
    <div>
      <label className="text-xs text-muted mb-1.5 flex items-center gap-2">
        <span>{label}</span>
        {required && <span className="text-error">*</span>}
        {autoFilled && value && (
          <span className="text-[10px] uppercase tracking-wider text-accent/70">Auto-filled</span>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
      />
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  required,
  placeholder = "Select...",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      {label && (
        <label className="text-xs text-muted mb-1.5 flex items-center gap-2">
          <span>{label}</span>
          {required && <span className="text-error">*</span>}
        </label>
      )}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ContinueButton({
  onClick,
  disabled,
  children = "Continue",
}: {
  onClick: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3.5 rounded-xl bg-accent text-black font-semibold hover:bg-accent-dark transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
