import { getServerTranslation } from "@/lib/serverI18n";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import IssuesClient from "@/components/dashboard/IssuesClient";
import { AlertTriangle } from "lucide-react";

const prisma = new PrismaClient();

export default async function IssuesPage() {
  const { t } = await getServerTranslation();
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    redirect("/dashboard");
  }

  const orders = await prisma.sale.findMany({
    where: {
      type: "ONLINE",
      hasIssue: true
    },
    orderBy: { createdAt: "asc" }, // Oldest first
    include: {
      user: true,
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

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
        <AlertTriangle size={28} className="text-danger" />
        <h1 style={{ fontSize: "1.8rem", fontWeight: "bold" }}>{"مشاكل التقفيل في المخزن"}</h1>
      </div>
      <IssuesClient initialOrders={orders} />
    </div>);

}
