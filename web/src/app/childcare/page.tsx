"use client";

import { useState, useCallback } from "react";
import { Baby, Milk, Moon, AlertCircle, Plus } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FeedEntry {
  id: number;
  time: string;
  duration: number; // minutes
}

interface SleepEntry {
  id: number;
  date: string;
  hours: number;
}

export default function ChildCarePage() {
  const [feedings, setFeedings] = useState<FeedEntry[]>([
    { id: 1, time: "7:00 AM", duration: 15 },
    { id: 2, time: "10:30 AM", duration: 12 },
    { id: 3, time: "1:00 PM", duration: 14 },
    { id: 4, time: "4:30 PM", duration: 13 },
    { id: 5, time: "7:00 PM", duration: 16 },
    { id: 6, time: "11:00 PM", duration: 10 },
  ]);
  const [sleepLog] = useState<SleepEntry[]>([
    { id: 1, date: "Today", hours: 12 },
    { id: 2, date: "Yesterday", hours: 11.5 },
  ]);
  const [loggingFeed, setLoggingFeed] = useState(false);

  const handleLogFeeding = useCallback(() => {
    setLoggingFeed(true);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newEntry: FeedEntry = {
      id: Date.now(),
      time: timeStr,
      duration: Math.floor(10 + Math.random() * 8), // realistic 10-18 min
    };
    setFeedings((prev) => [newEntry, ...prev]);
    setTimeout(() => setLoggingFeed(false), 800);
  }, []);

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-br from-chart-4/30 via-chart-4/20 to-background px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl mb-2">Child Care</h1>
            <p className="text-muted-foreground">Baby Emma • 3 weeks old</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="rounded-3xl border-none shadow-lg p-5">
              <div className="flex items-center gap-2 mb-2">
                <Milk className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground">Feedings Today</p>
              </div>
              <p className="text-3xl font-bold text-primary">{feedings.length}</p>
            </Card>
            <Card className="rounded-3xl border-none shadow-lg p-5">
              <div className="flex items-center gap-2 mb-2">
                <Moon className="w-5 h-5 text-secondary" />
                <p className="text-sm text-muted-foreground">Sleep (hrs)</p>
              </div>
              <p className="text-3xl font-bold text-secondary">{sleepLog[0].hours}</p>
            </Card>
          </div>

          {/* Log feeding button */}
          <Button
            id="log-feeding-btn"
            className="w-full mb-6 rounded-full bg-primary hover:bg-primary/90 gap-2 h-14 shadow-lg active:scale-95 transition-transform text-base"
            onClick={handleLogFeeding}
            disabled={loggingFeed}
          >
            <Plus className="w-5 h-5" />
            {loggingFeed ? "Logged! ✓" : "Log a Feeding"}
          </Button>

          <Tabs defaultValue="feedings" className="mb-6">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-muted/50 mb-6">
              <TabsTrigger value="feedings" className="rounded-2xl">Feedings</TabsTrigger>
              <TabsTrigger value="health" className="rounded-2xl">Health</TabsTrigger>
              <TabsTrigger value="milestones" className="rounded-2xl">Milestones</TabsTrigger>
            </TabsList>

            <TabsContent value="feedings">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <h3 className="mb-4">Today's Feeding Log</h3>
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {feedings.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between px-4 py-3 rounded-2xl bg-muted/30 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Milk className="w-4 h-4 text-primary" />
                        <span>{f.time}</span>
                      </div>
                      <span className="text-muted-foreground">{f.duration} min</span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="health">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <h3 className="mb-3">Health Records</h3>
                <p className="text-sm text-muted-foreground">Vaccines, temperature logs, and pediatric history.</p>
                <div className="mt-4 space-y-2">
                  {[
                    { name: "Hepatitis B (1st dose)", date: "Day 1" },
                    { name: "Vitamin K shot", date: "Day 1" },
                  ].map((v) => (
                    <div key={v.name} className="flex justify-between text-sm p-3 rounded-xl bg-muted/30">
                      <span>{v.name}</span>
                      <span className="text-muted-foreground">{v.date}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="milestones">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <h3 className="mb-3">Developmental Milestones</h3>
                <div className="space-y-3">
                  {[
                    { label: "Follows faces with eyes", achieved: true },
                    { label: "Reacts to loud sounds", achieved: true },
                    { label: "First social smile", achieved: false },
                    { label: "Holds head up briefly", achieved: false },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center gap-3 text-sm">
                      <div
                        className={`w-5 h-5 rounded-full flex-shrink-0 ${
                          m.achieved ? "bg-primary" : "bg-muted border-2 border-muted-foreground/30"
                        }`}
                      />
                      <span className={m.achieved ? "" : "text-muted-foreground"}>{m.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="rounded-3xl border-none shadow-lg p-6 bg-destructive/10">
            <h3 className="mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              When to call the doctor
            </h3>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Fever over 100.4°F (38°C)</li>
              <li>Refusing feeds repeatedly</li>
              <li>Breathing difficulties or colour changes</li>
            </ul>
            <Button variant="outline" className="mt-4 rounded-full">
              Emergency Contacts
            </Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
