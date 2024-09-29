// Input.tsx

import { ChangeEvent } from "react";

// Definisi interface InputProps di file yang sama
interface InputProps {
  type: string;
  placeholder: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  className: string;
  label?: string; // Opsional
}

// Definisi komponen Input
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
      {label && <label>{label}</label>}
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
