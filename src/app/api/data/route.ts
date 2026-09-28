import { NextRequest, NextResponse } from 'next/server';
import { buildDashboardData } from '@/lib/pipeline';

// Esta ruta lee de Google Sheets (con cache en memoria, ver CACHE_TTL_SECONDS
// en sheetsConfig.ts) y devuelve los hechos ya deduplicados y vinculados.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const forceRefresh = req.nextUrl.searchParams.get('refresh') === '1';
  try {
    const data = await buildDashboardData(forceRefresh);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error building dashboard data:', err);
    return NextResponse.json(
      { error: err.message || 'Error desconocido al procesar las planillas' },
      { status: 500 }
    );
  }
}
