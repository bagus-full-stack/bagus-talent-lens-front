import { NextRequest, NextResponse } from 'next/server';
import { getExportRepository } from '@/lib/api';
import { mockOrganization } from '@/lib/mock/data/organizations';
import { createExportAction } from '@/app/actions/export';

export async function GET() {
  try {
    const repo = getExportRepository();
    const exports = await repo.getAll(mockOrganization.id);
    return NextResponse.json({ exports });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createExportAction(body);

    if (!result.success) {
      const status =
        result.code === 'FORBIDDEN' ? 403 : result.code === 'CEILING_EXCEEDED' ? 422 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
