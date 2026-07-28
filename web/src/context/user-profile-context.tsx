"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";
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

function isPublicAuthPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/pro/login") ||
    pathname.startsWith("/pro/register")
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchMe()
      .then((u) => {
        setUser(u);
        setError(null);
      })
      .catch((e: Error) => {
        setUser(null);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Never probe /auth/me on login/register — that fires a 401→refresh with
    // whatever stale cookies are in a normal Chrome profile and races login.
    // Only check once on mount; subsequent navigations within the app do not
    // re-probe so a SameSite cookie delivered by an OAuth redirect is not
    // clobbered by a second stale 401 before the browser propagates the cookie.
    if (isPublicAuthPath(pathname)) {
      setUser(null);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    fetchMe()
      .then((u) => {
        if (active) {
          setUser(u);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (active) {
          setUser(null);
          setError(e.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally mount-only — use refreshUser() to re-sync after actions

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
