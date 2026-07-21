import { api } from "@/lib/api-client";
import { apiUrl } from "@/lib/api-url";

export const loginUser = (data: {
  email: string;
  password: string;
}) => api.post("/auth/login", data);

export const signupUser = (data: {
  name: string;
  email: string;
  password: string;
  dueDate?: string;
  babyBirthDate?: string;
}) => api.post("/auth/register", data);

export const logoutUser = () => api.post("/auth/logout");
export const fetchMe = () => api.get("/auth/me");
export const updateProfile = (data: {
  name?: string;
  dueDate?: string;
  babyBirthDate?: string;
  avatarUrl?: string;
  specialization?: string;
  externalLink?: string;
  whatsappNumber?: string;
}) => api.patch("/auth/me", data);
export const fetchSessions = () => api.get("/auth/sessions");

/** Upload avatar photo – sends multipart/form-data to POST /auth/avatar */
export const uploadAvatar = async (file: File): Promise<{ profileImageUrl: string }> => {
  const formData = new FormData();
  formData.append("avatar", file);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const res = await fetch(apiUrl("/auth/avatar"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || "Upload failed");
  }
  return res.json() as Promise<{ profileImageUrl: string }>;
};

/** Admin: list all experts */
export const listExperts = () => api.get("/auth/admin/experts");

/** Admin: analytics summary */
export const fetchAnalyticsSummary = () => api.get("/analytics/summary");

/** Admin: create expert account */
export const createExpert = (data: {
  name: string;
  email: string;
  password: string;
  role: string;
  specialization?: string;
}) => api.post("/auth/register-expert", data);

/** Admin: approve an expert */
export const approveExpert = (expertId: string) =>
  api.patch(`/auth/admin/experts/${expertId}/approve`, {});

/** Admin: suspend an expert */
export const suspendExpert = (expertId: string) =>
  api.patch(`/auth/admin/experts/${expertId}/suspend`, {});
