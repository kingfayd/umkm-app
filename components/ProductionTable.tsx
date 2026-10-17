"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./ui/table";

interface ProductionItem {
  id: number;
  productName: string;
  productionDate: string;
  productionQuantity: number;
  items: { itemName: string; quantity: number }[];
}

const ProductionTable = () => {
  const [data, setData] = useState<ProductionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadProductions = useCallback(async () => {
    try {
      const response = await fetch("/api/production", {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Gagal memuat daftar produksi.");
      setData(await response.json());
      setError(null);
    } catch (loadError) {
      console.error("Error fetching production data:", loadError);
      setError("Gagal memuat daftar produksi.");
    }
  }, []);

  useEffect(() => {
    void loadProductions();
    window.addEventListener("production-created", loadProductions);
    return () => window.removeEventListener("production-created", loadProductions);
  }, [loadProductions]);

  return (
    <div className="overflow-x-auto">
      {error && <p role="alert" className="text-red-500">{error}</p>}
      <Table className="min-w-full">
        <TableCaption>Daftar Produksi</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Produk</TableHead>
            <TableHead>Tanggal Produksi</TableHead>
            <TableHead>Stok Tersedia</TableHead>
            <TableHead>Bahan Produksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.productName}</TableCell>
              <TableCell>
                {new Date(item.productionDate).toLocaleDateString("id-ID")}
              </TableCell>
              <TableCell>{item.productionQuantity}</TableCell>
              <TableCell>
                {item.items.map((subItem, index) => (
                  <div key={`${subItem.itemName}-${index}`}>
                    {subItem.itemName} ({subItem.quantity})
                  </div>
                ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductionTable;
