"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";

export type MlStatus = "loading" | "ok" | "degraded";

export interface MlHealthState {
  status: MlStatus;
  chunksIndexed: number;
  /**
   * True when the ML service has been degraded/loading for less than
   * FAST_POLL_DURATION_MS — i.e. it is likely still waking from Railway sleep,
   * not permanently broken. Use this to show a friendly "warming up" message
   * rather than an error state.
   */
  isWaking: boolean;
  /**
   * Human-readable context for the current status, suitable for display
   * in the chat UI status bar or a tooltip.
   */
  warningMessage: string;
}

// Fast-poll every 5s for the first 3 minutes after mount.
// Tuned to Railway sleep wake time (~60–90s): the 3-minute window ensures we
// keep retrying until the ML service is confirmed ready after a cold start.
const FAST_POLL_MS = 5_000;

// Slow-poll every 30s after the fast-poll window expires.
// Reserved for production scaling (>100 active users): reduce to 10_000
// or disable Railway sleep entirely to eliminate cold-start latency.
const SLOW_POLL_MS = 30_000;

// Duration of the fast-poll window. Matches ~2x the worst-case Railway
// sleep wake time so we never miss a successful wake event.
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
    isWaking: true,
    warningMessage: "AI warming up — first response may take ~60 seconds",
  });
  const mountedAt = useRef<number | null>(null);

  const check = useCallback(async () => {
    try {
      const res = (await api.get("/chatbot/health")) as {
        mlStatus?: string;
        chunksIndexed?: number;
      };
      const isOk = res.mlStatus === "ok";
      const elapsed = Date.now() - (mountedAt.current ?? Date.now());
      const isWaking = !isOk && elapsed < FAST_POLL_DURATION_MS;
      setState({
        status: isOk ? "ok" : "degraded",
        chunksIndexed: res.chunksIndexed ?? 0,
        isWaking,
        warningMessage: isOk
          ? ""
          : isWaking
            ? "AI is warming up — your message will be processed once ready (~60 seconds)"
            : "AI service is not responding. Please try again later or contact support.",
      });
      return isOk;
    } catch {
      const elapsed = Date.now() - (mountedAt.current ?? Date.now());
      const isWaking = elapsed < FAST_POLL_DURATION_MS;
      setState({
        status: "degraded",
        chunksIndexed: 0,
        isWaking,
        warningMessage: isWaking
          ? "AI is warming up — your message will be processed once ready (~60 seconds)"
          : "AI service is not responding. Please try again later or contact support.",
      });
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

