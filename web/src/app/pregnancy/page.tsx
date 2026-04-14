"use client";

import { Heart, Activity, TrendingUp, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import AppShell from "@/components/layout/app-shell";

export default function PregnancyTracker() {
  const weekNumber = 24;
  const kicksToday = 12;
  const kickGoal = 10;
  const milestones = [
    { week: 20, title: "Anatomy Scan", completed: true, date: "Feb 15, 2026" },
    { week: 24, title: "Glucose Test", completed: false, date: "Mar 28, 2026" },
    { week: 28, title: "Third Trimester Begins", completed: false, date: "Apr 18, 2026" },
  ];

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl mb-2">Pregnancy Tracker</h1>
            <p className="text-muted-foreground">Week {weekNumber} • Second Trimester</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-4">
          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-primary/10 flex-shrink-0">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1643618511639-d3f8eba7f486?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWJ5JTIwc2xlZXBpbmclMjBwZWFjZWZ1bGx5fGVufDF8fHx8MTc3NDI5MjkzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Baby Development"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="mb-2">Your Baby This Week</h2>
                <p className="text-sm text-muted-foreground">About the size of a corn 🌽</p>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3>Kick Counter</h3>
              <Heart className="w-6 h-6 text-primary fill-primary" />
            </div>
            <div className="mb-4">
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl text-primary">{kicksToday}</span>
                <span className="text-muted-foreground mb-2">/ {kickGoal} kicks today</span>
              </div>
              <Progress value={(kicksToday / kickGoal) * 100} className="h-3" />
            </div>
            <Button className="w-full rounded-full bg-primary hover:bg-primary/90 gap-2">
              <Plus className="w-4 h-4" />
              Log a Kick
            </Button>
          </Card>

          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
            <h3 className="mb-4">Upcoming Milestones</h3>
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {milestone.completed ? <Activity className="w-5 h-5" /> : <span>{milestone.week}</span>}
                  </div>
                  <div className="flex-1">
                    <p>{milestone.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">Week {milestone.week} • {milestone.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Tabs defaultValue="weight" className="mb-6">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-muted/50">
              <TabsTrigger value="weight" className="rounded-2xl">Weight</TabsTrigger>
              <TabsTrigger value="bp" className="rounded-2xl">Blood Pressure</TabsTrigger>
              <TabsTrigger value="mood" className="rounded-2xl">Mood</TabsTrigger>
            </TabsList>
            <TabsContent value="weight" className="mt-4">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3>Weight Tracking</h3>
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div className="h-32 bg-gradient-to-t from-primary/10 to-transparent rounded-2xl flex items-end p-4">
                  <p className="text-xs text-muted-foreground">Chart visualization placeholder</p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
