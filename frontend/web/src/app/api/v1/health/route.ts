import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'ok',
      service: 'PHALAY Serverless API (Vercel)',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    },
  });
}
