"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Star,
  MapPin,
  Globe,
  MessageCircle,
  ChevronRight,
  Award,
  Languages,
  Dumbbell,
  Leaf,
  Salad,
  Music,
  X,
  Send,
  Loader2,
  CheckCircle2,
  Filter,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getTrainers, submitTrainerQuestion, Trainer } from "@/services/trainers.service";
import { fetchMe } from "@/lib/api-client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_META: Record<
  Trainer["role"],
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  YOGA_TRAINER: {
    label: "Yoga Trainer",
    color: "text-violet-700",
    bg: "bg-violet-100",
    icon: Leaf,
  },
  WORKOUT_TRAINER: {
    label: "Gym Trainer",
    color: "text-orange-700",
    bg: "bg-orange-100",
    icon: Dumbbell,
  },
  NUTRITIONIST: {
    label: "Nutritionist",
    color: "text-green-700",
    bg: "bg-green-100",
    icon: Salad,
  },
  DANCE_TEACHER: {
    label: "Dance Coach",
    color: "text-pink-700",
    bg: "bg-pink-100",
    icon: Music,
  },
};

const FILTER_TABS = [
  { value: "", label: "All" },
  { value: "YOGA_TRAINER", label: "Yoga" },
  { value: "WORKOUT_TRAINER", label: "Gym" },
  { value: "NUTRITIONIST", label: "Nutrition" },
  { value: "DANCE_TEACHER", label: "Dance" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Ask Question Modal ────────────────────────────────────────────────────────

function AskModal({
  trainer,
  onClose,
}: {
  trainer: Trainer;
  onClose: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const meta = ROLE_META[trainer.role];
  const Icon = meta.icon;

  const handleSubmit = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    try {
      await submitTrainerQuestion({
        trainerId: trainer.id,
        trainerRole: trainer.role,
        questionText: question.trim(),
      });
      setDone(true);
    } catch {
      setError("Could not send your question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div
          className={`${meta.bg} px-6 py-5 flex items-center gap-4`}
        >
          <div className="w-12 h-12 rounded-2xl bg-white/60 flex items-center justify-center shrink-0">
            <Icon className={`w-6 h-6 ${meta.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground">{trainer.name}</p>
            <p className={`text-sm font-medium ${meta.color}`}>{meta.label}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center hover:bg-white/90 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-lg mb-1">Question Sent!</p>
              <p className="text-sm text-muted-foreground">
                {trainer.name} will review your question and you&apos;ll get a
                notification once they respond.
              </p>
              <Button
                className="mt-4 rounded-full"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                Ask <span className="font-medium text-foreground">{trainer.name}</span> a question.
                You&apos;ll be notified when they respond.
              </p>
              <Textarea
                id="trainer-question-input"
                placeholder={`e.g. "What yoga poses are safe in the third trimester?"`}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
                className="resize-none rounded-2xl"
              />
              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-full gap-2"
                  onClick={handleSubmit}
                  disabled={loading || !question.trim()}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Question
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Trainer Card ─────────────────────────────────────────────────────────────

function TrainerCard({
  trainer,
  onAsk,
}: {
  trainer: Trainer;
  onAsk: (t: Trainer) => void;
}) {
  const meta = ROLE_META[trainer.role];
  const Icon = meta.icon;
  const avatarSrc = trainer.avatarUrl || trainer.profileImage;

  return (
    <Card className="rounded-3xl border-none shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
      {/* Top accent bar */}
      <div className={`h-1.5 w-full ${meta.bg.replace("bg-", "bg-gradient-to-r from-").replace("100", "400")} opacity-60`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt={trainer.name}
                className="w-14 h-14 rounded-2xl object-cover"
              />
            ) : (
              <div
                className={`w-14 h-14 rounded-2xl ${meta.bg} flex items-center justify-center`}
              >
                <span className={`text-lg font-bold ${meta.color}`}>
                  {initials(trainer.name)}
                </span>
              </div>
            )}
            {trainer.isFeatured && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-base leading-tight">{trainer.name}</h3>
                {trainer.specialization && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {trainer.specialization}
                  </p>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${meta.bg} ${meta.color}`}
              >
                <span className="flex items-center gap-1">
                  <Icon className="w-3 h-3" />
                  {meta.label}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {trainer.bio && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
            {trainer.bio}
          </p>
        )}

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {trainer.city && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
              <MapPin className="w-3 h-3" />
              {trainer.city}
            </span>
          )}
          {trainer.languagesSpoken?.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
              <Languages className="w-3 h-3" />
              {trainer.languagesSpoken.join(", ")}
            </span>
          )}
          {trainer.contributionCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <Award className="w-3 h-3" />
              {trainer.contributionCount} reviews
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            id={`ask-trainer-${trainer.id}`}
            className="flex-1 rounded-full gap-2 text-sm"
            onClick={() => onAsk(trainer)}
          >
            <MessageCircle className="w-4 h-4" />
            Ask a Question
          </Button>
          {trainer.externalLink && (
            <a
              href={trainer.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0"
              aria-label="External profile"
            >
              <Globe className="w-4 h-4 text-muted-foreground" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [activeModal, setActiveModal] = useState<Trainer | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check auth (for gating "Ask a Question")
  useEffect(() => {
    fetchMe()
      .then((u) => setIsLoggedIn(!!u))
      .catch(() => setIsLoggedIn(false));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTrainers({ role: roleFilter || undefined });
      setTrainers(data);
    } catch {
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = trainers.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.specialization ?? "").toLowerCase().includes(q) ||
      (t.city ?? "").toLowerCase().includes(q) ||
      (t.bio ?? "").toLowerCase().includes(q)
    );
  });

  const handleAsk = (trainer: Trainer) => {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    setActiveModal(trainer);
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-12">
        {/* Hero header */}
        <div className="bg-gradient-to-br from-violet-500/20 via-pink-500/10 to-background px-4 md:px-8 pt-8 pb-10 rounded-b-[3rem]">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-1 text-sm font-medium text-primary">
              <MapPin className="w-4 h-4" />
              Tri-City · Chandigarh · Mohali · Panchkula
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Top Trainers &amp; Nutritionists
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Connect with verified local experts in yoga, fitness, nutrition, and dance —
              specialising in pregnancy and postpartum wellness.
            </p>

            {/* Search bar */}
            <div className="relative mt-5 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="trainer-search"
                placeholder="Search by name, specialty, or city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 rounded-full bg-background/80 backdrop-blur border-border/60"
              />
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-8 mt-6">
          {/* Role filter tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                id={`filter-${tab.value || "all"}`}
                onClick={() => setRoleFilter(tab.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  roleFilter === tab.value
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Stats bar */}
          {!loading && filtered.length > 0 && (
            <p className="text-sm text-muted-foreground mb-5">
              Showing{" "}
              <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
              verified expert{filtered.length !== 1 ? "s" : ""}
              {search ? ` for "${search}"` : ""}
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl bg-card shadow-md p-5 animate-pulse h-52"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <p className="font-semibold mb-1">No trainers found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter.
              </p>
              {search && (
                <Button
                  variant="outline"
                  className="mt-4 rounded-full"
                  onClick={() => setSearch("")}
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((t) => (
                <TrainerCard key={t.id} trainer={t} onAsk={handleAsk} />
              ))}
            </div>
          )}

          {/* CTA for non-logged-in users */}
          {!isLoggedIn && (
            <div className="mt-10 rounded-3xl bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-base">Want to ask a question?</p>
                <p className="text-sm text-muted-foreground">
                  Sign in to send your question directly to any trainer — they'll
                  respond in-app and you'll get notified.
                </p>
              </div>
              <a href="/login">
                <Button className="rounded-full gap-2 shrink-0">
                  Sign In to Ask
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Ask modal */}
      {activeModal && (
        <AskModal
          trainer={activeModal}
          onClose={() => setActiveModal(null)}
        />
      )}
    </AppShell>
  );
}
