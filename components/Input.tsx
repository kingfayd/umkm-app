import { ChangeEvent } from "react";

interface InputProps {
  type: string;
  placeholder: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  className: string;
  label?: string; // Menjadikan label opsional
}

export default function Input({
  type,
  placeholder,
  value,
  onChange,
  className,
  label,
}: InputProps) {
  return (
    <div className="input-container">
      {label && <label>{label}</label>} {/* Menampilkan label hanya jika ada */}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={className}
      />
    </div>
  );
}
