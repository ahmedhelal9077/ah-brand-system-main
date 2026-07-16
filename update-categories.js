const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bagsPartner = await prisma.partner.findUnique({
    where: { name: 'شنط' }
  });

  if (bagsPartner) {
    const res = await prisma.category.updateMany({
      where: { partnerId: null },
      data: { partnerId: bagsPartner.id }
    });
    console.log(`Updated ${res.count} categories to belong to 'شنط' partner.`);
  } else {
    console.log("Partner 'شنط' not found!");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
