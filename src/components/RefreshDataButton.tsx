import { AlertTriangle, Database, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Tag } from "@/components/kit";
import { applyRemoteModels, setLastRefreshedAt, useDataSource } from "@/services/dataSource";
import { fetchRemoteDataset, triggerRefresh } from "@/lib/modelsRemote";

function formatTimestamp(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Triggers a live Bright Data scrape, then swaps the app over to the freshly
 * stored rows. On failure the previously loaded dataset stays on screen.
 */
export function RefreshDataButton() {
  const { source, lastRefreshedAt } = useDataSource();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 8000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function handleRefresh() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await triggerRefresh();
      if (!result.success) {
        setError(result.error ?? "The refresh failed. Showing the last known good data.");
        return;
      }
      const dataset = await fetchRemoteDataset();
      const applied = applyRemoteModels(dataset.models, result.lastRefreshedAt ?? dataset.lastRefreshedAt);
      setLastRefreshedAt(result.lastRefreshedAt ?? dataset.lastRefreshedAt);
      setNotice(
        applied
          ? `Updated ${dataset.models.length} models from Bright Data.`
          : "Refresh finished but no rows were returned — keeping the current data.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The refresh failed. Showing the last known good data.",
      );
    } finally {
      setBusy(false);
    }
  }

  const stamp = formatTimestamp(lastRefreshedAt);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <Tag>
        <Database className="size-3" aria-hidden />
        Data sourced via Bright Data Scraper Studio
        {source === "supabase" ? " (live)" : " (snapshot)"}
      </Tag>

      <Button variant="outline" onClick={handleRefresh} disabled={busy} aria-busy={busy}>
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <RefreshCw className="size-4" aria-hidden />
        )}
        {busy ? "Refreshing… this can take up to a few minutes" : "Refresh Data"}
      </Button>

      {stamp && !busy && (
        <span className="text-xs text-muted-foreground">Last updated: {stamp}</span>
      )}

      {notice && !error && (
        <span className="text-xs text-violet-soft" role="status">
          {notice}
        </span>
      )}

      {error && (
        <span className="inline-flex items-center gap-1.5 text-xs text-destructive" role="alert">
          <AlertTriangle className="size-3.5" aria-hidden />
          {error} Showing the last known good data.
        </span>
      )}
    </div>
  );
}
