"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";

export type MlStatus = "loading" | "ok" | "degraded";

export interface MlHealthState {
  status: MlStatus;
  chunksIndexed: number;
}

/**
 * useMlStatus — polls GET /chatbot/health once on mount.
 *
 * Reusable on any page that embeds the chatbot or wants to display
 * ML service status (recovery, postpartum, career, etc.).
 *
 * @example
 *   const { status, chunksIndexed } = useMlStatus();
 */
export function useMlStatus(): MlHealthState {
  const [state, setState] = useState<MlHealthState>({
    status: "loading",
    chunksIndexed: 0,
  });

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
    } catch {
      setState({ status: "degraded", chunksIndexed: 0 });
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return state;
}
