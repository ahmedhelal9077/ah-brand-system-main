"use server";

import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function processReturn(saleItemId: string, returnQty: number, reason: string) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return { error: "Unauthorized. Only the owner can process returns." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Find the sale item
      const saleItem = await tx.saleItem.findUnique({
        where: { id: saleItemId },
        include: { sale: true, productVariant: { include: { product: true } } }
      });

      if (!saleItem) throw new Error("Sale item not found");
      if (saleItem.isReturned || saleItem.returnedQuantity >= saleItem.quantity) throw new Error("Item is already fully returned");
      if (returnQty <= 0 || returnQty > (saleItem.quantity - saleItem.returnedQuantity)) throw new Error("Invalid return quantity");

      // 1. Mark as returned
      const newReturnedQty = saleItem.returnedQuantity + returnQty;
      const isFullyReturned = newReturnedQty === saleItem.quantity;
      
      await tx.saleItem.update({
        where: { id: saleItemId },
        data: { 
          returnedQuantity: newReturnedQty,
          isReturned: isFullyReturned, 
          returnReason: reason 
        }
      });

      // 2. Increment stock
      await tx.productVariant.update({
        where: { id: saleItem.productVariantId },
        data: { stock: { increment: returnQty } }
      });

      // 3. Deduct from total amount of the sale
      const amountToDeduct = returnQty * saleItem.priceAtSale;
      
      // Calculate new remaining amount if it exists
      const sale = await tx.sale.findUnique({ where: { id: saleItem.saleId } });
      let newRemaining = sale?.remainingAmount;
      if (newRemaining !== null && newRemaining !== undefined) {
         newRemaining = Math.max(0, newRemaining - amountToDeduct);
      }

      const updatedSale = await tx.sale.update({
        where: { id: saleItem.saleId },
        data: { 
          totalAmount: { decrement: amountToDeduct },
          returnedAmount: { increment: amountToDeduct },
          remainingAmount: newRemaining
        },
        include: { items: true }
      });

      // 3.5 Check if all items are now returned. If so, mark the order as CANCELLED
      const allItemsReturned = updatedSale.items.every(item => item.isReturned);
      if (allItemsReturned) {
        await tx.sale.update({
          where: { id: saleItem.saleId },
          data: { status: "CANCELLED" }
        });
      }

      // 4. Activity log
      await tx.activityLog.create({
        data: {
          userId: session.id,
          action: "RETURN",
          details: `Processed return for ${returnQty}x ${saleItem.productVariant.product.name} (Code: ${saleItem.productVariant.product.code}, Color: ${saleItem.productVariant.colorName}). Refunded ${amountToDeduct} EGP. Reason: ${reason}`
        }
      });
    });

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to process return" };
  }
}

export async function markSalesAsPrinted(saleIds: string[]) {
  const session = await getSession();
  if (!session) return { error: "Not logged in" };

  try {
    await prisma.sale.updateMany({
      where: { id: { in: saleIds } },
      data: { status: "PRINTED" }
    });
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to mark as printed" };
  }
}

import { updateBostaDelivery } from "@/lib/bostaActions";

export async function updateSaleRemainingAmount(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return { error: "Unauthorized" };
  }

  const saleId = formData.get("saleId") as string;
  const additionalDeposit = Number(formData.get("additionalDeposit"));
  const screenshot = formData.get("screenshot") as File;

  if (!saleId || !additionalDeposit || !screenshot || screenshot.size === 0) {
    return { error: "يجب إرفاق صورة التحويل وإدخال المبلغ." };
  }

  try {
    const sale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale) return { error: "Order not found" };

    const hoursSinceCreation = (Date.now() - sale.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return { error: "لا يمكن تعديل مبلغ التحصيل بعد مرور 24 ساعة على إنشاء الفاتورة." };
    }

    const currentRemaining = sale.remainingAmount ?? sale.totalAmount;
    const newRemainingAmount = currentRemaining - additionalDeposit;
    const depositNote = `\n[تم إضافة تحويل بقيمة ${additionalDeposit} بواسطة ${session.username}. المتبقي الجديد: ${newRemainingAmount}]`;

    await prisma.sale.update({
      where: { id: saleId },
      data: {
        remainingAmount: newRemainingAmount,
        orderNotes: (sale.orderNotes || "") + depositNote,
      }
    });

    if (sale.bostaAwb) {
      const bostaRes = await updateBostaDelivery(saleId);
      if (bostaRes?.error) {
         // Revert on failure
         await prisma.sale.update({
           where: { id: saleId },
           data: { remainingAmount: currentRemaining }
         });
         return { error: `تم إلغاء التعديل لأن سيرفر بوسطة رفض التحديث: ${bostaRes.error}` };
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: "UPDATE_COLLECTION",
        details: `Added deposit ${additionalDeposit} to order ${sale.invoiceCode}. New remaining: ${newRemainingAmount}`
      }
    });

    // Send Telegram Notification with Photo
    try {
      const settings = await prisma.storeSettings.findFirst();
      if (settings?.telegramToken && settings?.telegramChatId) {
        const tgMessage = `💸 *تعديل تحصيل لفاتورة*
فاتورة: *${sale.invoiceCode || sale.id.slice(-6)}*
بواسطة: ${session.username}

*المبلغ المضاف (تحويل جديد):* ${additionalDeposit} ج.م
*إجمالي الفاتورة:* ${sale.totalAmount} ج.م
*المتبقي تحصيله (الجديد):* ${newRemainingAmount} ج.م
`;
        
        const tgFormData = new FormData();
        tgFormData.append("chat_id", settings.telegramChatId);
        tgFormData.append("caption", tgMessage);
        tgFormData.append("parse_mode", "Markdown");
        tgFormData.append("photo", screenshot);

        await fetch(`https://api.telegram.org/bot${settings.telegramToken}/sendPhoto`, {
          method: "POST",
          body: tgFormData
        });
      }
    } catch (error) {
      console.error("Failed to send telegram notification:", error);
    }

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update amount" };
  }
}

export async function updateSaleRemainingAmountByCode(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return { error: "Unauthorized" };
  }

  const invoiceCode = formData.get("invoiceCode") as string;
  if (!invoiceCode) return { error: "يجب إدخال رقم الفاتورة." };

  const sale = await prisma.sale.findFirst({
    where: { invoiceCode }
  });

  if (!sale) {
    return { error: "الفاتورة غير موجودة." };
  }

  formData.append("saleId", sale.id);
  return await updateSaleRemainingAmount(formData);
}
