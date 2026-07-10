import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const links = await prisma.storeLink.findMany({ orderBy: { createdAt: 'asc' } });
    const locations = await prisma.storeLocation.findMany({ orderBy: { createdAt: 'asc' } });
    
    return NextResponse.json({ links, locations });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch store info' }, { status: 500 });
  }
}
