'use client';
import { createContext, useContext } from 'react';
import type { ParticipantView } from './types';

export interface RunnerCtx {
  view: ParticipantView | null;
  showNotes: boolean;
  fast: boolean;
}
export const RunnerContext = createContext<RunnerCtx>({ view: null, showNotes: false, fast: false });
export const useRunner = () => useContext(RunnerContext);
