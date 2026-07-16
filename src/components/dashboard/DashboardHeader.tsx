"use client";

import { usePathname } from "next/navigation";
import { Bell, Download, Plus } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/lib/SettingsContext";

export default function DashboardHeader() {
  const pathname = usePathname();
  const { t } = useSettings();

  const getPageTitle = () => {
    if (pathname === "/dashboard") return t("overview") || "Dashboard";
    if (pathname.includes("/products")) return t("products");
    if (pathname.includes("/categories")) return t("categories");
    if (pathname.includes("/sales")) return t("salesHistory") || "Sales";
    if (pathname.includes("/users")) return t("userManagement");
    if (pathname.includes("/activity")) return t("activityLog") || "Activity";
    if (pathname.includes("/warehouse-performance")) return t("warehousePerformance") || "Warehouse";
    if (pathname.includes("/settings")) return t("settings") || "Settings";
    if (pathname.includes("/issues")) return t("issues") || "Issues";
    if (pathname.includes("/barcodes")) return t("barcodes") || "Barcodes";
    return "Dashboard";
  };

  return (
    <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
      <h1 className="text-2xl font-bold text-gray-800">{getPageTitle()}</h1>
      
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        {/* Export CSV */}
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
          <Download size={18} />
          Export CSV
        </button>
        
        {/* Create Order / Sale */}
        <Link href="/pos" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors shadow-sm">
          <Plus size={18} />
          Create Order
        </Link>
      </div>
    </div>
  );
}
