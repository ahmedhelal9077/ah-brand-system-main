const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.storeLink.deleteMany();
  await prisma.storeLink.createMany({
    data: [
      { name: "الميرور", url: "https://www.instagram.com/alaa_helal_ah_brand", icon: "Instagram" },
      { name: "الكوبي", url: "https://www.instagram.com/a_h_collection_002024", icon: "Instagram" },
      { name: "الجروب", url: "https://www.facebook.com/share/g/18wWWiu9JD/?mibextid=wwXIfr", icon: "Facebook" }
    ]
  });

  await prisma.storeLocation.deleteMany();
  await prisma.storeLocation.create({
    data: {
      name: "فرع سكة المحلة - طنطا",
      url: "https://maps.app.goo.gl/G1nJeBCT8P24KhED7"
    }
  });

  console.log("Seeded successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
