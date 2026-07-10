"use server";

import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function resolveOrderIssue(saleId: string) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    throw new Error("Unauthorized. Only the owner can resolve issues.");
  }

  await prisma.sale.update({
    where: { id: saleId },
    data: { hasIssue: false, issueReason: null }
  });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      action: "ISSUE_RESOLVED",
      details: `تم حل المشكلة وإعادة الأوردر للتجهيز. الفاتورة: ${saleId}`
    }
  });

  revalidatePath("/dashboard/issues");
  revalidatePath("/fulfillment");
  return { success: true };
}

export async function cancelOrderFromIssue(saleId: string) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    throw new Error("Unauthorized. Only the owner can cancel orders.");
  }

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: { items: true }
    });

    if (!sale) throw new Error("Sale not found");

    // Return stock for all items
    for (const item of sale.items) {
      if (!item.isReturned) {
        await tx.saleItem.update({
          where: { id: item.id },
          data: { isReturned: true, returnReason: "إلغاء كامل الأوردر من شاشة المشاكل" }
        });
        
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { increment: item.quantity } }
        });
      }
    }

    // Cancel order
    await tx.sale.update({
      where: { id: saleId },
      data: { status: "CANCELLED", hasIssue: false, totalAmount: 0 }
    });

    // Log activity
    await tx.activityLog.create({
      data: {
        userId: session.id,
        action: "ORDER_CANCELLED_FROM_ISSUE",
        details: `تم إلغاء الأوردر بسبب مشكلة. الفاتورة: ${sale.invoiceCode || saleId}`
      }
    });
  });

  revalidatePath("/dashboard/issues");
  revalidatePath("/dashboard/sales");
  return { success: true };
}
