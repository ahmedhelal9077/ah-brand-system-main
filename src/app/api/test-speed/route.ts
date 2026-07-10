import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const start = Date.now();
  
  const lastProduct = await prisma.product.findFirst({
    orderBy: { code: 'desc' }
  });
  const t1 = Date.now();
  
  const newCode = lastProduct ? lastProduct.code + 1 : 1000;
  
  const product = await prisma.product.create({
    data: {
      name: "Test Speed",
      price: 100,
      code: newCode,
    }
  });
  const t2 = Date.now();
  
  await prisma.activityLog.create({
    data: {
      userId: "test-id", // might fail if foreign key constraint exists, wait...
      action: "CREATE_PRODUCT",
      details: `Test`
    }
  }).catch(() => {}); // catch FK error
  const t3 = Date.now();
  
  // Cleanup
  await prisma.product.delete({ where: { id: product.id } });
  
  return NextResponse.json({
    findLastCodeMs: t1 - start,
    createProductMs: t2 - t1,
    createLogMs: t3 - t2,
    totalMs: t3 - start
  });
}
