import { getApiBase } from "@/lib/api-url";

const API = getApiBase();

export interface TrainerPost {
  id: string;
  title: string;
  body: string;
  targetGroup?: string;
  mediaUrl?: string;
  isPublished: boolean;
  publishedAt?: string;
  author: {
    id: string; name: string; role: string;
    specialization?: string; avatarUrl?: string; isFeatured: boolean;
  };
}

export async function getPublicTrainerPosts(targetGroup?: string): Promise<TrainerPost[]> {
  try {
    const url = targetGroup
      ? `${API}/trainer-content?targetGroup=${encodeURIComponent(targetGroup)}`
      : `${API}/trainer-content`;
    const res = await fetch(url, { next: { revalidate: 180 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getMyTrainerPosts() {
  const res = await fetch(`${API}/trainer-content/my`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
}

export async function createTrainerPost(payload: {
  title: string; body: string; targetGroup?: string; mediaUrl?: string; publish?: boolean;
}) {
  const res = await fetch(`${API}/trainer-content`, {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create post");
  return res.json();
}

export async function publishTrainerPost(postId: string) {
  const res = await fetch(`${API}/trainer-content/${postId}/publish`, {
    method: "PATCH", credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to publish post");
  return res.json();
}
