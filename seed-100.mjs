import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const bagTypes = ["Classic Bag", "Tote Bag", "Backpack", "Crossbody", "Shoulder Bag", "Mini Bag", "Clutch", "Satchel", "Duffel Bag", "Messenger Bag"];
const bagAdjectives = ["Elegant", "Casual", "Vintage", "Modern", "Luxury", "Chic", "Urban", "Sporty", "Premium", "Everyday"];
const colors = [
  { name: "Black", hex: "#000000" },
  { name: "Brown", hex: "#8B4513" },
  { name: "Red", hex: "#FF0000" },
  { name: "Navy Blue", hex: "#000080" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Olive", hex: "#808000" },
  { name: "Pink", hex: "#FFC0CB" }
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateBarcode() {
  return Date.now().toString().slice(-6) + Math.floor(100000 + Math.random() * 900000).toString();
}

async function main() {
  console.log('Fetching/Creating categories...');
  let categories = await prisma.category.findMany();
  
  if (categories.length === 0) {
    await prisma.category.createMany({
      data: [
        { name: "Classic" },
        { name: "Casual" },
        { name: "Backpacks" },
        { name: "Travel" }
      ]
    });
    categories = await prisma.category.findMany();
  }

  // Get current max code to ensure uniqueness
  const maxProduct = await prisma.product.findFirst({
    orderBy: { code: 'desc' }
  });
  let nextCode = maxProduct ? maxProduct.code + 1 : 1001;

  console.log('Generating 100 bags...');
  
  let totalCreated = 0;
  
  for (let i = 0; i < 100; i++) {
    const adj = getRandomElement(bagAdjectives);
    const type = getRandomElement(bagTypes);
    const name = `${adj} ${type}`;
    const price = Math.floor(Math.random() * (800 - 150 + 1) + 150);
    const category = getRandomElement(categories);
    
    // Choose 1 to 3 random colors for this bag
    const numVariants = Math.floor(Math.random() * 3) + 1;
    const bagColors = [];
    while(bagColors.length < numVariants) {
      const c = getRandomElement(colors);
      if(!bagColors.find(bc => bc.name === c.name)) {
        bagColors.push(c);
      }
    }

    const createdProduct = await prisma.product.create({
      data: {
        name,
        price,
        code: nextCode++,
        categoryId: category.id,
        variants: {
          create: bagColors.map(c => ({
            colorName: c.name,
            colorHex: c.hex,
            stock: Math.floor(Math.random() * 50) + 5,
            barcode: generateBarcode()
          }))
        }
      }
    });
    
    totalCreated++;
    if (totalCreated % 10 === 0) {
      console.log(`Created ${totalCreated} bags...`);
    }
  }

  console.log('Successfully added 100 random bags!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
