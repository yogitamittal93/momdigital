"use client";

import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Habit } from "@/hooks/use-habits";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreateHabitInput {
  name: string;
  emoji?: string;
  category?: string;
  color?: string;
  targetQuantity?: number;
  unit?: string;
  sortOrder?: number;
  hasLoadingPhase?: boolean;
  loadingPhaseDays?: number;
  loadingStartDate?: string;
}

// ── Suggested habits users can pick from ─────────────────────────────────────

export const SUGGESTED_HABITS: CreateHabitInput[] = [
  { name: "Prenatal Vitamins",    emoji: "💊", category: "supplement", color: "#e879f9", unit: "pills",   targetQuantity: 1  },
  { name: "Water",                 emoji: "💧", category: "hydration",  color: "#38bdf8", unit: "glasses", targetQuantity: 8  },
  { name: "Iron / Minerals",       emoji: "🪨", category: "supplement", color: "#fb923c", unit: "pills",   targetQuantity: 1  },
  { name: "Omega-3 / Fish Oil",    emoji: "🐟", category: "supplement", color: "#34d399", unit: "capsules",targetQuantity: 1  },
  { name: "Calcium",               emoji: "🦴", category: "supplement", color: "#a78bfa", unit: "pills",   targetQuantity: 1  },
  { name: "Vitamin D",             emoji: "☀️", category: "supplement", color: "#fbbf24", unit: "drops",   targetQuantity: 1  },
  { name: "Probiotic",             emoji: "🦠", category: "supplement", color: "#6ee7b7", unit: "capsules",targetQuantity: 1  },
  { name: "Magnesium",             emoji: "⚡",  category: "supplement", color: "#818cf8", unit: "mg",      targetQuantity: 200 },
  { name: "Folate / Folic Acid",   emoji: "🍃", category: "supplement", color: "#4ade80", unit: "mcg",     targetQuantity: 400 },
  { name: "Morning Walk",          emoji: "🚶‍♀️", category: "exercise",  color: "#f472b6", unit: "mins",   targetQuantity: 30  },
  { name: "Kegel Exercises",       emoji: "💪", category: "exercise",   color: "#fb7185", unit: "sets",    targetQuantity: 3   },
  { name: "Meditation",            emoji: "🧘‍♀️", category: "wellness", color: "#c084fc", unit: "mins",   targetQuantity: 10  },
];

const CATEGORIES = [
  { value: "supplement", label: "Supplement", color: "bg-purple-100 text-purple-700" },
  { value: "hydration",  label: "Hydration",  color: "bg-blue-100 text-blue-700"   },
  { value: "exercise",   label: "Exercise",   color: "bg-pink-100 text-pink-700"   },
  { value: "wellness",   label: "Wellness",   color: "bg-green-100 text-green-700" },
  { value: "custom",     label: "Custom",     color: "bg-gray-100 text-gray-700"   },
];

const EMOJIS = ["💊","💧","🪨","🐟","🦴","☀️","🦠","⚡","🍃","🚶‍♀️","💪","🧘‍♀️","🏋️","🥗","🍵","🌿","🎯","✅","⭐","🌟"];

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  existingHabits: Habit[];
  onAdd: (habit: CreateHabitInput) => Promise<Habit>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export function HabitSetupModal({ existingHabits, onAdd, onDelete, onClose }: Props) {
  const [tab, setTab] = useState<"suggested" | "custom">("suggested");
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Custom form state
  const [custom, setCustom] = useState({
    name: "",
    emoji: "⭐",
    category: "custom",
    targetQuantity: "",
    unit: "",
    hasLoadingPhase: false,
    loadingPhaseDays: "",
  });

  const existingNames = new Set(existingHabits.map((h) => h.name.toLowerCase()));

  const handleAddSuggested = async (s: typeof SUGGESTED_HABITS[0]) => {
    if (existingNames.has(s.name.toLowerCase())) return;
    setSaving(s.name);
    try {
      await onAdd({ ...s, sortOrder: existingHabits.length });
    } finally {
      setSaving(null);
    }
  };

  const handleAddCustom = async () => {
    if (!custom.name.trim()) return;
    setSaving("custom");
    try {
      await onAdd({
        name: custom.name.trim(),
        emoji: custom.emoji,
        category: custom.category,
        targetQuantity: custom.targetQuantity ? Number(custom.targetQuantity) : undefined,
        unit: custom.unit || undefined,
        hasLoadingPhase: custom.hasLoadingPhase,
        loadingPhaseDays: custom.loadingPhaseDays ? Number(custom.loadingPhaseDays) : undefined,
        loadingStartDate: custom.hasLoadingPhase ? new Date().toISOString() : undefined,
        sortOrder: existingHabits.length,
      });
      setCustom({ name: "", emoji: "⭐", category: "custom", targetQuantity: "", unit: "", hasLoadingPhase: false, loadingPhaseDays: "" });
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { await onDelete(id); } finally { setDeleting(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg rounded-3xl border-none shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/40">
          <div>
            <h2 className="text-lg font-semibold">Manage Daily Habits</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Pick from suggestions or create your own</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/40">
          {(["suggested", "custom"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "suggested" ? "✨ Suggested" : "➕ Custom"}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {tab === "suggested" ? (
            <>
              <p className="text-xs text-muted-foreground mb-3">Tap to add. Already-added habits are shown checked.</p>
              <div className="grid grid-cols-1 gap-2">
                {SUGGESTED_HABITS.map((s) => {
                  const added = existingNames.has(s.name.toLowerCase());
                  const isLoading = saving === s.name;
                  return (
                    <button
                      key={s.name}
                      onClick={() => handleAddSuggested(s)}
                      disabled={added || isLoading}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                        added
                          ? "border-primary/30 bg-primary/5 opacity-70 cursor-default"
                          : "border-border hover:border-primary/50 hover:bg-accent/20 cursor-pointer"
                      }`}
                    >
                      <span className="text-xl w-8 text-center">{s.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        {s.targetQuantity && (
                          <p className="text-xs text-muted-foreground">
                            Target: {s.targetQuantity} {s.unit}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : added ? (
                          <span className="text-xs text-primary font-medium">✓ Added</span>
                        ) : (
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Emoji picker */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Emoji</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setCustom((p) => ({ ...p, emoji: e }))}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                        custom.emoji === e ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Habit Name *</label>
                <input
                  value={custom.name}
                  onChange={(e) => setCustom((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Evening Yoga, Creatine, Collagen..."
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCustom((p) => ({ ...p, category: c.value }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        custom.category === c.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target + Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={custom.targetQuantity}
                    onChange={(e) => setCustom((p) => ({ ...p, targetQuantity: e.target.value }))}
                    placeholder="e.g. 8"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit</label>
                  <input
                    value={custom.unit}
                    onChange={(e) => setCustom((p) => ({ ...p, unit: e.target.value }))}
                    placeholder="glasses, pills, g..."
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Loading phase */}
              <div className="rounded-2xl border border-border/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Loading Phase</p>
                    <p className="text-xs text-muted-foreground">For supplements like creatine that have a loading phase</p>
                  </div>
                  <button
                    onClick={() => setCustom((p) => ({ ...p, hasLoadingPhase: !p.hasLoadingPhase }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${custom.hasLoadingPhase ? "bg-primary" : "bg-muted"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${custom.hasLoadingPhase ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                {custom.hasLoadingPhase && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Loading Phase Duration (days)</label>
                    <input
                      type="number"
                      min="1"
                      value={custom.loadingPhaseDays}
                      onChange={(e) => setCustom((p) => ({ ...p, loadingPhaseDays: e.target.value }))}
                      placeholder="e.g. 7"
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    />
                  </div>
                )}
              </div>

              <Button
                className="w-full rounded-full"
                disabled={!custom.name.trim() || saving === "custom"}
                onClick={handleAddCustom}
              >
                {saving === "custom" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Habit
              </Button>
            </div>
          )}
        </div>

        {/* Current habits */}
        {existingHabits.length > 0 && (
          <div className="border-t border-border/40 p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Your Habits ({existingHabits.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {existingHabits.map((h) => (
                <Badge
                  key={h.id}
                  variant="outline"
                  className="rounded-full pl-2 pr-1 py-1 flex items-center gap-1.5 text-xs"
                >
                  <span>{h.emoji}</span>
                  <span>{h.name}</span>
                  <button
                    onClick={() => handleDelete(h.id)}
                    disabled={deleting === h.id}
                    className="ml-1 w-4 h-4 rounded-full flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-colors"
                  >
                    {deleting === h.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
