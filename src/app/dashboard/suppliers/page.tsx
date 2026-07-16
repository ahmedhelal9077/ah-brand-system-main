import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SuppliersClient from "@/components/dashboard/SuppliersClient";

const prisma = new PrismaClient();

export default async function SuppliersPage() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    redirect("/dashboard");
  }

  const suppliers = await prisma.supplier.findMany({
    include: { purchases: { orderBy: { date: "desc" }, take: 5 } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
      <SuppliersClient suppliers={suppliers} />
    </div>
  );
}
