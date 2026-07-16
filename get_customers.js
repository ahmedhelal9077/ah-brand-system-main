const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres.qxfgwlnmcatbdhfksrxl:5*d%40NVYB%25hX%24mB%2C.@aws-1-us-east-1.pooler.supabase.com:5432/postgres' } } });

async function getStoreSettings() {
  try {
    const storeSettings = await prisma.storeSettings.findMany();
    const storeLinks = await prisma.storeLink.findMany();
    const storeLocations = await prisma.storeLocation.findMany();
    fs.writeFileSync('old_storeSettings.json', JSON.stringify({ storeSettings, storeLinks, storeLocations }));
    console.log('Saved settings');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
getStoreSettings();
