// components/ui/DatePicker.tsx
"use client";

import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Controller, Control } from "react-hook-form";
import Input from "@/components/ui/input"; // Sesuaikan import dengan lokasi Input component-mu

interface Props {
  control: Control<any>; // Ganti any dengan tipe data form yang sesuai jika perlu
  name: string;
  label: string;
  error?: { message?: string };
}

const CustomDatePicker: React.FC<Props> = ({ control, name, label, error }) => {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-semibold">
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <DatePicker
            id={name}
            selected={field.value ? new Date(field.value) : null}
            onChange={(date: Date | null) => field.onChange(date)}
            dateFormat="yyyy-MM-dd"
            className={`p-2 border rounded-md ${
              error ? "border-red-500" : "border-gray-300"
            }`}
          />
        )}
      />
      {error && <p className="text-red-500 text-sm">{error.message}</p>}
    </div>
  );
};

export default CustomDatePicker;
