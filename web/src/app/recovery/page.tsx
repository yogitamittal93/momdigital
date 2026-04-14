"use client";

import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function BodyRecoveryPage() {
  const exercises = [
    { id: 1, name: "Deep Belly Breathing", duration: "2 min", sets: "5 breaths", intensity: "Very Light" },
    { id: 2, name: "Pelvic Floor Activation", duration: "3 min", sets: "10 pulses", intensity: "Very Light" },
    { id: 3, name: "Ankle Circles", duration: "2 min", sets: "10 each direction", intensity: "Very Light" },
  ];

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-br from-accent/30 via-primary/10 to-secondary/10 px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl mb-1">Body Recovery</h1>
            <p className="text-sm text-muted-foreground">Gentle exercises to rebuild strength</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-4 space-y-6">
          <Card className="rounded-3xl border-none shadow-lg p-6 bg-gradient-to-br from-destructive/10 to-chart-4/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-destructive mt-1" />
              <div>
                <h3 className="mb-2 text-destructive">Get Medical Clearance First</h3>
                <p className="text-sm text-muted-foreground">
                  Wait for doctor approval before starting postpartum exercises, especially after C-section.
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-none shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <div>
                <h3 className="mb-1">Week 1 - Gentle Beginning</h3>
                <p className="text-sm text-muted-foreground">Focus on breathing and pelvic floor awareness</p>
              </div>
            </div>
            <Progress value={40} className="h-3 mb-3" />
            <p className="text-sm text-muted-foreground">1 of {exercises.length} exercises completed today</p>
          </Card>

          {exercises.map((exercise) => (
            <Card key={exercise.id} className="rounded-3xl border-none shadow-lg p-6">
              <div className="flex items-start justify-between mb-3">
                <h3>{exercise.name}</h3>
                <Badge variant="outline" className="rounded-full">{exercise.intensity}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{exercise.duration} • {exercise.sets}</p>
              <Button className="rounded-full">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Start Exercise
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
