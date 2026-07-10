import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SidebarClient from "@/components/SidebarClient";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  let lowStockAlerts: { productName: string; colorName: string; stock: number; code: number }[] = [];
  
  if (session.role === "OWNER") {
    const lowStockVariants = await prisma.productVariant.findMany({
      where: {
        stock: { lte: 3 },
        product: { isActive: true }
      },
      include: {
        product: { select: { name: true, code: true } }
      }
    });

    lowStockAlerts = lowStockVariants.map(v => ({
      productName: v.product.name,
      code: v.product.code,
      colorName: v.colorName,
      stock: v.stock
    }));
  }

  return (
    <div style={{ flexDirection: "row", display: "flex", backgroundColor: "var(--sidebar-bg)", minHeight: "100vh", padding: "1rem", gap: "1rem" }}>
      {/* Sidebar (Client Component) */}
      <SidebarClient role={session.role} username={session.username} lowStockAlerts={lowStockAlerts} />

      {/* Main Content */}
      <main style={{ flexGrow: 1, padding: "2rem", overflowY: "auto", height: "calc(100vh - 2rem)", backgroundColor: "var(--background)", borderRadius: "var(--radius-xl)", boxShadow: "0 0 20px rgba(0,0,0,0.2)" }}>
        {children}
      </main>
      
      <style>{`
        .hover-bg:hover { background: var(--secondary); }
      `}</style>
    </div>
  );
}
