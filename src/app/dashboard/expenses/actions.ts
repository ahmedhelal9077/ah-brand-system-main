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

export async function createExpense(formData: FormData) {
  const session = await checkOwner();
  
  const amountStr = formData.get("amount") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as string;
  const partnerId = formData.get("partnerId") as string;
  const dateStr = formData.get("date") as string;
  
  if (!amountStr || !description) return { error: "المبلغ والوصف مطلوبان" };
  
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return { error: "مبلغ غير صحيح" };
  
  const date = dateStr ? new Date(dateStr) : new Date();
  
  await prisma.expense.create({
    data: {
      amount,
      description,
      type: type || "GENERAL",
      partnerId: (type === "PARTNER_SPECIFIC" && partnerId) ? partnerId : null,
      date
    }
  });
  
  await prisma.activityLog.create({
    data: {
      userId: session.id,
      action: "CREATE_EXPENSE",
      details: `أضاف مصروف جديد: ${description} بقيمة ${amount}`
    }
  });
  
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/accounting");
  return { success: true };
}

export async function deleteExpense(id: string) {
  const session = await checkOwner();
  
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (expense) {
    await prisma.expense.delete({ where: { id } });
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: "DELETE_EXPENSE",
        details: `مسح مصروف: ${expense.description} بقيمة ${expense.amount}`
      }
    });
  }
  
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/accounting");
}

export async function updatePartnerExpenseShare(partnerId: string, shareStr: string) {
  const session = await checkOwner();
  
  const share = parseFloat(shareStr);
  if (isNaN(share) || share < 0 || share > 100) return { error: "نسبة غير صحيحة" };
  
  await prisma.partner.update({
    where: { id: partnerId },
    data: { expenseShare: share }
  });
  
  revalidatePath("/dashboard/accounting");
  return { success: true };
}
