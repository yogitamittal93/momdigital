"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Baby,
  CheckCircle2,
  ChefHat,
  Circle,
  Info,
  Lock,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useUserProfile } from "@/hooks/use-user-profile";
import { api } from "@/lib/api-client";
import {
  getDayNumber,
  getChecklistItemsForDay,
  TRUST_MILESTONES,
  type ChecklistItem,
} from "@/lib/nanny-checklist";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SavedCheck {
  id: string;
  helperType: string;
  checks: Record<string, boolean>;
  score: number;
  checkedAt: string;
}

// ── Chef checklist (local — no separate constants file needed) ─────────────────

const CHEF_CHECKLIST: ChecklistItem[] = [
  { id: "chef_handwash",        label: "Washed hands before cooking",                  critical: true  },
  { id: "chef_hair_tied",       label: "Hair tied back or covered",                    critical: true  },
  { id: "chef_clean_apron",     label: "Clean apron worn",                             critical: false },
  { id: "chef_raw_separation",  label: "Raw meat kept separate from other foods",      critical: true  },
  { id: "chef_cooked_temp",     label: "Food cooked to correct temperature",           critical: true  },
  { id: "chef_no_cross_contam", label: "Separate utensils for raw/cooked food",        critical: true  },
  { id: "chef_fridge_temp",     label: "Fridge temperature checked (below 5°C)",       critical: false },
  { id: "chef_pp_diet",         label: "Postpartum diet restrictions followed",        critical: false },
  { id: "chef_no_raw_food",     label: "No raw/undercooked food served to mother",     critical: true  },
  { id: "chef_clean_surfaces",  label: "Cooking surfaces cleaned before & after",      critical: false },
];

// ── Baby food stages (age-gated) ──────────────────────────────────────────────

interface FoodStage {
  id: string;
  label: string;
  ageMonths: number; // unlocks at this age
  icon: string;
  foods: string[];
  avoid: string[];
}

const FOOD_STAGES: FoodStage[] = [
  {
    id: "stage-0",
    label: "0–6 months",
    ageMonths: 0,
    icon: "🍼",
    foods: ["Breast milk", "Formula"],
    avoid: ["All solids", "Water (unless prescribed)", "Juice"],
  },
  {
    id: "stage-1",
    label: "6 months",
    ageMonths: 6,
    icon: "🥣",
    foods: [
      "Single-ingredient purees (sweet potato, carrot, banana)",
      "Rice cereal thinned with breast milk",
      "Pureed dal (no salt/spice)",
    ],
    avoid: ["Honey", "Cow's milk", "Whole nuts", "Salt or sugar"],
  },
  {
    id: "stage-2",
    label: "7–9 months",
    ageMonths: 7,
    icon: "🥦",
    foods: [
      "Thicker mashes — pea, spinach, lentil",
      "Soft cooked fruit pieces",
      "Khichdi (mild, soft)",
      "Curd (small amounts)",
    ],
    avoid: ["Honey", "Whole cow's milk as drink", "Choking hazards"],
  },
  {
    id: "stage-3",
    label: "10–12 months",
    ageMonths: 10,
    icon: "🫐",
    foods: [
      "Soft finger foods — ripe banana, cooked potato cubes",
      "Soft roti pieces",
      "Scrambled egg (well cooked)",
      "Small pasta shapes",
    ],
    avoid: ["Honey", "Whole grapes (halve them)", "Hard raw vegetables"],
  },
  {
    id: "stage-4",
    label: "12+ months",
    ageMonths: 12,
    icon: "🍛",
    foods: [
      "Family foods (mild seasoning, low salt)",
      "Cow's milk can be introduced as a drink",
      "Most fruits and vegetables",
    ],
    avoid: ["High-salt processed foods", "Excessive sugar", "Choking foods"],
  },
];

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color =
    score >= 80 ? "hsl(var(--chart-2))" :
    score >= 50 ? "hsl(var(--chart-4))" :
    "hsl(var(--destructive))";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={7} className="stroke-muted" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={7}
        stroke={color} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.7s ease", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
        fontSize={size * 0.22} fontWeight={500} className="fill-foreground">
        {score}%
      </text>
    </svg>
  );
}

// ── Checklist component (shared by nanny + chef tabs) ─────────────────────────

function ChecklistCard({
  items,
  checked,
  onToggle,
}: {
  items: ChecklistItem[];
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const critical = items.filter((i) => i.critical);
  const nonCritical = items.filter((i) => !i.critical);

  const renderItem = (item: ChecklistItem) => {
    const done = Boolean(checked[item.id]);
    return (
      <button
        key={item.id}
        onClick={() => onToggle(item.id)}
        className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all
          ${done
            ? "bg-primary/10 border-primary/30"
            : "bg-muted/20 border-muted/30 hover:border-muted/60"
          }`}
      >
        {done
          ? <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
          : <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        }
        <span className={`text-sm flex-1 ${done ? "line-through text-muted-foreground" : ""}`}>
          {item.label}
        </span>
        {item.critical && (
          <Badge variant="outline" className="rounded-full text-[10px] flex-shrink-0 border-destructive/40 text-destructive">
            critical
          </Badge>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {critical.length > 0 && (
        <div>
          <p className="text-xs font-medium text-destructive mb-2 uppercase tracking-wide">
            Critical checks
          </p>
          <div className="space-y-2">{critical.map(renderItem)}</div>
        </div>
      )}
      {nonCritical.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Good practice
          </p>
          <div className="space-y-2">{nonCritical.map(renderItem)}</div>
        </div>
      )}
    </div>
  );
}

// ── Nanny tab ─────────────────────────────────────────────────────────────────

function NannyTab({ babyBirthDate }: { babyBirthDate: string | null }) {
  const dayNumber = babyBirthDate ? getDayNumber(babyBirthDate) : 1;
  const items = useMemo(() => getChecklistItemsForDay(dayNumber), [dayNumber]);
  const milestone = TRUST_MILESTONES.find((m) => m.day === dayNumber) ?? null;

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [lastSave, setLastSave] = useState<SavedCheck | null>(null);

  // Load today's saved check on mount
  useEffect(() => {
    api.get("/nanny/check?helperType=nanny&limit=1")
      .then((res: unknown) => {
        const data = res as SavedCheck[];
        if (data?.[0]) {
          const today = new Date().toISOString().slice(0, 10);
          const saveDate = new Date(data[0].checkedAt).toISOString().slice(0, 10);
          if (saveDate === today) {
            const savedChecks = data[0].checks as Record<string, any>;
            const { __notes, ...restChecks } = savedChecks;
            setChecked(restChecks as Record<string, boolean>);
            if (__notes) {
              setNotes(__notes);
            }
            setLastSave(data[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setInitialLoaded(true);
      });
  }, []);

  const toggle = useCallback((id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const calculateScore = useCallback((currentChecked: Record<string, boolean>) => {
    const criticalItems = items.filter((i) => i.critical);
    const criticalDone = criticalItems.filter((i) => currentChecked[i.id]).length;
    const totalDone = items.filter((i) => currentChecked[i.id]).length;
    return items.length > 0
      ? Math.round(
          (criticalItems.length > 0
            ? (criticalDone / criticalItems.length) * 70
            : 70) +
          (items.length > 0 ? (totalDone / items.length) * 30 : 0)
        )
      : 0;
  }, [items]);

  const score = useMemo(() => calculateScore(checked), [checked, calculateScore]);

  const handleSave = useCallback(async (
    latestChecked: Record<string, boolean>,
    latestNotes: string,
    latestScore: number
  ) => {
    setSaving(true);
    try {
      const result = await api.post("/nanny/check", {
        helperType: "nanny",
        checks: latestChecked,
        score: latestScore,
        notes: latestNotes,
      }) as SavedCheck;
      setLastSave(result);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    if (!initialLoaded) return;
    const currentScore = calculateScore(checked);
    const delayDebounce = setTimeout(() => {
      handleSave(checked, notes, currentScore);
    }, 800);
    return () => clearTimeout(delayDebounce);
  }, [checked, notes, initialLoaded, calculateScore, handleSave]);

  const isWeeklyDay = dayNumber > 30 && dayNumber % 7 !== 0;

  return (
    <div className="space-y-4">
      {/* Header card — day + score */}
      <Card className="rounded-3xl border-none shadow-lg p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="mb-1 flex items-center gap-2">
              {!babyBirthDate
                ? "Nanny Trust Check"
                : dayNumber <= 15
                ? `Day ${dayNumber} — First fortnight`
                : dayNumber <= 30
                ? `Day ${dayNumber} — First month`
                : `Day ${dayNumber} — Ongoing care`}
              {babyBirthDate && (
                <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full border bg-muted/40 text-muted-foreground flex items-center gap-1 transition-all">
                  {saving ? (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                      Saving...
                    </span>
                  ) : initialLoaded ? (
                    <span className="flex items-center gap-1 text-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Saved to profile
                    </span>
                  ) : (
                    "Loading..."
                  )}
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {!babyBirthDate
                ? "Add your baby's birth date to see a personalised checklist."
                : isWeeklyDay
                ? "Non-weekly day — standard daily checks apply."
                : `${items.length} checks for today`}
            </p>
          </div>
          <ScoreRing score={score} />
        </div>

        {/* Scoring legend */}
        <div className="mt-3 p-3 rounded-2xl bg-muted/20 text-xs text-muted-foreground">
          <Info className="w-3 h-3 inline mr-1" />
          Score = 70% critical checks + 30% all checks. Aim for 100% on critical items.
        </div>
      </Card>

      {/* Milestone callout */}
      {milestone && (
        <Card className="rounded-3xl border-none shadow-lg p-5 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">{milestone.label}</p>
              <p className="text-sm text-muted-foreground">{milestone.message}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Checklist */}
      {!babyBirthDate ? (
        <Card className="rounded-3xl border-none shadow-lg p-6 border-dashed bg-muted/5">
          <p className="text-sm text-muted-foreground">
            Update your profile with your baby's birth date to see the day-specific checklist.
          </p>
        </Card>
      ) : (
        <Card className="rounded-3xl border-none shadow-lg p-6">
          <ChecklistCard items={items} checked={checked} onToggle={toggle} />
        </Card>
      )}

      {/* Notes */}
      <Card className="rounded-3xl border-none shadow-lg p-6">
        <h4 className="mb-3">Daily notes</h4>
        <Textarea
          placeholder="Observations about today's care — any concerns, changes, or things that went well…"
          className="min-h-28 rounded-2xl resize-none"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Card>
    </div>
  );
}

// ── Chef tab ──────────────────────────────────────────────────────────────────

function ChefTab() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Load today's saved check on mount
  useEffect(() => {
    api.get("/nanny/check?helperType=chef&limit=1")
      .then((res: unknown) => {
        const data = res as SavedCheck[];
        if (data?.[0]) {
          const today = new Date().toISOString().slice(0, 10);
          const saveDate = new Date(data[0].checkedAt).toISOString().slice(0, 10);
          if (saveDate === today) {
            const savedChecks = data[0].checks as Record<string, any>;
            const { __notes, ...restChecks } = savedChecks;
            setChecked(restChecks as Record<string, boolean>);
            if (__notes) {
              setNotes(__notes);
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setInitialLoaded(true);
      });
  }, []);

  const toggle = useCallback((id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const calculateScore = useCallback((currentChecked: Record<string, boolean>) => {
    const criticalItems = CHEF_CHECKLIST.filter((i) => i.critical);
    const criticalDone = criticalItems.filter((i) => currentChecked[i.id]).length;
    const totalDone = CHEF_CHECKLIST.filter((i) => currentChecked[i.id]).length;
    return Math.round(
      (criticalDone / criticalItems.length) * 70 +
      (totalDone / CHEF_CHECKLIST.length) * 30
    );
  }, []);

  const score = useMemo(() => calculateScore(checked), [checked, calculateScore]);

  const handleSave = useCallback(async (
    latestChecked: Record<string, boolean>,
    latestNotes: string,
    latestScore: number
  ) => {
    setSaving(true);
    try {
      await api.post("/nanny/check", {
        helperType: "chef",
        checks: latestChecked,
        score: latestScore,
        notes: latestNotes,
      });
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    if (!initialLoaded) return;
    const currentScore = calculateScore(checked);
    const delayDebounce = setTimeout(() => {
      handleSave(checked, notes, currentScore);
    }, 800);
    return () => clearTimeout(delayDebounce);
  }, [checked, notes, initialLoaded, calculateScore, handleSave]);

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card className="rounded-3xl border-none shadow-lg p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="mb-1 flex items-center gap-2">
              Chef hygiene & diet check
              <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full border bg-muted/40 text-muted-foreground flex items-center gap-1 transition-all">
                {saving ? (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    Saving...
                  </span>
                ) : initialLoaded ? (
                  <span className="flex items-center gap-1 text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Saved to profile
                  </span>
                ) : (
                  "Loading..."
                )}
              </span>
            </h3>
            <p className="text-sm text-muted-foreground">
              {CHEF_CHECKLIST.length} checks · postpartum kitchen safety
            </p>
          </div>
          <ScoreRing score={isNaN(score) ? 0 : score} />
        </div>
      </Card>

      {/* Checklist */}
      <Card className="rounded-3xl border-none shadow-lg p-6">
        <ChecklistCard items={CHEF_CHECKLIST} checked={checked} onToggle={toggle} />
      </Card>

      {/* Postpartum diet reminder */}
      <Card className="rounded-3xl border-none shadow-lg p-5 bg-gradient-to-br from-chart-3/10 to-chart-1/10">
        <h4 className="mb-2 text-sm font-medium">Postpartum diet reminders for the chef</h4>
        <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
          <li>Iron-rich meals — leafy greens, dal, lean meat</li>
          <li>Protein at every meal for tissue repair</li>
          <li>Warm, easy-to-digest foods (especially first 6 weeks)</li>
          <li>Avoid gas-causing foods if baby is breastfed (cauliflower, cabbage)</li>
          <li>No raw sprouts, unpasteurised cheese, or undercooked eggs</li>
        </ul>
      </Card>

      {/* Notes */}
      <Card className="rounded-3xl border-none shadow-lg p-6">
        <h4 className="mb-3">Notes</h4>
        <Textarea
          placeholder="Any diet changes, ingredients used, or observations about today's meals…"
          className="min-h-24 rounded-2xl resize-none"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Card>
    </div>
  );
}

// ── Baby food tab ─────────────────────────────────────────────────────────────

function BabyFoodTab({ babyBirthDate }: { babyBirthDate: string | null }) {
  const babyAgeMonths = useMemo(() => {
    if (!babyBirthDate) return null;
    const birth = new Date(babyBirthDate);
    const today = new Date();
    const months =
      (today.getFullYear() - birth.getFullYear()) * 12 +
      (today.getMonth() - birth.getMonth());
    return Math.max(0, months);
  }, [babyBirthDate]);

  return (
    <div className="space-y-4">
      {babyAgeMonths !== null && (
        <Card className="rounded-3xl border-none shadow-lg p-5 bg-gradient-to-br from-primary/10 to-secondary/10">
          <p className="text-sm font-medium mb-1">
            Baby is {babyAgeMonths} month{babyAgeMonths !== 1 ? "s" : ""} old
          </p>
          <p className="text-sm text-muted-foreground">
            {babyAgeMonths < 6
              ? "Breast milk or formula only. Solids unlock at 6 months."
              : `Stages up to ${babyAgeMonths} months are unlocked below.`}
          </p>
        </Card>
      )}

      {FOOD_STAGES.map((stage) => {
        const unlocked = babyAgeMonths === null || babyAgeMonths >= stage.ageMonths;
        const isCurrent =
          babyAgeMonths !== null &&
          babyAgeMonths >= stage.ageMonths &&
          (FOOD_STAGES.findIndex((s) => s.id === stage.id) ===
            FOOD_STAGES.filter((s) => babyAgeMonths >= s.ageMonths).length - 1);

        return (
          <Card
            key={stage.id}
            className={`rounded-3xl border-none shadow-lg p-6 transition-opacity
              ${!unlocked ? "opacity-50" : ""}
              ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}
            `}
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-0.5">{stage.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-medium">{stage.label}</h4>
                  {isCurrent && (
                    <Badge className="rounded-full text-[10px]">Current stage</Badge>
                  )}
                  {!unlocked && (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                  Introduce
                </p>
                <ul className="text-sm text-muted-foreground space-y-0.5 mb-3">
                  {stage.foods.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-xs font-medium text-destructive mb-1 uppercase tracking-wide">
                  Avoid
                </p>
                <ul className="text-sm text-muted-foreground space-y-0.5">
                  {stage.avoid.map((a) => (
                    <li key={a} className="flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        );
      })}

      {/* Safety footer */}
      <Card className="rounded-3xl border-none shadow-lg p-5 bg-destructive/10">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive mb-1">Always remember</p>
            <ul className="text-sm text-muted-foreground space-y-0.5">
              <li>Never leave baby unsupervised while eating</li>
              <li>Honey is unsafe under 12 months (botulism risk)</li>
              <li>Introduce one new food at a time, wait 3 days to check for reactions</li>
              <li>Consult your paediatrician before starting solids</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TrustedHelpPage() {
  const { user } = useUserProfile();
  const babyBirthDate = user?.babyBirthDate ?? null;

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-br from-secondary/20 via-accent/10 to-primary/10 px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl mb-1">Trusted Help</h1>
                <p className="text-sm text-muted-foreground">
                  Nanny checks, chef hygiene, and baby food timeline
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-4">
          <Tabs defaultValue="nanny">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-muted/50 mb-6">
              <TabsTrigger value="nanny" className="rounded-2xl">
                <Users className="w-4 h-4 mr-2" />Nanny
              </TabsTrigger>
              <TabsTrigger value="chef" className="rounded-2xl">
                <ChefHat className="w-4 h-4 mr-2" />Chef
              </TabsTrigger>
              <TabsTrigger value="babyfood" className="rounded-2xl">
                <Baby className="w-4 h-4 mr-2" />Baby Food
              </TabsTrigger>
            </TabsList>

            <TabsContent value="nanny">
              <NannyTab babyBirthDate={babyBirthDate} />
            </TabsContent>
            <TabsContent value="chef">
              <ChefTab />
            </TabsContent>
            <TabsContent value="babyfood">
              <BabyFoodTab babyBirthDate={babyBirthDate} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
