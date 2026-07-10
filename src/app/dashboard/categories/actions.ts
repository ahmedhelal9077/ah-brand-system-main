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

export async function createCategory(formData: FormData) {
  const session = await checkOwner();
  
  const name = formData.get("name") as string;
  if (!name) return;
  
  try {
    await prisma.category.create({
      data: { name }
    });
    
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: "CREATE_CATEGORY",
        details: `Added new category: ${name}`
      }
    });
    
    revalidatePath("/dashboard/categories");
  } catch (error) {
    // ignore
  }
}

export async function deleteCategory(id: string) {
  const session = await checkOwner();
  try {
    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      throw new Error("لا يمكن مسح هذا القسم لأنه يحتوي على منتجات.");
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (category) {
      await prisma.activityLog.create({
        data: {
          userId: session.id,
          action: "DELETE_CATEGORY",
          details: `Deleted category: ${category.name}`
        }
      });
      await prisma.category.delete({ where: { id } });
    }
    revalidatePath("/dashboard/categories");
  } catch (error: any) {
    // Ignore to satisfy form action void return type in Server Component
  }
}
