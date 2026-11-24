'use client';
/* Modül A – Çalışma 1 laboratuvar deneyine özgü ekranlar (referans roundAd, roundApply, roundWait). */
import { useEffect, useRef, useState } from 'react';
import { ADS, type AdKey } from '@/protocol/ads';
import { AD_STATUS_TEXT } from '@/protocol/conditions';
import { rejectionParagraphs, rejectionSignature } from '@/protocol/emails';
import { PROGRESS } from '@/protocol/progress';
import { NOTES, PLATFORM_INTRO_HTML } from '@/protocol/texts';
import { t } from '@/protocol/timing';
import type { AppRow } from '../types';
import { api } from '../api';
import { useRunner } from '../RunnerContext';
import { AppsBox, ApplyForm, Btn, CompanyMessage, Crumbs, JobDetail, SideSimilar, SuccessAlert } from '@/components/platform/Platform';
import { Note, RBtn, ResearchPage, ResearchPanel, useSurvey } from '@/components/research/Research';
import { PlatformFrame, type StepProps } from './common';

function nowClock() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function mmss(s: number) {
  s = Math.max(0, Math.ceil(s));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
const r1 = (ms: number) => Math.round(ms / 100) / 10;

export function IntroStep({ done }: StepProps) {
  return (
    <ResearchPage progress={PROGRESS.A.platform_giris} section="Başvuru bölümü" title="İlan platformuna geçiyorsunuz"
      pre={<><div className="prose-r" dangerouslySetInnerHTML={{ __html: PLATFORM_INTRO_HTML }} /><Note>{NOTES.platformIntro}</Note></>}
      items={[]} button="Platforma geç" onDone={(r) => done({ rt_sn: r.rt_sn })} />
  );
}

export function RoundAdStep({ step, view, done }: StepProps) {
  const key = step.adKey as AdKey;
  const ad = ADS[key];
  const i = (step.round ?? 1) - 1;
  const t0 = useRef(performance.now());
  const side = (view.roundOrder ?? []).filter((k) => k !== key).slice(0, 2);
  return (
    <PlatformFrame active="ilanlar" q="editör, çeviri, içerik">
      <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-5 py-5 pb-10 max-[860px]:grid-cols-1">
        <div className="min-w-0">
          <Crumbs parts={['İş İlanları', ad.area, ad.title]} />
          <JobDetail ad={ad} actions={<>
            <Btn id="ap" onClick={() => done({ tur: i + 1, sirket: ad.co, ilan_okuma_sn: r1(performance.now() - t0.current) })}>Başvur</Btn>
            <Btn ghost disabled title="Bu çalışmada kaydetme kapalı">Kaydet</Btn>
          </>} />
          {i === 0 ? <Note>{NOTES.roundAd}</Note> : null}
        </div>
        <aside className="min-w-0"><SideSimilar keys={side} /></aside>
      </div>
    </PlatformFrame>
  );
}

export function RoundApplyStep({ step, done }: StepProps) {
  const ad = ADS[step.adKey as AdKey];
  const i = (step.round ?? 1) - 1;
  return (
    <PlatformFrame active="ilanlar">
      <div className="py-5 pb-10">
        <Crumbs parts={['İş İlanları', ad.title, 'Başvuru']} />
        <div className="rounded-md border border-p-line bg-white px-[22px] py-5 max-[520px]:p-4">
          <ApplyForm ad={ad} onSend={(txt) => done({ tur: i + 1, not_uzunluk: txt.length, not_metni: txt })} />
        </div>
        {i === 0 ? <Note>{NOTES.roundApply}</Note> : null}
      </div>
    </PlatformFrame>
  );
}

/**
 * Bekleme turu. Herkes tam WAIT sn bekler; WAIT. saniyede şirket yanıtı sunucudan istenir (koşul istemcide tutulmaz):
 * ret/sahte → mesaj gelir, ghosting → hiçbir şey olmaz. Devam düğmesi her koşulda WAIT+READ. saniyede açılır.
 */
export function RoundWaitStep({ step, view, done }: StepProps) {
  const { fast } = useRunner();
  const WAIT = t('roundWait', fast);
  const READ = t('roundRead', fast);
  const key = step.adKey as AdKey;
  const ad = ADS[key];
  const i = (step.round ?? 1) - 1;
  const t0 = useRef(performance.now());
  const [apps, setApps] = useState<AppRow[]>(() => [{ key, when: `Bugün ${nowClock()}`, status: 'pending' }, ...view.apps]);
  const [left, setLeft] = useState(WAIT);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState<null | { time: string; adStatus: 'open' | 'closed' }>(null);
  const asked = useRef(false);
  const { block, check, hasMissing } = useSurvey(step.items);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      const s = (performance.now() - t0.current) / 1000;
      setLeft(WAIT - s);
      if (!asked.current && s >= WAIT) {
        asked.current = true;
        api.companyResponse(view.code, step.id, s).then((r) => {
          if (r.deliver) {
            setApps((a) => a.map((x, j) => (j === 0 ? { ...x, status: 'rejected' } : x)));
            setMsg({ time: nowClock(), adStatus: r.adStatus });
          }
        }).catch(() => { /* bağlantı hatası: olay sunucuda kaydedilemedi; akış süresi korunur */ });
      }
      if (s >= WAIT + READ) { setReady(true); clearInterval(iv); }
    }, 200);
    return () => clearInterval(iv);
  }, [WAIT, READ, step.id, view.code]);

  return (
    <PlatformFrame active="basvurular" badge={msg ? 1 : 0}>
      <div className="py-5 pb-10">
        <div className="mb-3.5"><SuccessAlert><b>Başvurunuz {ad.co} şirketine iletildi.</b> 60 saniye içinde yanıt verilecektir. <span className="font-mono text-[13px] text-p-muted" id="tm">{mmss(left)}</span></SuccessAlert></div>
        {msg ? <CompanyMessage ad={ad} time={msg.time} bodyHtml={rejectionParagraphs(ad.title) + rejectionSignature(ad.co)} adStatusHtml={`<b>İlan durumu:</b> ${AD_STATUS_TEXT[msg.adStatus]}`} /> : null}
        <AppsBox apps={apps} />
        <form noValidate onSubmit={(e) => {
          e.preventDefault();
          if (!ready || busy) return;
          const out = check();
          if (!out) return;
          setBusy(true);
          done({ tur: i + 1, sirket: ad.co, bekleme_sn: r1(performance.now() - t0.current), ...out });
        }}>
          <ResearchPanel head="Araştırma ekranı · Bekleme süresince yanıtlayınız" headRight={`Başvurduğunuz ilan: ${ad.title}, ${ad.co}`}>
            {block}
            {hasMissing ? <div role="alert" className="mt-2.5 text-[13.5px] text-bad">Lütfen işaretlenmemiş soruları yanıtlayınız.</div> : null}
            <div className="mt-[18px] flex items-center justify-end gap-3">
              {!ready ? <span className="text-[13px] text-r-muted">Lütfen bekleyiniz…</span> : null}
              <RBtn disabled={!ready || busy}>Devam</RBtn>
            </div>
          </ResearchPanel>
        </form>
        {i === 0 ? <Note>{NOTES.roundWait(WAIT, READ, fast)}</Note> : null}
      </div>
    </PlatformFrame>
  );
}
