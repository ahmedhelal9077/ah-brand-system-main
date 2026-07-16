import { getServerTranslation } from "@/lib/serverI18n";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import FulfillmentClient from "@/components/FulfillmentClient";
import { LogOut } from "lucide-react";

const prisma = new PrismaClient();

export default async function FulfillmentPage() {
  const { t } = await getServerTranslation();
  const session = await getSession();
  if (!session || session.role !== "OWNER" && session.role !== "WAREHOUSE") {
    redirect("/login");
  }

  // Fetch pending online orders
  const pendingOrders = await prisma.sale.findMany({
    where: {
      type: "ONLINE",
      status: "PENDING",
      hasIssue: false
    },
    orderBy: { createdAt: "asc" }, // Oldest first
    include: {
      items: {
        include: {
          productVariant: {
            include: { product: true }
          }
        }
      }
    }
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)" }}>{t("trans_115")}</h1>
            <p style={{ color: "#9ca3af" }}>{t("trans_116")}{session.username}{t("trans_117")}</p>
          </div>
          <a href="/api/auth/logout" className="btn btn-secondary" style={{ display: "flex", gap: "0.5rem", alignItems: "center", textDecoration: "none" }}>
            <LogOut size={18} />{t("trans_118")}
          </a>
        </header>

        {/* Content */}
        <FulfillmentClient initialOrders={pendingOrders} />
        
      </div>
    </div>);

}
