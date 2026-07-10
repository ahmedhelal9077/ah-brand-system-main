import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.storeSettings.findFirst();
  if (!settings || !settings.bostaApiKey) {
    console.log("No Bosta API Key");
    return;
  }

  try {
    const res = await fetch("https://app.bosta.co/api/v0/deliveries?page=1&limit=50", {
      method: "GET",
      headers: {
        "Authorization": settings.bostaApiKey.trim(),
      }
    });

    const data = await res.json();
    if (!res.ok) {
      console.log("Error:", data);
      return;
    }

    if (data.deliveries && data.deliveries.length > 0) {
      const d = data.deliveries[0];
      console.log(JSON.stringify(d, null, 2));
    }
  } catch (error) {
    console.error(error);
  }
}

main().finally(() => prisma.$disconnect());
