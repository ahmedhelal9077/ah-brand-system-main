import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CustomersClient from "@/components/dashboard/CustomersClient";

const prisma = new PrismaClient();

export default async function CustomersPage() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    redirect("/dashboard");
  }

  const customers = await prisma.customer.findMany({
    orderBy: { totalOrders: "desc" }
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
      <CustomersClient customers={customers} />
    </div>
  );
}
