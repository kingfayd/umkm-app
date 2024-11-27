//ProcurementExport.tsx
"use client";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import { fetchWithAuth } from "../lib/utils"; // Ensure this function is properly defined to handle authentication

interface ExportFormValues {
  startDate: string;
  endDate: string;
}

export default function ProcurementExport() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExportFormValues>();

  const onSubmit = async (data: ExportFormValues) => {
    try {
      const queryString = new URLSearchParams({
        startDate: data.startDate,
        endDate: data.endDate,
      }).toString();

      const response = await fetchWithAuth(
        `/api/procurement/export?${queryString}`,
        {
          method: "GET",
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "procurement-report.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Error exporting data");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Error exporting data");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        type="date"
        label="Tanggal Mulai"
        {...register("startDate", { required: "Tanggal mulai diperlukan" })}
        error={
          errors.startDate ? { message: errors.startDate.message } : undefined
        }
      />
      <Input
        type="date"
        label="Tanggal Akhir"
        {...register("endDate", { required: "Tanggal akhir diperlukan" })}
        error={errors.endDate ? { message: errors.endDate.message } : undefined}
      />
      <Button type="submit" variant="default">
        Ekspor ke PDF
      </Button>
    </form>
  );
}
