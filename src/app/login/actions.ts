"use server";

import { cookies } from "next/headers";
import { encrypt } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  
  if (!username || !password) return { error: "All fields are required" };
  
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isActive) return { error: "Invalid credentials or inactive account" };
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return { error: "Invalid credentials" };
  
  const sessionToken = await encrypt({
    id: user.id,
    username: user.username,
    role: user.role,
    pwdSnippet: user.password.slice(-10),
  });
  
  const expiresDate = new Date();
  expiresDate.setFullYear(expiresDate.getFullYear() + 1);

  const cookieStore = await cookies();
  
  // Delete old stuck cookie if it exists
  cookieStore.delete("session");

  cookieStore.set("bag_session", sessionToken, {
    httpOnly: true,
    secure: true, // Force secure since it's Vercel
    maxAge: 31536000, // 1 year in seconds
    path: "/",
    sameSite: "lax",
  });
  
  let redirectUrl = "/pos";
  if (user.role === "OWNER") redirectUrl = "/dashboard";
  else if (user.role === "WAREHOUSE") redirectUrl = "/fulfillment";
  
  return { success: true, redirectUrl, sessionToken };
}

export async function restoreSessionAction(token: string) {
  if (!token) return { success: false };
  
  try {
    const { decrypt } = await import("@/lib/auth");
    const payload = await decrypt(token);
    if (!payload) return { success: false };
    
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.isActive) return { success: false };
    if (payload.pwdSnippet && payload.pwdSnippet !== user.password.slice(-10)) return { success: false };

    const cookieStore = await cookies();
    cookieStore.delete("session");
    
    cookieStore.set("bag_session", token, {
      httpOnly: true,
      secure: true,
      maxAge: 31536000,
      path: "/",
      sameSite: "lax",
    });

    let redirectUrl = "/pos";
    if (user.role === "OWNER") redirectUrl = "/dashboard";
    else if (user.role === "WAREHOUSE") redirectUrl = "/fulfillment";

    return { success: true, redirectUrl };
  } catch (err) {
    return { success: false };
  }
}
