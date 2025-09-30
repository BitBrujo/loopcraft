import { NextResponse } from 'next/server';
import { checkConnection } from '@/lib/mysql-client';

export async function GET() {
  try {
    const dbConnected = await checkConnection();

    if (!dbConnected) {
      return NextResponse.json(
        { status: 'unhealthy', database: 'disconnected' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Health check failed' },
      { status: 503 }
    );
  }
}