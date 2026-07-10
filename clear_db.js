const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Deleting SaleItem...");
  await prisma.saleItem.deleteMany({});
  console.log("Deleting Sale...");
  await prisma.sale.deleteMany({});
  console.log("Deleting Reservation...");
  await prisma.reservation.deleteMany({});
  console.log("Deleting ActivityLog...");
  await prisma.activityLog.deleteMany({});
  console.log("Deleting ProductVariant...");
  await prisma.productVariant.deleteMany({});
  console.log("Deleting Product...");
  await prisma.product.deleteMany({});
  console.log("Deleting Category...");
  await prisma.category.deleteMany({});
  
  console.log("DB wiped! Only Users and StoreSettings remain.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
