import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const secretKey = "super-secret-bag-inventory-key-change-me"; // In production, use process.env.JWT_SECRET
const key = new TextEncoder().encode(secretKey);

export type AuthPayload = {
  id: string;
  username: string;
  role: string;
  pwdSnippet?: string;
};

export async function encrypt(payload: AuthPayload) {
  const oneYearInSeconds = 60 * 60 * 24 * 365;
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + oneYearInSeconds)
    .sign(key);
}

export async function decrypt(input: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload as AuthPayload;
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("bag_session")?.value;
  if (!session) return null;
  
  const payload = await decrypt(session);
  if (!payload) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { isActive: true, password: true }
    });

    if (!user || !user.isActive) {
      return null;
    }

    if (payload.pwdSnippet && payload.pwdSnippet !== user.password.slice(-10)) {
      return null;
    }

    return payload;
  } catch (err) {
    console.error("DB error in getSession (likely cold start):", err);
    // Do NOT return null here, otherwise a simple DB timeout will log the user out!
    // Since the JWT was verified successfully above, we can trust the session temporarily.
    return payload;
  }
}
