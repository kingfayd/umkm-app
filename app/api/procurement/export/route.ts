// app/api/procurement/export/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import * as XLSX from "xlsx";

// Register fonts
(pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(angka);
};

export async function GET(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const format = searchParams.get("format") || "pdf"; // Default to pdf if no format specified

    if (!startDate || !endDate) {
      return new NextResponse("Tanggal mulai dan akhir diperlukan", {
        status: 400,
      });
    }
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedEndDate.getTime()) ||
      parsedStartDate > parsedEndDate
    ) {
      return new NextResponse("Rentang tanggal tidak valid", { status: 400 });
    }

    const procurements = await prisma.procurement.findMany({
      where: {
        userId,
        purchaseDate: {
          gte: parsedStartDate,
          lte: parsedEndDate,
        },
      },
    });

    if (format === "pdf") {
      // Prepare table data for PDF
      const tableBody = [
        [
          { text: "Kategori", style: "tableHeader" },
          { text: "Nama", style: "tableHeader" },
          { text: "Jumlah", style: "tableHeader" },
          { text: "Total Harga", style: "tableHeader" },
          { text: "Supplier", style: "tableHeader" },
          { text: "Tanggal", style: "tableHeader" },
        ],
      ];

      procurements.forEach((item) => {
        tableBody.push([
          { text: item.category || "-", style: "tableData" },
          { text: item.itemName || "-", style: "tableData" },
          {
            text:
              item.initialQuantity === 0
                ? "-"
                : `${item.initialQuantity?.toString()} ${item.unit || ""}`,
            style: "tableData",
          },
          { text: formatRupiah(Number(item.totalPrice)), style: "tableData" },
          { text: item.supplierName || "-", style: "tableData" },
          {
            text: new Date(item.purchaseDate).toLocaleDateString(),
            style: "tableData",
          },
        ]);
      });

      const docDefinition: any = {
        content: [
          { text: "Laporan Pengadaan", style: "header" },
          {
            text: `Periode: ${new Date(
              startDate
            ).toLocaleDateString()} - ${new Date(
              endDate
            ).toLocaleDateString()}`,
            style: "subheader",
          },
          {
            table: {
              headerRows: 1,
              widths: [80, 100, 60, 80, 100, 80],
              body: tableBody,
            },
          },
        ],
        styles: {
          header: { fontSize: 16, bold: true, margin: [0, 0, 0, 10] },
          subheader: { fontSize: 12, margin: [0, 0, 0, 10] },
          tableHeader: { bold: true, fontSize: 10, fillColor: "#f8f9fa" },
          tableData: { fontSize: 9 },
        },
        pageMargins: [30, 15, 10, 15],
      };

      const pdfDoc = pdfMake.createPdf(docDefinition);
      const buffer = await new Promise<Buffer>((resolve) => {
        pdfDoc.getBuffer((buffer: Buffer) => {
          resolve(buffer);
        });
      });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="pengadaan.pdf"',
        },
      });
    }

    if (format === "excel") {
      // Prepare table data for Excel
      const tableData = procurements.map((item) => ({
        Category: item.category || "-",
        Item: item.itemName || "-",
        Quantity: `${item.initialQuantity} ${item.unit || ""}`,
        TotalPrice: formatRupiah(Number(item.totalPrice)),
        Supplier: item.supplierName || "-",
        Date: new Date(item.purchaseDate).toLocaleDateString(),
      }));

      const ws = XLSX.utils.json_to_sheet(tableData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Procurement Report");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="pengadaan.xlsx"',
        },
      });
    }

    return new NextResponse("Format tidak dikenali", { status: 400 });
  } catch (error) {
    console.error("Error during procurement export:", error);
    return new NextResponse("Terjadi kesalahan saat memproses ekspor", {
      status: 500,
    });
  }
}

// Export this to indicate the route is dynamic
export const dynamic = "force-dynamic";
