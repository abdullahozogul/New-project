import { expect, test, type Page } from '@playwright/test';
import { COVER, adminLogin, checkSafe, answerAll, createParticipant, submitResearch, waitStep, wideRow } from './helpers';

const EXPECTED_MK: Record<string, string> = { ret: 'Kapandı', sahte: 'Yayında', ghosting: 'Mesaj almadım' };
const COND_TEXT: Record<string, string> = { ret: 'Zamanında ret', sahte: 'Sahte ilan', ghosting: 'Ghosting' };

async function preamble(page: Page, code: string, demo: Record<string, string | number> = {}) {
  await page.goto(`/katilim/${code}`);
  await page.click('#start');
  await waitStep(page, 'onam');
  // Onam reddi ilerletmez (referans doğrulaması).
  await checkSafe(page.locator('fieldset[data-id=onam] input[value="Kabul etmiyorum"]'));
  await submitResearch(page);
  await expect(page.getByText('Lütfen işaretlenmemiş soruları yanıtlayınız.')).toBeVisible();
  await waitStep(page, 'onam');
  await answerAll(page, { onam: 'Kabul ediyorum' });
  await submitResearch(page);
  await waitStep(page, 'demografi');
  // Eksik yanıtla ilerlenemez.
  await submitResearch(page);
  await expect(page.getByText('Lütfen işaretlenmemiş soruları yanıtlayınız.')).toBeVisible();
  await answerAll(page, demo);
  await submitResearch(page);
  await waitStep(page, 'on_jsse');
  await answerAll(page, { dikkat_on: 'Ayda bir' });
  await submitResearch(page);
}

async function behavior(page: Page, choice: 'basvur' | 'gec') {
  await waitStep(page, 'davranis', 60_000);
  await expect(page.getByText('Platformda size uygun yeni bir ilan var.')).toBeVisible();
  if (choice === 'basvur') {
    await page.click('#b_apply');
    await page.fill('#note_t', COVER);
    await page.click('#send');
    await expect(page.getByText('Başvurunuz Ardıçlı Dil Hizmetleri şirketine iletildi.')).toBeVisible();
    await expect(page.locator('#beh_go')).toBeEnabled({ timeout: 30_000 });
    await page.click('#beh_go');
  } else {
    await page.click('#b_skip');
    await expect(page.getByText('Bir ilanı değerlendirin')).toBeVisible();
    await answerAll(page);
    await submitResearch(page);
  }
}

async function postMeasures(page: Page, cond: string) {
  await waitStep(page, 'son_pa');
  await answerAll(page, { dikkat_son: 4, pa_1: 2, pa_2: 2, pa_3: 2, pa_4: 2, pa_5: 2, pa_6: 2, pa_7: 2 });
  await submitResearch(page);
  await waitStep(page, 'son_ba');
  await answerAll(page);
  await submitResearch(page);
  await waitStep(page, 'son_jsse');
  await answerAll(page);
  await submitResearch(page);
  await waitStep(page, 'son_dn');
  await answerAll(page, { dn_1: 4, dn_2: 2, dn_3: 4 });
  await submitResearch(page);
  await waitStep(page, 'son_mk');
  await answerAll(page, { mk_olgusal: EXPECTED_MK[cond] });
  await submitResearch(page);
}

async function debrief(page: Page, cond: string) {
  await waitStep(page, 'bilgilendirme');
  await expect(page.getByText(`Siz ${COND_TEXT[cond]} grubundaydınız.`)).toBeVisible();
  await submitResearch(page, 'Çalışmayı bitir');
  await expect(page.getByRole('heading', { name: 'Teşekkür ederiz', exact: true })).toBeVisible();
}

for (const cond of ['ret', 'sahte', 'ghosting'] as const) {
  test(`Modül A · ${cond} · tam akış ve veri kaydı`, async ({ page }) => {
    await adminLogin(page);
    const code = await createParticipant(page, { module: 'A', condition: cond, isTest: true, fast: true, notes: true });
    await preamble(page, code);
    await waitStep(page, 'platform_giris');
    await expect(page.getByText('İlan platformuna geçiyorsunuz')).toBeVisible();
    await submitResearch(page, 'Platforma geç');
    for (let r = 1; r <= 4; r++) {
      await waitStep(page, `tur${r}_ilan`);
      await page.click('#ap');
      await waitStep(page, `tur${r}_basvuru`);
      await expect(page.locator('#send')).toBeDisabled();
      await page.fill('#note_t', 'kısa');
      await expect(page.locator('#send')).toBeDisabled();
      await page.fill('#note_t', COVER);
      await page.click('#send');
      await waitStep(page, `tur${r}_bekleme`);
      await answerAll(page, {}, '[data-testid=research-panel]');
      // Bekleme bitmeden Devam pasif.
      await expect(page.getByRole('button', { name: 'Devam', exact: true })).toBeDisabled();
      if (cond === 'ghosting') {
        await expect(page.getByRole('button', { name: 'Devam', exact: true })).toBeEnabled({ timeout: 20_000 });
        await expect(page.getByTestId('company-message')).toHaveCount(0);
        await expect(page.getByTestId('apps-table').locator('tbody tr').first()).toContainText('Başvurunuz alındı');
      } else {
        await expect(page.getByTestId('company-message')).toBeVisible({ timeout: 20_000 });
        await expect(page.getByTestId('company-message')).toContainText('bu aşamada sürece sizinle devam etmeyeceğimizi bildirmek isteriz');
        await expect(page.getByTestId('ad-status')).toHaveText(cond === 'sahte' ? 'İlan durumu: Yayında – başvurular devam ediyor' : 'İlan durumu: Kapandı');
        await expect(page.getByTestId('msg-badge')).toHaveText('1');
        await expect(page.getByTestId('apps-table').locator('tbody tr').first()).toContainText('Olumsuz sonuçlandı');
      }
      await expect(page.getByTestId('apps-table').locator('tbody tr')).toHaveCount(r);
      await submitResearch(page);
    }
    await behavior(page, cond === 'sahte' ? 'gec' : 'basvur');
    await postMeasures(page, cond);
    await waitStep(page, 'suphe');
    await answerAll(page);
    await submitResearch(page);
    await debrief(page, cond);

    const row = await wideRow(page, code);
    expect(row.kosul).toBe(cond);
    expect(row.kayit_durumu).toBe('tamamlandi');
    expect(row.durum).toBe('4. sınıf öğrencisiyim');
    expect(row.jsse_on_ort).toBe('6');
    expect(row.dikkat_on_dogru).toBe('true');
    expect(row.dikkat_son_dogru).toBe('true');
    expect(row.prosedurel_adalet_ort).toBe('2'); // dikkat_son (4) ortalamaya girmez
    expect(row.devam_niyeti_ort).toBe('4'); // dn_2 = 2 → ters 4
    expect(row.mk_olgusal_dogru).toBe('true');
    expect(row['tur1_bekleme.mesaj']).toBe(cond === 'ghosting' ? 'false' : 'true');
    expect(row['tur4_bekleme.kosul']).toBe(cond);
    expect(Number(row['tur2_basvuru.not_uzunluk'])).toBe(COVER.length);
    expect(row['davranis.davranis']).toBe(cond === 'sahte' ? 'gec' : 'basvur');
    expect(row.tur_sirasi.split('|').sort()).toEqual(['kekik', 'nehirsu', 'selvigol', 'tirhan']);
    expect(row.tur3_sirket_yaniti_gonderildi).toBe(cond === 'ghosting' ? 'false' : 'true');
  });
}

for (const cond of ['ret', 'sahte', 'ghosting'] as const) {
  test(`Modül B · ${cond} · e-posta akışı ve veri kaydı @mobil`, async ({ page }) => {
    await adminLogin(page);
    const code = await createParticipant(page, { module: 'B', condition: cond, isTest: true, fast: true });
    await preamble(page, code);
    await waitStep(page, 'ilan_secim');
    await expect(page.getByText('Arama sonuçları · 3 ilan')).toBeVisible();
    await answerAll(page, { secim: 'Tirhan Kitap · Redaksiyon Asistanı' }, '[data-testid=research-panel]');
    await page.click('button:has-text("Seçtiğim ilana başvur")');
    await waitStep(page, 'basvuru');
    await expect(page.locator('#nm')).toHaveValue('Deniz Yılmaz');
    await page.fill('#note_t', COVER);
    await expect(page.locator('#send')).toBeDisabled(); // onay kutusu işaretlenmedi
    await page.check('#ok');
    await page.click('#send');
    await waitStep(page, 'basvuru_onay');
    await expect(page.getByText('Başvuru numaranız: TK-2026-0417')).toBeVisible();
    await page.click('#next');
    await waitStep(page, 'posta_gun1');
    await expect(page.getByTestId('sim-clock')).toHaveText('24 Kasım 2026 Salı, 16:43');
    await expect(page.locator('[data-id=conf]')).toHaveClass(/font-bold/);
    await page.click('[data-id=conf]');
    await expect(page.getByTestId('mail-subject')).toHaveText('Başvurunuz alındı – Redaksiyon Asistanı (TK-2026-0417)');
    await expect(page.getByText("7 Aralık 2026 saat 12:00'ye")).toBeVisible();
    await page.click('#next');
    await waitStep(page, 'zaman_atlama');
    await page.click('#go');
    await waitStep(page, 'posta_gun14_1130');
    await expect(page.getByTestId('sim-clock')).toHaveText('7 Aralık 2026 Pazartesi, 11:30');
    if (cond === 'ghosting') {
      await expect(page.locator('[data-id=rej]')).toHaveCount(0);
      await expect(page.locator('[data-id=bulut2]')).toBeVisible();
    } else {
      await page.click('[data-id=rej]');
      await expect(page.getByTestId('mail-subject')).toHaveText('Redaksiyon Asistanı başvurunuz hakkında (TK-2026-0417)');
      await expect(page.getByTestId('ad-status')).toHaveText(cond === 'sahte' ? 'İlan durumu: Yayında – başvurular devam ediyor' : 'İlan durumu: Kapandı');
    }
    await page.click('#next');
    await waitStep(page, 'posta_gun14_1400');
    await expect(page.locator('[data-id=res]')).toHaveClass(/font-bold/);
    await page.click('[data-id=res]');
    await expect(page.getByText('Aday Deneyimi Araştırması (İÜ)')).toBeVisible();
    await page.click('#golink');
    await behavior(page, cond === 'ret' ? 'gec' : 'basvur');
    await postMeasures(page, cond);
    await waitStep(page, 'son_sorular');
    await answerAll(page);
    await submitResearch(page);
    await debrief(page, cond);
    const row = await wideRow(page, code);
    expect(row.kosul).toBe(cond);
    expect(row.kayit_durumu).toBe('tamamlandi');
    expect(row.durum).toBe('4. sınıf öğrencisiyim');
    expect(row.secilen_ilan).toBe('tirhan');
    expect(row.eposta_onay_acildi).toBe('true');
    expect(row.eposta_ret_acildi).toBe(cond === 'ghosting' ? '' : 'true');
    expect(row.eposta_arastirma_acildi).toBe('true');
    expect(row.baglanti_tiklandi).toBe('true');
    expect(row.sirket_epostasi_11_30).toBe(cond === 'ghosting' ? 'gönderilmedi' : 'gönderildi');
    expect(Number(row['basvuru.not_uzunluk'])).toBe(COVER.length);
    expect(row.ilan_tirhan_cekicilik).toBe('3');
    // Kişisel veri dışa aktarıma girmez.
    expect(JSON.stringify(row)).not.toContain('Deniz');
    expect(JSON.stringify(row)).not.toContain('posta.example');
  });
}
