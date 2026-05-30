"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  ChevronRight,
  Phone,
  Loader2,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api-client";

type Appointment = {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  location?: string | null;
  type: string;
  completed: boolean;
};

function formatApptDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get("/appointments")
      .then((data) => setAppointments((data as Appointment[]) || []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => !a.completed && new Date(a.date) >= now,
  );
  const past = appointments.filter(
    (a) => a.completed || new Date(a.date) < now,
  );

  async function handleAdd() {
    const title = window.prompt("Appointment title (e.g. Prenatal Checkup)");
    if (!title?.trim()) return;
    const dateStr = window.prompt("Date & time (YYYY-MM-DDTHH:mm)", "");
    if (!dateStr) return;
    try {
      await api.post("/appointments", {
        title: title.trim(),
        date: dateStr,
        type: "CHECKUP",
      });
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to create appointment");
    }
  }

  function renderList(list: Appointment[]) {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <Card className="rounded-3xl border-none shadow-lg p-8 text-center text-muted-foreground">
          No appointments yet. Tap &quot;Book New Appointment&quot; to add one.
        </Card>
      );
    }
    return list.map((appointment) => {
      const { date, time } = formatApptDate(appointment.date);
      return (
        <Card
          key={appointment.id}
          className="rounded-3xl border-none shadow-lg p-6 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="mb-1">{appointment.title}</h3>
              <p className="text-xs text-muted-foreground">{appointment.type}</p>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          <div className="space-y-3 mb-4 text-sm">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{time}</span>
            </div>
            {appointment.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <p>{appointment.location}</p>
              </div>
            )}
          </div>
          {appointment.description && (
            <div className="bg-accent/10 rounded-2xl p-3 mb-4">
              <p className="text-sm">{appointment.description}</p>
            </div>
          )}
        </Card>
      );
    });
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-br from-secondary/20 via-secondary/10 to-background px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl mb-2">Appointments</h1>
            <p className="text-muted-foreground">Manage your healthcare visits</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-4">
          <Button
            type="button"
            onClick={handleAdd}
            className="w-full mb-6 rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 shadow-lg h-14"
          >
            <Plus className="w-5 h-5" />
            Book New Appointment
          </Button>

          <Tabs defaultValue="upcoming" className="mb-6">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/50 mb-6">
              <TabsTrigger value="upcoming" className="rounded-2xl">
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="past" className="rounded-2xl">
                Past
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {renderList(upcoming)}
            </TabsContent>
            <TabsContent value="past" className="space-y-4">
              {renderList(past)}
            </TabsContent>
          </Tabs>

          <Card className="rounded-3xl border-none shadow-lg p-6 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <Phone className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1">Emergency</h3>
                <p className="text-sm text-muted-foreground">
                  NHM Helpline: 104 | Emergency: 112
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
