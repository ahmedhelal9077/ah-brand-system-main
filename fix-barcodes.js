const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const variants = await prisma.productVariant.findMany({
    include: { product: true }
  });

  let fixed = 0;
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    // Check if barcode contains non-ascii characters (like Arabic)
    if (!/^[\x00-\x7F]*$/.test(v.barcode)) {
      console.log(`Fixing barcode for variant ${v.id}: ${v.barcode}`);
      // Find its index among variants of the same product
      const productVariants = variants.filter(pv => pv.productId === v.productId);
      const index = productVariants.findIndex(pv => pv.id === v.id) + 1;
      const newBarcode = `${v.product.code}-${index}`;
      
      try {
        await prisma.productVariant.update({
          where: { id: v.id },
          data: { barcode: newBarcode }
        });
        console.log(` -> Changed to ${newBarcode}`);
        fixed++;
      } catch (err) {
        console.log(` -> Failed to update to ${newBarcode}: ${err.message}`);
        // fallback to random if unique constraint fails
        const fallback = `${v.product.code}-${index}-${Math.floor(Math.random()*1000)}`;
        await prisma.productVariant.update({
          where: { id: v.id },
          data: { barcode: fallback }
        });
        console.log(` -> Fallback to ${fallback}`);
        fixed++;
      }
    }
  }
  console.log(`Fixed ${fixed} barcodes.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
