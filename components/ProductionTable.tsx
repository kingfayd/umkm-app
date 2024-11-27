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
  productionQuantity: number;
  items: { itemName: string; quantity: number }[];
}

const ProductionTable = () => {
  const [data, setData] = useState<ProductionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/production");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          console.error("Failed to fetch production data.");
        }
      } catch (error) {
        console.error("Error fetching production data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full">
        <TableCaption>Daftar Produksi</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Produk</TableHead>
            <TableHead>Tanggal Produksi</TableHead>
            <TableHead>Jumlah Produksi</TableHead>
            <TableHead>Bahan Produksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.productName}</TableCell>
              <TableCell>
                {new Date(item.productionDate).toLocaleDateString()}
              </TableCell>
              <TableCell>{item.productionQuantity}</TableCell>
              <TableCell>
                {item.items.map((subItem, index) => (
                  <div key={index}>
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
