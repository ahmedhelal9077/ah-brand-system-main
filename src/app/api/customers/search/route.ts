import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json(null);
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { phone }
    });
    
    return NextResponse.json(customer);
  } catch (error: any) {
    console.error("Search Customer Error:", error);
    return NextResponse.json(null);
  }
}
