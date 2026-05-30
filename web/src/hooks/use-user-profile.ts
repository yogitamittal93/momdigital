"use client";

import { useEffect, useState } from "react";
import { fetchMe, type ApiUser } from "@/lib/api-client";

export function useUserProfile() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then((u) => setUser(u))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading, error, setUser };
}
