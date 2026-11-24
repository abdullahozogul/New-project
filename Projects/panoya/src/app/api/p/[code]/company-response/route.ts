import { codeParam, handle, readJson } from '@/server/http';
import { FlowError, companyResponse } from '@/server/participants';

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = await codeParam(params);
    const body = await readJson(req, 4096);
    if (typeof body.stepId !== 'string') throw new FlowError('stepId eksik', 400);
    const el = typeof body.elapsedSec === 'number' && Number.isFinite(body.elapsedSec) ? body.elapsedSec : -1;
    return companyResponse(code, body.stepId, el);
  });
}
