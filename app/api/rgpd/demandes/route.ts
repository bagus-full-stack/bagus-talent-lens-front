import { NextRequest, NextResponse } from 'next/server';
import { getDsrRepository } from '@/lib/api';
import { mockOrganization } from '@/lib/mock/data/organizations';
import { createDsrAction } from '@/app/actions/dsr';

export async function GET() {
  try {
    const repo = getDsrRepository() as any;
    const dsrs = await repo.getAll(mockOrganization.id);
    return NextResponse.json({ dsrs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createDsrAction(body);

    if (!result.success) {
      const status = result.code === 'FORBIDDEN' ? 403 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
