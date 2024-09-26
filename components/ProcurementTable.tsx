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
  supplierName: string;
  purchaseDate: string;
}

const ProcurementTable = () => {
  const [data, setData] = useState<ProcurementItem[]>([]);
  const [loading, setLoading] = useState(true); // State untuk loading

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/procurement");
        if (response.ok) {
          const result = await response.json();

          // Format data sesuai dengan interface ProcurementItem
          const formattedData = result.map((item: any) => ({
            id: item.id,
            itemName: item.item_name, // Ubah sesuai dengan nama kolom di Supabase
            quantity: item.quantity,
            unitPrice: item.unit_price, // Ubah sesuai dengan nama kolom di Supabase
            totalPrice: item.total_price, // Ubah sesuai dengan nama kolom di Supabase
            supplierName: item.supplier_name, // Ubah sesuai dengan nama kolom di Supabase
            purchaseDate: item.purchase_date, // Ubah sesuai dengan nama kolom di Supabase
          }));

          setData(formattedData);
        } else {
          console.error("Failed to fetch procurement data.");
        }
      } catch (error) {
        console.error("Error fetching procurement data:", error);
      } finally {
        setLoading(false); // Set loading ke false setelah fetch selesai
      }
    };

    fetchData();
  }, []);

  // Tampilkan loading jika data masih dalam proses fetching
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full">
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
    </div>
  );
};

export default ProcurementTable;
