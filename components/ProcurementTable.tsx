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
import Pagination from "./Pagination";
import { fetchWithAuth } from "../lib/utils";

interface ProcurementItem {
  id: number;
  category: string;
  itemName: string | null;
  initialQuantity: number | null;
  currentQuantity: number | null;
  unit: string | null; // Unit still exists in the data
  totalPrice: number;
  supplierName: string | null;
  purchaseDate: string;
}

const ProcurementTable = () => {
  const [data, setData] = useState<ProcurementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchWithAuth("/api/procurement", {
          method: "GET",
        });
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Fetched data:", result);
        setData(result);
      } catch (error) {
        console.error("Error fetching procurement data:", error);
        setError("Gagal memuat data pengadaan. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full">
        <TableCaption>Daftar Pengadaan</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Kategori</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Kuantitas</TableHead> {/* Combined quantity and unit */}
            <TableHead>Total Harga</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Stok</TableHead> {/* Added unit to stock column */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.itemName || "-"}</TableCell>
              <TableCell>
                {item.initialQuantity
                  ? `${item.initialQuantity} ${item.unit || ""}`
                  : "-"}
              </TableCell>{" "}
              {/* Display combined quantity and unit */}
              <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
              <TableCell>{item.supplierName || "-"}</TableCell>
              <TableCell>
                {new Date(item.purchaseDate).toLocaleDateString("id-ID")}
              </TableCell>
              <TableCell>
                {item.currentQuantity
                  ? `${item.currentQuantity} ${item.unit || ""}`
                  : "-"}
              </TableCell>{" "}
              {/* Display combined stock and unit */}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Komponen Pagination */}
      <div className="flex justify-end mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>
    </div>
  );
};

export default ProcurementTable;
