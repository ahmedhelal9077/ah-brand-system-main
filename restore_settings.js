const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreSettings() {
  console.log('Loading settings backup file...');
  const data = JSON.parse(fs.readFileSync('old_storeSettings.json', 'utf8'));

  console.log('Restoring settings...');

  if (data.storeSettings && data.storeSettings.length > 0) {
    const s = data.storeSettings[0];
    if (s.updatedAt) s.updatedAt = new Date(s.updatedAt);
    
    await prisma.storeSettings.upsert({
      where: { id: s.id },
      update: s,
      create: s
    });
    console.log(`Updated StoreSettings with ID ${s.id}`);
  }

  if (data.storeLinks && data.storeLinks.length > 0) {
    for (const l of data.storeLinks) {
      if (l.createdAt) l.createdAt = new Date(l.createdAt);
      if (l.updatedAt) l.updatedAt = new Date(l.updatedAt);
    }
    await prisma.storeLink.createMany({ data: data.storeLinks, skipDuplicates: true });
    console.log(`Restored ${data.storeLinks.length} storeLinks.`);
  }

  if (data.storeLocations && data.storeLocations.length > 0) {
    for (const l of data.storeLocations) {
      if (l.createdAt) l.createdAt = new Date(l.createdAt);
      if (l.updatedAt) l.updatedAt = new Date(l.updatedAt);
    }
    await prisma.storeLocation.createMany({ data: data.storeLocations, skipDuplicates: true });
    console.log(`Restored ${data.storeLocations.length} storeLocations.`);
  }

  console.log('Settings Restore complete!');
}

restoreSettings().catch(e => {
  console.error('Error during restore:', e);
}).finally(async () => {
  await prisma.$disconnect();
});
