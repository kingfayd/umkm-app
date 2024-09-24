/** @format */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css"; // Mengimpor CSS global
import { cn } from "../../lib/utils";
import SideNavbar from "@/components/SideNavbar"; // Pastikan jalur ini sesuai dengan struktur folder Anda

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My App",
  description: "This is the main layout for the application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen w-full bg-white text-black flex",
          inter.className
        )}
      >
        {/* Sidebar */}
        <SideNavbar />
        {/* Main content */}
        <div className="p-8 w-full">{children}</div>
      </body>
    </html>
  );
}
