const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.storeSettings.findFirst();
  const res = await fetch('https://app.bosta.co/api/v0/deliveries/awb?ids=Swt7NsNn2tRD2GCTmlO4c', {
    method: 'GET',
    headers: {
      'Authorization': settings.bostaApiKey.trim(),
    }
  });
  console.log(res.status);
  const data = await res.json().catch(() => null);
  console.log(data);
}

main().catch(console.error).finally(() => prisma.$disconnect());
