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

interface ProcurementItem {
  id: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplierName: string; // Tambahkan field supplierName
  purchaseDate: string; // Tambahkan field purchaseDate
}

const ProcurementTable = () => {
  const [data, setData] = useState<ProcurementItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/procurement");
        if (response.ok) {
          const result: ProcurementItem[] = await response.json();
          setData(result);
        } else {
          console.error("Failed to fetch procurement data.");
        }
      } catch (error) {
        console.error("Error fetching procurement data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Table>
      <TableCaption>Daftar Pengadaan</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Bahan</TableHead>
          <TableHead>Jumlah</TableHead>
          <TableHead>Harga Satuan</TableHead>
          <TableHead>Total Harga</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Tanggal Pembelian</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.itemName}</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>{item.unitPrice}</TableCell>
            <TableCell>{item.totalPrice}</TableCell>
            <TableCell>{item.supplierName}</TableCell>
            <TableCell>
              {new Date(item.purchaseDate).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProcurementTable;
