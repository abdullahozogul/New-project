import { codeParam, handle } from '@/server/http';
import { FlowError, mailbox } from '@/server/participants';

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = await codeParam(params);
    const stage = new URL(req.url).searchParams.get('stage');
    if (stage !== 'd1' && stage !== 'd14a' && stage !== 'd14b') throw new FlowError('Geçersiz aşama', 400);
    return mailbox(code, stage);
  });
}
