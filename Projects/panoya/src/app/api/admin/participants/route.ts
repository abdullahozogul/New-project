import { z } from 'zod';
import { handle, readJson } from '@/server/http';
import { FlowError, createParticipant, purgeContact, resetTestParticipant, setCancelled } from '@/server/participants';
import { CODE_RE, normalizeCode } from '@/server/codes';

const createSchema = z.object({
  module: z.enum(['A', 'B']),
  condition: z.enum(['blok', 'ret', 'sahte', 'ghosting']),
  count: z.number().int().min(1).max(200),
  isTest: z.boolean(),
  fastMode: z.boolean().default(false),
  showNotes: z.boolean().default(false),
  label: z.string().max(120).optional().nullable(),
});

/** Katılımcı kaydı / kod üretimi (toplu). */
export async function POST(req: Request) {
  return handle(async () => {
    const r = createSchema.safeParse(await readJson(req));
    if (!r.success) throw new FlowError('Geçersiz istek: ' + r.error.issues.map((i) => i.message).join('; '), 422);
    const d = r.data;
    const created = [];
    for (let i = 0; i < d.count; i++) {
      const p = await createParticipant({ module: d.module, condition: d.condition, isTest: d.isTest, fastMode: d.fastMode, showNotes: d.showNotes, label: d.label });
      created.push({ code: p.code, module: p.module, isTest: p.is_test });
    }
    return { created };
  });
}

const actionSchema = z.object({ code: z.string(), action: z.enum(['reset', 'cancel', 'uncancel', 'purge_contact']) });

export async function PATCH(req: Request) {
  return handle(async () => {
    const r = actionSchema.safeParse(await readJson(req));
    if (!r.success) throw new FlowError('Geçersiz istek', 422);
    const code = normalizeCode(r.data.code);
    if (!CODE_RE.test(code)) throw new FlowError('Geçersiz kod', 422);
    if (r.data.action === 'reset') await resetTestParticipant(code);
    if (r.data.action === 'cancel') await setCancelled(code, true);
    if (r.data.action === 'uncancel') await setCancelled(code, false);
    if (r.data.action === 'purge_contact') await purgeContact(code);
    return { ok: true };
  });
}
