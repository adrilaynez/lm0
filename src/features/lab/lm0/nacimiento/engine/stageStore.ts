/* ─────────────────────────────────────────────
   LM0 v3 — engine/stageStore.ts
   Tiny external store bridging the scroll loop → React (v2 pattern).
   The loop writes THROTTLED snapshots (beat/gear/bucket/era changes);
   components read via useSyncExternalStore. Per-frame values (raw
   progress, dawn) NEVER pass through here — they go straight to the
   CSS variables --lm0-raw / --lm0-dawn on the stage element.
   ───────────────────────────────────────────── */

import { useSyncExternalStore } from "react";

import type { Beat } from "./progressMap";

export interface StageState {
  /** spine mounted and measuring. */
  ready: boolean;
  beat: Beat;
  gear: 0 | 1 | 2;
  bucket: number;
  eraIdx: number;
}

const INITIAL: StageState = {
  ready: false,
  beat: "hero",
  gear: 0,
  bucket: 0,
  eraIdx: 0,
};

export interface StageStore {
  get(): StageState;
  set(next: StageState): void;
  subscribe(cb: () => void): () => void;
}

export function createStageStore(): StageStore {
  let state = INITIAL;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next) {
      if (
        next.ready === state.ready &&
        next.beat === state.beat &&
        next.gear === state.gear &&
        next.bucket === state.bucket &&
        next.eraIdx === state.eraIdx
      ) {
        return;
      }
      state = next;
      for (const cb of listeners) cb();
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

export function useStage(store: StageStore): StageState {
  return useSyncExternalStore(store.subscribe, store.get, () => INITIAL);
}
