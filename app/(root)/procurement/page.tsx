"use client";

import PageTitle from "@/components/PageTitle";
import ProcurementForm from "@/components/ProcurementForm";
import ProcurementTable from "@/components/ProcurementTable";
import { TooltipProvider } from "@/components/ui/tooltip"; // Impor TooltipProvider

interface Props {}

export default function ProcurementPage({}: Props) {
  return (
    <TooltipProvider>
      {" "}
      {/* Tambahkan TooltipProvider di sini */}
      <div className="flex flex-col gap-5 w-full">
        <PageTitle title="Pengadaan" />
        <ProcurementForm />
        <ProcurementTable />
      </div>
    </TooltipProvider>
  );
}
