/**
 * eslint-disable @next/next/no-img-element
 *
 * @format
 */

/** @format */
"use client";
import PageTitle from "@/components/PageTitle";

interface Props {
  // Definisikan props yang akan diterima komponen Anda di sini
}

export default function SalesPage({}: Props) {
  return (
    <div className="flex flex-col gap-5  w-full">
      <PageTitle title="Penjualan" />
    </div>
  );
}
