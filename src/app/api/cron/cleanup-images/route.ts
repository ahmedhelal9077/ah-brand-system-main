import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const variants = await prisma.productVariant.findMany({
      where: {
        imageUrl: {
          not: null
        }
      },
      select: {
        id: true,
        imageUrl: true
      }
    });

    let updatedCount = 0;
    
    // We only clean images that are suspiciously large (Base64), ignoring normal Cloudinary URLs
    for (const v of variants) {
      if (v.imageUrl && v.imageUrl.length > 500) {
        await prisma.productVariant.update({
          where: { id: v.id },
          data: { imageUrl: null }
        });
        updatedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${updatedCount} large base64 images.` 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
