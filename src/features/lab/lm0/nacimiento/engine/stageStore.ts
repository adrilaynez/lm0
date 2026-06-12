/* ─────────────────────────────────────────────
   LM0 v3 — engine/stageStore.ts
   Tiny external store bridging the scroll loop → React (v2 pattern).
   The loop writes THROTTLED snapshots (beat/gear/bucket changes);
   components read via useSyncExternalStore. Per-frame values (raw
   progress, dawn) NEVER pass through here — they go straight to the
   CSS variables --lm0-raw / --lm0-dawn on the stage element.
   ───────────────────────────────────────────── */

import { useSyncExternalStore } from "react";

import type { Beat } from "./progressMap";

export type DialogChoice = "yes" | "no" | "skip" | null;

export interface StageState {
  /** spine mounted and fonts measured. */
  ready: boolean;
  beat: Beat;
  gear: 0 | 1 | 2;
  bucket: number;
  caminoPhase: 0 | 1 | 2 | 3;
  /** the visitor's sí/no answer (written by the Dialogue component). */
  dialogChoice: DialogChoice;
}

const INITIAL: StageState = {
  ready: false,
  beat: "hero",
  gear: 0,
  bucket: 0,
  caminoPhase: 0,
  dialogChoice: null,
};

export interface StageStore {
  get(): StageState;
  set(next: StageState): void;
  patch(partial: Partial<StageState>): void;
  subscribe(cb: () => void): () => void;
}

export function createStageStore(): StageStore {
  let state = INITIAL;
  const listeners = new Set<() => void>();
  const store: StageStore = {
    get: () => state,
    set(next) {
      if (
        next.ready === state.ready &&
        next.beat === state.beat &&
        next.gear === state.gear &&
        next.bucket === state.bucket &&
        next.caminoPhase === state.caminoPhase &&
        next.dialogChoice === state.dialogChoice
      ) {
        return;
      }
      state = next;
      for (const cb of listeners) cb();
    },
    patch(partial) {
      store.set({ ...state, ...partial });
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
  return store;
}

export function useStage(store: StageStore): StageState {
  return useSyncExternalStore(store.subscribe, store.get, () => INITIAL);
}
