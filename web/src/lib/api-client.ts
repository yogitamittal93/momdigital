import { apiUrl } from "./api-url";

export type CareerPlan = {
  profession?: string;
  employer?: string;
  breakStartDate?: string | null;
  returnDate?: string | null;
  planItems?: {
    workBeforePregnancy?: string | null;
    maternityLeave?: string | null;
    stayAtHomeDuration?: string | null;
    planningCareerChange?: string | null;
    stayConnectedBusiness?: string | null;
    exerciseLog?: string[] | null;
    returnToWorkChecklist?: string[] | null;
  } | null;
};

export type UserRole =
  | "MOTHER"
  | "MBBS"
  | "AYURVEDA"
  | "NUTRITIONIST"
  | "CHEF"
  | "YOGA_TRAINER"
  | "WORKOUT_TRAINER"
  | "DANCE_TEACHER"
  | "ADMIN";

export type ExpertStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SUSPENDED"
  | "REJECTED";

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  // Role & approval
  role?: UserRole;
  expertStatus?: ExpertStatus | null;
  isAdmin?: boolean;
  // Expert profile
  specialization?: string | null;
  externalLink?: string | null;
  contributionCount?: number;
  isFeatured?: boolean;
  // Mother fields
  dueDate?: string | null;
  babyBirthDate?: string | null;
  babyName?: string | null;
  deliveryType?: string | null;
  // Shared
  avatarUrl?: string | null;
  profileImage?: string | null;
  weight?: number | null;
  height?: number | null;
  whatsappNumber?: string | null;
  careerPlan?: CareerPlan | null;
};


export type MeResponse = { user: ApiUser };

/**
 * Bumped on successful login/logout so in-flight 401→refresh handlers from a
 * pre-login /auth/me probe cannot redirect the user back to /login after a
 * successful sign-in (the stale-cookie race that breaks normal Chrome but not
 * incognito).
 */
let authEpoch = 0;

export function bumpAuthEpoch() {
  authEpoch += 1;
}

function isPublicAuthPath(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/pro/login") ||
    pathname.startsWith("/pro/register")
  );
}

function parseReply(data: Record<string, unknown>): string {
  const nested = (data.data ?? {}) as Record<string, unknown>;
  const candidates = [
    data.reply,
    data.message,
    data.content,
    data.response,
    data.answer,
    nested.reply,
    nested.message,
    nested.content,
    nested.response,
    nested.answer,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }

    if (Array.isArray(candidate)) {
      const joined = candidate
        .map((item) => (typeof item === "string" ? item : ""))
        .filter(Boolean)
        .join(" ");
      if (joined.trim()) return joined;
    }
  }

  return "";
}

export async function apiCall(
  endpoint: string,
  options: RequestInit = {},
): Promise<unknown> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const epochAtStart = authEpoch;

  let response = await fetch(apiUrl(endpoint), {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      const newToken = localStorage.getItem("access_token");
      if (newToken) headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(apiUrl(endpoint), {
        ...options,
        headers,
        credentials: "include",
      });
    } else if (typeof window !== "undefined") {
      // Skip redirect if login already succeeded, or if we're already on an
      // auth page (avoids reload loops from the root UserProfileProvider probe).
      if (
        epochAtStart === authEpoch &&
        !isPublicAuthPath(window.location.pathname)
      ) {
        window.location.href = "/login";
      }
      return null;
    }
  }

  const text = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      console.debug("[api-client] non-JSON response", { endpoint, status: response.status, text });
    }
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
  }

  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    console.debug("[api-client] response", { endpoint, status: response.status, data });
  }

  if (!response.ok) {
    const rawMessage = data.message;
    const msg =
      (Array.isArray(rawMessage) ? rawMessage.join(", ") : null) ||
      (typeof rawMessage === "string" ? rawMessage : null) ||
      `API error: ${response.status}`;
    throw new Error(msg);
  }

  return data;
}

async function refreshToken(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const api = {
  get: (url: string) => apiCall(url.startsWith("/") ? url : `/${url}`),
  post: (url: string, body?: unknown) =>
    apiCall(url.startsWith("/") ? url : `/${url}`, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: (url: string, body: unknown) =>
    apiCall(url.startsWith("/") ? url : `/${url}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: (url: string) =>
    apiCall(url.startsWith("/") ? url : `/${url}`, { method: "DELETE" }),
  upload: async (url: string, formData: FormData) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    const response = await fetch(apiUrl(url), {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "Upload failed");
    }
    return response.json();
  },
};

export { parseReply };

export async function fetchMe(): Promise<ApiUser | null> {
  const data = (await api.get("/auth/me")) as MeResponse | ApiUser | null;
  if (!data) return null;
  if ("user" in data && data.user) return data.user;
  return data as ApiUser;
}
