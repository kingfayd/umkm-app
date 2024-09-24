"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";

interface ProcurementItem {
  id: number;
  itemName: string;
  quantity: number;
}

interface FormValues {
  productName: string;
  productionDate: Date;
  productionQuantity: number; // Tambahkan field untuk jumlah produksi
  items: { id: number; itemName: string; quantity: number }[];
}

export default function ProductionForm() {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const [procurementItems, setProcurementItems] = useState<ProcurementItem[]>(
    []
  );

  useEffect(() => {
    const fetchProcurementItems = async () => {
      try {
        const response = await fetch("/api/procurement");
        if (response.ok) {
          const result: ProcurementItem[] = await response.json();
          setProcurementItems(result);
        } else {
          console.error("Failed to fetch procurement items.");
        }
      } catch (error) {
        console.error("Error fetching procurement items:", error);
      }
    };

    fetchProcurementItems();
  }, []);

  const onSubmit = async (data: FormValues) => {
    const productionDateISO = new Date(data.productionDate).toISOString();

    // Tambahkan id ke setiap item
    const itemsWithId = data.items.map((item) => {
      const selectedProcurementItem = procurementItems.find(
        (procItem) => procItem.itemName === item.itemName
      );
      return {
        ...item,
        id: selectedProcurementItem?.id, // Ambil ID dari procurementItems
      };
    });

    try {
      const response = await fetch("/api/production", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName: data.productName,
          productionDate: productionDateISO,
          productionQuantity: data.productionQuantity, // Kirim jumlah produksi
          items: itemsWithId,
        }),
      });

      if (response.ok) {
        alert("Produksi berhasil disimpan!");
        reset();
      } else {
        const result = await response.json();
        alert(`Error: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error saat menyimpan produksi:", error);
      alert("Error saat menyimpan produksi.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Nama Produk"
        id="productName"
        placeholder="Nama Produk"
        {...register("productName", {
          required: "Nama produk diperlukan",
        })}
        error={
          errors.productName
            ? { message: errors.productName.message }
            : undefined
        }
      />

      <Input
        label="Tanggal Produksi"
        id="productionDate"
        type="date"
        {...register("productionDate", {
          required: "Tanggal produksi diperlukan",
        })}
        error={
          errors.productionDate
            ? { message: errors.productionDate.message }
            : undefined
        }
      />

      <Input
        label="Jumlah Produksi" // Tambahkan input untuk jumlah produksi
        id="productionQuantity"
        type="number"
        placeholder="Jumlah Produksi"
        {...register("productionQuantity", {
          required: "Jumlah produksi diperlukan",
          valueAsNumber: true,
          validate: (value) => value > 0 || "Jumlah harus lebih besar dari 0",
        })}
        error={
          errors.productionQuantity
            ? { message: errors.productionQuantity.message }
            : undefined
        }
      />

      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-4 items-center">
          <div>
            <select
              {...register(`items.${index}.itemName`, {
                required: "Pilih bahan yang akan digunakan",
              })}
              className="border p-2 rounded"
            >
              <option value="">Pilih Bahan</option>
              {procurementItems.map((item) => (
                <option key={item.id} value={item.itemName}>
                  {item.itemName} (Stok: {item.quantity})
                </option>
              ))}
            </select>
            {errors.items?.[index]?.itemName && (
              <p className="text-red-500 text-sm">
                {errors.items[index].itemName?.message}
              </p>
            )}
          </div>

          <Input
            label={`Jumlah bahan ${index + 1}`}
            id={`items.${index}.quantity`}
            type="number"
            placeholder="Jumlah"
            min={0}
            {...register(`items.${index}.quantity`, {
              required: "Jumlah yang digunakan diperlukan",
              valueAsNumber: true,
              validate: (value) =>
                value > 0 || "Jumlah harus lebih besar dari 0",
            })}
            error={
              errors.items?.[index]?.quantity
                ? { message: errors.items[index].quantity?.message }
                : undefined
            }
          />

          <Button
            type="button"
            onClick={() => remove(index)}
            className="bg-red-500"
          >
            Hapus
          </Button>
        </div>
      ))}

      <Button
        type="button"
        onClick={() => append({ id: 0, itemName: "", quantity: 0 })}
      >
        Tambah Bahan
      </Button>

      <Button type="submit" variant="default">
        Simpan Produksi
      </Button>
    </form>
  );
}
