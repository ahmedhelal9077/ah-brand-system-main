import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ShiftsClient from "@/components/dashboard/ShiftsClient";

const prisma = new PrismaClient();

export default async function ShiftsPage() {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "EMPLOYEE")) {
    redirect("/login");
  }

  const shifts = await prisma.shift.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { username: true } },
      _count: {
        select: { sales: true, expenses: true }
      }
    }
  });

  return <ShiftsClient shifts={shifts} userRole={session.role} userId={session.id} />;
}
