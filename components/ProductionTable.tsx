"use client";

import { useEffect, useState } from "react";
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
  productionQuantity: number; // Menambahkan properti untuk jumlah produksi
  items: { itemName: string; quantity: number }[]; // Menyimpan item dengan jumlah
}

const ProductionTable = () => {
  const [data, setData] = useState<ProductionItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/production"); // Ganti dengan API yang sesuai
        if (response.ok) {
          const result: ProductionItem[] = await response.json();
          setData(result);
        } else {
          console.error("Failed to fetch production data.");
        }
      } catch (error) {
        console.error("Error fetching production data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Table>
      <TableCaption>Daftar Produksi</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Nama Produk</TableHead>
          <TableHead>Bahan</TableHead>
          <TableHead>Tanggal Produksi</TableHead>
          <TableHead>Jumlah Produksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.productName}</TableCell>
            <TableCell>
              {item.items.map(({ itemName, quantity }) => (
                <div key={itemName}>
                  {itemName}({quantity}){/* Menampilkan jumlah setiap bahan */}
                </div>
              ))}
            </TableCell>
            <TableCell>
              {new Date(item.productionDate).toLocaleDateString()}
            </TableCell>
            <TableCell>{item.productionQuantity}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProductionTable;
