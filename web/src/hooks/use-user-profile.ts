"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMe, type ApiUser } from "@/lib/api-client";

/**
 * useUserProfile — fetches /auth/me and caches the result locally.
 *
 * When wrapped by UserProfileProvider (app root), components can also use
 * useUserProfileContext() directly to share a single fetch across the tree.
 * This hook is kept for backwards compatibility with existing pages.
 */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    load();
  }, [load]);

  /** Call this after a PATCH /auth/me to re-sync local state. */
  const refreshUser = useCallback(() => {
    load();
  }, [load]);

  return { user, loading, error, setUser, refreshUser };
}
