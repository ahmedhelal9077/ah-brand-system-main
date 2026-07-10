import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    if (!data.products || !data.categories) {
      return NextResponse.json({ error: "Invalid backup file" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Wipe in reverse dependency order
      await tx.activityLog.deleteMany();
      await tx.saleItem.deleteMany();
      await tx.reservation.deleteMany();
      await tx.sale.deleteMany();
      await tx.productVariant.deleteMany();
      await tx.product.deleteMany();
      await tx.category.deleteMany();
      await tx.user.deleteMany();

      // Insert in forward dependency order
      if (data.users && data.users.length > 0) {
        await tx.user.createMany({ data: data.users });
      } else {
        // Fallback: at least recreate the current admin user if backup had no users
        await tx.user.create({
          data: {
            id: session.id,
            username: session.username,
            password: "hashed_password", // Placeholder if we didn't back them up
            role: "OWNER"
          }
        });
      }

      if (data.categories && data.categories.length > 0) await tx.category.createMany({ data: data.categories });
      if (data.products && data.products.length > 0) await tx.product.createMany({ data: data.products });
      if (data.productVariants && data.productVariants.length > 0) await tx.productVariant.createMany({ data: data.productVariants });
      if (data.sales && data.sales.length > 0) await tx.sale.createMany({ data: data.sales });
      if (data.saleItems && data.saleItems.length > 0) await tx.saleItem.createMany({ data: data.saleItems });
      if (data.reservations && data.reservations.length > 0) await tx.reservation.createMany({ data: data.reservations });
      if (data.activityLogs && data.activityLogs.length > 0) await tx.activityLog.createMany({ data: data.activityLogs });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Restore failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
