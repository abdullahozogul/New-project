import { codeParam, handle, readJson } from '@/server/http';
import { FlowError, submitStep } from '@/server/participants';

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = await codeParam(params);
    const body = await readJson(req);
    if (typeof body.stepId !== 'string') throw new FlowError('stepId eksik', 400);
    return submitStep(code, body.stepId, body.data, body.startedAt, body.finishedAt);
  });
}
