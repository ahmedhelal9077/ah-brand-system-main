const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const partners = [
    { name: 'شنط', expenseShare: 40 },
    { name: 'ملابس', expenseShare: 40 },
    { name: 'عطور', expenseShare: 20 },
  ];

  for (const partner of partners) {
    await prisma.partner.upsert({
      where: { name: partner.name },
      update: {},
      create: {
        name: partner.name,
        expenseShare: partner.expenseShare
      }
    });
  }
  console.log('Partners seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
