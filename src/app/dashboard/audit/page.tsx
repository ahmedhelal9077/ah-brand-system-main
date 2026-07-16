import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuditClient from "@/components/dashboard/AuditClient";

const prisma = new PrismaClient();

export default async function AuditPage() {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "MANAGER")) {
    redirect("/dashboard");
  }

  const variants = await prisma.productVariant.findMany({
    include: { product: true }
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
      <AuditClient variants={variants} userId={session.userId} />
    </div>
  );
}
