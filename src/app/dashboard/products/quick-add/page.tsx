import { PrismaClient } from "@prisma/client";
import QuickAddClient from "@/components/dashboard/QuickAddClient";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function QuickAddPage() {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "WAREHOUSE")) {
    redirect("/dashboard");
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" }
  });

  return <QuickAddClient categories={categories} />;
}
