"use server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function getSettings() {
  const settings = await prisma.storeSettings.findFirst();
  return settings || {
    storeName: "My Bag Store",
    storePhone: "",
    address: "",
    currency: "EGP",
    telegramToken: "",
    telegramChatId: "",
    isTelegramEnabled: false,
    bostaApiKey: "",
    storeCity: "",
    storeAddress: ""
  };
}

export async function updateTelegramSettings(
  token: string, 
  chatId: string, 
  enabled: boolean, 
  bostaApiKey: string, 
  storeCity: string, 
  storeAddress: string
) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") throw new Error("Unauthorized");
  
  const settings = await prisma.storeSettings.findFirst();
  if (!settings) {
    await prisma.storeSettings.create({
      data: { 
        telegramToken: token, 
        telegramChatId: chatId, 
        isTelegramEnabled: enabled,
        bostaApiKey: bostaApiKey,
        storeCity: storeCity,
        storeAddress: storeAddress
      }
    });
  } else {
    await prisma.storeSettings.update({
      where: { id: settings.id },
      data: { 
        telegramToken: token, 
        telegramChatId: chatId, 
        isTelegramEnabled: enabled,
        bostaApiKey: bostaApiKey,
        storeCity: storeCity,
        storeAddress: storeAddress
      }
    });
  }
  return { success: true };
}

export async function saveStoreLinks(links: { name: string; url: string; icon: string }[]) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") throw new Error("Unauthorized");
  
  await prisma.storeLink.deleteMany();
  if (links.length > 0) {
    await prisma.storeLink.createMany({ data: links });
  }
  return { success: true };
}

export async function saveStoreLocations(locations: { name: string; url: string }[]) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") throw new Error("Unauthorized");
  
  await prisma.storeLocation.deleteMany();
  if (locations.length > 0) {
    await prisma.storeLocation.createMany({ data: locations });
  }
  return { success: true };
}
