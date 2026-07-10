import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/SettingsClient";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    redirect("/dashboard");
  }

  let settings = await prisma.storeSettings.findFirst();
  if (!settings) {
    settings = await prisma.storeSettings.create({ data: {} });
  }

  const storeLinks = await prisma.storeLink.findMany({ orderBy: { createdAt: 'asc' } });
  const storeLocations = await prisma.storeLocation.findMany({ orderBy: { createdAt: 'asc' } });

  return <SettingsClient initialSettings={settings} initialStoreLinks={storeLinks} initialStoreLocations={storeLocations} />;
}
