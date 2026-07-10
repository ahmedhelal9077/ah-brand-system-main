"use server";

import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

async function checkAndArchiveProduct(tx: any, productId: string) {
  const variants = await tx.productVariant.findMany({ where: { productId } });
  const totalStock = variants.reduce((sum: number, v: any) => sum + v.stock, 0);
  if (totalStock <= 0) {
    await tx.product.update({
      where: { id: productId },
      data: { isActive: false }
    });
  }
}

function generateInvoicePrefix(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

export async function processSale(
  cart: { variantId: string, quantity: number, price: number }[], 
  customerData: { name: string, phone: string, phone2?: string, city: string, address: string }, 
  orderNotes: string, 
  discountAmount: number = 0, 
  isOnline: boolean = false,
  remainingAmountStr?: string,
  isExchange: boolean = false
) {
  const session = await getSession();
  if (!session) throw new Error("Not logged in");

  if (!cart || cart.length === 0) return { error: "Cart is empty" };

  if (isOnline && customerData.phone) {
    const existingOnlineOrder = await prisma.sale.findFirst({
      where: {
        type: "ONLINE",
        customerPhone: customerData.phone,
        status: {
          notIn: ["PRINTED", "CANCELLED"]
        }
      }
    });

    if (existingOnlineOrder) {
      return { error: `هذا العميل له أوردر أونلاين مسجل مسبقاً لم يتم طباعته بعد (الفاتورة: ${existingOnlineOrder.invoiceCode}). الرجاء استخدام خيار 'تزويد منتجات' على الفاتورة القديمة بدلاً من إنشاء أوردر جديد.` };
    }
  }

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const prefix = generateInvoicePrefix();
    
    // We'll wrap the transaction in a retry loop to handle concurrent checkout collisions
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const lastSale = await prisma.sale.findFirst({
          where: {
            createdAt: { gte: startOfDay },
            invoiceCode: { startsWith: prefix + "-" }
          },
          orderBy: { createdAt: 'desc' }
        });

        let nextNum = 1;
        if (lastSale && lastSale.invoiceCode) {
          const parts = lastSale.invoiceCode.split('-');
          if (parts.length === 2) {
            nextNum = parseInt(parts[1], 10) + 1;
          }
        }
        
        const invoiceCode = `${prefix}-${nextNum}`;
        
        let totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) - discountAmount;
        if (totalAmount < 0) totalAmount = 0;

        const sale = await prisma.$transaction(async (tx) => {
          let customerId = null;
          if (customerData.phone) {
            let formattedPhone = customerData.phone.replace(/\D/g, "");
            if (formattedPhone.startsWith("002001")) formattedPhone = formattedPhone.replace("002001", "01");
            else if (formattedPhone.startsWith("00201")) formattedPhone = formattedPhone.replace("00201", "01");
            else if (formattedPhone.startsWith("2001")) formattedPhone = formattedPhone.replace("2001", "01");
            else if (formattedPhone.startsWith("201")) formattedPhone = formattedPhone.replace("201", "01");
            else if (formattedPhone.startsWith("1") && formattedPhone.length === 10) formattedPhone = "0" + formattedPhone;

            const cust = await tx.customer.upsert({
              where: { phone: formattedPhone },
              update: {
                phone2: customerData.phone2 || undefined,
                name: customerData.name || undefined,
                city: customerData.city || undefined,
                address: customerData.address || undefined,
                totalOrders: { increment: 1 }
              },
              create: {
                phone: formattedPhone,
                phone2: customerData.phone2 || null,
                name: customerData.name || null,
                city: customerData.city || null,
                address: customerData.address || null,
                totalOrders: 1
              }
            });
            customerId = cust.id;
          }

          const newSale = await tx.sale.create({
            data: {
              userId: session.id,
              totalAmount,
              discountAmount,
              remainingAmount: remainingAmountStr ? parseFloat(remainingAmountStr) || null : null,
              customerId,
              customerName: customerData.name || null,
              customerPhone: customerData.phone || null,
              customerPhone2: customerData.phone2 || null,
              customerCity: customerData.city || null,
              customerAddress: customerData.address || null,
              orderNotes: orderNotes || null,
              isExchange: isExchange,
              invoiceCode,
              type: isOnline ? "ONLINE" : "POS",
              status: isOnline ? "PENDING" : "COMPLETED",
              items: {
                create: cart.map(item => ({
                  productVariantId: item.variantId,
                  quantity: item.quantity,
                  priceAtSale: item.price
                }))
              }
            }
          });

      // 2. Decrement stock
      const productIdSet = new Set<string>();
      for (const item of cart) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant || variant.stock < item.quantity) {
          throw new Error(`Not enough stock for variant ${variant?.colorName || item.variantId}`);
        }
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } }
        });
        productIdSet.add(variant.productId);
      }
      for (const pid of productIdSet) {
        await checkAndArchiveProduct(tx, pid);
      }

      // 3. Activity Log
      await tx.activityLog.create({
        data: {
          userId: session.id,
          action: "SALE",
          details: `Processed sale for ${cart.length} items. Total: ${totalAmount} EGP (Discount: ${discountAmount}). Invoice: ${invoiceCode}`
        }
      });

      return newSale;
    });

      return { success: true, invoiceCode };
      } catch (err: any) {
        // P2002 is Prisma's Unique Constraint Violation error code
        if (err.code === 'P2002' && err.meta?.target?.includes('invoiceCode')) {
          lastError = err;
          // Loop again to retry
        } else {
          throw err;
        }
      }
    }
    
    throw lastError || new Error("Checkout failed after multiple attempts due to high concurrency.");
  } catch (error: any) {
    return { error: error.message || "Checkout failed" };
  }
}

export async function processReservation(cart: { variantId: string, quantity: number }[], days: number = 1) {
  const session = await getSession();
  if (!session) throw new Error("Not logged in");

  try {
    await prisma.$transaction(async (tx) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const productIdSet = new Set<string>();
      for (const item of cart) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant || variant.stock < item.quantity) {
          throw new Error(`Not enough stock for variant ${variant?.colorName || item.variantId}`);
        }

        // Deduct stock
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } }
        });
        productIdSet.add(variant.productId);

        // Create reservation
        await tx.reservation.create({
          data: {
            userId: session.id,
            productVariantId: item.variantId,
            quantity: item.quantity,
            expiresAt
          }
        });
      }
      for (const pid of productIdSet) {
        await checkAndArchiveProduct(tx, pid);
      }
      
      await tx.activityLog.create({
        data: {
          userId: session.id,
          action: "RESERVATION",
          details: `Reserved ${cart.reduce((a, c) => a + c.quantity, 0)} items for ${days} days`
        }
      });
    });
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Reservation failed" };
  }
}

export async function processOnlineOrder(
  cart: { variantId: string, quantity: number, price: number, name: string, code: number, imageUrl?: string | null }[], 
  customerData: { name: string, phone: string, phone2?: string, city: string, address: string }, 
  orderNotes: string, 
  depositImagesBase64: string[],
  customerDeposit: string,
  discountAmount: number = 0,
  isExchange: boolean = false
) {
  const session = await getSession();
  if (!session) throw new Error("Not logged in");

  const { egyptCitiesMap } = await import('@/lib/egyptCities');
  const getCityFromAddress = (address: string) => {
    for (const [key, value] of Object.entries(egyptCitiesMap)) {
      if (address.includes(key)) return value;
    }
    return "";
  };

  const currentCity = customerData.city?.trim() || getCityFromAddress(customerData.address);

  const isTantaOrder = currentCity === "طنطا" || currentCity.includes("طنطا") || (currentCity === "الغربية" && (customerData.address.includes("طنطا") || customerData.address.toLowerCase().includes("tanta")));

  const upperEgyptCities = ["الفيوم", "بني سويف", "المنيا", "اسيوط", "أسيوط", "سوهاج", "قنا", "الاقصر", "الأقصر", "اسوان", "أسوان", "الوادي الجديد"];
  const shippingCost = isTantaOrder ? 0 : (currentCity && upperEgyptCities.includes(currentCity) ? 130 : 110);
  
  const parsedDeposit = parseFloat(customerDeposit) || 0;
  if (parsedDeposit < 0) throw new Error("قيمة التحويل غير صحيحة");
  
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartTotalAfterDiscount = Math.max(0, cartTotal - discountAmount);
  
  const finalRequired = cartTotalAfterDiscount + shippingCost;
  
  if (parsedDeposit > finalRequired) {
    throw new Error("المبلغ المحول أكبر من إجمالي الفاتورة ومصاريف الشحن!");
  }

  const finalCod = finalRequired - parsedDeposit;

  // First, process the sale in DB
  if (!isTantaOrder && parsedDeposit > 0 && depositImagesBase64.length === 0) {
    return { error: "برجاء إرفاق صورة اسكرين التحويل أولاً!" };
  }

  // 1. Process Sale normally as ONLINE
  // Notice we pass finalCod as string to remainingAmount argument
  const result = await processSale(
    cart.map(c => ({ variantId: c.variantId, quantity: c.quantity, price: c.price })), 
    customerData, 
    orderNotes, 
    discountAmount, 
    true, 
    finalCod.toString(),
    isExchange
  );

  if (result.error) return result;

  try {
    // Check Telegram settings
    const settings = await prisma.storeSettings.findFirst();
    if (settings && settings.isTelegramEnabled && settings.telegramToken && settings.telegramChatId) {
      
      const totalPieces = cart.reduce((acc, item) => acc + item.quantity, 0);

      let invoiceText = `🛍 *أوردر أونلاين جديد!*\n`;
      invoiceText += `🏷 *كود الفاتورة:* ${result.invoiceCode}\n`;
      if (isExchange) invoiceText += `🔄 *هذا أوردر استبدال*\n`;
      invoiceText += `\n`;
      
      if (isTantaOrder) {
        invoiceText += `🔴🔴🔴 ((((((((((( طـنـطـا ))))))))))) 🔴🔴🔴\n\n`;
      }

      invoiceText += `📌 *البيانات:*\n`;
      if (customerData.name) invoiceText += `- الاسم: ${customerData.name}\n`;
      if (customerData.phone) invoiceText += `- التليفون: ${customerData.phone}\n`;
      invoiceText += `- المحافظة: ${currentCity || "غير محدد (تم حساب شحن افتراضي)"}\n`;
      if (customerData.address) invoiceText += `- العنوان: ${customerData.address}\n`;
      
      if (orderNotes) invoiceText += `📝 *الملحوظات:* ${orderNotes}\n\n`;
      
      invoiceText += `📦 *المنتجات:*\n`;
      cart.forEach(item => {
        invoiceText += `- ${item.quantity}x ${item.name} (#${item.code}) بـ ${item.price} ج.م\n`;
      });
      
      invoiceText += `\n🔢 *عدد القطع الكلي:* ${totalPieces} قطعة\n`;
      invoiceText += `💰 *قيمة الفاتورة:* ${cartTotalAfterDiscount} ج.م\n`;
      invoiceText += `🚚 *قيمة الشحن:* ${shippingCost} ج.م ${isTantaOrder ? "(طنطا)" : ""}\n`;
      invoiceText += `💸 *العميلة حولت:* ${parsedDeposit} ج.م\n`;
      invoiceText += `💵 *باقي للتحصيل (COD):* ${finalCod} ج.م\n`;
      invoiceText += `👨‍💼 *الموظف:* ${session.username}`;

      // 1. Prepare images
      let allFiles: { buffer: Buffer, caption?: string }[] = [];
      
      for (const base64Str of depositImagesBase64) {
        const base64Data = base64Str.split(",")[1];
        allFiles.push({
          buffer: Buffer.from(base64Data, "base64"),
          caption: "إسكرين التحويل"
        });
      }
      
      for (const item of cart) {
        if (item.imageUrl && item.imageUrl.startsWith("data:image")) {
          const prodBase64Data = item.imageUrl.split(",")[1];
          allFiles.push({
            buffer: Buffer.from(prodBase64Data, "base64"),
            caption: `المنتج: ${item.name} (#${item.code})`
          });
        }
      }

      // 2. Send images first
      if (allFiles.length === 1) {
        // Use sendPhoto
        const formData = new FormData();
        formData.append("chat_id", settings.telegramChatId);
        const blob = new Blob([new Uint8Array(allFiles[0].buffer)], { type: "image/jpeg" });
        formData.append("photo", blob, "photo.jpg");
        if (allFiles[0].caption) formData.append("caption", allFiles[0].caption);
        
        const tgRes = await fetch(`https://api.telegram.org/bot${settings.telegramToken}/sendPhoto`, {
          method: "POST",
          body: formData
        });
        if (!tgRes.ok) console.error("Telegram API Error:", await tgRes.text());
      } else if (allFiles.length > 1) {
        // Send in batches of 10 (Telegram's limit for sendMediaGroup)
        for (let i = 0; i < allFiles.length; i += 10) {
          const batch = allFiles.slice(i, i + 10);
          
          if (batch.length === 1) {
            // If the last batch has exactly 1 image, send it as sendPhoto
            const formData = new FormData();
            formData.append("chat_id", settings.telegramChatId);
            const blob = new Blob([new Uint8Array(batch[0].buffer)], { type: "image/jpeg" });
            formData.append("photo", blob, "photo.jpg");
            if (batch[0].caption) formData.append("caption", batch[0].caption);
            
            await fetch(`https://api.telegram.org/bot${settings.telegramToken}/sendPhoto`, {
              method: "POST",
              body: formData
            });
            continue;
          }

          const formData = new FormData();
          formData.append("chat_id", settings.telegramChatId);
          
          const mediaGroup = batch.map((file, idx) => {
            const attachName = `photo${i + idx}`;
            const blob = new Blob([new Uint8Array(file.buffer)], { type: "image/jpeg" });
            formData.append(attachName, blob, `${attachName}.jpg`);
            
            const mediaObj: any = {
              type: "photo",
              media: `attach://${attachName}`
            };
            if (file.caption) mediaObj.caption = file.caption;
            return mediaObj;
          });
          
          formData.append("media", JSON.stringify(mediaGroup));
          
          const tgRes = await fetch(`https://api.telegram.org/bot${settings.telegramToken}/sendMediaGroup`, {
            method: "POST",
            body: formData
          });
          
          if (!tgRes.ok) {
             console.error("Telegram API Error:", await tgRes.text());
          }
        }
      }

      // 3. Send the text message after the images
      await fetch(`https://api.telegram.org/bot${settings.telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: invoiceText,
          parse_mode: "Markdown"
        })
      });
    }
  } catch (error) {
    console.error("Error sending to Telegram:", error);
  }

  return { success: true };
}

export async function appendItemsToSale(
  invoiceCode: string,
  cart: { variantId: string, quantity: number, price: number, name: string, code: number, imageUrl?: string | null }[],
  customerData: { name: string, phone: string, phone2?: string, city: string, address: string } | null,
  orderNotes: string = "",
  depositImagesBase64: string[] = [],
  remainingAmount: string = ""
) {
  const session = await getSession();
  if (!session) throw new Error("Not logged in");
  
  if (!cart || cart.length === 0) return { error: "Cart is empty" };

  try {
    const sale = await prisma.sale.findUnique({ where: { invoiceCode } });
    if (!sale) return { error: "Invoice not found" };

    if (sale.status === "PRINTED") {
      return { error: "لا يمكن تزويد منتجات على هذا الأوردر لأنه تم طباعة بوليصة الشحن الخاصة به وتغليفه نهائياً. برجاء إنشاء أوردر جديد بالمنتجات الإضافية." };
    }

    const totalAddedAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newTotal = sale.totalAmount + totalAddedAmount;

    await prisma.$transaction(async (tx) => {
      // 1. Add items to sale
      for (const item of cart) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productVariantId: item.variantId,
            quantity: item.quantity,
            priceAtSale: item.price
          }
        });

        // 2. Decrement stock
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant || variant.stock < item.quantity) {
          throw new Error(`Not enough stock for variant ${variant?.colorName || item.variantId}`);
        }
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } }
        });
        await checkAndArchiveProduct(tx, variant.productId);
      }

      // 3. Update Sale total & status
      let parsedRemaining = remainingAmount ? parseFloat(remainingAmount) : null;
      
      await tx.sale.update({
        where: { id: sale.id },
        data: { 
          totalAmount: newTotal,
          ...(parsedRemaining !== null && { remainingAmount: parsedRemaining }),
          // If it was packed, revert to pending so the warehouse knows to add the new items
          status: sale.status === "PACKED" ? "PENDING" : sale.status
        }
      });

      // 4. Activity Log
      await tx.activityLog.create({
        data: {
          userId: session.id,
          action: "APPEND_TO_SALE",
          details: `Added ${cart.length} items to invoice ${invoiceCode}. New Total: ${newTotal}`
        }
      });
    });

    // 5. Send Telegram Notification
    const settings = await prisma.storeSettings.findFirst();
    if (settings && settings.isTelegramEnabled && settings.telegramToken && settings.telegramChatId) {
      const totalPieces = cart.reduce((acc, item) => acc + item.quantity, 0);

      let invoiceText = `⚠️ *تحديث أوردر أونلاين: تزويد منتجات وتحويلات!* ⚠️\n`;
      invoiceText += `🏷 *كود الفاتورة الأصلية:* ${invoiceCode}\n`;
      if (sale.isExchange) invoiceText += `🔄 *هذا أوردر استبدال*\n`;
      invoiceText += `\n`;
      
      if (customerData && (customerData.name || customerData.phone)) {
        invoiceText += `📌 *تحديث البيانات:*\n`;
        if (customerData.name) invoiceText += `- الاسم: ${customerData.name}\n`;
        if (customerData.phone) invoiceText += `- التليفون: ${customerData.phone}\n`;
        if (customerData.city) invoiceText += `- المحافظة: ${customerData.city}\n`;
        if (customerData.address) invoiceText += `- العنوان: ${customerData.address}\n\n`;
      }
      if (orderNotes) invoiceText += `📝 *ملحوظات التحديث:* ${orderNotes}\n\n`;

      invoiceText += `📦 *المنتجات التي تم إضافتها الآن:*\n`;
      cart.forEach(item => {
        invoiceText += `- ${item.quantity}x ${item.name} (#${item.code}) بـ ${item.price} ج.م\n`;
      });
      invoiceText += `\n🔢 *عدد القطع المضافة:* ${totalPieces} قطعة\n`;
      invoiceText += `💰 *الإجمالي الجديد للفاتورة بالكامل:* ${newTotal} ج.م\n`;
      
      if (remainingAmount) {
        invoiceText += `💵 *المتبقي للتحصيل عند الاستلام:* ${remainingAmount} ج.م\n`;
      }
      
      if (depositImagesBase64.length > 0) {
        invoiceText += `🖼 *مرفق إثباتات تحويل الإضافة.*\n`;
      }

      invoiceText += `👨‍💼 *الموظف المعدل:* ${session.username}`;

      // Prepare images
      let allFiles: { buffer: Buffer, caption?: string }[] = [];
      
      for (const base64Str of depositImagesBase64) {
        const base64Data = base64Str.split(",")[1];
        allFiles.push({
          buffer: Buffer.from(base64Data, "base64"),
          caption: "إسكرين تحويل الإضافة"
        });
      }
      
      for (const item of cart) {
        if (item.imageUrl && item.imageUrl.startsWith("data:image")) {
          const prodBase64Data = item.imageUrl.split(",")[1];
          allFiles.push({
            buffer: Buffer.from(prodBase64Data, "base64"),
            caption: `المنتج المضاف: ${item.name} (#${item.code})`
          });
        }
      }

      // Send images first
      if (allFiles.length === 1) {
        const formData = new FormData();
        formData.append("chat_id", settings.telegramChatId);
        const blob = new Blob([new Uint8Array(allFiles[0].buffer)], { type: "image/jpeg" });
        formData.append("photo", blob, "photo.jpg");
        if (allFiles[0].caption) formData.append("caption", allFiles[0].caption);
        
        await fetch(`https://api.telegram.org/bot${settings.telegramToken}/sendPhoto`, {
          method: "POST",
          body: formData
        });
      } else if (allFiles.length > 1) {
        for (let i = 0; i < allFiles.length; i += 10) {
          const batch = allFiles.slice(i, i + 10);
          
          if (batch.length === 1) {
            const formData = new FormData();
            formData.append("chat_id", settings.telegramChatId);
            const blob = new Blob([new Uint8Array(batch[0].buffer)], { type: "image/jpeg" });
            formData.append("photo", blob, "photo.jpg");
            if (batch[0].caption) formData.append("caption", batch[0].caption);
            
            await fetch(`https://api.telegram.org/bot${settings.telegramToken}/sendPhoto`, {
              method: "POST",
              body: formData
            });
            continue;
          }

          const formData = new FormData();
          formData.append("chat_id", settings.telegramChatId);
          
          const mediaGroup = batch.map((file, idx) => {
            const attachName = `photo${i + idx}`;
            const blob = new Blob([new Uint8Array(file.buffer)], { type: "image/jpeg" });
            formData.append(attachName, blob, `${attachName}.jpg`);
            
            const mediaObj: any = {
              type: "photo",
              media: `attach://${attachName}`
            };
            if (file.caption) mediaObj.caption = file.caption;
            return mediaObj;
          });
          
          formData.append("media", JSON.stringify(mediaGroup));
          
          await fetch(`https://api.telegram.org/bot${settings.telegramToken}/sendMediaGroup`, {
            method: "POST",
            body: formData
          });
        }
      }

      // Send text message
      await fetch(`https://api.telegram.org/bot${settings.telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: invoiceText,
          parse_mode: "Markdown"
        })
      });
    }

    return { success: true, newTotal };
  } catch (error: any) {
    return { error: error.message || "Failed to add items to order" };
  }
}

export async function fetchSaleForEdit(invoiceCode: string) {
  const session = await getSession();
  if (!session) throw new Error("Not logged in");

  const sale = await prisma.sale.findUnique({
    where: { invoiceCode },
    include: {
      items: {
        include: {
          productVariant: {
            include: {
              product: {
                include: { category: true }
              }
            }
          }
        }
      }
    }
  });

  if (!sale) return { error: "الفاتورة غير موجودة." };
  
  if (sale.bostaAwb) {
    return { error: "لا يمكن تعديل الفاتورة لأنه تم طباعة بوليصة شحن بوسطة الخاصة بها." };
  }
  
  if (sale.status === "CANCELLED" || sale.status === "PRINTED") {
    return { error: "الفاتورة ملغاة أو تم تسليمها لشركة الشحن، لا يمكن تعديلها." };
  }

  return { success: true, sale };
}

export async function editOrderCashier(
  saleId: string,
  cart: { variantId: string, quantity: number, price: number, name: string, code: number, imageUrl?: string | null }[],
  customerData: { name: string, phone: string, phone2?: string, city: string, address: string },
  orderNotes: string,
  depositImagesBase64: string[],
  customerDeposit: string,
  discountAmount: number = 0
) {
  const session = await getSession();
  if (!session) throw new Error("Not logged in");

  const existingSale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: { include: { productVariant: { include: { product: true } } } } }
  });

  if (!existingSale) return { error: "الفاتورة غير موجودة." };
  if (existingSale.bostaAwb || existingSale.status === "CANCELLED" || existingSale.status === "PRINTED") {
    return { error: "لا يمكن التعديل: الفاتورة في حالة تمنع التعديل." };
  }

  const { egyptCitiesMap } = await import('@/lib/egyptCities');
  const getCityFromAddress = (address: string) => {
    for (const [key, value] of Object.entries(egyptCitiesMap)) {
      if (address.includes(key)) return value;
    }
    return "";
  };

  const currentCity = customerData.city?.trim() || getCityFromAddress(customerData.address);
  const isTantaOrder = currentCity === "طنطا" || currentCity.includes("طنطا") || (currentCity === "الغربية" && (customerData.address.includes("طنطا") || customerData.address.toLowerCase().includes("tanta")));
  const upperEgyptCities = ["الفيوم", "بني سويف", "المنيا", "اسيوط", "أسيوط", "سوهاج", "قنا", "الاقصر", "الأقصر", "اسوان", "أسوان", "الوادي الجديد"];
  const shippingCost = isTantaOrder ? 0 : (currentCity && upperEgyptCities.includes(currentCity) ? 130 : 110);
  
  const parsedDeposit = parseFloat(customerDeposit) || 0;
  if (parsedDeposit < 0) throw new Error("قيمة التحويل غير صحيحة");
  
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartTotalAfterDiscount = Math.max(0, cartTotal - discountAmount);
  const finalRequired = cartTotalAfterDiscount + shippingCost;
  
  if (parsedDeposit > finalRequired) {
    throw new Error("المبلغ المحول أكبر من إجمالي الفاتورة ومصاريف الشحن!");
  }

  const finalCod = finalRequired - parsedDeposit;

  let addedDetails = "";
  let removedDetails = "";

  try {
    await prisma.$transaction(async (tx) => {
      const oldItemsMap = new Map();
      existingSale.items.forEach((item: any) => {
        if (!oldItemsMap.has(item.productVariantId)) {
          oldItemsMap.set(item.productVariantId, { ...item, totalQuantity: 0 });
        }
        oldItemsMap.get(item.productVariantId).totalQuantity += item.quantity;
      });

      const newItemsMap = new Map();
      cart.forEach((item: any) => {
        if (!newItemsMap.has(item.variantId)) {
          newItemsMap.set(item.variantId, { ...item, totalQuantity: 0 });
        }
        newItemsMap.get(item.variantId).totalQuantity += item.quantity;
      });

      // 1. Process Removed/Decreased Items (Return to stock)
      for (const [variantId, oldData] of Array.from(oldItemsMap.entries())) {
        const newData = newItemsMap.get(variantId);
        const newQty = newData ? newData.totalQuantity : 0;
        const diff = oldData.totalQuantity - newQty;

        if (diff > 0) {
          removedDetails += `- ${diff}x ${oldData.productVariant.product.name} (${oldData.productVariant.colorName})\n`;
          await tx.productVariant.update({
            where: { id: variantId },
            data: { stock: { increment: diff } }
          });
        }
      }

      // 2. Process Added/Increased Items (Deduct from stock)
      for (const [variantId, newData] of Array.from(newItemsMap.entries())) {
        const oldData = oldItemsMap.get(variantId);
        const oldQty = oldData ? oldData.totalQuantity : 0;
        const diff = newData.totalQuantity - oldQty;

        if (diff > 0) {
          const variant = await tx.productVariant.findUnique({ where: { id: variantId }, include: { product: true } });
          if (!variant || variant.stock < diff) {
            throw new Error(`Not enough stock for variant ${variant?.colorName || variantId}`);
          }
          addedDetails += `+ ${diff}x ${variant.product.name} (${variant.colorName})\n`;
          await tx.productVariant.update({
            where: { id: variantId },
            data: { stock: { decrement: diff } }
          });
          await checkAndArchiveProduct(tx, variant.productId);
        }
      }

      // 3. Update Sale items (Replace old with new)
      await tx.saleItem.deleteMany({ where: { saleId } });
      await tx.saleItem.createMany({
        data: cart.map(item => ({
          saleId,
          productVariantId: item.variantId,
          quantity: item.quantity,
          priceAtSale: item.price
        }))
      });

      // 4. Update Sale Details
      let newNotes = orderNotes;
      let newStatus = existingSale.status;
      let hasIssue = existingSale.hasIssue;
      let issueReason = existingSale.issueReason;

      if (existingSale.status === "PACKED") {
        hasIssue = true;
        issueReason = "تم تعديل الأوردر من المبيعات بعد التجهيز - يتطلب إعادة تجهيز";
      }

      newNotes += `\n\n[تم تعديل الأوردر بالكامل من المبيعات بواسطة ${session.username}]`;

      await tx.sale.update({
        where: { id: saleId },
        data: {
          customerName: customerData.name || null,
          customerPhone: customerData.phone || null,
          customerPhone2: customerData.phone2 || null,
          customerCity: customerData.city || null,
          customerAddress: customerData.address || null,
          orderNotes: newNotes,
          totalAmount: cartTotalAfterDiscount,
          discountAmount: discountAmount,
          remainingAmount: finalCod,
          status: newStatus,
          hasIssue,
          issueReason
        }
      });

      await tx.activityLog.create({
        data: {
          userId: session.id,
          action: "ORDER_FULL_EDIT_CASHIER",
          details: `Fully edited invoice ${existingSale.invoiceCode}.`
        }
      });
    });

    // Telegram Notification
    const settings = await prisma.storeSettings.findFirst();
    if (settings && settings.isTelegramEnabled && settings.telegramToken && settings.telegramChatId) {
      let invoiceText = `⚠️ *تعديل فاتورة بالكامل من المبيعات!* ⚠️\n`;
      invoiceText += `🏷 *كود الفاتورة:* ${existingSale.invoiceCode}\n`;
      if (existingSale.isExchange) invoiceText += `🔄 *هذا أوردر استبدال*\n`;
      invoiceText += `\n`;
      
      invoiceText += `📌 *البيانات الحالية:*\n`;
      if (customerData.name) invoiceText += `- الاسم: ${customerData.name}\n`;
      if (customerData.phone) invoiceText += `- التليفون: ${customerData.phone}\n`;
      invoiceText += `- المحافظة: ${currentCity || "غير محدد"}\n`;
      if (customerData.address) invoiceText += `- العنوان: ${customerData.address}\n\n`;
      if (orderNotes) invoiceText += `📝 *الملحوظات:* ${orderNotes}\n\n`;

      if (removedDetails) {
        invoiceText += `❌ *منتجات تم مسحها (ورجعت للمخزن):*\n${removedDetails}\n`;
      }
      if (addedDetails) {
        invoiceText += `✅ *منتجات تم إضافتها:*\n${addedDetails}\n`;
      }

      invoiceText += `\n📦 *المنتجات النهائية في الأوردر الآن:*\n`;
      cart.forEach(item => {
        invoiceText += `- ${item.quantity}x ${item.name} (#${item.code}) بـ ${item.price} ج.م\n`;
      });
      
      invoiceText += `\n💰 *قيمة الفاتورة:* ${cartTotalAfterDiscount} ج.م\n`;
      if (parsedDeposit > 0) invoiceText += `💸 *العميلة حولت:* ${parsedDeposit} ج.م\n`;
      invoiceText += `💵 *المطلوب دفعه للاستلام (COD):* ${finalCod} ج.م\n`;
      
      if (existingSale.status === "PACKED") {
         invoiceText += `\n🚨 *تنبيه للمخزن: هذا الأوردر كان متقفل! تم تحويله لمشاكل التقفيل برجاء مراجعته وتجهيزه من جديد.*\n`;
      }

      invoiceText += `👨‍💼 *الموظف المعدل:* ${session.username}`;

      await fetch(`https://api.telegram.org/bot${settings.telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: invoiceText,
          parse_mode: "Markdown"
        })
      });
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to edit order" };
  }
}
