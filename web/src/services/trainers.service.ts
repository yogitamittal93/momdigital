import { getApiBase } from "@/lib/api-url";
import { api } from "@/lib/api-client";

const API = getApiBase();

export interface Trainer {
  id: string;
  name: string;
  role: "YOGA_TRAINER" | "WORKOUT_TRAINER" | "NUTRITIONIST" | "DANCE_TEACHER";
  specialization?: string | null;
  bio?: string | null;
  city?: string | null;
  avatarUrl?: string | null;
  profileImage?: string | null;
  languagesSpoken: string[];
  externalLink?: string | null;
  isFeatured: boolean;
  contributionCount: number;
}

export async function getTrainers(filters?: {
  role?: string;
  city?: string;
}): Promise<Trainer[]> {
  const params = new URLSearchParams();
  if (filters?.role) params.set("role", filters.role);
  if (filters?.city) params.set("city", filters.city);
  const query = params.toString();

  try {
    const res = await fetch(`${API}/experts/trainers${query ? `?${query}` : ""}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function submitTrainerQuestion(payload: {
  trainerId: string;
  trainerRole: string;
  questionText: string;
}): Promise<void> {
  const requestTypeMap: Record<string, string> = {
    NUTRITIONIST: "DIETARY_QUERY",
    YOGA_TRAINER: "EXERCISE_QUERY",
    WORKOUT_TRAINER: "EXERCISE_QUERY",
    DANCE_TEACHER: "EXERCISE_QUERY",
  };

  await api.post("/content-requests", {
    requestType: requestTypeMap[payload.trainerRole] ?? "GENERAL_QUESTION",
    questionText: payload.questionText,
    context: JSON.stringify({
      targetExpertId: payload.trainerId,
      trainerRole: payload.trainerRole,
    }),
  });
}
