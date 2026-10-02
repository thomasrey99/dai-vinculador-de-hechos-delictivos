import { NextRequest, NextResponse } from 'next/server';
import { getHechoDetalle } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Id de hecho inválido' }, { status: 400 });
  }

  try {
    const detalle = await getHechoDetalle(id);
    if (!detalle) {
      return NextResponse.json({ error: `No existe el hecho #${id}` }, { status: 404 });
    }
    return NextResponse.json(detalle);
  } catch (err: any) {
    console.error(`Error obteniendo detalle del hecho ${id}:`, err);
    return NextResponse.json(
      { error: err.message || 'Error desconocido al obtener el detalle' },
      { status: 500 }
    );
  }
}