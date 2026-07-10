const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sales = await prisma.sale.findMany({
    include: { items: true }
  });

  let fixed = 0;
  for (const sale of sales) {
    if (sale.items.length > 0 && sale.items.every(item => item.isReturned)) {
      if (sale.status !== "CANCELLED") {
        await prisma.sale.update({
          where: { id: sale.id },
          data: { status: "CANCELLED" }
        });
        console.log(`Updated sale ${sale.id} to CANCELLED`);
        fixed++;
      }
    }
  }
  console.log(`Fixed ${fixed} cancelled sales.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
