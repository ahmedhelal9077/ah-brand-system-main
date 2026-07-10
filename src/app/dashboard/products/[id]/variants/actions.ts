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

export async function createVariant(formData: FormData) {
  const session = await checkOwner();
  
  const productId = formData.get("productId") as string;
  const colorName = formData.get("colorName") as string;
  const colorHex = formData.get("colorHex") as string;
  const imageUrl = formData.get("imageUrl") as string | null;
  const stockStr = formData.get("stock") as string;
  
  if (!productId || !colorName) return;
  
  const stock = parseInt(stockStr) || 0;
  
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  const existingVariants = await prisma.productVariant.findMany({ 
    where: { productId },
    select: { barcode: true }
  });
  
  let maxSuffix = 0;
  for (const v of existingVariants) {
    const parts = v.barcode.split('-');
    if (parts.length > 1) {
      const suffix = parseInt(parts[1], 10);
      if (!isNaN(suffix) && suffix > maxSuffix) {
        maxSuffix = suffix;
      }
    }
  }
  
  const barcode = `${product.code}-${maxSuffix + 1}`;
  
  await prisma.productVariant.create({
    data: {
      productId,
      colorName,
      colorHex,
      imageUrl,
      stock,
      barcode,
    }
  });
  
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      action: "CREATE_VARIANT",
      details: `Added new variant: ${colorName} to ${product?.name || "Product"}`
    }
  });
  
  revalidatePath(`/dashboard/products/${productId}/variants`);
}

export async function updateStock(variantId: string, productId: string, newStock: number) {
  const session = await checkOwner();
  
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, include: { product: true } });
  
  await prisma.productVariant.update({
    where: { id: variantId },
    data: { stock: newStock }
  });
  
  // Check if product should be auto-archived
  const allVariants = await prisma.productVariant.findMany({ where: { productId } });
  const totalStock = allVariants.reduce((sum, v) => sum + v.stock, 0);
  if (totalStock <= 0) {
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false }
    });
  }
  
  if (variant) {
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: "UPDATE_STOCK",
        details: `Updated stock of ${variant.product.name} (${variant.colorName}) from ${variant.stock} to ${newStock}`
      }
    });
  }
  
  revalidatePath(`/dashboard/products/${productId}/variants`);
}

export async function deleteVariant(variantId: string, productId: string) {
  const session = await checkOwner();
  
  // Check if there are any sales associated with this variant
  const salesCount = await prisma.saleItem.count({ where: { productVariantId: variantId } });
  if (salesCount > 0) {
    return { error: "لا يمكن حذف هذا الموديل لأنه مرتبط بمبيعات سابقة. قم بتصفير المخزون (جعله 0) بدلاً من الحذف للحفاظ على سجلات المبيعات." };
  }
  
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, include: { product: true } });
  if (variant) {
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: "DELETE_VARIANT",
        details: `Deleted variant: ${variant.colorName} from ${variant.product.name}`
      }
    });
    await prisma.productVariant.delete({ where: { id: variantId } });
  }
  revalidatePath(`/dashboard/products/${productId}/variants`);
}
