"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

async function checkOwner() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    throw new Error("Unauthorized");
  }
}

export async function createUser(formData: FormData) {
  await checkOwner();
  
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  
  if (!username || !password || !role) return;
  
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return;
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      plainPassword: password,
      role,
    }
  });
  
  revalidatePath("/dashboard/users");
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  await checkOwner();
  
  await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });
  
  revalidatePath("/dashboard/users");
}

export async function resetUserPassword(userId: string, newPassword: string) {
  await checkOwner();
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword, plainPassword: newPassword },
  });
  
  revalidatePath("/dashboard/users");
}

export async function deleteUser(userId: string) {
  await checkOwner();
  
  // Soft delete to preserve sales history
  await prisma.user.update({
    where: { id: userId },
    data: { isDeleted: true, isActive: false },
  });
  
  revalidatePath("/dashboard/users");
}

export async function editUser(userId: string, formData: FormData) {
  await checkOwner();
  
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  
  if (!username || !role) return { error: "Missing fields" };
  
  // Check if username is taken by another user
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.id !== userId) return { error: "Username already exists" };
  
  const updateData: any = { username, role };
  
  if (password && password.trim() !== "") {
    updateData.password = await bcrypt.hash(password, 10);
    updateData.plainPassword = password;
  }
  
  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });
  
  revalidatePath("/dashboard/users");
  return { success: true };
}
