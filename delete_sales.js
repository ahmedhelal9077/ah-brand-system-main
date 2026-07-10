const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allSales = await prisma.sale.findMany({
    include: { items: true }
  });

  console.log(`Found ${allSales.length} sales to delete.`);

  let restoredItems = 0;
  // Restore stock for all sale items
  for (const sale of allSales) {
    if (sale.status !== "CANCELLED") {
      for (const item of sale.items) {
        if (!item.isReturned) {
          try {
            await prisma.productVariant.update({
              where: { id: item.productVariantId },
              data: { stock: { increment: item.quantity } }
            });
            restoredItems++;
          } catch (e) {
            console.error(`Failed to restore stock for variant ${item.productVariantId}`);
          }
        }
      }
    }
  }

  console.log(`Restored stock for ${restoredItems} sale items.`);

  // Delete all sales (SaleItem cascades automatically, but we can do deleteMany just in case)
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();

  console.log("All sales and sale items deleted.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
