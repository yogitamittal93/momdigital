"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchMe } from "@/lib/api-client";
import {
  listExperts,
  createExpert,
  approveExpert,
  suspendExpert,
  fetchAnalyticsSummary,
} from "@/services/auth.service";
import {
  Shield,
  UserPlus,
  CheckCircle,
  XCircle,
  Users,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Expert = {
  id: string;
  name: string;
  email: string;
  role: string;
  expertStatus: string | null;
  specialization: string | null;
  createdAt: string;
};

const EXPERT_ROLE_OPTIONS = [
  { value: "MBBS", label: "MBBS Doctor" },
  { value: "AYURVEDA", label: "Ayurveda Practitioner" },
  { value: "NUTRITIONIST", label: "Nutritionist" },
  { value: "CHEF", label: "Chef / Diet Expert" },
  { value: "YOGA_TRAINER", label: "Yoga Trainer" },
  { value: "WORKOUT_TRAINER", label: "Fitness Trainer" },
  { value: "DANCE_TEACHER", label: "Dance Teacher" },
];

const statusBadge: Record<string, string> = {
  PENDING_APPROVAL: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  SUSPENDED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  REJECTED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loadingExperts, setLoadingExperts] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [analyticsSummary, setAnalyticsSummary] = useState<{
    totalEvents?: number;
    signups?: number;
    activeSessions?: number;
    chatMessages?: number;
    uniqueUsers?: number;
    ragSourceBreakdown?: Record<string, number>;
    retention?: { day2: number | null; day5: number | null; day10: number | null };
    recentEvents?: Array<{
      eventName: string;
      userId?: string | null;
      createdAt: string;
      metadata?: Record<string, unknown> | null;
    }>;
  } | null>(null);

  // Create expert form
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "MBBS",
    specialization: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchMe()
      .then((user) => {
        if (!user || !user.isAdmin) {
          router.replace("/profile");
          return;
        }
        setIsAdmin(true);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  // ── Load experts ─────────────────────────────────────────────────────────
  const loadExperts = () => {
    setLoadingExperts(true);
    (listExperts() as Promise<{ experts: Expert[] }>)
      .then((data) => setExperts(data.experts ?? []))
      .catch(() => setGlobalError("Failed to load experts."))
      .finally(() => setLoadingExperts(false));
  };

  const loadAnalyticsSummary = () => {
    setLoadingSummary(true);
    fetchAnalyticsSummary()
      .then((data) => setAnalyticsSummary((data as typeof analyticsSummary) ?? null))
      .catch(() => setGlobalError("Failed to load analytics summary."))
      .finally(() => setLoadingSummary(false));
  };

  useEffect(() => {
    if (isAdmin) {
      loadExperts();
      loadAnalyticsSummary();
    }
  }, [isAdmin]);

  // ── Approve / Suspend ──────────────────────────────────────────────────────
  const handleApprove = async (id: string) => {
    setActionLoading(id + "-approve");
    setGlobalError(null);
    try {
      await approveExpert(id);
      setSuccessMsg("Expert approved.");
      loadExperts();
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (id: string) => {
    setActionLoading(id + "-suspend");
    setGlobalError(null);
    try {
      await suspendExpert(id);
      setSuccessMsg("Expert suspended.");
      loadExperts();
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Create expert ──────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setCreateError("Name, email and password are required.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      await createExpert({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        specialization: form.specialization || undefined,
      });
      setCreateSuccess(`Expert account created for ${form.email}. They can now log in.`);
      setForm({ name: "", email: "", password: "", role: "MBBS", specialization: "" });
      loadExperts();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create expert.");
    } finally {
      setCreating(false);
    }
  };

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const pendingExperts = experts.filter((e) => e.expertStatus === "PENDING_APPROVAL");
  const otherExperts = experts.filter((e) => e.expertStatus !== "PENDING_APPROVAL");

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-12">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-background px-4 md:px-8 pt-8 pb-16 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-7 h-7 text-primary" />
              <h1 className="text-2xl md:text-3xl">Admin Panel</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Create expert accounts and manage approvals.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 mt-8 space-y-6">
          {/* Global feedback */}
          {globalError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
              {globalError}
            </p>
          )}
          {successMsg && (
            <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3">
              {successMsg}
            </p>
          )}

          {/* ── Analytics ─────────────────────────────────────────────── */}
          <Card className="rounded-3xl border-none shadow-lg p-6">
            <div className="flex items-center gap-3 mb-5">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Analytics</h2>
            </div>
            {loadingSummary ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading analytics...
              </div>
            ) : (
              <div className="space-y-5">
                {/* Core counts */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Total events (30d)</p>
                    <p className="text-xl font-semibold">{analyticsSummary?.totalEvents ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Signups (30d)</p>
                    <p className="text-xl font-semibold">{analyticsSummary?.signups ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Active users (7d)</p>
                    <p className="text-xl font-semibold">{analyticsSummary?.activeSessions ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Chat messages (30d)</p>
                    <p className="text-xl font-semibold">{analyticsSummary?.chatMessages ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Unique users (30d)</p>
                    <p className="text-xl font-semibold">{analyticsSummary?.uniqueUsers ?? 0}</p>
                  </div>
                </div>

                {/* RAG source breakdown */}
                {analyticsSummary?.ragSourceBreakdown && Object.keys(analyticsSummary.ragSourceBreakdown).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">RAG Source (all-time)</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(analyticsSummary.ragSourceBreakdown).map(([src, count]) => (
                        <div key={src} className="rounded-xl bg-primary/5 border border-primary/10 p-2.5">
                          <p className="text-[11px] text-muted-foreground font-mono">{src}</p>
                          <p className="text-lg font-semibold">{count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Retention */}
                {analyticsSummary?.retention && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Retention</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { label: "Day 2", value: analyticsSummary.retention.day2 },
                          { label: "Day 5", value: analyticsSummary.retention.day5 },
                          { label: "Day 10", value: analyticsSummary.retention.day10 },
                        ] as { label: string; value: number | null }[]
                      ).map(({ label, value }) => (
                        <div key={label} className="rounded-xl bg-muted/40 p-3 text-center">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="text-xl font-semibold">
                            {value === null ? (
                              <span className="text-muted-foreground text-sm">—</span>
                            ) : (
                              `${value}%`
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      — means not enough users have reached that day yet.
                    </p>
                  </div>
                )}

                {/* Recent events feed */}
                {analyticsSummary?.recentEvents && analyticsSummary.recentEvents.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Recent Activity</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {analyticsSummary.recentEvents.map((ev, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                          <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-[10px]">
                            {ev.eventName}
                          </span>
                          <span className="truncate font-mono opacity-50">
                            {ev.userId?.slice(0, 8) ?? "anon"}…
                          </span>
                          <span className="ml-auto shrink-0">
                            {new Date(ev.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>


          {/* ── Create Expert Account ─────────────────────────────────── */}
          <Card className="rounded-3xl border-none shadow-lg p-6">
            <div className="flex items-center gap-3 mb-5">
              <UserPlus className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Create Expert Account</h2>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full name</label>
                  <Input
                    id="admin-expert-name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Dr. Priya Sharma"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    id="admin-expert-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="doctor@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Temporary password</label>
                  <Input
                    id="admin-expert-password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Min. 8 characters"
                    minLength={8}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    id="admin-expert-role"
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {EXPERT_ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Specialization <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Input
                    id="admin-expert-specialization"
                    value={form.specialization}
                    onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))}
                    placeholder="e.g. Postpartum Nutrition, High-risk Pregnancy"
                  />
                </div>
              </div>

              {createError && (
                <p className="text-sm text-destructive">{createError}</p>
              )}
              {createSuccess && (
                <p className="text-sm text-green-700 dark:text-green-400">{createSuccess}</p>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={creating} className="rounded-full px-8">
                  {creating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</>
                  ) : (
                    <><UserPlus className="w-4 h-4 mr-2" /> Create Account</>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* ── Pending Approvals ─────────────────────────────────────── */}
          <Card className="rounded-3xl border-none shadow-lg p-6">
            <div className="flex items-center gap-3 mb-5">
              <Users className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold">
                Pending Approvals
                {pendingExperts.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-amber-500 text-white">
                    {pendingExperts.length}
                  </span>
                )}
              </h2>
            </div>
            {loadingExperts ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : pendingExperts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No pending approvals 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {pendingExperts.map((expert) => (
                  <ExpertRow
                    key={expert.id}
                    expert={expert}
                    actionLoading={actionLoading}
                    onApprove={handleApprove}
                    onSuspend={handleSuspend}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* ── All Experts ───────────────────────────────────────────── */}
          {otherExperts.length > 0 && (
            <Card className="rounded-3xl border-none shadow-lg p-6">
              <div className="flex items-center gap-3 mb-5">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">All Experts</h2>
              </div>
              <div className="space-y-3">
                {otherExperts.map((expert) => (
                  <ExpertRow
                    key={expert.id}
                    expert={expert}
                    actionLoading={actionLoading}
                    onApprove={handleApprove}
                    onSuspend={handleSuspend}
                  />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// ─── Expert Row sub-component ─────────────────────────────────────────────────

function ExpertRow({
  expert,
  actionLoading,
  onApprove,
  onSuspend,
}: {
  expert: Expert;
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onSuspend: (id: string) => void;
}) {
  const status = expert.expertStatus ?? "UNKNOWN";
  const badgeCls = statusBadge[status] ?? "bg-gray-100 text-gray-600";
  const approveLoading = actionLoading === expert.id + "-approve";
  const suspendLoading = actionLoading === expert.id + "-suspend";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-muted/30 rounded-2xl">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{expert.name}</p>
        <p className="text-sm text-muted-foreground truncate">{expert.email}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-muted-foreground">{expert.role.replace("_", " ")}</span>
          {expert.specialization && (
            <span className="text-xs text-muted-foreground">· {expert.specialization}</span>
          )}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}>
            {status.replace("_", " ")}
          </span>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        {status !== "APPROVED" && (
          <Button
            size="sm"
            className="rounded-full gap-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onApprove(expert.id)}
            disabled={approveLoading || suspendLoading}
          >
            {approveLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle className="w-3 h-3" />
            )}
            Approve
          </Button>
        )}
        {status !== "SUSPENDED" && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-1 border-destructive text-destructive hover:bg-destructive hover:text-white"
            onClick={() => onSuspend(expert.id)}
            disabled={approveLoading || suspendLoading}
          >
            {suspendLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            Suspend
          </Button>
        )}
      </div>
    </div>
  );
}
