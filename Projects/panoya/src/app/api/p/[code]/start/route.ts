import { codeParam, handle } from '@/server/http';
import { startParticipant } from '@/server/participants';

export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => startParticipant(await codeParam(params)));
}
