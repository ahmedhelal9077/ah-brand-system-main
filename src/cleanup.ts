import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const testSales = await prisma.sale.findMany({
    where: {
      invoiceCode: {
        in: [
          '260626-13', '260626-12', '260626-11', '260626-10', '260626-9',
          '260626-8', '260626-7', '260626-6', '260626-5', '260626-4',
          '260626-3', '260626-2', '260626-1', '260625-3', '260625-2', '260625-1'
        ]
      }
    },
    include: { items: true }
  });

  console.log(`Found ${testSales.length} test sales to delete.`);

  for (const sale of testSales) {
    console.log(`Processing invoice: ${sale.invoiceCode}`);
    
    // Restore stock
    for (const item of sale.items) {
      if (sale.status !== 'CANCELLED') {
         await prisma.productVariant.update({
           where: { id: item.productVariantId },
           data: { stock: { increment: item.quantity } }
         });
         console.log(`  - Restored ${item.quantity} for variant ${item.productVariantId}`);
      }
    }
    
    // Delete sale
    await prisma.sale.delete({ where: { id: sale.id } });
    console.log(`  - Deleted sale ${sale.invoiceCode}`);
  }
  
  console.log("Cleanup complete!");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
