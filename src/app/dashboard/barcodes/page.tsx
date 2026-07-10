import { PrismaClient } from "@prisma/client";
import BarcodesClient from "@/components/BarcodesClient";

const prisma = new PrismaClient();

export default async function BarcodesPage() {
  const variants = await prisma.productVariant.findMany({
    where: { product: { isActive: true } },
    include: {
      product: { select: { name: true, code: true, price: true } }
    },
    orderBy: { product: { name: "asc" } }
  });

  return <BarcodesClient variants={variants} />;
}
