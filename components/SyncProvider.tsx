"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  syncFromSources,
  getSyncState,
  getDataSourceStatus,
  SyncResult,
  DataSourceStatus,
} from "@/lib/xlsx-sync";
import { SyncState } from "@/lib/sync-state";
import { isDemoMode } from "@/lib/demo-data";
import { isFirebaseConfigured } from "@/lib/firebase";

interface SyncContextType {
  syncing: boolean;
  syncState: SyncState | null;
  dataSource: DataSourceStatus | null;
  lastMessage: string;
  syncNow: (force?: boolean) => Promise<SyncResult>;
  refreshStatus: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType>({
  syncing: false,
  syncState: null,
  dataSource: null,
  lastMessage: "",
  syncNow: async () => ({ success: false, message: "" }),
  refreshStatus: async () => {},
});

export function useSync() {
  return useContext(SyncContext);
}

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

export function SyncProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const [syncing, setSyncing] = useState(false);
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [dataSource, setDataSource] = useState<DataSourceStatus | null>(null);
  const [lastMessage, setLastMessage] = useState("");

  const refreshStatus = useCallback(async () => {
    if (!enabled || isDemoMode() || !isFirebaseConfigured()) return;
    const [state, source] = await Promise.all([getSyncState(), getDataSourceStatus()]);
    setSyncState(state);
    setDataSource(source);
  }, [enabled]);

  const syncNow = useCallback(
    async (force = false): Promise<SyncResult> => {
      if (!enabled || isDemoMode()) {
        return { success: false, message: "Sync not available" };
      }
      setSyncing(true);
      try {
        const result = await syncFromSources(force);
        setLastMessage(result.message);
        await refreshStatus();
        return result;
      } finally {
        setSyncing(false);
      }
    },
    [enabled, refreshStatus]
  );

  useEffect(() => {
    if (!enabled || isDemoMode() || !isFirebaseConfigured()) return;

    refreshStatus();

    // Defer sync so initial page render is not blocked by large spreadsheet download
    const initialTimer = setTimeout(() => {
      syncFromSources(false).then((result) => setLastMessage(result.message));
    }, 1500);

    const interval = setInterval(() => {
      syncFromSources(false).then((result) => {
        if (!result.skipped) setLastMessage(result.message);
        refreshStatus();
      });
    }, SYNC_INTERVAL_MS);

    const onFocus = () => {
      syncFromSources(false).then((result) => {
        if (!result.skipped) setLastMessage(result.message);
        refreshStatus();
      });
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled, refreshStatus]);

  return (
    <SyncContext.Provider
      value={{ syncing, syncState, dataSource, lastMessage, syncNow, refreshStatus }}
    >
      {children}
    </SyncContext.Provider>
  );
}
