import { expect, test } from '@playwright/test';

// Gerçek katılımcı oluşturan testler aynı atama katmanını paylaşır; sırayla çalışırlar.
test.describe.configure({ mode: 'serial' });
import { COVER, adminLogin, parseCsv, answerAll, createParticipant, submitResearch, waitStep } from './helpers';

test('gerçek katılımcı: koşul istemciye gönderilmez, test şeridi ve notlar yok', async ({ page }) => {
  await adminLogin(page);
  const code = await createParticipant(page, { module: 'B', condition: 'blok', isTest: false });
  const html = await (await page.request.get(`/katilim/${code}`)).text();
  expect(html).toContain('\\"condition\\":null');
  expect(html).not.toMatch(/\\"condition\\":\\"(ret|sahte|ghosting)\\"/);
  await page.goto(`/katilim/${code}`);
  await expect(page.getByTestId('demo-bar')).toHaveCount(0);
  await expect(page.getByTestId('test-setup')).toHaveCount(0);
  await page.click('#start');
  await waitStep(page, 'onam');
  await expect(page.getByText('Tasarım notu.')).toHaveCount(0);
});

test('sunucu adım sırasını ve veriyi doğrular', async ({ page }) => {
  await adminLogin(page);
  const code = await createParticipant(page, { module: 'A', condition: 'ret', isTest: true });
  const post = (stepId: string, data: unknown) => page.request.post(`/api/p/${code}/step`, { data: { stepId, data } });
  expect((await post('onam', { onam: 'Kabul ediyorum' })).status()).toBe(409); // başlatılmadan
  await page.request.post(`/api/p/${code}/start`);
  expect((await post('demografi', { yas: 22 })).status()).toBe(409); // adım atlama
  expect((await post('onam', { onam: 'Kabul etmiyorum' })).status()).toBe(422); // onam yok
  expect((await post('onam', {})).status()).toBe(422); // eksik yanıt
  expect((await post('onam', { onam: 'Kabul ediyorum', fazla: 1 })).status()).toBe(422); // tanımsız alan
  expect((await post('onam', { onam: 'Kabul ediyorum', rt_sn: 3 })).status()).toBe(200);
  expect((await post('onam', { onam: 'Kabul ediyorum', rt_sn: 3 })).status()).toBe(200); // yineleme: çift kayıt yok
  const bad = await post('demografi', { yas: 22, cinsiyet: 'Kadın', bolum: 'Uydurma', durum: '4. sınıf öğrencisiyim' });
  expect(bad.status()).toBe(422);
  // Şirket yanıtı yalnızca bekleme adımında istenebilir.
  expect((await page.request.post(`/api/p/${code}/company-response`, { data: { stepId: 'tur1_bekleme', elapsedSec: 60 } })).status()).toBe(409);
  // Gerçek katılımcı sıfırlanamaz.
  const real = await createParticipant(page, { module: 'A', condition: 'blok', isTest: false });
  expect((await page.request.post(`/api/p/${real}/reset`)).status()).toBe(403);
});

test('kaldığı yerden devam', async ({ page }) => {
  await adminLogin(page);
  const code = await createParticipant(page, { module: 'A', condition: 'blok', isTest: false });
  await page.goto(`/katilim/${code}`);
  await page.click('#start');
  await waitStep(page, 'onam');
  await answerAll(page, { onam: 'Kabul ediyorum' });
  await submitResearch(page);
  await waitStep(page, 'demografi');
  await answerAll(page);
  await submitResearch(page);
  await waitStep(page, 'on_jsse');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Devam et' })).toBeVisible();
  await page.click('#start');
  await waitStep(page, 'on_jsse');
  // /katilim sayfasından kodla giriş
  await page.goto('/katilim');
  await page.fill('#kod', code.toLowerCase().replace(/-/g, ''));
  await page.click('button:has-text("Devam")');
  await expect(page).toHaveURL(new RegExp(`/katilim/${code}$`));
  await page.click('#start');
  await waitStep(page, 'on_jsse');
  await page.goto(`/arastirmaci/katilimcilar/${code}`);
  await expect(page.getByText('Ön ölçüm (JSSE)').first()).toBeVisible();
  await expect(page.locator('li:has-text("resume")')).toHaveCount(2);
});

test('bloklu atama: her 3 gerçek kayıtta her koşul bir kez', async ({ page }) => {
  await adminLogin(page);
  const rows = async () => parseCsv(await (await page.request.get('/api/admin/export?scope=gercek&module=A&kind=genis&format=csv')).text());
  // Açık bloğu tamamla, ardından yeni bir tam blok çek.
  const pad = (3 - ((await rows()).filter((x) => x.atama_yontemi === 'blok').length % 3)) % 3;
  for (let i = 0; i < pad; i++) await createParticipant(page, { module: 'A', condition: 'blok', isTest: false });
  const r = await page.request.post('/api/admin/participants', { data: { module: 'A', condition: 'blok', count: 3, isTest: false } });
  const codes: string[] = (await r.json()).created.map((c: { code: string }) => c.code);
  const all = await rows();
  const got = codes.map((c) => all.find((x) => x.katilimci_kodu === c)!).map((x) => { expect(x.atama_yontemi).toBe('blok'); return x.kosul; }).sort();
  expect(got).toEqual(['ghosting', 'ret', 'sahte']);
});

test('gerçek sürede bekleme turu kısaltılamaz (60 sn + 6 sn)', async ({ page }) => {
  test.setTimeout(4 * 60_000);
  await adminLogin(page);
  const code = await createParticipant(page, { module: 'A', condition: 'ret', isTest: false });
  await page.goto(`/katilim/${code}`);
  await page.click('#start');
  await waitStep(page, 'onam');
  await answerAll(page, { onam: 'Kabul ediyorum' }); await submitResearch(page);
  await waitStep(page, 'demografi'); await answerAll(page); await submitResearch(page);
  await waitStep(page, 'on_jsse'); await answerAll(page, { dikkat_on: 'Ayda bir' }); await submitResearch(page);
  await waitStep(page, 'platform_giris'); await submitResearch(page, 'Platforma geç');
  await waitStep(page, 'tur1_ilan'); await page.click('#ap');
  await page.fill('#note_t', COVER); await page.click('#send');
  await waitStep(page, 'tur1_bekleme');
  const t0 = Date.now();
  await answerAll(page, {}, '[data-testid=research-panel]');
  await page.waitForTimeout(50_000);
  await expect(page.getByTestId('company-message')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Devam', exact: true })).toBeDisabled();
  await expect(page.getByTestId('company-message')).toBeVisible({ timeout: 15_000 });
  const tMsg = (Date.now() - t0) / 1000;
  expect(tMsg).toBeGreaterThan(55);
  await expect(page.getByRole('button', { name: 'Devam', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Devam', exact: true })).toBeEnabled({ timeout: 10_000 });
  expect((Date.now() - t0) / 1000).toBeGreaterThan(64);
});
