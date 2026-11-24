import { codebook, eventTable, longTable, toCsv, toXlsx, wideTable } from '@/server/export';
import type { Scope } from '@/server/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const scope = (['gercek', 'test', 'tumu'].includes(sp.get('scope') ?? '') ? sp.get('scope') : 'gercek') as Scope;
  const module = sp.get('module') ?? '';
  const kind = sp.get('kind') ?? 'genis';
  const format = sp.get('format') === 'xlsx' ? 'xlsx' : 'csv';
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `panoya_${module || 'AB'}_${scope}_${stamp}`;
  if (format === 'xlsx') {
    const buf = await toXlsx([await wideTable(scope, module), await longTable(scope, module), await eventTable(scope, module), codebook()]);
    return new Response(new Uint8Array(buf), { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${base}.xlsx"`, 'Cache-Control': 'no-store' } });
  }
  const table = kind === 'uzun' ? await longTable(scope, module) : kind === 'olaylar' ? await eventTable(scope, module) : kind === 'sozluk' ? codebook() : await wideTable(scope, module);
  return new Response(toCsv(table), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${base}_${table.name}.csv"`, 'Cache-Control': 'no-store' } });
}
