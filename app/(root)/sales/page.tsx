"use client";

import { useCallback, useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";

interface Product {
  id: number;
  productName: string;
  productionQuantity: number;
}

interface SelectedProduct {
  id: number;
  name: string;
  price: number;
  quantity: number;
  availableStock: number;
}

interface SalesSummary {
  dailyRevenue: number;
  dailyQuantity: number;
}

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [summary, setSummary] = useState<SalesSummary>({
    dailyRevenue: 0,
    dailyQuantity: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setError(null);
    try {
      const [productsResponse, salesResponse] = await Promise.all([
        fetch("/api/production", { credentials: "include", cache: "no-store" }),
        fetch("/api/sales", { credentials: "include", cache: "no-store" }),
      ]);
      if (!productsResponse.ok || !salesResponse.ok) {
        throw new Error("Gagal memuat produk atau ringkasan penjualan.");
      }
      const [productionData, salesData] = await Promise.all([
        productsResponse.json(),
        salesResponse.json(),
      ]);
      setProducts(productionData);
      setSummary({
        dailyRevenue: salesData.dailyRevenue,
        dailyQuantity: salesData.dailyQuantity,
      });
    } catch (loadError) {
      console.error("Error loading sales data:", loadError);
      setError("Gagal memuat data penjualan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const addProduct = () => {
    if (
      selectedProduct === null ||
      price === null ||
      !Number.isFinite(price) ||
      price < 0.01 ||
      price > 9999999999.99
    ) {
      setError("Pilih produk dan masukkan harga yang valid.");
      return;
    }

    const product = products.find((item) => item.id === selectedProduct);
    if (!product) {
      setError("Produk tidak ditemukan.");
      return;
    }
    const alreadySelected = selectedProducts.find((item) => item.id === product.id);
    if (alreadySelected && alreadySelected.price !== price) {
      setError("Produk yang sama harus menggunakan satu harga dalam transaksi.");
      return;
    }
    if (
      alreadySelected &&
      alreadySelected.quantity >= alreadySelected.availableStock
    ) {
      setError("Jumlah produk melebihi stok yang tersedia.");
      return;
    }

    setSelectedProducts((current) =>
      alreadySelected
        ? current.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [
            ...current,
            {
              id: product.id,
              name: product.productName,
              price,
              quantity: 1,
              availableStock: product.productionQuantity,
            },
          ]
    );
    setSelectedProduct(null);
    setPrice(null);
    setError(null);
  };

  const updateQuantity = (id: number, delta: number) => {
    setSelectedProducts((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(
                0,
                Math.min(item.quantity + delta, item.availableStock)
              ),
            }
          : item
      )
    );
  };

  const updatePrice = (id: number, value: string) => {
    const nextPrice = value === "" ? 0 : Number(value);
    if (!Number.isFinite(nextPrice) || nextPrice < 0 || nextPrice > 9999999999.99) return;
    const roundedPrice = Math.round(nextPrice * 100) / 100;
    setSelectedProducts((current) =>
      current.map((item) =>
        item.id === id ? { ...item, price: roundedPrice } : item
      )
    );
  };

  const saveSale = async () => {
    if (!selectedProducts.length) {
      setError("Tambahkan produk sebelum menyimpan penjualan.");
      return;
    }
    if (selectedProducts.some((item) => item.price < 0.01 || item.quantity < 1)) {
      setError("Pastikan harga dan jumlah setiap produk valid.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: selectedProducts.map(({ id, price, quantity }) => ({
            id,
            price,
            quantity,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Gagal menyimpan penjualan.");
      }
      setSelectedProducts([]);
      await refreshData();
    } catch (saveError) {
      console.error("Error saving sale:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Gagal menyimpan penjualan."
      );
    } finally {
      setSaving(false);
    }
  };

  const cartQuantity = selectedProducts.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const cartTotal = selectedProducts.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div className="flex w-full flex-col gap-5">
      <PageTitle title="Penjualan" />

      {error && <p role="alert" className="text-red-500">{error}</p>}
      {loading ? (
        <p>Memuat data...</p>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <h2 className="text-lg">Pilih Produk</h2>
            <select
              value={selectedProduct ?? ""}
              onChange={(event) => {
                setSelectedProduct(
                  event.target.value ? Number(event.target.value) : null
                );
                setError(null);
              }}
              className="w-full rounded-lg border p-2"
            >
              <option value="">Pilih Produk</option>
              {products
                .filter((product) => product.productionQuantity > 0)
                .map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.productName} (Stok: {product.productionQuantity})
                  </option>
                ))}
            </select>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              label="Harga Produk"
              placeholder="Masukkan harga produk"
              value={price ?? ""}
              onChange={(event) =>
                setPrice(event.target.value ? Number(event.target.value) : null)
              }
            />
            <Button
              type="button"
              onClick={addProduct}
              disabled={selectedProduct === null}
              className="w-full"
            >
              Tambah Produk
            </Button>
          </section>

          <section className="mt-6 flex flex-col gap-5">
            <h2 className="text-lg">Produk yang Dipilih</h2>
            {selectedProducts.length ? (
              selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
                >
                  <span className="flex-grow">{product.name}</span>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    label="Harga Produk"
                    value={product.price}
                    onChange={(event) => updatePrice(product.id, event.target.value)}
                    className="w-32"
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      onClick={() => updateQuantity(product.id, -1)}
                      disabled={product.quantity === 0}
                    >
                      -
                    </Button>
                    <span>{product.quantity}</span>
                    <Button
                      type="button"
                      onClick={() => updateQuantity(product.id, 1)}
                      disabled={product.quantity >= product.availableStock}
                    >
                      +
                    </Button>
                    <span className="text-sm text-gray-500">
                      (Stok: {product.availableStock})
                    </span>
                    <Button
                      type="button"
                      onClick={() =>
                        setSelectedProducts((current) =>
                          current.filter((item) => item.id !== product.id)
                        )
                      }
                      className="bg-red-500 text-white"
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p>Belum ada produk yang dipilih.</p>
            )}
          </section>

          <Button
            type="button"
            onClick={saveSale}
            disabled={!selectedProducts.length || saving}
            className="mt-4 w-full"
          >
            {saving ? "Menyimpan..." : "Simpan Penjualan"}
          </Button>

          <section className="mt-6 flex flex-col gap-2 rounded-lg border p-4">
            <h2 className="text-lg">Ringkasan</h2>
            <p>Jumlah dalam transaksi: {cartQuantity}</p>
            <p>
              Total transaksi:{" "}
              {cartTotal.toLocaleString("id-ID", {
                style: "currency",
                currency: "IDR",
              })}
            </p>
            <p>Produk terjual hari ini: {summary.dailyQuantity}</p>
            <p>
              Pendapatan hari ini:{" "}
              {summary.dailyRevenue.toLocaleString("id-ID", {
                style: "currency",
                currency: "IDR",
              })}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
