"use client";

import { Shield, Users, ChefHat, Baby, AlertCircle } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

export default function TrustedHelpPage() {
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
                <p className="text-sm text-muted-foreground">Nanny checks, chef guide, and baby food timeline</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-4">
          <Tabs defaultValue="nanny">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-muted/50 mb-6">
              <TabsTrigger value="nanny" className="rounded-2xl"><Users className="w-4 h-4 mr-2" />Nanny</TabsTrigger>
              <TabsTrigger value="chef" className="rounded-2xl"><ChefHat className="w-4 h-4 mr-2" />Chef</TabsTrigger>
              <TabsTrigger value="babyfood" className="rounded-2xl"><Baby className="w-4 h-4 mr-2" />Baby Food</TabsTrigger>
            </TabsList>

            <TabsContent value="nanny" className="space-y-4">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <h3 className="mb-2">10-Day Nanny Trust Check</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Evaluate hygiene, handling, punctuality and organization to build trust with objective tracking.
                </p>
                <Progress value={60} className="h-3 mb-2" />
                <p className="text-sm text-muted-foreground">Current trust score: 60%</p>
              </Card>
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <h4 className="mb-3">Daily Notes</h4>
                <Textarea placeholder="Add daily observations..." className="min-h-28 rounded-2xl resize-none" />
              </Card>
            </TabsContent>

            <TabsContent value="chef" className="space-y-4">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <h3 className="mb-3">Postpartum Mother Diet</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Iron-rich meals, protein, hydration, and calcium are critical.</li>
                  <li>Avoid raw foods, alcohol, and excessive caffeine.</li>
                  <li>Adjust gas-causing foods based on baby comfort.</li>
                </ul>
              </Card>
            </TabsContent>

            <TabsContent value="babyfood" className="space-y-4">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <h3 className="mb-3">Baby Food Introduction Timeline</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>0-6 months: milk only.</li>
                  <li>6 months: single ingredients, one at a time.</li>
                  <li>7-12 months: gradual texture variety.</li>
                  <li>12+ months: family foods with choking precautions.</li>
                </ul>
              </Card>
              <Card className="rounded-3xl border-none shadow-lg p-6 bg-destructive/10">
                <h4 className="mb-2 flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  Safety reminders
                </h4>
                <p className="text-sm">Avoid honey before 12 months and always supervise meals.</p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
