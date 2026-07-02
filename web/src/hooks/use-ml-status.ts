"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";

export type MlStatus = "loading" | "ok" | "degraded";

export interface MlHealthState {
  status: MlStatus;
  chunksIndexed: number;
}

const FAST_POLL_MS = 5_000;
const SLOW_POLL_MS = 30_000;
const FAST_POLL_DURATION_MS = 3 * 60_000;

/**
 * useMlStatus — polls GET /chatbot/health on mount and retries while degraded.
 *
 * Production ML cold-starts (model load + ChromaDB download) can exceed a
 * single request; without retries the UI stays on "warming up" forever.
 */
export function useMlStatus(): MlHealthState {
  const [state, setState] = useState<MlHealthState>({
    status: "loading",
    chunksIndexed: 0,
  });
  const mountedAt = useRef<number | null>(null);

  const check = useCallback(async () => {
    try {
      const res = (await api.get("/chatbot/health")) as {
        mlStatus?: string;
        chunksIndexed?: number;
      };
      setState({
        status: res.mlStatus === "ok" ? "ok" : "degraded",
        chunksIndexed: res.chunksIndexed ?? 0,
      });
      return res.mlStatus === "ok";
    } catch {
      setState({ status: "degraded", chunksIndexed: 0 });
      return false;
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    mountedAt.current = Date.now();

    const runCheck = async () => {
      if (cancelled) return;
      const healthy = await check();
      if (cancelled || healthy) return;

      const elapsed = Date.now() - (mountedAt.current ?? Date.now());
      schedule(elapsed < FAST_POLL_DURATION_MS ? FAST_POLL_MS : SLOW_POLL_MS);
    };

    const schedule = (delayMs: number) => {
      timer = setTimeout(async () => {
        await runCheck();
      }, delayMs);
    };

    schedule(0);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [check]);

  return state;
}
