"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Calendar, Star, Sparkles, CheckCircle2, BookOpen } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserProfile } from "@/hooks/use-user-profile";
import { api } from "@/lib/api-client";

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

function formatDaysAgo(days: number) {
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function CareerPage() {
  const { user, loading } = useUserProfile();
  const [careerPlan, setCareerPlan] = useState<CareerPlan | null>(null);
  const [formState, setFormState] = useState(defaultForm);
  const [exerciseLog, setExerciseLog] = useState<string[]>([]);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const headline = `Career Journey for ${firstName}`;
  const stageLabel = user?.babyBirthDate
    ? "Postpartum transition"
    : user?.dueDate
    ? "Pregnancy transition"
    : "Career transition";
  const introText = user?.name
    ? `Hi ${firstName}, this section helps you capture your work history, leave plans, and return-to-work ideas.`
    : "Complete your profile to turn career support into a personalized path.";

  const daysSinceBirth = useMemo(() => {
    if (!user?.babyBirthDate) return null;
    const birthDate = new Date(user.babyBirthDate);
    const today = new Date();
    return Math.max(0, Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)));
  }, [user?.babyBirthDate]);

  const suggestionItems = useMemo(() => {
    const items: string[] = [];
    if (user?.dueDate && !user?.babyBirthDate) {
      items.push("Talk with your employer about expected maternity leave and a gentle return schedule.");
    }
    if (formState.maternityLeave.toLowerCase().startsWith("y")) {
      items.push("Keep a simple handover note for your team so your leave starts with confidence.");
    }
    if (formState.planningCareerChange.toLowerCase().startsWith("y")) {
      items.push("Use leave time to explore new roles, update your resume, and keep learning.");
    }
    if (daysSinceBirth !== null) {
      if (daysSinceBirth < 42) {
        items.push("Focus on recovery first. In about 6 weeks we’ll help you ease back into work.");
      } else {
        items.push("Now is a good time to reconnect with your business gently and set small next steps.");
      }
    }
    if (!items.length) {
      items.push("Answer the short questions below to receive the most relevant career guidance.");
    }
    return items;
  }, [user?.dueDate, formState.maternityLeave, formState.planningCareerChange, daysSinceBirth]);

  useEffect(() => {
    if (!user) return;
    const plan = user.careerPlan ?? null;
    setCareerPlan(plan);
    setFormState({
      profession: plan?.profession ?? "",
      employer: plan?.employer ?? "",
      workBeforePregnancy: plan?.planItems?.workBeforePregnancy ?? "",
      maternityLeave: plan?.planItems?.maternityLeave ?? "",
      stayAtHomeDuration: plan?.planItems?.stayAtHomeDuration ?? "",
      planningCareerChange: plan?.planItems?.planningCareerChange ?? "",
      stayConnectedBusiness: plan?.planItems?.stayConnectedBusiness ?? "",
      breakStartDate: plan?.breakStartDate ? plan.breakStartDate.slice(0, 10) : "",
      returnDate: plan?.returnDate ? plan.returnDate.slice(0, 10) : "",
    });
    setExerciseLog(plan?.planItems?.exerciseLog ?? []);
    setCompletedTasks(plan?.planItems?.returnToWorkChecklist ?? []);
  }, [user]);

  const savePlan = async (updatedExerciseLog?: string[], updatedChecklist?: string[]) => {
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
          exerciseLog: updatedExerciseLog ?? exerciseLog,
          returnToWorkChecklist: updatedChecklist ?? completedTasks,
        },
      };

      const response = (await api.post("/auth/career-plan", payload)) as CareerPlan;
      setCareerPlan(response);
      setExerciseLog(response.planItems?.exerciseLog ?? []);
      setStatusMessage("Career plan saved successfully.");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save your plan.");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteExercise = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const nextLog = exerciseLog.includes(today) ? exerciseLog : [today, ...exerciseLog].slice(0, 30);
    setExerciseLog(nextLog);
    await savePlan(nextLog, undefined);
  };

  const returnToWorkTasks = useMemo(() => {
    if (daysSinceBirth === null || daysSinceBirth < 42) {
      return [];
    }

    return [
      "Check in with your doctor about a safe first return-to-work step.",
      "Review flexible work or caregiving options with your employer.",
      "Set a gentle first-week goal for business, training, or networking.",
      "Create a simple schedule that balances rest and work energy.",
      "Update your professional profile or portfolio with recent achievements.",
    ];
  }, [daysSinceBirth]);

  const toggleReturnTask = async (task: string) => {
    const nextTasks = completedTasks.includes(task)
      ? completedTasks.filter((item) => item !== task)
      : [...completedTasks, task];
    setCompletedTasks(nextTasks);
    await savePlan(undefined, nextTasks);
  };

  const completedToday = exerciseLog.includes(new Date().toISOString().slice(0, 10));
  const recentExerciseCount = exerciseLog.filter((date) => {
    const day = new Date(date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return day >= weekAgo;
  }).length;

  return (
    <AppShell>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl mb-4">{headline}</h1>
        <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{stageLabel}</p>
              <p className="text-base text-foreground max-w-2xl">{introText}</p>
            </div>
            <div className="rounded-3xl bg-primary/5 p-4 text-sm text-primary">
              {user?.babyBirthDate
                ? daysSinceBirth !== null
                  ? `${daysSinceBirth} days postpartum`
                  : "Postpartum stage"
                : user?.dueDate
                ? "Pregnancy stage"
                : "Career planning stage"}
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <Card className="rounded-3xl border-none shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="w-5 h-5 text-primary" />
                <h3>Your work and leave plans</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">What were you doing before or during pregnancy?</label>
                  <Textarea
                    value={formState.workBeforePregnancy}
                    onChange={(event) => setFormState((prev) => ({ ...prev, workBeforePregnancy: event.target.value }))}
                    placeholder="Example: working full-time in marketing, part-time freelance, or focused on family care."
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Are you getting maternity leave?</label>
                  <Input
                    value={formState.maternityLeave}
                    onChange={(event) => setFormState((prev) => ({ ...prev, maternityLeave: event.target.value }))}
                    placeholder="Yes, at least 12 weeks / No / Unsure"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">How long do you plan to stay at home?</label>
                  <Input
                    value={formState.stayAtHomeDuration}
                    onChange={(event) => setFormState((prev) => ({ ...prev, stayAtHomeDuration: event.target.value }))}
                    placeholder="3 months, 6 months, until baby is 1 year old"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Are you planning a career change?</label>
                  <Input
                    value={formState.planningCareerChange}
                    onChange={(event) => setFormState((prev) => ({ ...prev, planningCareerChange: event.target.value }))}
                    placeholder="Yes / No / Thinking about it"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Would you like to stay connected to your business or industry?</label>
                  <Textarea
                    value={formState.stayConnectedBusiness}
                    onChange={(event) => setFormState((prev) => ({ ...prev, stayConnectedBusiness: event.target.value }))}
                    placeholder="Example: receive newsletters, maintain a small project, stay in touch with colleagues."
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Current role or profession</label>
                    <Input
                      value={formState.profession}
                      onChange={(event) => setFormState((prev) => ({ ...prev, profession: event.target.value }))}
                      placeholder="e.g. product manager, teacher, software engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Employer or business name</label>
                    <Input
                      value={formState.employer}
                      onChange={(event) => setFormState((prev) => ({ ...prev, employer: event.target.value }))}
                      placeholder="e.g. Acme Health, freelance, startup founder"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Maternity leave start date</label>
                    <Input
                      type="date"
                      value={formState.breakStartDate}
                      onChange={(event) => setFormState((prev) => ({ ...prev, breakStartDate: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Return-to-work target date</label>
                    <Input
                      type="date"
                      value={formState.returnDate}
                      onChange={(event) => setFormState((prev) => ({ ...prev, returnDate: event.target.value }))}
                    />
                  </div>
                </div>
                {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
                {statusMessage ? <p className="text-sm text-primary">{statusMessage}</p> : null}
                <div className="flex justify-end">
                  <Button onClick={() => savePlan()} disabled={saving}>
                    {saving ? "Saving…" : "Save career plan"}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border-none shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3>Suggested guidance</h3>
              </div>
              <div className="space-y-3">
                {suggestionItems.map((item, index) => (
                  <div key={index} className="rounded-3xl bg-muted/10 p-4">
                    <p className="text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl border-none shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-5 h-5 text-primary" />
                <h3>Latest career news</h3>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  We will use your leave timeline and career goals to suggest helpful actions, from stay-at-home planning to gentle business reconnection.
                </p>
                {user?.babyBirthDate && daysSinceBirth !== null ? (
                  <p>
                    {daysSinceBirth < 42
                      ? "During the first 6 weeks after birth, the focus is on recovery and rest."
                      : "After 6 weeks postpartum, you can begin reconnecting to work with small, supportive steps."}
                  </p>
                ) : user?.dueDate ? (
                  <p>Preparing before baby arrives helps you return to work with less stress and more clarity.</p>
                ) : (
                  <p>Fill in the questions above and save your plan to see personalized career recommendations.</p>
                )}
              </div>
            </Card>

            {returnToWorkTasks.length ? (
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h3>Return-to-work checklist</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  After 6 weeks postpartum, these gentle steps can help you move back toward work or business involvement.
                </p>
                <div className="space-y-3">
                  {returnToWorkTasks.map((task) => {
                    const done = completedTasks.includes(task);
                    return (
                      <button
                        key={task}
                        type="button"
                        onClick={() => toggleReturnTask(task)}
                        className={`w-full rounded-3xl border p-4 text-left transition ${
                          done
                            ? 'border-primary/50 bg-primary/10 text-primary'
                            : 'border-muted/30 bg-muted/5 text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm">{task}</span>
                          <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                            {done ? 'Done' : 'Mark done'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            ) : null}

            <Card className="rounded-3xl border-none shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <h3>Body recovery tracker</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Track exercises and recovery habits so you can see progress over time.
              </p>
              <div className="space-y-4">
                <div className="rounded-3xl bg-muted/10 p-4">
                  <p className="text-sm">Completed in the last 7 days: {recentExerciseCount}</p>
                  <p className="text-sm">{completedToday ? "You’ve completed today’s activity." : "Tap the button when you complete today’s exercise."}</p>
                </div>
                <Button onClick={handleCompleteExercise} disabled={saving || completedToday}>
                  {completedToday ? "Completed today" : "I completed today’s exercise"}
                </Button>
                {exerciseLog.length ? (
                  <div className="rounded-3xl bg-muted/10 p-4">
                    <p className="text-sm font-medium mb-2">Recent exercise dates</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {exerciseLog.slice(0, 7).map((date) => (
                        <p key={date}>{date}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No exercise entries yet.</p>
                )}
              </div>
            </Card>

            <Card className="rounded-3xl border-none shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3>What comes next</h3>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>After 6–7 weeks postpartum, we can begin connecting you to career resources, business check-ins, and gentle planning steps.</p>
                <p>Use this space to save your career history and leave expectations, then check back for new recommendations.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
