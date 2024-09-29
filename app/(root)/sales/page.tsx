/**
 * eslint-disable @next/next/no-img-element
 *
 * @format
 */

/** @format */
"use client";

import { useState, useEffect } from "react";
import PageTitle from "@/components/PageTitle";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";

// Data structure for production items
interface ProductionItem {
  id: number;
  productName: string;
  productionQuantity: number; // Stok yang tersedia
}

interface SelectedProduct {
  id: number;
  name: string;
  price: number;
  quantity: number;
  availableStock: number; // Stok yang tersedia untuk produk yang dipilih
}

export default function SalesPage() {
  const [products, setProducts] = useState<ProductionItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);

  // Fetch available products from the production page
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/production");
        if (response.ok) {
          const result = await response.json();
          setProducts(result);
        } else {
          console.error("Failed to fetch products.");
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  const handleSelectProduct = () => {
    if (selectedProduct !== null && price !== null && price > 0) {
      const product = products.find((p) => p.id === selectedProduct);
      if (product) {
        setSelectedProducts((prev) => [
          ...prev,
          {
            id: product.id,
            name: product.productName,
            price: price,
            quantity: 1,
            availableStock: product.productionQuantity,
          },
        ]);
        setSelectedProduct(null);
        setPrice(null);
      }
    } else {
      alert("Pilih produk dan masukkan harga.");
    }
  };

  const handlePriceChange = (id: number, price: number) => {
    setSelectedProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price: price } : item))
    );
  };

  const handleQuantityChange = (id: number, delta: number) => {
    setSelectedProducts((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(
                Math.min(item.quantity + delta, item.availableStock),
                0
              ),
            }
          : item
      )
    );
  };

  // Fungsi untuk menghitung total kuantitas produk yang dipilih
  const totalQuantity = selectedProducts.reduce(
    (total, product) => total + product.quantity,
    0
  );

  // Fungsi untuk menghitung total pendapatan dari produk yang dipilih
  const totalRevenue = selectedProducts.reduce(
    (total, product) => total + product.price * product.quantity,
    0
  );

  return (
    <div className="flex flex-col gap-5 w-full">
      <PageTitle title="Penjualan" />

      <div className="flex flex-col gap-5">
        <h2 className="text-xl font-bold">Pilih Produk</h2>

        <div className="flex items-center gap-4">
          <select
            value={selectedProduct || ""}
            onChange={(e) => setSelectedProduct(Number(e.target.value))}
            className="border p-2 rounded-lg w-64"
          >
            <option value="">Pilih Produk</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.productName} (Stok: {product.productionQuantity})
              </option>
            ))}
          </select>

          <Input
  type="number"
  placeholder="Harga Produk"
  value={price !== null ? price : ""}
  onChange={(e) => setPrice(parseFloat(e.target.value))}
  className="w-24"
  label="Harga Produk" // Tambahkan properti label
/>



          <Button onClick={handleSelectProduct}>Tambah Produk</Button>
        </div>
      </div>

      <div className="flex flex-col gap-5 mt-10">
        <h2 className="text-xl font-bold">Produk yang Dipilih</h2>
        {selectedProducts.length > 0 ? (
          selectedProducts.map((product) => (
            <div
              key={product.id}
              className="flex justify-between items-center border p-4 rounded-lg"
            >
              <span>{product.name}</span>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Harga Produk"
                  value={product.price}
                  onChange={(e) =>
                    handlePriceChange(product.id, Number(e.target.value))
                  }
                  className="w-24"
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleQuantityChange(product.id, -1)}
                    disabled={product.quantity === 0}
                  >
                    -
                  </Button>
                  <span>{product.quantity}</span>
                  <Button
                    onClick={() => handleQuantityChange(product.id, 1)}
                    disabled={product.quantity >= product.availableStock}
                  >
                    +
                  </Button>
                  <span className="text-sm text-gray-500">
                    (Stok: {product.availableStock})
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>Belum ada produk yang dipilih.</p>
        )}
      </div>

      {/* Laporan Harian */}
      <div className="flex flex-col gap-5 mt-10">
        <h2 className="text-xl font-bold">Laporan Harian</h2>
        <div className="border p-4 rounded-lg">
          <p>Total Produk Terjual: {totalQuantity}</p>
          <p>Total Pendapatan: Rp {totalRevenue.toLocaleString("id-ID")}</p>
        </div>
      </div>
    </div>
  );
}
