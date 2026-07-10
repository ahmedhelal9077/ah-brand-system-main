import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const settings = await prisma.storeSettings.findFirst();
  if (!settings || !settings.bostaApiKey) {
    return new NextResponse("Bosta API Key missing", { status: 500 });
  }

  try {
    let page = 1;
    let limit = 100;
    let totalCustomersAdded = 0;
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(`https://app.bosta.co/api/v0/deliveries?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: {
          "Authorization": settings.bostaApiKey.trim(),
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Bosta API Error");
      }

      if (!data.deliveries || data.deliveries.length === 0) {
        hasMore = false;
        break;
      }

      for (const d of data.deliveries) {
        const receiver = d.receiver;
        const addressObj = d.dropOffAddress;

        if (receiver && receiver.phone) {
          let formattedPhone = receiver.phone.replace(/\D/g, "");
          if (formattedPhone.startsWith("002001")) formattedPhone = formattedPhone.replace("002001", "01");
          else if (formattedPhone.startsWith("00201")) formattedPhone = formattedPhone.replace("00201", "01");
          else if (formattedPhone.startsWith("2001")) formattedPhone = formattedPhone.replace("2001", "01");
          else if (formattedPhone.startsWith("201")) formattedPhone = formattedPhone.replace("201", "01");
          else if (formattedPhone.startsWith("1") && formattedPhone.length === 10) formattedPhone = "0" + formattedPhone;

          if (formattedPhone.length === 11 && formattedPhone.startsWith("01")) {
            const name = receiver.fullName && receiver.fullName !== "-" ? receiver.fullName : undefined;
            const city = addressObj?.city?.nameAr || addressObj?.city?.name || undefined;
            const address = addressObj?.firstLine || undefined;

            await prisma.customer.upsert({
              where: { phone: formattedPhone },
              update: {
                name: name || undefined,
                city: city || undefined,
                address: address || undefined,
              },
              create: {
                phone: formattedPhone,
                name: name,
                city: city,
                address: address,
                totalOrders: 1
              }
            });
            totalCustomersAdded++;
          }
        }
      }

      if (data.deliveries.length < limit) {
        hasMore = false;
      } else {
        page++;
      }
    }

    // Also sync from existing local sales
    const localSales = await prisma.sale.findMany({
      where: { customerPhone: { not: null } }
    });

    for (const sale of localSales) {
      if (sale.customerPhone) {
        await prisma.customer.upsert({
          where: { phone: sale.customerPhone },
          update: {
            totalOrders: { increment: 1 }
          },
          create: {
            phone: sale.customerPhone,
            name: sale.customerName,
            city: sale.customerCity,
            address: sale.customerAddress,
            totalOrders: 1
          }
        });
      }
    }

    return NextResponse.json({ success: true, totalProcessed: totalCustomersAdded });
  } catch (error: any) {
    console.error("Sync Customers Error:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
