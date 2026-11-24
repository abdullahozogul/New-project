import { codeParam, handle } from '@/server/http';
import { resetTestParticipant } from '@/server/participants';

/** Yalnızca test kayıtları sıfırlanabilir (sunucu tarafında denetlenir). */
export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => { await resetTestParticipant(await codeParam(params)); return { ok: true }; });
}
