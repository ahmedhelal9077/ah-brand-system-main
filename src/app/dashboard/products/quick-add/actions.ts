"use server";

import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function createProductWithVariants(
  productData: { name: string; price: number; categoryId: string },
  variantsData: { colorName: string; colorHex?: string; barcode: string; stock: number; imageUrl: string | null }[]
) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "WAREHOUSE")) {
    return { error: "Unauthorized" };
  }

  if (!productData.name || isNaN(productData.price) || productData.price <= 0) {
    return { error: "اسم الشنطة والسعر مطلوبين." };
  }

  if (!variantsData || variantsData.length === 0) {
    return { error: "يجب إضافة لون واحد على الأقل." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Determine new product code
      const lastProduct = await tx.product.findFirst({
        orderBy: { code: 'desc' }
      });
      const newCode = lastProduct ? lastProduct.code + 1 : 1000;

      // 2. Check for duplicate barcodes
      const barcodes = variantsData.map(v => v.barcode).filter(b => b.trim() !== "");
      if (barcodes.length > 0) {
        const existingBarcodes = await tx.productVariant.findMany({
          where: { barcode: { in: barcodes } }
        });
        if (existingBarcodes.length > 0) {
          throw new Error(`الباركود مستخدم مسبقاً: ${existingBarcodes.map(b => b.barcode).join(", ")}`);
        }
      }

      // 3. Create Product
      const product = await tx.product.create({
        data: {
          name: productData.name,
          price: productData.price,
          code: newCode,
          categoryId: productData.categoryId || null,
        }
      });

      // 4. Create Variants
      let variantCount = 0;
      const seenColors = new Set<string>();

      for (const variant of variantsData) {
        if (!variant.colorName) continue; // Skip empty rows

        let finalColorName = variant.colorName.trim();
        let barcodeIndex = variantCount + 1;
        let barcodeStr = `${newCode}-${barcodeIndex}`;
        
        let counter = 1;
        while (seenColors.has(barcodeStr)) {
          barcodeStr = `${newCode}-${barcodeIndex}-${counter}`;
          counter++;
        }
        seenColors.add(barcodeStr);

        await tx.productVariant.create({
          data: {
            productId: product.id,
            colorName: finalColorName,
            colorHex: variant.colorHex || null,
            barcode: variant.barcode.trim() || barcodeStr, // purely numeric/ascii
            stock: variant.stock || 0,
            imageUrl: variant.imageUrl || null
          }
        });
        variantCount++;
      }

      if (variantCount === 0) {
        throw new Error("لم يتم إدخال أي ألوان صحيحة.");
      }

      // 5. Activity Log
      await tx.activityLog.create({
        data: {
          userId: session.id,
          action: "QUICK_ADD_PRODUCT",
          details: `Quick added product: ${product.name} (Code: ${newCode}) with ${variantCount} colors.`
        }
      });

      return { success: true, productId: product.id, code: newCode };
    });

    return result;
  } catch (error: any) {
    return { error: error.message || "حدث خطأ غير معروف أثناء الحفظ." };
  }
}
