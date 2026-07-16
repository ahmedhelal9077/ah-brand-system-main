"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

async function checkOwner() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createProduct(formData: FormData): Promise<void> {
  const session = await checkOwner();
  
  const name = formData.get("name") as string;
  const priceStr = formData.get("price") as string;
  const wholesalePriceStr = formData.get("wholesalePrice") as string;
  const categoryId = formData.get("categoryId") as string;
  const codeStr = formData.get("code") as string;
  
  if (!name || !priceStr) return;
  
  const price = parseFloat(priceStr);
  if (isNaN(price)) return;
  
  let newCode: number;
  if (codeStr && codeStr.trim() !== "") {
    newCode = parseInt(codeStr.trim(), 10);
    if (isNaN(newCode)) return;
    
    // Check if code already exists
    const existing = await prisma.product.findUnique({ where: { code: newCode } });
    if (existing) {
      return;
    }
  } else {
    const lastProduct = await prisma.product.findFirst({
      orderBy: { code: 'desc' }
    });
    newCode = lastProduct ? lastProduct.code + 1 : 1000;
  }
  
  const wholesalePrice = wholesalePriceStr ? parseFloat(wholesalePriceStr) : 0;

  await prisma.product.create({
    data: {
      name,
      price,
      wholesalePrice: isNaN(wholesalePrice) ? 0 : wholesalePrice,
      code: newCode,
      categoryId: categoryId || null,
    }
  });
  
  prisma.activityLog.create({
    data: {
      userId: session.id,
      action: "CREATE_PRODUCT",
      details: `Added new product: ${name} (Code: ${newCode})`
    }
  }).catch(console.error);
  

  revalidatePath("/dashboard/products");
}

export async function editProduct(productId: string, formData: FormData) {
  const session = await checkOwner();
  
  const name = formData.get("name") as string;
  const priceStr = formData.get("price") as string;
  const wholesalePriceStr = formData.get("wholesalePrice") as string;
  const categoryId = formData.get("categoryId") as string;
  const codeStr = formData.get("code") as string;
  
  if (!name || !priceStr) return { error: "الاسم والسعر مطلوبان" };
  
  const price = parseFloat(priceStr);
  if (isNaN(price)) return { error: "السعر غير صحيح" };
  
  let code: number | undefined;
  if (codeStr && codeStr.trim() !== "") {
    code = parseInt(codeStr.trim(), 10);
    if (isNaN(code)) return { error: "الكود غير صحيح" };
    
    const existing = await prisma.product.findUnique({ where: { code } });
    if (existing && existing.id !== productId) {
      return { error: "هذا الكود مستخدم بالفعل لشنطة أخرى!" };
    }
  }
  
  const wholesalePrice = wholesalePriceStr ? parseFloat(wholesalePriceStr) : undefined;

  await prisma.product.update({
    where: { id: productId },
    data: {
      name,
      price,
      ...(wholesalePrice !== undefined && !isNaN(wholesalePrice) ? { wholesalePrice } : {}),
      categoryId: categoryId || null,
      ...(code !== undefined ? { code } : {})
    }
  });
  
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      action: "EDIT_PRODUCT",
      details: `Edited product: ${name} (Code: ${code || "unchanged"})`
    }
  });
  
  revalidatePath("/dashboard/products");
  revalidatePath("/store");
  revalidatePath("/pos");
  return { success: true };
}

export async function toggleProductActive(id: string) {
  const session = await checkOwner();
  const product = await prisma.product.findUnique({ where: { id } });
  if (product) {
    const newStatus = !product.isActive;
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: newStatus ? "UNARCHIVE_PRODUCT" : "ARCHIVE_PRODUCT",
        details: `${newStatus ? 'Unarchived' : 'Archived'} product: ${product.name} (Code: ${product.code})`
      }
    });
    await prisma.product.update({ 
      where: { id },
      data: { isActive: newStatus }
    });
  }
  revalidatePath("/dashboard/products");
  revalidatePath("/store");
  revalidatePath("/pos");
}

export async function deleteProduct(id: string) {
  const session = await checkOwner();
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { include: { _count: { select: { sales: true } } } } }
  });
  
  if (!product) return { error: "المنتج غير موجود" };
  
  const totalSales = product.variants.reduce((acc, v) => acc + v._count.sales, 0);
  
  if (totalSales > 0) {
    return { error: "لا يمكن مسح هذه الشنطة نهائياً لأنها متباعة في فواتير سابقة ومسجلة في الحسابات (سيؤدي مسحها إلى اختلال الفواتير). يمكنك أرشفتها (علامة العين) لإخفائها بدلاً من مسحها." };
  }
  
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      action: "DELETE_PRODUCT",
      details: `Permanently deleted product: ${product.name} (Code: ${product.code})`
    }
  });
  
  await prisma.product.delete({ where: { id } });
  
  revalidatePath("/dashboard/products");
  revalidatePath("/store");
  revalidatePath("/pos");
  
  return { success: true };
}
