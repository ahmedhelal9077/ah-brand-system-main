import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const settings = await prisma.storeSettings.findFirst();
  console.log('API Key:', settings.bostaApiKey.substring(0, 10));
  
  const payload = {
    type: 30, // Test Exchange
    dropOffAddress: { city: { name: 'Cairo' }, firstLine: 'Test' },
    receiver: { firstName: 'Test', lastName: 'Test', phone: '01012345678' },
    cod: 100,
    allowToOpenPackage: true,
    specs: {
      packageDetails: {
        itemsCount: 1,
        description: 'Test Exchange Item'
      }
    }
  };
  const res = await fetch('https://app.bosta.co/api/v0/deliveries', {
    method: 'POST',
    headers: { 'Authorization': settings.bostaApiKey.trim(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  console.log('Response type 30:', await res.json());
}
main().catch(console.error).finally(()=>prisma.$disconnect());
