"use client";

import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function CareerPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl mb-6">Career Journey</h1>
        <Card className="rounded-3xl border-none shadow-lg p-6">
          <h3 className="mb-2">Return-to-work readiness</h3>
          <p className="text-sm text-muted-foreground mb-3">Current phase: transition</p>
          <Progress value={40} className="h-3 mb-3" />
          <p className="text-sm text-muted-foreground">A gradual, supportive roadmap tailored to postpartum timeline.</p>
        </Card>
      </div>
    </AppShell>
  );
}
