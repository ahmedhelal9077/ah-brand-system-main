const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanBase64Images() {
  console.log("Starting cleanup of old Base64 images...");
  
  const variants = await prisma.productVariant.findMany({
    where: {
      imageUrl: {
        startsWith: "data:image/"
      }
    }
  });

  console.log(`Found ${variants.length} variants with huge Base64 images.`);

  if (variants.length > 0) {
    const updated = await prisma.productVariant.updateMany({
      where: {
        imageUrl: {
          startsWith: "data:image/"
        }
      },
      data: {
        imageUrl: null
      }
    });
    console.log(`Successfully cleared ${updated.count} base64 images.`);
  }
  
  console.log("Cleanup complete!");
}

cleanBase64Images().catch(console.error).finally(() => prisma.$disconnect());
