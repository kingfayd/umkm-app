"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";

interface RawMaterial {
  id: number;
  itemName: string;
  currentQuantity: number;
  unit: string | null;
}

interface FormValues {
  productName: string;
  productionDate: string;
  productionQuantity: number;
  items: { id: number; quantity: number }[];
}

export default function ProductionForm() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { items: [] } });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    fetch("/api/procurement/rawMaterial", {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Gagal memuat daftar bahan baku.");
        setMaterials(await response.json());
      })
      .catch((loadError: unknown) => {
        console.error("Error fetching raw materials:", loadError);
        setError("Gagal memuat daftar bahan baku.");
      });
  }, []);

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/production", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || "Gagal menyimpan produksi.");

      reset({ items: [] });
      window.dispatchEvent(new Event("production-created"));
      const materialsResponse = await fetch("/api/procurement/rawMaterial", {
        credentials: "include",
        cache: "no-store",
      });
      if (materialsResponse.ok) setMaterials(await materialsResponse.json());
    } catch (submitError) {
      console.error("Error saving production:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Gagal menyimpan produksi."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {error && <p role="alert" className="text-red-500">{error}</p>}
      <Input
        label="Nama Produk"
        id="productName"
        placeholder="Nama Produk"
        {...register("productName", { required: "Nama produk diperlukan" })}
        error={errors.productName ? { message: errors.productName.message } : undefined}
      />
      <Input
        label="Tanggal Produksi"
        id="productionDate"
        type="date"
        {...register("productionDate", { required: "Tanggal produksi diperlukan" })}
        error={errors.productionDate ? { message: errors.productionDate.message } : undefined}
      />
      <Input
        label="Jumlah Produksi"
        id="productionQuantity"
        type="number"
        min={1}
        step={1}
        {...register("productionQuantity", {
          required: "Jumlah produksi diperlukan",
          valueAsNumber: true,
          validate: (value) =>
            (Number.isSafeInteger(value) && value > 0) ||
            "Jumlah harus bilangan bulat lebih besar dari 0",
        })}
        error={errors.productionQuantity ? { message: errors.productionQuantity.message } : undefined}
      />

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-4">
          <div className="flex-1">
            <label htmlFor={`items.${index}.id`} className="mb-2 block">
              Bahan Baku
            </label>
            <select
              id={`items.${index}.id`}
              {...register(`items.${index}.id`, {
                required: "Pilih bahan baku",
                valueAsNumber: true,
                validate: (value) => value > 0 || "Pilih bahan baku",
              })}
              className="w-full rounded border p-2"
            >
              <option value="">Pilih bahan</option>
              {materials.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.itemName} (Stok: {item.currentQuantity} {item.unit ?? ""})
                </option>
              ))}
            </select>
            {errors.items?.[index]?.id && (
              <p className="text-sm text-red-500">{errors.items[index]?.id?.message}</p>
            )}
          </div>
          <Input
            label="Jumlah bahan"
            id={`items.${index}.quantity`}
            type="number"
            min={1}
            step={1}
            {...register(`items.${index}.quantity`, {
              required: "Jumlah bahan diperlukan",
              valueAsNumber: true,
              validate: (value) =>
                (Number.isSafeInteger(value) && value > 0) ||
                "Jumlah harus bilangan bulat lebih besar dari 0",
            })}
            error={
              errors.items?.[index]?.quantity
                ? { message: errors.items[index]?.quantity?.message }
                : undefined
            }
          />
          <Button type="button" onClick={() => remove(index)} className="bg-red-500">
            Hapus
          </Button>
        </div>
      ))}

      <Button
        type="button"
        onClick={() => append({ id: 0, quantity: 1 })}
        disabled={!materials.length}
      >
        Tambah Bahan
      </Button>
      <Button type="submit" disabled={saving}>
        {saving ? "Menyimpan..." : "Simpan Produksi"}
      </Button>
    </form>
  );
}
