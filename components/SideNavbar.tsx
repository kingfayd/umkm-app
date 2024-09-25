/** @format */
"use client";

import { useState } from "react";
import { Nav } from "./ui/nav";
import {
  HandPlatter,
  ShoppingBasket,
  CircleDollarSign,
  LayoutDashboard,
  UsersRound,
  AlignJustify,
} from "lucide-react"; // Mengimpor AlignJustify
import { Button } from "./ui/button";
import { useWindowWidth } from "@react-hook/window-size";

const SideNavbar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const onlyWidth = useWindowWidth();
  const mobileWidth = onlyWidth < 768;

  function toggleSidebar() {
    setIsCollapsed(!isCollapsed);
  }

  return (
    <div className="relative">
      {/* Tombol toggle selalu terlihat */}
      <div
        className={`absolute top-7 transition-transform ${
          isCollapsed ? "right-[-35px]" : "right-[-20px]" // Mengubah posisi tombol saat sidebar disembunyikan
        } z-10`}
      >
        <Button
          onClick={toggleSidebar}
          variant="secondary"
          className="rounded-full p-2"
        >
          <AlignJustify />
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`border-r pb-10 pt-24 transition-all duration-300 ${
          isCollapsed
            ? "w-0 overflow-hidden"
            : "min-w-[80px] max-w-[200px] px-3"
        }`}
      >
        {!isCollapsed && (
          <Nav
            isCollapsed={mobileWidth ? true : isCollapsed}
            links={[
              {
                title: "Dashboard",
                href: "/",
                icon: LayoutDashboard,
                variant: "default",
              },
              {
                title: "Pengadaan",
                href: "/procurement",
                icon: ShoppingBasket,
                variant: "ghost",
              },
              {
                title: "Produksi",
                href: "/production",
                icon: HandPlatter,
                variant: "ghost",
              },
              {
                title: "Penjualan",
                href: "/sales",
                icon: CircleDollarSign,
                variant: "ghost",
              },
              {
                title: "Sign Out",
                href: "/auth/sign-in",
                icon: UsersRound,
                variant: "ghost",
              },
            ]}
          />
        )}
      </div>
    </div>
  );
};

export default SideNavbar;
