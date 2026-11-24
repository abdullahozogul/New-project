'use client';
/* Modül B – Çalışma 2 e-posta takipli deneye özgü ekranlar (referans chooseAds, apply, confirmation, inbox, jump). */
import { useEffect, useRef, useState } from 'react';
import { ADS, CHOICE_ADS, type AdKey } from '@/protocol/ads';
import { appNoFor, DATES, SAMPLE_CONTACT, type Mail, type MailboxStage } from '@/protocol/emails';
import { NOTES, PART1_DONE } from '@/protocol/texts';
import { api } from '../api';
import { useRunner } from '../RunnerContext';
import { AppsBox, ApplyForm, Crumbs, JobDetail, JobMeta, SuccessAlert, adLogo } from '@/components/platform/Platform';
import { Note, RBtn, ResearchPanel, useSurvey } from '@/components/research/Research';
import { Icon } from '@/components/Icon';
import { PlatformFrame, type StepProps } from './common';

const r1 = (ms: number) => Math.round(ms / 100) / 10;

export function ChooseAdsStep({ step, done }: StepProps) {
  const t0 = useRef(performance.now());
  const { block, check, hasMissing } = useSurvey(step.items);
  const [busy, setBusy] = useState(false);
  return (
    <PlatformFrame active="ilanlar" q="editör yardımcısı">
      <div className="py-5 pb-10">
        <Crumbs parts={['İş İlanları', 'Arama sonuçları · 3 ilan']} />
        <div className="flex flex-col rounded-md border border-p-line bg-white">
          {CHOICE_ADS.map((k, i) => { const a = ADS[k]; return (
            <div key={k} className={`flex items-start gap-3.5 px-[18px] py-4 ${i ? 'border-t border-p-line' : ''}`}>
              {adLogo(a)}
              <div className="min-w-0 flex-1">
                <p className="m-0 text-base font-[650] text-p-accent">{a.title}</p>
                <p className="mb-1 mt-px">{a.co}</p>
                <JobMeta />
                <details className="mt-2 [&[open]>summary_svg]:rotate-90">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-semibold text-p-accent"><Icon name="chevronRight" size={14} className="transition-transform" />İlan ayrıntılarını göster</summary>
                  <div className="mt-2.5"><JobDetail ad={a} bare /></div>
                </details>
              </div>
            </div>
          ); })}
        </div>
        <form noValidate onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          const out = check();
          if (!out) return;
          setBusy(true);
          done({ ...out, rt_sn: r1(performance.now() - t0.current) });
        }}>
          <ResearchPanel head="Araştırma ekranı" headRight="Üç ilanı kısaca değerlendiriniz">
            {block}
            {hasMissing ? <div role="alert" className="mt-2.5 text-[13.5px] text-bad">Lütfen işaretlenmemiş soruları yanıtlayınız.</div> : null}
            <div className="mt-[18px] flex justify-end"><RBtn disabled={busy}>Seçtiğim ilana başvur</RBtn></div>
          </ResearchPanel>
        </form>
        <Note>{NOTES.chooseAds}</Note>
      </div>
    </PlatformFrame>
  );
}

export function ApplyBStep({ view, done }: StepProps) {
  const ad = ADS[view.chosenAd as AdKey];
  const [name, setName] = useState(view.isTest ? SAMPLE_CONTACT.name : '');
  const [email, setEmail] = useState(view.isTest ? SAMPLE_CONTACT.email : '');
  const [ok, setOk] = useState(false);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const inputCls = 'w-full rounded border border-[#b9c2ce] bg-white px-2.5 py-2 focus:border-p-accent focus:outline-none focus:ring-2 focus:ring-p-accent-soft';
  return (
    <PlatformFrame active="ilanlar">
      <div className="py-5 pb-10">
        <Crumbs parts={['İş İlanları', ad.title, 'Başvuru']} />
        <div className="rounded-md border border-p-line bg-white px-[22px] py-5 max-[520px]:p-4">
          <ApplyForm ad={ad} extraValid={ok && name.trim().length > 0 && emailOk}
            before={<>
              <div className="mb-3.5 flex flex-col gap-1"><label htmlFor="nm" className="text-sm font-semibold">Ad soyad</label><input id="nm" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>
              <div className="mb-3.5 flex flex-col gap-1"><label htmlFor="em" className="text-sm font-semibold">E-posta</label><input id="em" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /><div className="text-[12.5px] text-p-muted">Başvurunuzla ilgili bildirimler bu adrese gönderilir.</div></div>
            </>}
            beforeSend={<label className="mb-3.5 flex items-start gap-2 text-sm"><input type="checkbox" id="ok" className="mt-1 accent-p-accent" checked={ok} onChange={(e) => setOk(e.target.checked)} /> <span>Bilgilerimin doğru olduğunu onaylıyorum.</span></label>}
            onSend={(txt) => done({ not_uzunluk: txt.length, ad_soyad: name.trim(), eposta: email.trim() })} />
        </div>
        <Note>{NOTES.applyB}</Note>
      </div>
    </PlatformFrame>
  );
}

export function ConfirmBStep({ view, done }: StepProps) {
  const ad = ADS[view.chosenAd as AdKey];
  const [busy, setBusy] = useState(false);
  return (
    <PlatformFrame active="basvurular">
      <div className="py-5 pb-10">
        <div className="mb-3.5"><SuccessAlert><b>Başvurunuz alındı.</b> {ad.co} şirketine yaptığınız başvuru iletildi. Başvuru numaranız: <b>{appNoFor(view.chosenAd as AdKey)}</b>. Onay e-postası {view.recipient?.email} adresine gönderildi.</SuccessAlert></div>
        <AppsBox apps={[{ key: view.chosenAd as AdKey, when: DATES.appsWhen, status: 'pending' }]} />
        <ResearchPanel head="Araştırma ekranı">
          <div className="pt-3.5">
            <p className="mb-1.5"><b>{PART1_DONE.title}</b> Teşekkür ederiz.</p>
            <p className="m-0 text-[13px] text-r-muted">{PART1_DONE.sub}</p>
          </div>
        </ResearchPanel>
        <SimBar text="Bu sürümde e-posta kutunuz uygulama içinde canlandırılır." action="E-posta kutusuna bak" disabled={busy} onClick={() => { setBusy(true); done({}); }} />
        <Note>{NOTES.confirmB}</Note>
      </div>
    </PlatformFrame>
  );
}

/** Simülasyon denetimi: gerçek e-posta modunda gerçek zaman geçer; simülasyonda katılımcı zamanı buradan ilerletir. Metin üç koşulda aynıdır. */
function SimBar({ text, action, onClick, disabled }: { text: string; action: string; onClick: () => void; disabled?: boolean }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-dashed border-[#b7c0cc] bg-white px-4 py-3 text-[13.5px] text-p-muted" data-testid="sim-bar">
      <span className="inline-flex items-center gap-1.5 rounded bg-d-bg px-2 py-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-d-hl"><Icon name="clock" size={13} />Simülasyon</span>
      <span className="flex-1">{text}</span>
      <button type="button" id="next" disabled={disabled} onClick={onClick} className="inline-flex items-center gap-1.5 rounded bg-d-bg px-3.5 py-2 text-[13.5px] font-semibold text-white disabled:opacity-50">{action}<Icon name="arrowRight" size={15} /></button>
    </div>
  );
}

const FOLDERS: [string, string][] = [['inbox', 'Gelen Kutusu'], ['star', 'Yıldızlı'], ['clock', 'Ertelenenler'], ['send', 'Gönderilmiş'], ['file', 'Taslaklar'], ['alert', 'İstenmeyen']];

/**
 * E-posta istemcisi (Gmail benzeri yerleşim, nötr "Posta" markası). İçerik sunucudan gelir;
 * şirket ve araştırma e-postaları farklı gönderen ad/adres/renk ile açıkça ayrıdır.
 */
export function InboxStep({ step, view, done }: StepProps) {
  const stage = step.mailbox as MailboxStage;
  const { view: v } = useRunner();
  const [box, setBox] = useState<null | { mails: Mail[]; fresh: string | null; clock: string; recipient: string }>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const t0 = useRef(performance.now());

  useEffect(() => {
    api.mailbox(view.code, stage).then(setBox).catch((e) => setErr(String(e.message || e)));
    window.scrollTo(0, 0);
  }, [view.code, stage]);

  const open = (id: string) => {
    setOpenId(id);
    setBox((b) => (b ? { ...b, mails: b.mails.map((m) => (m.id === id ? { ...m, unread: false } : m)) } : b));
    void api.event(view.code, 'mail_open', step.id, { mailId: id });
    window.scrollTo(0, 0);
  };
  const finish = (extra: Record<string, unknown> = {}) => { if (!busy) { setBusy(true); done({ rt_sn: r1(performance.now() - t0.current), ...extra }); } };

  const mails = box ? box.mails.slice().reverse() : [];
  const unread = mails.filter((m) => m.unread).length;
  const m = openId && box ? box.mails.find((x) => x.id === openId) : null;
  const next = stage === 'd1' ? '14 gün ileri sar' : stage === 'd14a' ? "Saat 14:00'e ilerle" : null;
  const note = stage === 'd1' ? NOTES.inboxD1 : stage === 'd14b' ? NOTES.d14b : v?.condition === 'ghosting' ? NOTES.d14aGhosting : v?.condition === 'sahte' ? NOTES.d14aSahte : NOTES.d14aRet;

  return (
    <div className="min-h-dvh bg-m-bg">
      <header className="border-b border-m-line bg-white">
        <div className="wrap flex min-h-14 flex-wrap items-center gap-4 py-1.5">
          <span className="flex items-center gap-2 text-[19px] text-[#3c4350]"><Icon name="menu" size={20} className="text-[#5b6370] max-[860px]:hidden" /><Icon name="mail" size={24} className="text-m-accent" />Posta</span>
          <span className="flex min-w-[160px] max-w-[560px] flex-1 items-center gap-2 rounded-full bg-[#eef2f7] px-4 py-2 text-sm text-[#6b7380]"><Icon name="search" size={16} />Postalarda ara</span>
          <span className="ml-auto text-right text-[13px] text-[#5b6370]">Simüle edilen zaman<br /><b className="tabular-nums text-p-ink" data-testid="sim-clock">{box?.clock ?? '…'}</b></span>
        </div>
      </header>
      <div className="wrap grid grid-cols-[200px_minmax(0,1fr)] pb-10 pt-3 max-[860px]:grid-cols-1">
        <div className="max-[860px]:hidden">
          <span className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-[#c2e7ff] px-5 py-3.5 font-semibold text-[#001d35]"><Icon name="pencil" size={18} />Yeni ileti</span>
          <ul className="pr-2.5 pt-1 text-sm">
            {FOLDERS.map(([ic, label], i) => (
              <li key={label} className={`flex items-center justify-between rounded-r-2xl px-3 py-1.5 ${i === 0 ? 'bg-m-sel font-bold text-m-unread' : 'text-[#3c4350]'}`}>
                <span className="flex items-center gap-3"><Icon name={ic as never} size={17} />{label}</span>{i === 0 && unread ? <span className="text-xs" data-testid="unread-count">{unread}</span> : null}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0">
          {next ? <div className="mb-3"><SimBar text="Bu sürümde zaman uygulama içinde ilerletilir." action={next} disabled={!box || busy} onClick={() => finish()} /></div> : null}
          <div className="min-w-0 overflow-hidden rounded-lg border border-m-line bg-white" id="pane">
            {err ? <p className="p-4 text-bad">{err}</p> : !box ? <p className="p-4 text-p-muted">Yükleniyor…</p> : m ? (
              <div className="px-6 pb-[26px] pt-[18px] max-[520px]:px-4">
                <button type="button" onClick={() => setOpenId(null)} className="mb-3 inline-flex items-center gap-1.5 font-semibold text-m-accent"><Icon name="arrowLeft" size={16} />Gelen Kutusu</button>
                <h2 className="mb-3.5 text-[21px] font-medium [text-wrap:balance]" data-testid="mail-subject">{m.subj}</h2>
                <div className="mb-[18px] flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full font-semibold text-white" style={{ background: m.color }}>{m.ini}</span>
                  <div className="min-w-0"><div className="font-semibold">{m.name}</div><div className="break-all text-[13px] text-[#6b7380]">&lt;{m.addr}&gt; · Alıcı: {box.recipient}</div></div>
                  <span className="ml-auto whitespace-nowrap text-[12.5px] text-[#6b7380]">{m.date ?? m.time}</span>
                </div>
                <div className="m-text max-w-[640px] text-[14.5px]">
                  <MailBody html={m.body} withLink={!!m.hasResearchLink} onLink={() => { void api.event(view.code, 'link_click', step.id, { mailId: m.id }); finish({ baglanti_tiklandi: true }); }} busy={busy} />
                  {m.sig ? <div className="mt-4 border-t border-[#eef1f4] pt-2.5 text-[13.5px] text-[#4a5260]" dangerouslySetInnerHTML={{ __html: m.sig }} /> : null}
                  {m.adstatus ? <div className="mt-3.5 rounded border border-m-line bg-m-bg px-3 py-2 text-[13.5px]" data-testid="ad-status" dangerouslySetInnerHTML={{ __html: m.adstatus }} /> : null}
                  {m.foot ? <div className="mt-3.5 text-xs text-[#7b8390]">{m.foot}</div> : null}
                </div>
              </div>
            ) : (
              <div role="list">
                {mails.map((x) => (
                  <button key={x.id} type="button" role="listitem" data-id={x.id} onClick={() => open(x.id)}
                    className={`grid w-full cursor-pointer grid-cols-[200px_minmax(0,1fr)_92px] items-baseline gap-3 border-b border-[#eef1f4] px-4 py-2.5 text-left text-sm hover:shadow-[inset_0_-1px_0_#d6dce4,inset_0_1px_0_#d6dce4] max-[860px]:grid-cols-[minmax(0,1fr)_70px] max-[860px]:gap-y-0.5 ${x.unread ? 'bg-white font-bold text-m-unread' : 'bg-m-bg text-[#3c4350]'} ${box.fresh === x.id && x.unread ? 'm-row-fresh' : ''}`}>
                    <span className="truncate max-[860px]:col-start-1 max-[860px]:row-start-1">{x.name}</span>
                    <span className="truncate max-[860px]:col-span-2 max-[860px]:row-start-2">{x.subj} <span className="font-normal text-[#6b7380]">– {x.snip}</span></span>
                    <span className="text-right text-[12.5px] tabular-nums max-[860px]:col-start-2 max-[860px]:row-start-1">{x.time}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Note>{note}</Note>
        </div>
      </div>
    </div>
  );
}

/** E-posta gövdesi; araştırma bağlantısı yer tutucusunun yerine düğme konur. */
function MailBody({ html, withLink, onLink, busy }: { html: string; withLink: boolean; onLink: () => void; busy: boolean }) {
  if (!withLink) return <div dangerouslySetInnerHTML={{ __html: html }} />;
  const [a, b] = html.split('<p data-research-link></p>');
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: a }} />
      <p className="mb-3"><button type="button" id="golink" disabled={busy} onClick={onLink} className="inline-block rounded-[3px] bg-r-accent px-[18px] py-2.5 font-semibold text-white disabled:opacity-60">İkinci bölüme başla</button></p>
      <div dangerouslySetInnerHTML={{ __html: b ?? '' }} />
    </>
  );
}

export function JumpStep({ done }: StepProps) {
  const head = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
  const { y, m, d } = DATES.calendarStart;
  const days = Array.from({ length: 21 }, (_, i) => new Date(y, m, d + i));
  const [busy, setBusy] = useState(false);
  const t0 = useRef(performance.now());
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-dvh bg-r-bg text-r-ink">
      <div className="mx-auto max-w-[560px] px-4 py-[60px] text-center">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[.06em] text-r-muted">Zaman atlaması</p>
        <h2 className="mb-1.5 text-2xl font-semibold">14 gün sonra</h2>
        <Note>{NOTES.jump}</Note>
        <div className="my-[18px] inline-grid grid-cols-[repeat(7,36px)] gap-1 text-[13px] tabular-nums" aria-label="Takvim">
          {head.map((h) => <div key={h} className="grid h-8 place-items-center font-semibold text-[#3c4350]">{h}</div>)}
          {days.map((dt) => {
            const day = dt.getDate(); const mo = dt.getMonth();
            const isD1 = mo === 10 && day === 24; const isD14 = mo === 11 && day === 7;
            const mid = (mo === 10 && day > 24) || (mo === 11 && day < 7);
            return <div key={dt.toISOString()} className={`grid h-8 place-items-center rounded border ${isD1 || isD14 ? 'border-d-bg bg-d-bg text-white' : mid ? 'border-m-line bg-[#eef2f7] text-p-ink' : 'border-m-line bg-white text-[#6b7380]'}`}>{day}</div>;
          })}
        </div>
        <p className="text-[13px] text-r-muted">1. gün: {DATES.DAY1} · 14. gün: {DATES.DAY14}</p>
        <div className="mt-[18px] flex justify-center"><RBtn type="button" id="go" disabled={busy} onClick={() => { setBusy(true); done({ rt_sn: r1(performance.now() - t0.current) }); }}>14. gün, saat 11:30&apos;a geç</RBtn></div>
      </div>
    </div>
  );
}
