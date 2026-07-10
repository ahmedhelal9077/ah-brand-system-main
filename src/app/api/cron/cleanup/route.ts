import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const now = new Date();
    
    // 1. Delete Reservations older than 24 hours
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const deletedReservations = await prisma.reservation.deleteMany({
      where: {
        createdAt: {
          lt: yesterday,
        }
      }
    });

    // 2. Delete Activity Logs older than 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const deletedLogs = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Cleanup successful',
      deletedReservations: deletedReservations.count,
      deletedLogs: deletedLogs.count
    });

  } catch (error) {
    console.error('Cron cleanup error:', error);
    return NextResponse.json({ success: false, error: 'Failed to cleanup' }, { status: 500 });
  }
}
