const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restore() {
  console.log('Loading backup file...');
  const data = JSON.parse(fs.readFileSync('C:\\Users\\User\\.gemini\\antigravity\\scratch\\database_backup_14july.json', 'utf8'));

  console.log('Restoring data...');

  if (data.users && data.users.length > 0) {
    await prisma.user.createMany({ data: data.users, skipDuplicates: true });
    console.log(`Restored ${data.users.length} users.`);
  }

  if (fs.existsSync('old_customers.json')) {
    const customersData = JSON.parse(fs.readFileSync('old_customers.json', 'utf8'));
    if (customersData && customersData.length > 0) {
      await prisma.customer.createMany({ data: customersData, skipDuplicates: true });
      console.log(`Restored ${customersData.length} customers.`);
    }
  }

  if (data.categories && data.categories.length > 0) {
    await prisma.category.createMany({ data: data.categories, skipDuplicates: true });
    console.log(`Restored ${data.categories.length} categories.`);
  }

  if (data.products && data.products.length > 0) {
    await prisma.product.createMany({ data: data.products, skipDuplicates: true });
    console.log(`Restored ${data.products.length} products.`);
  }

  if (data.productVariants && data.productVariants.length > 0) {
    await prisma.productVariant.createMany({ data: data.productVariants, skipDuplicates: true });
    console.log(`Restored ${data.productVariants.length} variants.`);
  }

  if (data.sales && data.sales.length > 0) {
    for (const s of data.sales) {
      if (s.date) s.date = new Date(s.date);
    }
    await prisma.sale.createMany({ data: data.sales, skipDuplicates: true });
    console.log(`Restored ${data.sales.length} sales.`);
  }

  if (data.saleItems && data.saleItems.length > 0) {
    await prisma.saleItem.createMany({ data: data.saleItems, skipDuplicates: true });
    console.log(`Restored ${data.saleItems.length} sale items.`);
  }

  if (data.reservations && data.reservations.length > 0) {
    for (const r of data.reservations) {
      if (r.createdAt) r.createdAt = new Date(r.createdAt);
      if (r.updatedAt) r.updatedAt = new Date(r.updatedAt);
    }
    await prisma.reservation.createMany({ data: data.reservations, skipDuplicates: true });
    console.log(`Restored ${data.reservations.length} reservations.`);
  }

  if (data.activityLogs && data.activityLogs.length > 0) {
    for (const a of data.activityLogs) {
      if (a.createdAt) a.createdAt = new Date(a.createdAt);
    }
    await prisma.activityLog.createMany({ data: data.activityLogs, skipDuplicates: true });
    console.log(`Restored ${data.activityLogs.length} activity logs.`);
  }

  console.log('Restore complete!');
}

restore().catch(e => {
  console.error('Error during restore:', e);
}).finally(async () => {
  await prisma.$disconnect();
});
