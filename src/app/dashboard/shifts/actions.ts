"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function getActiveShift(userId: string) {
  try {
    const shift = await prisma.shift.findFirst({
      where: {
        userId,
        status: "OPEN"
      },
      include: {
        sales: true,
        expenses: true,
      }
    });
    return { shift };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getAllShifts() {
  try {
    const shifts = await prisma.shift.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true } },
        _count: {
          select: { sales: true, expenses: true }
        }
      }
    });
    return { shifts };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function startShift(userId: string, startingCash: number) {
  try {
    // Ensure no active shift exists for this user
    const existing = await prisma.shift.findFirst({
      where: { userId, status: "OPEN" }
    });

    if (existing) {
      return { error: "You already have an active shift. Please close it first." };
    }

    const shift = await prisma.shift.create({
      data: {
        userId,
        startingCash,
        status: "OPEN"
      }
    });

    revalidatePath("/dashboard/shifts");
    revalidatePath("/pos");
    return { success: true, shift };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function endShift(shiftId: string, actualCash: number, notes?: string) {
  try {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        sales: true,
        expenses: true
      }
    });

    if (!shift) return { error: "Shift not found" };
    if (shift.status === "CLOSED") return { error: "Shift already closed" };

    // Calculate expected cash
    // Total POS cash sales
    const totalSales = shift.sales.reduce((sum, sale) => {
      // Net revenue from sale = totalAmount - discountAmount - returnedAmount
      return sum + (sale.totalAmount - sale.discountAmount - sale.returnedAmount);
    }, 0);

    // Total expenses paid from drawer
    const totalExpenses = shift.expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const expectedCash = shift.startingCash + totalSales - totalExpenses;
    const shortage = actualCash - expectedCash; // Negative means shortage, Positive means overage

    const closedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: "CLOSED",
        endTime: new Date(),
        expectedCash,
        actualCash,
        shortage,
        notes
      }
    });

    revalidatePath("/dashboard/shifts");
    revalidatePath("/pos");
    return { success: true, closedShift };
  } catch (error: any) {
    return { error: error.message };
  }
}
