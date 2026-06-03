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

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  dueDate?: string | null;
  babyBirthDate?: string | null;
  avatarUrl?: string | null;
  role?: string;
  careerPlan?: CareerPlan | null;
};

export type MeResponse = { user: ApiUser };

function parseReply(data: Record<string, unknown>): string {
  return (
    (data.reply as string) ||
    (data.message as string) ||
    (data.content as string) ||
    (data.response as string) ||
    (data.answer as string) ||
    ""
  );
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
      window.location.href = "/login";
      return null;
    }
  }

  const text = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
  }

  if (!response.ok) {
    const msg =
      (data.message as string) ||
      (Array.isArray(data.message) ? (data.message as string[]).join(", ") : null) ||
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
