import { PrismaClient } from "@prisma/client";
import StoreClient from "@/components/StoreClient";

const prisma = new PrismaClient();

export const revalidate = 60; // Cache for 60 seconds for instant loading

import { getServerTranslation } from "@/lib/serverI18n";

export default async function StorePage() {
  const { t } = await getServerTranslation();

  const categories = await prisma.category.findMany({
    include: {
      products: {
        where: { isActive: true },
        include: { variants: true }
      }
    },
    orderBy: { name: "asc" }
  });

  const uncategorizedProducts = await prisma.product.findMany({
    where: { categoryId: null, isActive: true },
    include: { variants: true }
  });

  if (uncategorizedProducts.length > 0) {
    categories.push({
      id: "uncategorized",
      name: t("uncategorized" as any) || "Uncategorized",
      products: uncategorizedProducts
    } as any);
  }

  const links = await prisma.storeLink.findMany({ orderBy: { createdAt: 'asc' } });
  const locations = await prisma.storeLocation.findMany({ orderBy: { createdAt: 'asc' } });

  return <StoreClient categories={categories} storeLinks={links} storeLocations={locations} />;
}
