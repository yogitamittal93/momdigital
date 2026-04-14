"use client";

import { Baby, Milk, Moon, AlertCircle } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ChildCarePage() {
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
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="rounded-3xl border-none shadow-lg p-5">
              <div className="flex items-center gap-2"><Milk className="w-5 h-5 text-primary" /><p>Feedings</p></div>
              <p className="text-2xl text-primary mt-2">6</p>
            </Card>
            <Card className="rounded-3xl border-none shadow-lg p-5">
              <div className="flex items-center gap-2"><Moon className="w-5 h-5 text-secondary" /><p>Sleep (hrs)</p></div>
              <p className="text-2xl text-secondary mt-2">12</p>
            </Card>
          </div>

          <Tabs defaultValue="growth" className="mb-6">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-muted/50 mb-6">
              <TabsTrigger value="growth" className="rounded-2xl">Growth</TabsTrigger>
              <TabsTrigger value="health" className="rounded-2xl">Health</TabsTrigger>
              <TabsTrigger value="milestones" className="rounded-2xl">Milestones</TabsTrigger>
            </TabsList>
            <TabsContent value="growth">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <h3 className="mb-3">Growth Tracking</h3>
                <p className="text-sm text-muted-foreground">Track weight, length, and head circumference percentiles.</p>
              </Card>
            </TabsContent>
            <TabsContent value="health">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <h3 className="mb-3">Health Records</h3>
                <p className="text-sm text-muted-foreground">Vaccines, temperature logs, and pediatric history.</p>
              </Card>
            </TabsContent>
            <TabsContent value="milestones">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <h3 className="mb-3">Developmental Milestones</h3>
                <p className="text-sm text-muted-foreground">Track first smile, head control, and developmental goals.</p>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="rounded-3xl border-none shadow-lg p-6 bg-destructive/10">
            <h3 className="mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              When to call the doctor
            </h3>
            <ul className="text-sm space-y-1">
              <li>Fever over 100.4F</li>
              <li>Refusing feeds repeatedly</li>
              <li>Breathing difficulties</li>
            </ul>
            <Button variant="outline" className="mt-4 rounded-full">Emergency Contacts</Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
