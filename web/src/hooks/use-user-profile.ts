"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMe, type ApiUser } from "@/lib/api-client";

export function useUserProfile() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchMe()
      .then((u) => setUser(u))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  /** Call this after a PATCH /auth/me to re-sync local state. */
  const refreshUser = useCallback(() => {
    load();
  }, [load]);

  return { user, loading, error, setUser, refreshUser };
}
