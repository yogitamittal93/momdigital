const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface FeaturedExpert {
  id: string;
  name: string;
  role: string;
  specialization?: string;
  externalLink?: string;
  avatarUrl?: string;
  isFeatured: boolean;
  featuredAt?: string;
  contributionCount: number;
}

export async function getFeaturedExperts(): Promise<FeaturedExpert[]> {
  try {
    const res = await fetch(`${API}/experts/featured`, {
      next: { revalidate: 300 }, // ISR: re-fetch every 5 min
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getExpertQueue() {
  const res = await fetch(`${API}/content-requests/queue`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch queue");
  return res.json();
}

export async function getExpertStats() {
  const res = await fetch(`${API}/content-requests/stats`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function approveAssignment(assignmentId: string, note?: string) {
  const res = await fetch(`${API}/content-requests/${assignmentId}/approve`, {
    method: "PATCH", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw new Error("Approve failed");
  return res.json();
}

export async function flagAssignment(assignmentId: string, note?: string) {
  const res = await fetch(`${API}/content-requests/${assignmentId}/flag`, {
    method: "PATCH", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw new Error("Flag failed");
  return res.json();
}

export async function addNoteToAssignment(assignmentId: string, note: string) {
  const res = await fetch(`${API}/content-requests/${assignmentId}/note`, {
    method: "PATCH", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw new Error("Note failed");
  return res.json();
}

export async function revealPatientPii(assignmentId: string) {
  const res = await fetch(`${API}/content-requests/${assignmentId}/reveal-pii`, {
    method: "POST", credentials: "include",
  });
  if (!res.ok) throw new Error("Reveal PII failed");
  return res.json();
}

export async function submitContentRequest(payload: {
  requestType: string;
  questionText?: string;
  scanReportId?: string;
  context?: string;
}) {
  const res = await fetch(`${API}/content-requests`, {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Submit failed");
  return res.json();
}

export async function getMyRequests() {
  const res = await fetch(`${API}/content-requests`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch requests");
  return res.json();
}
