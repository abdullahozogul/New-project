import { expect, type Page } from '@playwright/test';

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'panoya-yerel-test';

export async function adminLogin(page: Page) {
  await page.goto('/arastirmaci/giris');
  await page.fill('#pw', ADMIN_PASSWORD);
  await page.click('button:has-text("Giriş")');
  await expect(page).toHaveURL(/\/arastirmaci$/);
}

export async function createParticipant(page: Page, opts: { module: 'A' | 'B'; condition: string; isTest: boolean; fast?: boolean; notes?: boolean }) {
  const r = await page.request.post('/api/admin/participants', { data: { module: opts.module, condition: opts.condition, count: 1, isTest: opts.isTest, fastMode: opts.fast ?? true, showNotes: opts.notes ?? false, label: 'e2e' } });
  expect(r.ok()).toBeTruthy();
  return (await r.json()).created[0].code as string;
}

/** Sayfa açılışındaki scrollTo(0,0) ile çakışan tıklamalar için yeniden denemeli işaretleme. */
export async function checkSafe(loc: import('@playwright/test').Locator) {
  await expect(async () => { await loc.check({ force: true, timeout: 2000 }); }).toPass({ timeout: 15_000 });
}

/** Görünür araştırma sayfasındaki tüm soruları yanıtlar. Varsayılanlar: likert 3 (10'luda 6), ilk seçenek. */
export async function answerAll(page: Page, overrides: Record<string, string | number> = {}, scope = 'body') {
  const sets = page.locator(`${scope} fieldset[data-id]`);
  const n = await sets.count();
  for (let i = 0; i < n; i++) {
    const fs = sets.nth(i);
    const id = (await fs.getAttribute('data-id'))!;
    const ov = overrides[id];
    if (await fs.locator('.r-scale').count()) {
      const max = await fs.locator('input[type=radio]').count();
      const v = ov ?? (max === 10 ? 6 : 3);
      await checkSafe(fs.locator(`input[value="${v}"]`));
    } else if (await fs.locator('input[type=radio]').count()) {
      if (ov !== undefined) await checkSafe(fs.locator(`input[value="${ov}"]`));
      else await checkSafe(fs.locator('input[type=radio]').first());
    } else if (await fs.locator('select').count()) {
      await fs.locator('select').selectOption({ index: 1 });
    } else if (await fs.locator('input[type=number]').count()) {
      await fs.locator('input').fill(String(ov ?? 23));
    } else if (await fs.locator('textarea').count()) {
      await fs.locator('textarea').fill(String(ov ?? 'Bir iş başvurusu deneyimi hakkında bir araştırma olduğunu düşünüyorum'));
    } else {
      await fs.locator('input').fill(String(ov ?? 'İstanbul'));
    }
  }
}

export async function submitResearch(page: Page, label = 'Devam') {
  const btn = page.getByRole('button', { name: label, exact: true });
  await expect(btn).toBeEnabled({ timeout: 120_000 });
  await btn.click();
}

export async function step(page: Page) {
  return page.getByTestId('runner').getAttribute('data-step');
}
export async function waitStep(page: Page, id: string | RegExp, timeout = 30_000) {
  await expect(page.getByTestId('runner')).toHaveAttribute('data-step', id, { timeout });
}

export const COVER = 'Yayıncılık alanında edindiğim staj deneyimini bu pozisyonda geliştirmek istiyorum. Metinlere dikkatle yaklaşır, ekip içinde düzenli çalışırım.';

export function parseCsv(text: string): Record<string, string>[] {
  text = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const [head, ...rest] = rows;
  return rest.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

export async function wideRow(page: Page, code: string, scope = 'test') {
  const r = await page.request.get(`/api/admin/export?scope=${scope}&kind=genis&format=csv`);
  expect(r.ok()).toBeTruthy();
  return parseCsv(await r.text()).find((x) => x.katilimci_kodu === code)!;
}
