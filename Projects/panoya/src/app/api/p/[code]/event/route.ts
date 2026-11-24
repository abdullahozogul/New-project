import { codeParam, handle, readJson } from '@/server/http';
import { FlowError, logEvent } from '@/server/participants';

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = await codeParam(params);
    const body = await readJson(req, 4096);
    if (typeof body.type !== 'string') throw new FlowError('type eksik', 400);
    const payload = typeof body.payload === 'object' && body.payload && !Array.isArray(body.payload) ? (body.payload as Record<string, unknown>) : {};
    await logEvent(code, body.type, typeof body.stepId === 'string' ? body.stepId : null, payload, body.clientTs);
    return { ok: true };
  });
}
