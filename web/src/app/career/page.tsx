"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Lightbulb,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserProfile } from "@/hooks/use-user-profile";
import { api } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

type CareerPlan = {
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

const defaultForm = {
  profession: "",
  employer: "",
  workBeforePregnancy: "",
  maternityLeave: "",
  stayAtHomeDuration: "",
  planningCareerChange: "",
  stayConnectedBusiness: "",
  breakStartDate: "",
  returnDate: "",
};

// ─── Career Insights via DuckDuckGo Instant Answer ───────────────────────────

type DdgInsight = { heading: string; text: string; url: string } | null;

async function fetchCareerInsight(profession: string): Promise<DdgInsight> {
  try {
    const q = encodeURIComponent(
      `${profession} return to work after maternity leave tips India`
    );
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${q}&format=json&no_redirect=1&no_html=1`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      Heading?: string;
      AbstractText?: string;
      AbstractURL?: string;
      RelatedTopics?: { Text?: string; FirstURL?: string }[];
    };
    if (data.AbstractText) {
      return {
        heading: data.Heading ?? profession,
        text: data.AbstractText,
        url: data.AbstractURL ?? "",
      };
    }
    // Try first related topic as fallback
    const related = data.RelatedTopics?.[0];
    if (related?.Text) {
      return { heading: profession, text: related.Text, url: related.FirstURL ?? "" };
    }
  } catch {
    // silently fall through to static fallback
  }
  return null;
}

const STATIC_CAREER_TIPS: Record<string, string> = {
  default:
    "Many mothers find that easing back to work gradually — starting with part-time hours or remote days — helps them manage both work expectations and infant care. Document your skills and achievements from the maternity period (project management, scheduling, multitasking) and frame them as professional strengths.",
  teacher:
    "Reconnect with your school or institution before return. Reviewing updated curricula or lesson plans during the last weeks of leave helps reduce first-week anxiety and signals commitment to your team.",
  engineer:
    "Spend a few hours before return reviewing recent tech updates, PRs, or design docs in your area. A short 'knowledge refresh sprint' of 1-2 hours/day in week 8 onward ensures you return confidently.",
  doctor:
    "Check with your clinical lead for any updated protocols or new equipment adopted during your absence. Consider a phased clinical return with a buddy system in the first two weeks.",
  nurse:
    "Review any updated ward protocols and check if your BLS/ACLS certifications are current. Many hospitals offer refresher shifts — ask HR about phased return options.",
};

function getStaticTip(profession: string): string {
  const lower = profession.toLowerCase();
  for (const key of Object.keys(STATIC_CAREER_TIPS)) {
    if (key !== "default" && lower.includes(key)) return STATIC_CAREER_TIPS[key];
  }
  return STATIC_CAREER_TIPS.default;
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function CareerTimeline({
  breakStartDate,
  returnDate,
}: {
  breakStartDate?: string | null;
  returnDate?: string | null;
}) {
  const today = new Date();

  const start = breakStartDate ? new Date(breakStartDate) : null;
  const end = returnDate ? new Date(returnDate) : null;

  const totalDays =
    start && end ? Math.max(1, (end.getTime() - start.getTime()) / 86400000) : null;
  const elapsedDays =
    start ? Math.max(0, (today.getTime() - start.getTime()) / 86400000) : null;
  const pct =
    totalDays && elapsedDays != null
      ? Math.min(100, Math.round((elapsedDays / totalDays) * 100))
      : null;

  const daysToReturn =
    end ? Math.ceil((end.getTime() - today.getTime()) / 86400000) : null;

  if (!start && !end) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {start ? start.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
        </span>
        <span className="font-medium text-foreground">Leave journey</span>
        <span className="text-muted-foreground">
          {end ? end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
        </span>
      </div>

      {pct !== null && (
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
          {/* Today marker */}
          <div
            className="absolute top-0 h-full w-0.5 bg-foreground/40"
            style={{ left: `${pct}%` }}
          />
        </div>
      )}

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Leave start</span>
        <span className="font-medium text-primary">
          {daysToReturn !== null
            ? daysToReturn > 0
              ? `${daysToReturn} days to return`
              : daysToReturn === 0
              ? "Return date is today! 🎉"
              : `${Math.abs(daysToReturn)} days overdue`
            : "Today"}
        </span>
        <span>Return target</span>
      </div>
    </div>
  );
}

// ─── Plan Dashboard ───────────────────────────────────────────────────────────

function CareerDashboard({
  plan,
  daysSinceBirth,
  completedTasks,
  toggleReturnTask,
  saving,
  onEdit,
}: {
  plan: CareerPlan;
  daysSinceBirth: number | null;
  completedTasks: string[];
  toggleReturnTask: (task: string) => void;
  saving: boolean;
  onEdit: () => void;
}) {
  const [insight, setInsight] = useState<DdgInsight>(null);
  const [insightLoading, setInsightLoading] = useState(true);

  useEffect(() => {
    if (!plan.profession) {
      setInsightLoading(false);
      return;
    }
    fetchCareerInsight(plan.profession).then((res) => {
      setInsight(res);
      setInsightLoading(false);
    });
  }, [plan.profession]);

  const milestones = useMemo(() => {
    if (daysSinceBirth === null || daysSinceBirth < 42) return [];
    return [
      "Check in with your doctor about a safe first return-to-work step.",
      "Review flexible work or caregiving options with your employer.",
      "Set a gentle first-week goal for business, training, or networking.",
      "Create a simple schedule that balances rest and work energy.",
      "Update your professional profile or portfolio with recent achievements.",
    ];
  }, [daysSinceBirth]);

  return (
    <div className="space-y-6">
      {/* ── Header card ───────────────────────────────────────────────────── */}
      <Card className="rounded-3xl border-none shadow-lg p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-5 h-5 text-primary" />
              <h3>{plan.profession ?? "Your career plan"}</h3>
            </div>
            {plan.employer && (
              <p className="text-sm text-muted-foreground">{plan.employer}</p>
            )}
          </div>
          <Button
            id="career-edit-btn"
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="rounded-full gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit plan
          </Button>
        </div>

        <CareerTimeline
          breakStartDate={plan.breakStartDate}
          returnDate={plan.returnDate}
        />
      </Card>

      {/* ── Return-to-work milestones ──────────────────────────────────────── */}
      {milestones.length > 0 && (
        <Card className="rounded-3xl border-none shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3>Return-to-work milestones</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Gentle steps to ease back into work after 6 weeks postpartum.
          </p>
          <div className="space-y-3">
            {milestones.map((task) => {
              const done = completedTasks.includes(task);
              return (
                <button
                  key={task}
                  id={`milestone-${task.slice(0, 20).replace(/\s/g, "-")}`}
                  type="button"
                  onClick={() => toggleReturnTask(task)}
                  disabled={saving}
                  className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
                    done
                      ? "border-primary/40 bg-primary/8 text-primary"
                      : "border-muted/30 bg-muted/5 text-foreground hover:bg-muted/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      className={`w-4 h-4 flex-shrink-0 ${done ? "text-primary fill-primary/20" : "text-muted-foreground"}`}
                    />
                    <span className={`text-sm ${done ? "line-through opacity-60" : ""}`}>
                      {task}
                    </span>
                    <span className="ml-auto text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {done ? "Done" : "Mark done"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Career insight (DDG / static) ─────────────────────────────────── */}
      <Card className="rounded-3xl border-none shadow-lg p-6 bg-gradient-to-br from-accent/10 to-background">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="w-5 h-5 text-accent-foreground" />
          <h3>Career insight</h3>
        </div>

        {insightLoading ? (
          <div className="space-y-2">
            <div className="h-3 bg-muted/40 rounded animate-pulse w-full" />
            <div className="h-3 bg-muted/40 rounded animate-pulse w-5/6" />
            <div className="h-3 bg-muted/40 rounded animate-pulse w-4/6" />
          </div>
        ) : insight ? (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">{insight.text}</p>
            {insight.url && (
              <a
                href={insight.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Read more <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <p className="text-xs text-muted-foreground">Source: DuckDuckGo</p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">
            {plan.profession ? getStaticTip(plan.profession) : getStaticTip("default")}
          </p>
        )}
      </Card>

      {/* ── Plan details summary ───────────────────────────────────────────── */}
      {plan.planItems && (
        <Card className="rounded-3xl border-none shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h3>Your plan summary</h3>
          </div>
          <div className="space-y-3 text-sm">
            {plan.planItems.maternityLeave && (
              <div className="flex justify-between py-2 border-b border-muted/20">
                <span className="text-muted-foreground">Maternity leave</span>
                <span>{plan.planItems.maternityLeave}</span>
              </div>
            )}
            {plan.planItems.stayAtHomeDuration && (
              <div className="flex justify-between py-2 border-b border-muted/20">
                <span className="text-muted-foreground">Staying home</span>
                <span>{plan.planItems.stayAtHomeDuration}</span>
              </div>
            )}
            {plan.planItems.planningCareerChange && (
              <div className="flex justify-between py-2 border-b border-muted/20">
                <span className="text-muted-foreground">Career change?</span>
                <span>{plan.planItems.planningCareerChange}</span>
              </div>
            )}
            {plan.planItems.workBeforePregnancy && (
              <div className="pt-2">
                <p className="text-muted-foreground mb-1">Before pregnancy</p>
                <p className="leading-relaxed">{plan.planItems.workBeforePregnancy}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CareerPage() {
  const { user, loading } = useUserProfile();
  const [careerPlan, setCareerPlan] = useState<CareerPlan | null>(null);
  const [formState, setFormState] = useState(defaultForm);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const stageLabel = user?.babyBirthDate
    ? "Postpartum transition"
    : user?.dueDate
    ? "Pregnancy transition"
    : "Career transition";

  const daysSinceBirth = useMemo(() => {
    if (!user?.babyBirthDate) return null;
    return Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(user.babyBirthDate).getTime()) / 86400000
      )
    );
  }, [user?.babyBirthDate]);

  // ── Populate form from loaded profile ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const plan = user.careerPlan ?? null;
    setCareerPlan(plan);

    if (plan) {
      setFormState({
        profession: plan.profession ?? "",
        employer: plan.employer ?? "",
        workBeforePregnancy: plan.planItems?.workBeforePregnancy ?? "",
        maternityLeave: plan.planItems?.maternityLeave ?? "",
        stayAtHomeDuration: plan.planItems?.stayAtHomeDuration ?? "",
        planningCareerChange: plan.planItems?.planningCareerChange ?? "",
        stayConnectedBusiness: plan.planItems?.stayConnectedBusiness ?? "",
        breakStartDate: plan.breakStartDate ? plan.breakStartDate.slice(0, 10) : "",
        returnDate: plan.returnDate ? plan.returnDate.slice(0, 10) : "",
      });
      setCompletedTasks(plan.planItems?.returnToWorkChecklist ?? []);
      // Plan exists → show dashboard, not form
      setIsEditing(false);
    } else {
      // No plan saved yet → show form
      setIsEditing(true);
    }
  }, [user]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const savePlan = useCallback(
    async (updatedChecklist?: string[]) => {
      if (!user) return;
      setSaving(true);
      setErrorMessage(null);
      setStatusMessage(null);

      try {
        const payload = {
          profession: formState.profession || undefined,
          employer: formState.employer || undefined,
          breakStartDate: formState.breakStartDate || undefined,
          returnDate: formState.returnDate || undefined,
          planItems: {
            workBeforePregnancy: formState.workBeforePregnancy || undefined,
            maternityLeave: formState.maternityLeave || undefined,
            stayAtHomeDuration: formState.stayAtHomeDuration || undefined,
            planningCareerChange: formState.planningCareerChange || undefined,
            stayConnectedBusiness: formState.stayConnectedBusiness || undefined,
            returnToWorkChecklist: updatedChecklist ?? completedTasks,
          },
        };

        const response = (await api.post("/auth/career-plan", payload)) as CareerPlan;
        setCareerPlan(response);
        setStatusMessage("Career plan saved!");
        // Switch to dashboard view on successful save
        setIsEditing(false);
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to save your plan."
        );
      } finally {
        setSaving(false);
      }
    },
    [user, formState, completedTasks]
  );

  const toggleReturnTask = useCallback(
    async (task: string) => {
      const next = completedTasks.includes(task)
        ? completedTasks.filter((t) => t !== task)
        : [...completedTasks, task];
      setCompletedTasks(next);
      await savePlan(next);
    },
    [completedTasks, savePlan]
  );

  const hasPlan = Boolean(careerPlan?.profession);

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-background px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl mb-2">Career Journey for {firstName}</h1>
            <p className="text-muted-foreground">{stageLabel}</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 mt-6 space-y-6">
          {loading ? (
            <Card className="rounded-3xl border-none shadow-lg p-8 text-center">
              <p className="text-muted-foreground animate-pulse">Loading your career plan…</p>
            </Card>
          ) : hasPlan && !isEditing ? (
            /* ── Dashboard View ──────────────────────────────────────────── */
            <>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Your career plan is saved. Track milestones and insights below.
                </p>
              </div>
              <CareerDashboard
                plan={careerPlan!}
                daysSinceBirth={daysSinceBirth}
                completedTasks={completedTasks}
                toggleReturnTask={toggleReturnTask}
                saving={saving}
                onEdit={() => setIsEditing(true)}
              />
            </>
          ) : (
            /* ── Form View ───────────────────────────────────────────────── */
            <>
              {hasPlan && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="rounded-full text-muted-foreground"
                  >
                    ← Back to dashboard
                  </Button>
                </div>
              )}

              <Card className="rounded-3xl border-none shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <h3>Your work and leave plans</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Current role or profession
                      </label>
                      <Input
                        id="career-profession"
                        value={formState.profession}
                        onChange={(e) =>
                          setFormState((p) => ({ ...p, profession: e.target.value }))
                        }
                        placeholder="e.g. product manager, teacher, software engineer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Employer or business name
                      </label>
                      <Input
                        id="career-employer"
                        value={formState.employer}
                        onChange={(e) =>
                          setFormState((p) => ({ ...p, employer: e.target.value }))
                        }
                        placeholder="e.g. Acme Health, freelance, startup founder"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      What were you doing before or during pregnancy?
                    </label>
                    <Textarea
                      id="career-work-before"
                      value={formState.workBeforePregnancy}
                      onChange={(e) =>
                        setFormState((p) => ({ ...p, workBeforePregnancy: e.target.value }))
                      }
                      placeholder="Example: working full-time in marketing, part-time freelance, or focused on family care."
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Are you getting maternity leave?
                      </label>
                      <Input
                        id="career-maternity-leave"
                        value={formState.maternityLeave}
                        onChange={(e) =>
                          setFormState((p) => ({ ...p, maternityLeave: e.target.value }))
                        }
                        placeholder="Yes, 12 weeks / No / Unsure"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        How long do you plan to stay at home?
                      </label>
                      <Input
                        id="career-stay-home"
                        value={formState.stayAtHomeDuration}
                        onChange={(e) =>
                          setFormState((p) => ({
                            ...p,
                            stayAtHomeDuration: e.target.value,
                          }))
                        }
                        placeholder="3 months, 6 months, until baby is 1 year old"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Are you planning a career change?
                    </label>
                    <Input
                      id="career-change"
                      value={formState.planningCareerChange}
                      onChange={(e) =>
                        setFormState((p) => ({
                          ...p,
                          planningCareerChange: e.target.value,
                        }))
                      }
                      placeholder="Yes / No / Thinking about it"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Would you like to stay connected to your business or industry?
                    </label>
                    <Textarea
                      id="career-stay-connected"
                      value={formState.stayConnectedBusiness}
                      onChange={(e) =>
                        setFormState((p) => ({
                          ...p,
                          stayConnectedBusiness: e.target.value,
                        }))
                      }
                      placeholder="Example: newsletters, small project, stay in touch with colleagues."
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Leave start date
                      </label>
                      <Input
                        id="career-break-start"
                        type="date"
                        value={formState.breakStartDate}
                        onChange={(e) =>
                          setFormState((p) => ({ ...p, breakStartDate: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Return-to-work target date
                      </label>
                      <Input
                        id="career-return-date"
                        type="date"
                        value={formState.returnDate}
                        onChange={(e) =>
                          setFormState((p) => ({ ...p, returnDate: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <p className="text-sm text-destructive">{errorMessage}</p>
                  )}
                  {statusMessage && (
                    <p className="text-sm text-primary">{statusMessage}</p>
                  )}

                  <div className="flex justify-end">
                    <Button
                      id="career-save-btn"
                      onClick={() => savePlan()}
                      disabled={saving}
                      className="rounded-full px-8"
                    >
                      {saving ? "Saving…" : "Save career plan →"}
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
