"use server";

import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function markOrderAsPacked(saleId: string, isSplitPackage: boolean = false, expectedItemCount?: number, expectedUpdatedAtStr?: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "WAREHOUSE")) {
    throw new Error("Unauthorized");
  }

  const currentSale = await prisma.sale.findUnique({ where: { id: saleId }, include: { items: true } });
  if (!currentSale) throw new Error("Order not found");

  if (expectedUpdatedAtStr) {
    const expectedTime = new Date(expectedUpdatedAtStr).getTime();
    const actualTime = currentSale.updatedAt.getTime();
    if (actualTime !== expectedTime) {
      throw new Error("⚠️ تنبيه: تم تعديل هذا الأوردر من الكاشير للتو! تم إلغاء التقفيل لأن المنتجات أو المبالغ تغيرت. برجاء عمل (تحديث الشاشة) لرؤية البيانات الجديدة.");
    }
  }

  if (expectedItemCount !== undefined && currentSale.items.length !== expectedItemCount) {
    throw new Error("⚠️ تنبيه: تم تزويد منتجات على هذا الأوردر مؤخراً! برجاء تحديث الشاشة (Refresh) لرؤية المنتجات الجديدة قبل تقفيله.");
  }

  const sale = await prisma.sale.update({
    where: { id: saleId },
    data: { status: "PACKED", packedAt: new Date(), packedById: session.id }
  });

  let newNotes = sale.orderNotes || "";
  if (isSplitPackage) {
    newNotes += `\n⚠️ [تنبيه للمندوب]: هذا الأوردر مكون من أكثر من كيس (تم تغليف الزيادة في كيس منفصل).`;
  }

  // If this order was already sent to Bosta (e.g., an addition was made and sent back to warehouse), update Bosta API
  if (sale.bostaAwb && sale.bostaAwb.includes("/awb/")) {
    const { updateBostaDelivery } = await import('@/lib/bostaActions');
    const bostaRes = await updateBostaDelivery(sale.id);
    
    let noteAddition = bostaRes?.error 
      ? `\n[ملاحظة نظام]: فشل التعديل التلقائي على بوسطة بعد التجهيز: ${bostaRes.error}`
      : `\n[ملاحظة نظام]: تم تحديث بيانات بوسطة بنجاح بعد التجهيز (التحصيل وعدد القطع).`;
      
    newNotes += noteAddition;
  }

  if (newNotes !== sale.orderNotes) {
    await prisma.sale.update({
      where: { id: sale.id },
      data: { orderNotes: newNotes }
    });
  }

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      action: "ORDER_PACKED",
      details: `Order marked as packed. Sale ID: ${saleId}`
    }
  });

  revalidatePath("/fulfillment");
  revalidatePath("/dashboard/sales");
}

export async function markOrderAsIssue(saleId: string, reason: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "WAREHOUSE")) {
    throw new Error("Unauthorized");
  }

  if (!reason || reason.trim() === "") {
    throw new Error("يجب كتابة سبب المشكلة");
  }

  await prisma.sale.update({
    where: { id: saleId },
    data: { hasIssue: true, issueReason: reason }
  });

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      action: "ORDER_ISSUE_REPORTED",
      details: `تم الإبلاغ عن مشكلة في التجهيز. الفاتورة: ${saleId} | السبب: ${reason}`
    }
  });

  revalidatePath("/fulfillment");
  revalidatePath("/dashboard/issues");
}

export async function sendDailyFulfillmentReport() {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "WAREHOUSE")) {
    throw new Error("Unauthorized");
  }

  const settings = await prisma.storeSettings.findFirst();
  if (!settings?.isTelegramEnabled || !settings.telegramToken || !settings.telegramChatId) {
    throw new Error("تفعيل تليجرام غير مكتمل في الإعدادات");
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const packedToday = await prisma.sale.findMany({
    where: { packedAt: { gte: startOfDay, lte: endOfDay } },
    orderBy: { invoiceCode: 'asc' }
  });

  const issueLogsToday = await prisma.activityLog.findMany({
    where: { action: "ORDER_ISSUE_REPORTED", createdAt: { gte: startOfDay, lte: endOfDay } }
  });

  const issueSaleIds = issueLogsToday.map(log => {
    const match = log.details.match(/الفاتورة: (.*?) \|/);
    return match ? match[1] : null;
  }).filter(Boolean) as string[];

  const issuesToday = await prisma.sale.findMany({
    where: { id: { in: issueSaleIds } },
    orderBy: { invoiceCode: 'asc' }
  });

  const appendedPacked = packedToday.filter(s => 
    s.orderNotes && (s.orderNotes.includes("تعديل الأوردر من المخزن") || s.orderNotes.includes("تغليف الزيادة في كيس منفصل"))
  );
  const appendedIds = appendedPacked.map(s => s.id);
  const regularPacked = packedToday.filter(s => !appendedIds.includes(s.id));

  const dateStr = startOfDay.toLocaleDateString('en-GB');
  let message = `📦 *تقرير تقفيل المخزن ليوم ${dateStr}*\n\n`;

  // 1. Regular Packed Range
  if (regularPacked.length > 0) {
    const firstInv = regularPacked[0].invoiceCode;
    const lastInv = regularPacked[regularPacked.length - 1].invoiceCode;
    message += `✅ *الأوردرات الجديدة اللي اتقفلت:* ${regularPacked.length} أوردر\n`;
    if (regularPacked.length > 1) {
      message += `من فاتورة *${firstInv}* إلى فاتورة *${lastInv}*\n\n`;
    } else {
      message += `فاتورة رقم *${firstInv}*\n\n`;
    }
  } else {
    message += `✅ *الأوردرات الجديدة اللي اتقفلت:* لا يوجد\n\n`;
  }

  // 2. Appended Packed
  if (appendedPacked.length > 0) {
    message += `🔄 *تزويد الأوردرات القديمة اللي اتقفلت:* ${appendedPacked.length} أوردر\n`;
    appendedPacked.forEach(sale => {
      const isSplit = sale.orderNotes && sale.orderNotes.includes("تغليف الزيادة في كيس منفصل");
      const packMethod = isSplit ? "🛍️ كيس منفصل" : "📦 كيس واحد";
      message += `- فاتورة *${sale.invoiceCode}* (${packMethod})\n`;
    });
    message += `\n`;
  }

  // 3. Issues
  if (issuesToday.length > 0) {
    message += `⚠️ *أوردرات لم يتم تقفيلها لوجود مشاكل:* ${issuesToday.length} أوردر\n`;
    issuesToday.forEach(sale => {
      message += `- فاتورة *${sale.invoiceCode}*: ${sale.issueReason}\n`;
    });
    message += `\n`;
  } else {
    message += `⚠️ *المشاكل:* لا يوجد مشاكل في تجهيز اليوم الحمد لله.\n\n`;
  }

  message += `👤 *المرسل:* ${session.username}`;

  // Send to Telegram
  const tgRes = await fetch(`https://api.telegram.org/bot${settings.telegramToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: settings.telegramChatId,
      text: message,
      parse_mode: "Markdown"
    })
  });

  if (!tgRes.ok) {
    const errText = await tgRes.text();
    console.error("Failed to send telegram message", errText);
    throw new Error("فشل إرسال التقرير على تليجرام");
  }
}

export async function resolveOrderIssue(
  saleId: string, 
  deletedItemIds: string[], 
  newBarcodes: string[], 
  newBaseCod: number, 
  note: string
) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "WAREHOUSE")) {
    throw new Error("Unauthorized");
  }

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: { include: { productVariant: { include: { product: true } } } } }
  });

  if (!sale) throw new Error("Order not found");
  
  if (sale.bostaAwb || sale.status === "PRINTED" || sale.status === "CANCELLED") {
    throw new Error("لا يمكن تعديل هذا الأوردر من المخزن لأنه تم طباعته بالفعل أو إلغاؤه.");
  }

  const finalItemCount = sale.items.length - deletedItemIds.length + newBarcodes.length;
  if (finalItemCount <= 0) {
    throw new Error("لا يمكن تفريغ الأوردر بالكامل. يجب أن يحتوي على منتج واحد على الأقل.");
  }

  // Validate barcodes
  const newVariants: any[] = [];
  for (const barcode of newBarcodes) {
    if (!barcode.trim()) continue;
    const variant = await prisma.productVariant.findFirst({
      where: { barcode: barcode.trim() },
      include: { product: true }
    });
    if (!variant) throw new Error(`الباركود ${barcode} غير موجود`);
    if (variant.stock <= 0) throw new Error(`المنتج ${variant.product.name} - ${variant.colorName} غير متوفر بالمخزن`);
    newVariants.push(variant);
  }

  // Calculate shipping
  const upperEgyptCities = ["أسوان", "الأقصر", "قنا", "سوهاج", "أسيوط", "المنيا", "بني سويف", "الفيوم", "الوادي الجديد", "البحر الأحمر"];
  const shippingFee = upperEgyptCities.includes(sale.customerCity || "") ? 130 : 110;
  const finalAmount = newBaseCod + shippingFee;

  let addedDetails = "";
  let removedDetails = "";

  await prisma.$transaction(async (tx) => {
    // Process Deletions
    for (const itemId of deletedItemIds) {
      const saleItem = sale.items.find((i: any) => i.id === itemId);
      if (saleItem) {
        removedDetails += `- ${saleItem.productVariant.product.name} (${saleItem.productVariant.colorName})\n`;
        await tx.productVariant.update({
          where: { id: saleItem.productVariantId },
          data: { stock: { increment: saleItem.quantity } }
        });
        await tx.saleItem.delete({ where: { id: itemId } });
      }
    }

    // Process Additions
    for (const variant of newVariants) {
      addedDetails += `+ ${variant.product.name} (${variant.colorName})\n`;
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: { decrement: 1 } }
      });
      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productVariantId: variant.id,
          quantity: 1,
          priceAtSale: variant.product.price,
        }
      });
    }

    const updatedNotes = (sale.orderNotes || "") + `\n\n[تم تعديل الأوردر من المخزن بواسطة ${session.username}]\nالملاحظة: ${note}\nالتحصيل الجديد بعد الشحن: ${finalAmount}`;

    // Update Sale
    await tx.sale.update({
      where: { id: saleId },
      data: {
        totalAmount: finalAmount,
        remainingAmount: finalAmount,
        orderNotes: updatedNotes,
        hasIssue: false,
        issueReason: null
      }
    });

    await tx.activityLog.create({
      data: {
        userId: session.id,
        action: "ORDER_EDITED_IN_WAREHOUSE",
        details: `Order ${sale.invoiceCode} edited. New Total: ${finalAmount}.`
      }
    });
  });

  // Send Telegram Notification
  try {
    const settings = await prisma.storeSettings.findFirst();
    if (settings?.telegramToken && settings?.telegramChatId) {
      const tgMessage = `🔄 *تعديل أوردر من المخزن*
فاتورة: *${sale.invoiceCode}*
بواسطة: ${session.username}

*المنتجات التي تم مسحها (ورجعت للمخزن):*
${removedDetails || "لا يوجد"}

*المنتجات التي تم إضافتها:*
${addedDetails || "لا يوجد"}

*ملاحظة الموظف:* ${note}
*التحصيل الجديد المطلوب:* ${finalAmount} ج.م (شامل الشحن ${shippingFee})
      `;
      await fetch(`https://api.telegram.org/bot${settings.telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: tgMessage,
          parse_mode: "Markdown"
        })
      });
    }
  } catch (error) {
    console.error("Failed to send telegram notification:", error);
  }

  revalidatePath("/fulfillment");
  revalidatePath("/dashboard/issues");
  return { success: true };
}
