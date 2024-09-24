"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import CustomDatePicker from "@/components/ui/datePicker"; // Tambahkan komponen date-picker jika ada

interface FormValues {
  itemName: string;
  quantity: number;
  unitPrice: number;
  supplierName: string;
  purchaseDate: Date;
}

export default function ProcurementForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    console.log("Data yang Dikirim:", data); // Debug data
    try {
      const response = await fetch("/api/procurement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log("Respon API:", result); // Debug response
      if (response.ok) {
        alert("Pengadaan berhasil disimpan!");
        reset();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Error saat menyimpan pengadaan.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Input
            label="Nama Item"
            id="itemName"
            placeholder="Nama Item"
            {...register("itemName", { required: "Nama Item diperlukan" })}
            error={
              errors.itemName ? { message: errors.itemName.message } : undefined
            }
          />
        </TooltipTrigger>
        <TooltipContent>Masukkan nama item</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Input
            label="Kuantitas"
            id="quantity"
            type="number"
            placeholder="Kuantitas"
            {...register("quantity", {
              required: "Kuantitas diperlukan",
              valueAsNumber: true,
            })}
            error={
              errors.quantity ? { message: errors.quantity.message } : undefined
            }
          />
        </TooltipTrigger>
        <TooltipContent>Masukkan kuantitas item</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Input
            label="Harga Satuan"
            id="unitPrice"
            type="number"
            step="0.01"
            placeholder="Harga Satuan"
            {...register("unitPrice", {
              required: "Harga Satuan diperlukan",
              valueAsNumber: true,
            })}
            error={
              errors.unitPrice
                ? { message: errors.unitPrice.message }
                : undefined
            }
          />
        </TooltipTrigger>
        <TooltipContent>Masukkan harga satuan item</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Input
            label="Nama Supplier"
            id="supplierName"
            placeholder="Nama Supplier"
            {...register("supplierName", {
              required: "Nama Supplier diperlukan",
            })}
            error={
              errors.supplierName
                ? { message: errors.supplierName.message }
                : undefined
            }
          />
        </TooltipTrigger>
        <TooltipContent>Masukkan nama supplier</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Input
            label="Tanggal Pembelian"
            id="purchaseDate"
            type="date"
            {...register("purchaseDate", {
              required: "Tanggal Pembelian diperlukan",
            })}
            error={
              errors.purchaseDate
                ? { message: errors.purchaseDate.message }
                : undefined
            }
          />
        </TooltipTrigger>
        <TooltipContent>Masukkan tanggal pembelian</TooltipContent>
      </Tooltip>

      <Button type="submit" variant="default">
        Simpan Pengadaan
      </Button>
    </form>
  );
}
