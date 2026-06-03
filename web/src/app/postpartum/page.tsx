"use client";

import { CheckCircle2, Heart, Moon, Sparkles } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function PostpartumPage() {
  const dailyChecklist = [
    { id: 1, task: "Take prenatal vitamins", completed: true },
    { id: 2, task: "Pelvic floor exercises (Kegels)", completed: true },
    { id: 3, task: "15-minute walk", completed: false },
    { id: 4, task: "Drink 8 glasses of water", completed: true },
  ];

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-br from-accent/30 via-accent/20 to-background px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl mb-2">Postpartum Recovery</h1>
            <p className="text-muted-foreground">Supporting your healing journey</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-4 space-y-6">
          <Card className="rounded-3xl border-none shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-accent-foreground" />
              <div>
                <h3 className="mb-1">Recovery Progress</h3>
                <p className="text-sm text-muted-foreground">Week 3 of 6</p>
              </div>
            </div>
            <Progress value={50} className="h-3 mb-3" />
            <p className="text-sm text-muted-foreground">You're doing great. Be gentle with yourself.</p>
          </Card>

          <Card className="rounded-3xl border-none shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3>Today's Wellness Checklist</h3>
              <span className="text-sm text-muted-foreground">
                {dailyChecklist.filter((item) => item.completed).length}/{dailyChecklist.length}
              </span>
            </div>
            <div className="space-y-3">
              {dailyChecklist.map((item) => (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-2xl ${item.completed ? "bg-accent/20" : "bg-muted/30"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.completed ? "bg-accent text-accent-foreground" : "bg-muted border-2 border-muted-foreground/30"}`}>
                    {item.completed && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <span className={item.completed ? "line-through text-muted-foreground" : ""}>{item.task}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-3xl border-none shadow-lg p-6 bg-gradient-to-br from-secondary/10 to-secondary/5">
            <div className="flex items-start gap-4">
              <Heart className="w-6 h-6 text-secondary fill-secondary mt-1" />
              <div className="flex-1">
                <h3 className="mb-2">Mental Health Support</h3>
                <p className="text-sm text-muted-foreground mb-4">Feeling overwhelmed is normal. Talk to someone whenever needed.</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-full border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                    Talk to Counselor
                  </Button>
                  <Button variant="ghost" className="rounded-full text-secondary">
                    Resources
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-none shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <Moon className="w-5 h-5 text-primary" />
              <h3>Sleep & Energy</h3>
            </div>
            <p className="text-sm text-muted-foreground">Track mood and energy levels daily to identify recovery patterns.</p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
