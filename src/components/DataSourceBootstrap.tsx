import { useEffect } from "react";
import { applyRemoteModels, setLastRefreshedAt } from "@/services/dataSource";
import { fetchRemoteDataset } from "@/lib/modelsRemote";

/**
 * On load, try the Supabase `models` table first. If it is empty (first run)
 * or unreachable, the bundled data.json snapshot stays active so every page
 * always has data to show.
 */
export function DataSourceBootstrap() {
  useEffect(() => {
    let cancelled = false;
    fetchRemoteDataset()
      .then((dataset) => {
        if (cancelled) return;
        applyRemoteModels(dataset.models, dataset.lastRefreshedAt);
        setLastRefreshedAt(dataset.lastRefreshedAt);
      })
      .catch((error) => {
        console.warn("[ModelPulse] Falling back to the bundled snapshot:", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
