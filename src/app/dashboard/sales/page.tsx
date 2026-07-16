import { getServerTranslation } from "@/lib/serverI18n";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RefreshCcw, Search, Calendar, Hash } from "lucide-react";
import SalesListClient from "@/components/dashboard/SalesListClient";

const prisma = new PrismaClient();

export default async function SalesHistoryPage({ searchParams }: {searchParams: Promise<{q?: string;date?: string;fromInvoice?: string;toInvoice?: string;}>;}) {
  const { t } = await getServerTranslation();
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const q = sp.q || "";
  const date = sp.date || "";
  const fromInvoice = sp.fromInvoice || "";
  const toInvoice = sp.toInvoice || "";

  // Build the dynamic where clause
  let whereClause: any = {};
  const AND: any[] = [];

  if (q) {
    AND.push({ invoiceCode: { contains: q, mode: "insensitive" } });
  }

  if (date) {
    // Search by specific date (ignoring time)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    AND.push({
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    });
  }

  // Invoice Code range filtering (e.g. 1 to 50)
  // Assuming invoiceCode is something like "240626-1", the suffix is the daily counter
  // If we have date + fromInvoice + toInvoice, we can filter effectively.
  if (fromInvoice || toInvoice) {



    // If invoiceCode ends with a number, we can extract and compare.
    // However, Prisma doesn't support complex string splitting in where clause.
    // A simpler approach is to fetch by date, and filter in memory if fromInvoice/toInvoice are provided.
  }if (AND.length > 0) {whereClause.AND = AND;
  }

  // Get sales
  let sales = await prisma.sale.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    orderBy: { createdAt: "desc" },
    take: 150, // Increase slightly for bulk
    include: {
      user: true,
      packedBy: true,
      items: {
        include: {
          productVariant: {
            include: {
              product: true
            }
          }
        }
      }
    }
  });

  // In-memory filter for invoice range if provided
  if (fromInvoice || toInvoice) {
    const fromNum = fromInvoice ? parseInt(fromInvoice, 10) : 0;
    const toNum = toInvoice ? parseInt(toInvoice, 10) : 999999;

    sales = sales.filter((s) => {
      if (!s.invoiceCode) return false;
      const parts = s.invoiceCode.split('-');
      if (parts.length < 2) return false;
      const invNum = parseInt(parts[1], 10);
      if (isNaN(invNum)) return false;
      return invNum >= fromNum && invNum <= toNum;
    });
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <RefreshCcw size={28} />{t("trans_80")}

        </h1>
        <p style={{ color: "#9ca3af", marginBottom: "1.5rem" }}>{t("trans_81")}

        </p>

        <form action="/dashboard/sales" method="GET" style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flexGrow: 1, minWidth: "200px" }}>
            <label style={{ fontSize: "0.85rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: "0.3rem" }}><Search size={14} />{t("trans_82")}</label>
            <input
              type="text"
              name="q"
              placeholder={t("trans_83")}
              defaultValue={q}
              className="input-field" />
            
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", minWidth: "150px" }}>
            <label style={{ fontSize: "0.85rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: "0.3rem" }}><Calendar size={14} />{t("trans_67")}</label>
            <input
              type="date"
              name="date"
              defaultValue={date}
              className="input-field" />
            
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", width: "100px" }}>
            <label style={{ fontSize: "0.85rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: "0.3rem" }}><Hash size={14} />{t("trans_84")}</label>
            <input
              type="number"
              name="fromInvoice"
              placeholder={t("trans_85")}
              defaultValue={fromInvoice}
              className="input-field"
              min="1" />
            
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", width: "100px" }}>
            <label style={{ fontSize: "0.85rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: "0.3rem" }}><Hash size={14} />{t("trans_86")}</label>
            <input
              type="number"
              name="toInvoice"
              placeholder={t("trans_87")}
              defaultValue={toInvoice}
              className="input-field"
              min="1" />
            
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" className="btn btn-primary" style={{ height: "42px", padding: "0 2rem" }}>{t("trans_88")}</button>
          </div>
        </form>
      </div>

      <SalesListClient initialSales={sales} />
      
    </div>);

}
