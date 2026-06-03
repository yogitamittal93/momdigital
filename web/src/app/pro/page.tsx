"use client";

import { useEffect, useState, useCallback } from "react";
import { ProSidebar } from "./pro-sidebar";
import {
  CheckCircle, Flag, MessageSquare, Eye, EyeOff, Star,
  FileText, TrendingUp, Clock, BarChart2, Zap, AlertCircle,
  ChevronDown, ChevronUp, RefreshCw, Lock, Unlock,
} from "lucide-react";

import { getApiBase } from "@/lib/api-url";

const API = getApiBase();

interface User {
  id: string; name: string; role: string;
  expertStatus: string; contributionCount: number;
  isFeatured: boolean; specialization?: string;
}
interface Stats { reviewed: number; quota: number; isFeatured: boolean; remaining: number; }
interface QueueItem {
  id: string; status: string; expertNote?: string;
  request: {
    id: string; requestType: string; questionText?: string;
    mlResponse?: string; mlConfidence?: number; createdAt: string;
    uploadedBy: { id: string; dueDate?: string; babyBirthDate?: string };
    scanReport?: { id: string; originalName: string; mimeType: string };
  };
}

const rolePretty: Record<string, string> = {
  MBBS: "MBBS Doctor", AYURVEDA: "Ayurveda", NUTRITIONIST: "Nutritionist",
  CHEF: "Chef Expert", YOGA_TRAINER: "Yoga Trainer", WORKOUT_TRAINER: "Fitness Trainer",
};
const typeLabel: Record<string, string> = {
  MEDICAL_SCAN: "Medical Scan", DIETARY_QUERY: "Dietary Query",
  RECIPE_REVIEW: "Recipe Review", EXERCISE_QUERY: "Exercise Query",
  CROSS_DISCIPLINE: "Cross-Specialist", GENERAL_QUESTION: "General Q",
};

function CircularProgress({ value, max, size = 80 }: { value: number; max: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(value / max, 1) * circ;
  const pct = Math.round((value / max) * 100);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={pct >= 100 ? "#3FB950" : "#58A6FF"} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={circ - fill}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle"
        fill="var(--foreground)" fontSize={size / 5} fontWeight={700}
        style={{ transform: "rotate(90deg)", transformOrigin: `${size / 2}px ${size / 2}px` }}>
        {pct}%
      </text>
    </svg>
  );
}

function AssignmentRow({ item, onAction }: { item: QueueItem; onAction: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(item.expertNote ?? "");
  const [loading, setLoading] = useState<string | null>(null);
  const [piiData, setPiiData] = useState<{ name: string; email: string } | null>(null);
  const [piiLoading, setPiiLoading] = useState(false);

  const act = async (action: "approve" | "flag" | "note") => {
    setLoading(action);
    try {
      await fetch(`${API}/content-requests/${item.id}/${action}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      onAction();
    } finally { setLoading(null); }
  };

  const revealPii = async () => {
    if (piiData) return;
    setPiiLoading(true);
    try {
      const res = await fetch(`${API}/content-requests/${item.id}/reveal-pii`, {
        method: "POST", credentials: "include",
      });
      const d = await res.json();
      setPiiData(d.patient);
    } finally { setPiiLoading(false); }
  };

  const req = item.request;
  const isReviewed = item.status !== "PENDING" && item.status !== "ML_REVIEWED";

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 8, overflow: "hidden", opacity: isReviewed ? 0.65 : 1 }}>
      {/* Row header */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{
          fontSize: "0.65rem", fontWeight: 700, padding: "3px 7px", borderRadius: 4,
          background: req.requestType === "MEDICAL_SCAN" ? "rgba(88,166,255,0.12)" : "rgba(163,113,247,0.12)",
          color: req.requestType === "MEDICAL_SCAN" ? "#58A6FF" : "#A371F7",
          letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0,
        }}>
          {typeLabel[req.requestType] ?? req.requestType}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {req.questionText ?? (req.scanReport ? `📎 ${req.scanReport.originalName}` : "Review request")}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
            Patient #{req.uploadedBy.id.slice(-6).toUpperCase()} · {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {req.mlResponse && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.7rem", color: "#58A6FF" }}>
              <Zap size={11} />
              <span>ML</span>
            </div>
          )}
          <div style={{
            fontSize: "0.67rem", padding: "2px 7px", borderRadius: 4, fontWeight: 600,
            background: item.status === "APPROVED" ? "rgba(63,185,80,0.12)" : item.status === "FLAGGED" ? "rgba(248,81,73,0.12)" : item.status === "ML_REVIEWED" ? "rgba(88,166,255,0.12)" : "rgba(210,153,34,0.12)",
            color: item.status === "APPROVED" ? "#3FB950" : item.status === "FLAGGED" ? "#F85149" : item.status === "ML_REVIEWED" ? "#58A6FF" : "#D29922",
          }}>
            {item.status}
          </div>
          {expanded ? <ChevronUp size={14} style={{ color: "var(--muted-foreground)" }} /> : <ChevronDown size={14} style={{ color: "var(--muted-foreground)" }} />}
        </div>
      </div>

      {/* Expanded workspace */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "16px" }}>
          {/* ML Response */}
          {req.mlResponse && (
            <div style={{ background: "rgba(88,166,255,0.05)", border: "1px solid rgba(88,166,255,0.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Zap size={12} style={{ color: "#58A6FF" }} />
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#58A6FF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  AI Preliminary Answer ({req.mlConfidence ? `${Math.round(req.mlConfidence * 100)}% confident` : "unscored"})
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--foreground)", lineHeight: 1.5 }}>{req.mlResponse}</p>
            </div>
          )}

          {/* Scan file link */}
          {req.scanReport && (
            <a
              href={`${API}/content-requests/${item.id}/file`}
              target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--foreground)", textDecoration: "none", fontSize: "0.8rem", marginBottom: 14 }}
            >
              <FileText size={14} />
              View Scan: {req.scanReport.originalName}
            </a>
          )}

          {/* PII reveal */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            {!piiData ? (
              <button
                onClick={revealPii} disabled={piiLoading}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(210,153,34,0.4)", background: "rgba(210,153,34,0.05)", color: "#D29922", fontSize: "0.78rem", cursor: "pointer" }}
              >
                <Lock size={12} />
                {piiLoading ? "Loading…" : "Reveal Patient Details (Audited)"}
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(63,185,80,0.3)", background: "rgba(63,185,80,0.05)", fontSize: "0.78rem", color: "#3FB950" }}>
                <Unlock size={12} />
                <span><strong>{piiData.name}</strong> · {piiData.email}</span>
              </div>
            )}
          </div>

          {/* Note input */}
          {!isReviewed && (
            <div style={{ marginBottom: 12 }}>
              <textarea
                value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Add a clinical note or recommendation…"
                rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "0.82rem", resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          )}

          {/* Action buttons */}
          {!isReviewed && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => act("approve")} disabled={!!loading}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 7, border: "none", background: loading === "approve" ? "#2ea043" : "#3FB950", color: "#fff", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
              >
                <CheckCircle size={14} />
                {loading === "approve" ? "Approving…" : "Approve"}
              </button>
              <button
                onClick={() => act("note")} disabled={!!loading || !note.trim()}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 7, border: "1px solid rgba(88,166,255,0.4)", background: "rgba(88,166,255,0.08)", color: "#58A6FF", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
              >
                <MessageSquare size={14} />
                {loading === "note" ? "Saving…" : "Add Note"}
              </button>
              <button
                onClick={() => act("flag")} disabled={!!loading}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 7, border: "1px solid rgba(248,81,73,0.4)", background: "rgba(248,81,73,0.08)", color: "#F85149", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
              >
                <Flag size={14} />
                {loading === "flag" ? "Flagging…" : "Flag"}
              </button>
            </div>
          )}
          {isReviewed && item.expertNote && (
            <div style={{ background: "var(--muted)", borderRadius: 6, padding: "8px 12px", fontSize: "0.8rem", color: "var(--muted-foreground)" }}>
              <strong>Your note:</strong> {item.expertNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, statsRes, queueRes] = await Promise.all([
        fetch(`${API}/auth/me`, { credentials: "include" }),
        fetch(`${API}/content-requests/stats`, { credentials: "include" }),
        fetch(`${API}/content-requests/queue`, { credentials: "include" }),
      ]);
      if (meRes.ok) { const d = await meRes.json(); setUser(d.user); }
      if (statsRes.ok) { setStats(await statsRes.json()); }
      if (queueRes.ok) { setQueue(await queueRes.json()); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isTrainer = user?.role === "YOGA_TRAINER" || user?.role === "WORKOUT_TRAINER";
  const pendingCount = queue.filter((q) => q.status === "PENDING" || q.status === "ML_REVIEWED").length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>
      <ProSidebar user={user} />

      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--foreground)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
              {loading ? "Loading…" : `Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${user?.name?.split(" ")[0]}!`}
            </h1>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted-foreground)" }}>
              {rolePretty[user?.role ?? ""] ?? "Expert"} · {user?.specialization ?? "General Practice"}
            </p>
          </div>
          <button
            onClick={fetchData} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--muted-foreground)", fontSize: "0.78rem", cursor: "pointer" }}
          >
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>

        {/* Pending approval banner */}
        {user?.expertStatus === "PENDING_APPROVAL" && (
          <div style={{ background: "rgba(210,153,34,0.08)", border: "1px solid rgba(210,153,34,0.3)", borderRadius: 10, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <AlertCircle size={18} style={{ color: "#D29922", flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "#D29922" }}>Account Pending Approval</p>
              <p style={{ margin: "3px 0 0", fontSize: "0.78rem", color: "var(--muted-foreground)" }}>
                Your credentials are under review. The workspace will unlock once an admin approves your account.
              </p>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
          {/* Progress card */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px", display: "flex", alignItems: "center", gap: 16, gridColumn: "span 2" }}>
            <div style={{ flexShrink: 0 }}>
              <CircularProgress value={stats?.reviewed ?? 0} max={stats?.quota ?? 40} size={84} />
            </div>
            <div>
              {stats?.isFeatured ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Star size={16} style={{ color: "#D29922", fill: "#D29922" }} />
                  <span style={{ fontWeight: 700, color: "#D29922", fontSize: "0.95rem" }}>Featured Expert!</span>
                </div>
              ) : (
                <h3 style={{ margin: "0 0 6px", fontSize: "0.95rem", fontWeight: 700, color: "var(--foreground)" }}>
                  {stats?.reviewed ?? 0}/{stats?.quota ?? 40} {isTrainer ? "posts" : "reviews"} completed
                </h3>
              )}
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted-foreground)", lineHeight: 1.5 }}>
                {stats?.isFeatured
                  ? "You are now featured on the mothers' dashboard. Families can book you directly."
                  : `${stats?.remaining ?? (stats?.quota ?? 40)} more ${isTrainer ? "posts" : "reviews"} to unlock Featured Status`}
              </p>
              {!stats?.isFeatured && (
                <div style={{ marginTop: 10, height: 4, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, background: "#58A6FF", width: `${Math.min(((stats?.reviewed ?? 0) / (stats?.quota ?? 40)) * 100, 100)}%`, transition: "width 0.6s ease" }} />
                </div>
              )}
            </div>
          </div>

          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Clock size={14} style={{ color: "var(--muted-foreground)" }} />
              <span style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pending</span>
            </div>
            <p style={{ margin: 0, fontSize: "2rem", fontWeight: 700, color: pendingCount > 0 ? "#D29922" : "var(--foreground)" }}>{pendingCount}</p>
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>items awaiting review</p>
          </div>

          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <TrendingUp size={14} style={{ color: "var(--muted-foreground)" }} />
              <span style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Completed</span>
            </div>
            <p style={{ margin: 0, fontSize: "2rem", fontWeight: 700, color: "#3FB950" }}>{stats?.reviewed ?? 0}</p>
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>total {isTrainer ? "posts" : "reviews"}</p>
          </div>
        </div>

        {/* Queue / Workspace */}
        {!isTrainer && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 8 }}>
                <BarChart2 size={16} style={{ color: "var(--primary)" }} />
                Verification Workspace
              </h2>
              <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                {queue.length} item{queue.length !== 1 ? "s" : ""} in queue
              </span>
            </div>

            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} style={{ height: 58, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
              ))
            ) : queue.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10 }}>
                <CheckCircle size={32} style={{ color: "#3FB950", margin: "0 auto 12px", display: "block" }} />
                <p style={{ margin: 0, fontWeight: 600, color: "var(--foreground)" }}>Queue is clear!</p>
                <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "var(--muted-foreground)" }}>No pending reviews for your specialty.</p>
              </div>
            ) : (
              queue.map((item) => (
                <AssignmentRow key={item.id} item={item} onAction={fetchData} />
              ))
            )}
          </div>
        )}

        {/* Trainer content placeholder */}
        {isTrainer && (
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "32px", textAlign: "center" }}>
            <FileText size={32} style={{ color: "var(--primary)", margin: "0 auto 12px", display: "block" }} />
            <h2 style={{ margin: "0 0 8px", fontSize: "1rem", fontWeight: 700, color: "var(--foreground)" }}>Content Studio</h2>
            <p style={{ margin: "0 0 20px", fontSize: "0.82rem", color: "var(--muted-foreground)" }}>
              Publish exercise posts for specific age groups. Every {stats?.quota ?? 5} published posts earns you Featured Status.
            </p>
            <a href="/pro/content" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 20px", borderRadius: 8, background: "var(--primary)", color: "var(--primary-foreground)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
              Open Content Studio →
            </a>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
