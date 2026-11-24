'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ADS, BEHAVIOR_AD, BEHAVIOR_SIDE, FILLER_AD } from '@/protocol/ads';
import { COND_LABEL } from '@/protocol/conditions';
import { PROGRESS } from '@/protocol/progress';
import { CONSENT_ACCEPT, FILLER_ITEMS, JSSE_INSTR, whoText } from '@/protocol/scales';
import { CONSENT_A_HTML, CONSENT_B_HTML, NOTES, debriefExtraA, debriefExtraB, debriefHtml, THANKS_A, THANKS_B } from '@/protocol/texts';
import { t } from '@/protocol/timing';
import { STAGES_B, type StepDef } from '../steps';
import type { ParticipantView } from '../types';
import { api } from '../api';
import { useRunner } from '../RunnerContext';
import { AppsTable, ApplyForm, Btn, Crumbs, JobDetail, PlatformHeader, SideSimilar, SuccessAlert } from '@/components/platform/Platform';
import { Note, RBtn, ResearchCard, ResearchPage, ResearchPanel, ResearchShell, useHold } from '@/components/research/Research';
import { Icon } from '@/components/Icon';

export type Done = (data: Record<string, unknown>) => void;
export interface StepProps { step: StepDef; view: ParticipantView; done: Done }

/* ---------------- Test şeridi (yalnızca araştırmacı test kaydı) ---------------- */
export function DemoBar({ extra, onToggleNotes, onReset, stage }: { extra?: ReactNode; onToggleNotes: () => void; onReset: () => void; stage?: string }) {
  const { view, showNotes, fast } = useRunner();
  if (!view?.isTest) return null;
  const idx = STAGES_B.findIndex((s) => s[0] === stage);
  return (
    <>
      <div className="bg-d-bg text-[12.5px] text-d-ink" data-testid="demo-bar">
        <div className="wrap flex flex-wrap items-center gap-x-4 gap-y-1.5 py-[7px]">
          <b className="font-semibold tracking-[.04em] text-d-hl">TEST KAYDI</b>
          <span>Koşul: <span data-testid="demo-condition">{view.condition ? COND_LABEL[view.condition] : '—'}</span>{view.assignment === 'blok' ? ' (bloklu rastgele atandı)' : ' (elle seçildi)'}</span>
          {fast ? <span>Süreler kısaltıldı</span> : null}
          {extra}
          <span className="flex-1" />
          <button type="button" onClick={onToggleNotes} className="rounded border border-[#555b63] px-2 py-0.5 text-xs">{showNotes ? 'Notları gizle' : 'Notları göster'}</button>
          <button type="button" onClick={onReset} className="rounded border border-[#555b63] px-2 py-0.5 text-xs">Baştan başlat</button>
        </div>
      </div>
      {view.module === 'B' && stage ? (
        <div className="border-b border-m-line bg-white text-[12.5px]">
          <div className="wrap flex gap-1 overflow-x-auto py-1.5">
            {STAGES_B.map((s, i) => <span key={s[0]} className={`whitespace-nowrap rounded-xl px-2.5 py-[3px] ${i === idx ? 'bg-d-bg text-white' : i < idx ? 'text-p-ink' : 'text-[#6b7380]'}`}>{s[1]}</span>)}
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ---------------- Araştırma sayfası adımları ---------------- */
export function ResearchStep({ step, view, done }: StepProps) {
  const mod = view.module;
  const sing = mod === 'B';
  const pr = PROGRESS[mod];
  const base = pr.sonBase;
  const who = whoText(sing);
  const cfg: Record<string, Omit<React.ComponentProps<typeof ResearchPage>, 'items' | 'onDone'>> = {
    onam: {
      progress: pr.onam, title: 'Bilgilendirilmiş onam formu',
      pre: <><div className="prose-r rounded-[3px] border border-r-line bg-[#fafbfa] px-4 py-3.5 text-[14.5px]" dangerouslySetInnerHTML={{ __html: mod === 'A' ? CONSENT_A_HTML : CONSENT_B_HTML }} /><Note>{mod === 'A' ? NOTES.consentA : NOTES.consentB}</Note></>,
      validate: (o) => (o.onam !== null && o.onam !== undefined && o.onam !== CONSENT_ACCEPT ? ['onam'] : []),
    },
    demografi: { progress: pr.demografi, title: 'Hakkınızda', pre: <Note>{mod === 'A' ? NOTES.demoA : NOTES.demoB}</Note> },
    on_jsse: { progress: pr.on_jsse, section: 'Ön ölçüm', title: 'İş arama konusundaki güveniniz', lead: JSSE_INSTR, pre: <Note>{NOTES.jsse(true)}</Note> },
    son_pa: { progress: base, section: 'Son ölçüm', title: 'İşe alım süreci', lead: `Aşağıdaki soruları ${who} düşünerek yanıtlayınız.`, pre: <Note>{NOTES.proc}</Note> },
    son_ba: { progress: base + 0.06, section: 'Son ölçüm', title: 'Şirketin sizinle iletişimi', lead: `Aşağıdaki soruları ${who} yürüten kişileri düşünerek yanıtlayınız.`, pre: <Note>{NOTES.info}</Note> },
    son_jsse: { progress: base + 0.12, section: 'Son ölçüm', title: 'İş arama konusundaki güveniniz', lead: JSSE_INSTR, pre: <Note>{NOTES.jsse(false)}</Note> },
    son_dn: { progress: base + 0.18, section: 'Son ölçüm', title: 'İş aramaya ilişkin planlarınız', lead: 'Aşağıdaki ifadelere ne ölçüde katıldığınızı belirtiniz.', pre: <Note>{NOTES.cont}</Note> },
    son_mk: { progress: base + 0.24, section: 'Son ölçüm', title: 'Yaşadığınız süreç', pre: <Note>{NOTES.manip}</Note> },
    suphe: { progress: PROGRESS.A.suphe, title: 'Son bir soru', pre: <Note>{NOTES.suspicionA}</Note> },
    son_sorular: { progress: PROGRESS.B.son_sorular, section: 'Son ölçüm', title: 'Son sorular', pre: <Note>{NOTES.finalB}</Note> },
  };
  const c = cfg[step.id];
  if (!c) return <p>Bilinmeyen adım: {step.id}</p>;
  return <ResearchPage {...c} items={step.items} onDone={(out) => done(out)} />;
}

/* ---------------- Platform çerçevesi ---------------- */
export function PlatformFrame({ children, active, q, badge, demo }: { children: ReactNode; active?: 'ilanlar' | 'basvurular' | 'mesajlar'; q?: string; badge?: number; demo?: ReactNode }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-dvh bg-p-bg">
      {demo}
      <PlatformHeader active={active} q={q} badge={badge} inert />
      <div className="wrap">{children}</div>
    </div>
  );
}

/* ---------------- Davranış görevi (referans behaviorTask) ---------------- */
export function BehaviorStep({ step, view, done, demo }: StepProps & { demo?: ReactNode }) {
  const { fast } = useRunner();
  const MIN = t('behaviorMin', fast);
  const ad = ADS[BEHAVIOR_AD];
  const filler = ADS[FILLER_AD];
  const t0 = useRef(performance.now());
  const [path, setPath] = useState<null | 'basvur' | 'gec'>(null);
  const [tChoice, setTChoice] = useState(0);
  const [sentLen, setSentLen] = useState<number | null>(null);
  const progress = PROGRESS[view.module].davranis;
  const where = view.module === 'A' ? NOTES.behaviorWhereA : NOTES.behaviorWhereB;
  const karar = () => Math.round((tChoice - t0.current) / 100) / 10;

  const choose = (c: 'basvur' | 'gec') => {
    const now = performance.now();
    setTChoice(now);
    setPath(c);
    void api.event(view.code, 'behavior_choice', step.id, { secim: c, karar_sn: Math.round((now - t0.current) / 100) / 10 });
  };

  if (path === 'gec') {
    return (
      <>
        {demo}
        <ResearchPage progress={progress} section="İlan değerlendirme" title="Bir ilanı değerlendirin" lead="Aşağıdaki ilanı okuyup soruları yanıtlayınız."
          pre={<><div className="mb-3.5 mt-1.5"><JobDetail ad={filler} /></div><Note>{NOTES.filler}</Note></>}
          items={FILLER_ITEMS} minSec={MIN}
          onDone={(r) => done({ davranis: 'gec', karar_sn: karar(), ...r })} />
      </>
    );
  }
  if (path === 'basvur') {
    return (
      <PlatformFrame active="ilanlar" demo={demo}>
        <div className="py-5 pb-10">
          <Crumbs parts={['İş İlanları', ad.title, 'Başvuru']} />
          <div className="rounded-md border border-p-line bg-white px-[22px] py-5 max-[520px]:p-4" id="formbox">
            {sentLen === null ? (
              <ApplyForm ad={ad} onSend={(txt) => setSentLen(txt.length)} />
            ) : (
              <>
                <SuccessAlert><b>Başvurunuz {ad.co} şirketine iletildi.</b> Başvurunuzun durumunu Başvurularım sayfasından takip edebilirsiniz.</SuccessAlert>
                <div className="mt-3.5"><AppsTable apps={[{ key: BEHAVIOR_AD, when: 'Bugün', status: 'new' }]} /></div>
              </>
            )}
          </div>
          {sentLen !== null ? <HoldContinue since={tChoice} minSec={MIN} onGo={() => done({ davranis: 'basvur', karar_sn: karar(), not_uzunluk: sentLen })} /> : null}
        </div>
      </PlatformFrame>
    );
  }
  return (
    <PlatformFrame active="ilanlar" demo={demo}>
      <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-5 py-5 pb-10 max-[860px]:grid-cols-1">
        <div className="min-w-0">
          <div className="mb-3.5 flex items-start gap-3 rounded border border-p-line border-l-4 border-l-p-accent bg-white px-3.5 py-3 font-semibold">
            <Icon name="sparkle" size={18} className="mt-0.5 text-p-accent" />
            <div>Platformda size uygun yeni bir ilan var.<small className="block font-normal text-p-muted">Profilinize ve önceki başvurularınıza göre önerildi.</small></div>
          </div>
          <JobDetail ad={ad} actions={<><Btn id="b_apply" onClick={() => choose('basvur')}>Başvur</Btn><Btn ghost id="b_skip" onClick={() => choose('gec')}>Geç</Btn></>} />
          <Note>{NOTES.behavior(where, MIN)}</Note>
        </div>
        <aside className="min-w-0"><SideSimilar keys={BEHAVIOR_SIDE} /></aside>
      </div>
    </PlatformFrame>
  );
}

export function HoldContinue({ since, minSec, onGo }: { since: number; minSec: number; onGo: () => void }) {
  const ready = useHold(minSec, since);
  const [busy, setBusy] = useState(false);
  return (
    <ResearchPanel head="Araştırma ekranı">
      <div className="mt-[18px] flex items-center justify-end gap-3">
        {!ready ? <span className="text-[13px] text-r-muted">Lütfen bekleyiniz…</span> : null}
        <RBtn type="button" id="beh_go" disabled={!ready || busy} onClick={() => { if (ready && !busy) { setBusy(true); onGo(); } }}>Devam</RBtn>
      </div>
    </ResearchPanel>
  );
}

/* ---------------- Bilgilendirme ---------------- */
export function DebriefStep({ view, done }: StepProps) {
  const cond = view.condition;
  if (!cond) return <ResearchShell progress={1}><ResearchCard>Yükleniyor…</ResearchCard></ResearchShell>;
  const extra = view.module === 'A' ? debriefExtraA(cond) : debriefExtraB(cond, view.chosenAd ? ADS[view.chosenAd].co : '');
  return (
    <ResearchPage progress={1} section="Bilgilendirme" title="Çalışmanın amacı hakkında bilgilendirme"
      pre={<div className="prose-r" dangerouslySetInnerHTML={{ __html: debriefHtml(extra) }} />}
      items={[]} button="Çalışmayı bitir" onDone={(r) => done({ rt_sn: r.rt_sn })} />
  );
}

export function ThanksScreen({ view }: { view: ParticipantView }) {
  return (
    <ResearchShell progress={1}>
      <ResearchCard>
        <h2 className="mb-1.5 text-[19px] font-[650]">Teşekkür ederiz</h2>
        <p>{view.module === 'A' ? THANKS_A : THANKS_B}</p>
        {view.isTest ? <p className="mt-3 text-[13px] text-r-muted">Test kaydı tamamlandı. Kaydedilen veriler araştırmacı panelinde katılımcı ayrıntısında görüntülenebilir.</p> : null}
      </ResearchCard>
    </ResearchShell>
  );
}
