'use client';
/**
 * Deney yürütücüsü. jsPsych zaman çizelgesi modelinin karşılığı: sıradaki adımı çizer, adım bittiğinde
 * tek veri satırını sunucuya gönderir; sunucu sırayı ve veriyi doğrular. Tekrar girişte kaldığı adımdan
 * (yarım kalan adım baştan) devam eder.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MODULE_LABEL } from '@/protocol/conditions';
import { FLOW_A, FLOW_B, STUDY_HEADER } from '@/protocol/texts';
import { t } from '@/protocol/timing';
import { stepsFor, stepLabel, type StepDef } from './steps';
import type { ParticipantView } from './types';
import { api } from './api';
import { RunnerContext } from './RunnerContext';
import { BehaviorStep, DebriefStep, DemoBar, ResearchStep, ThanksScreen, type Done } from './screens/common';
import { IntroStep, RoundAdStep, RoundApplyStep, RoundWaitStep } from './screens/moduleA';
import { ApplyBStep, ChooseAdsStep, ConfirmBStep, InboxStep, JumpStep } from './screens/moduleB';
import { RBtn, ResearchCard, ResearchShell } from '@/components/research/Research';

export default function Runner({ initial }: { initial: ParticipantView }) {
  const [view, setView] = useState<ParticipantView>(initial);
  const [entered, setEntered] = useState(false);
  const [showNotes, setShowNotes] = useState(initial.showNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<null | (() => Promise<void>)>(null);
  const stepStart = useRef<string>(new Date().toISOString());

  const steps = useMemo<StepDef[]>(() => stepsFor(view.module, view.roundOrder), [view.module, view.roundOrder]);
  const step = steps[view.stepIndex];
  const fast = view.isTest && view.fastMode;

  // Adım görüntülenme kaydı ve sekme görünürlüğü (veri kalitesi için).
  useEffect(() => {
    if (!entered || !step || view.status !== 'devam') return;
    stepStart.current = new Date().toISOString();
    void api.event(view.code, 'step_view', step.id);
  }, [entered, step, view.code, view.status]);
  useEffect(() => {
    if (!entered) return;
    const h = () => void api.event(view.code, document.hidden ? 'page_hidden' : 'page_visible', step?.id ?? null);
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, [entered, view.code, step?.id]);

  const done: Done = useCallback((data) => {
    if (!step) return;
    const run = async () => {
      setSaving(true);
      setError(null);
      try {
        const next = await api.submit(view.code, step.id, data, stepStart.current);
        pending.current = null;
        setView(next);
      } catch (e) {
        pending.current = run;
        setError((e as Error).message || 'Kaydedilemedi');
      } finally {
        setSaving(false);
      }
    };
    void run();
  }, [step, view.code]);

  const enter = async () => {
    setError(null);
    try {
      const v = await api.start(view.code);
      setView(v);
      setEntered(true);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const reset = async () => {
    if (!confirm('Bu test kaydının tüm yanıtları silinip baştan başlanacak. Emin misiniz?')) return;
    await api.reset(view.code);
    location.reload();
  };

  const ctx = { view, showNotes, fast };
  const extra = step?.round ? <span>Tur {step.round} / {view.roundOrder?.length ?? 4}</span> : undefined;
  const demo = <DemoBar extra={extra} stage={step?.stage} onToggleNotes={() => setShowNotes((s) => !s)} onReset={reset} />;

  let body: React.ReactNode;
  if (view.status === 'iptal') {
    body = <Message title="Bu katılımcı kodu kullanılamıyor" text="Lütfen araştırma ekibiyle iletişime geçiniz." />;
  } else if (view.status === 'tamamlandi') {
    body = <ThanksScreen view={view} />;
  } else if (!entered) {
    body = <StartScreen view={view} onStart={enter} error={error} />;
  } else if (!step) {
    body = <Message title="Adım bulunamadı" text="Lütfen sayfayı yenileyiniz." />;
  } else {
    const p = { step, view, done };
    const k = `${step.id}`;
    switch (step.kind) {
      case 'research': body = <ResearchStep key={k} {...p} />; break;
      case 'intro': body = <IntroStep key={k} {...p} />; break;
      case 'roundAd': body = <RoundAdStep key={k} {...p} />; break;
      case 'roundApply': body = <RoundApplyStep key={k} {...p} />; break;
      case 'roundWait': body = <RoundWaitStep key={k} {...p} />; break;
      case 'behavior': body = <BehaviorStep key={k} {...p} />; break;
      case 'chooseAds': body = <ChooseAdsStep key={k} {...p} />; break;
      case 'applyB': body = <ApplyBStep key={k} {...p} />; break;
      case 'confirmB': body = <ConfirmBStep key={k} {...p} />; break;
      case 'inbox': body = <InboxStep key={k} {...p} />; break;
      case 'jump': body = <JumpStep key={k} {...p} />; break;
      case 'debrief': body = <DebriefStep key={k} {...p} />; break;
    }
  }

  return (
    <RunnerContext.Provider value={ctx}>
      <div data-step={entered ? step?.id : 'giris'} data-testid="runner">
        {view.isTest && view.status !== 'tamamlandi' ? demo : null}
        {body}
        {entered && (saving || error) ? (
          <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-3" role="status">
            <div className={`flex items-center gap-3 rounded-md px-4 py-2.5 text-sm shadow-lg ${error ? 'bg-bad text-white' : 'bg-d-bg text-d-ink'}`}>
              {error ? <>Yanıtınız kaydedilemedi: {error}<button type="button" className="rounded bg-white/15 px-2.5 py-1 font-semibold" onClick={() => pending.current?.()}>Tekrar dene</button></> : 'Kaydediliyor…'}
            </div>
          </div>
        ) : null}
      </div>
    </RunnerContext.Provider>
  );
}

function Message({ title, text }: { title: string; text: string }) {
  return <ResearchShell progress={0}><ResearchCard><h2 className="mb-1.5 text-[19px] font-[650]">{title}</h2><p>{text}</p></ResearchCard></ResearchShell>;
}

/** Deney başlangıç ekranı. Test kaydında referans kurulum ekranındaki akış özeti de gösterilir. */
function StartScreen({ view, onStart, error }: { view: ParticipantView; onStart: () => void; error: string | null }) {
  const resume = view.status === 'devam' && view.stepIndex > 0;
  const flow = view.module === 'A' ? FLOW_A : FLOW_B;
  const [busy, setBusy] = useState(false);
  const fast = view.isTest && view.fastMode;
  return (
    <ResearchShell progress={0}>
      <ResearchCard>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[.06em] text-r-muted">{resume ? 'Kaldığınız yerden devam' : 'Hoş geldiniz'}</p>
        <h2 className="mb-1.5 text-[19px] font-[650]">{STUDY_HEADER.name}</h2>
        <p className="mb-3 text-r-muted">{STUDY_HEADER.institution}</p>
        {resume ? (
          <p>Daha önce başladığınız çalışmaya kaldığınız yerden devam edeceksiniz. Yarım kalan ekran baştan gösterilir; daha önce verdiğiniz yanıtlar kaydedilmiştir.</p>
        ) : (
          <p>Başlamak için aşağıdaki düğmeyi kullanınız.</p>
        )}
        <p className="mt-2 text-[13px] text-r-muted">Katılımcı kodunuz: <b className="font-mono text-r-ink">{view.code}</b> — Çalışmaya ara verirseniz aynı kodla kaldığınız yerden devam edebilirsiniz.</p>
        {view.isTest ? (
          <div className="mt-4 rounded border border-note-line bg-note-bg px-4 py-3 text-[13.5px] text-note-ink" data-testid="test-setup">
            <p className="mb-1 font-semibold">Araştırmacı test kaydı · {MODULE_LABEL[view.module]}</p>
            <p className="mb-2">{flow.sub}</p>
            <p className="mb-1">Süreler: {fast ? `kısaltılmış (bekleme ${t('roundWait', true)} sn, davranış görevi ${t('behaviorMin', true)} sn)` : 'gerçek deney süreleri'} · Tasarım notları: {view.showNotes ? 'açık' : 'kapalı'}</p>
            <ol className="ml-5 list-decimal">{flow.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            {resume ? <p className="mt-2">Kalınan adım: {stepLabel(view.stepIds[view.stepIndex] ?? '')}</p> : null}
          </div>
        ) : null}
        {error ? <p role="alert" className="mt-3 text-[13.5px] text-bad">{error}</p> : null}
        <div className="mt-[18px] flex justify-end">
          <RBtn type="button" id="start" disabled={busy} onClick={async () => { setBusy(true); await onStart(); setBusy(false); }}>{resume ? 'Devam et' : 'Çalışmayı başlat'}</RBtn>
        </div>
      </ResearchCard>
    </ResearchShell>
  );
}
