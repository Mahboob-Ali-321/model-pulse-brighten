import { useSyncExternalStore } from "react";
import type { RawModel } from "@/types/model";
import { setRawOverride } from "@/services/modelService";

/**
 * Tiny store that tracks which dataset is currently active:
 * the bundled Bright Data snapshot, or fresh rows from the Supabase
 * `models` table. Bumping `version` lets pages recompute their memos.
 */
export type DataSourceKind = "snapshot" | "supabase";

export interface DataSourceState {
  version: number;
  source: DataSourceKind;
  lastRefreshedAt: string | null;
}

let state: DataSourceState = { version: 0, source: "snapshot", lastRefreshedAt: null };
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): DataSourceState {
  return state;
}

/** Activate live rows coming from Supabase. Ignored when the list is empty. */
export function applyRemoteModels(models: RawModel[], lastRefreshedAt: string | null): boolean {
  if (!models.length) return false;
  setRawOverride(models);
  state = {
    version: state.version + 1,
    source: "supabase",
    lastRefreshedAt: lastRefreshedAt ?? state.lastRefreshedAt,
  };
  emit();
  return true;
}

/** Record a refresh timestamp without swapping the dataset. */
export function setLastRefreshedAt(timestamp: string | null) {
  if (!timestamp || timestamp === state.lastRefreshedAt) return;
  state = { ...state, lastRefreshedAt: timestamp };
  emit();
}

export function useDataSource(): DataSourceState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Convenience: use as a dependency so memoised dataset reads recompute. */
export function useDataVersion(): number {
  return useDataSource().version;
}
