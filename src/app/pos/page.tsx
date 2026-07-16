import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import POSClient from "@/components/POSClient";

const prisma = new PrismaClient();

export default async function POSPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Fetch all variants with product info for offline-like instant search
  const variants = await prisma.productVariant.findMany({
    where: { product: { isActive: true } },
    include: {
      product: {
        select: { 
          name: true, 
          price: true, 
          code: true,
          category: { select: { name: true } } 
        }
      }
    }
  });

  const activeShift = await prisma.shift.findFirst({
    where: { userId: session.id, status: "OPEN" },
  });

  return <POSClient variants={variants} userRole={session.role} activeShift={activeShift} userId={session.id} />;
}
