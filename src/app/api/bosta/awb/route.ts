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
  const ids = searchParams.get("ids");
  if (!ids) {
    return new NextResponse("Missing IDs", { status: 400 });
  }

  const settings = await prisma.storeSettings.findFirst();
  if (!settings || !settings.bostaApiKey) {
    return new NextResponse("Bosta API Key missing", { status: 500 });
  }

  try {
    const res = await fetch(`https://app.bosta.co/api/v0/deliveries/awb?ids=${ids}`, {
      method: "GET",
      headers: {
        "Authorization": settings.bostaApiKey.trim(),
      }
    });

    const data = await res.json();
    if (!res.ok) {
      return new NextResponse(data.message || "Bosta Error", { status: res.status });
    }

    if (data.data) {
      // Decode base64 to binary buffer
      const pdfBuffer = Buffer.from(data.data, 'base64');
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="Bosta_AWBs.pdf"`
        }
      });
    }

    return new NextResponse("Invalid response from Bosta", { status: 500 });
  } catch (error: any) {
    console.error("Bosta AWB Error:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
