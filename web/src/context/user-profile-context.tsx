"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetchMe, type ApiUser } from "@/lib/api-client";

// ─── Context ──────────────────────────────────────────────────────────────────

type UserProfileContextValue = {
  user: ApiUser | null;
  loading: boolean;
  error: string | null;
  setUser: (user: ApiUser | null) => void;
  refreshUser: () => void;
};

const UserProfileContext = createContext<UserProfileContextValue>({
  user: null,
  loading: true,
  error: null,
  setUser: () => {},
  refreshUser: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
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
    load();
  }, [load]);

  const refreshUser = useCallback(() => {
    load();
  }, [load]);

  return (
    <UserProfileContext.Provider
      value={{ user, loading, error, setUser, refreshUser }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUserProfileContext() {
  return useContext(UserProfileContext);
}
