const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Enabling Row Level Security (RLS) on all tables...");
  
  const tables = [
    'User',
    'Category',
    'Product',
    'ProductVariant',
    'Sale',
    'SaleItem',
    'Reservation',
    'ActivityLog'
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`✅ RLS enabled for table: ${table}`);
    } catch (e) {
      console.error(`❌ Failed for ${table}:`, e.message);
    }
  }

  console.log("Done!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
