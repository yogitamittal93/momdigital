"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Phone,
  Loader2,
  Edit,
  Trash,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    location: "",
    dateTime: "",
    type: "CHECKUP",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreateForm = () => {
    setFormMode("create");
    setEditingAppointment(null);
    setFormState({
      title: "",
      description: "",
      location: "",
      dateTime: "",
      type: "CHECKUP",
    });
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (appointment: Appointment) => {
    setFormMode("edit");
    setEditingAppointment(appointment);
    setFormState({
      title: appointment.title,
      description: appointment.description ?? "",
      location: appointment.location ?? "",
      dateTime: new Date(appointment.date).toISOString().slice(0, 16),
      type: appointment.type,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingAppointment(null);
    setFormError(null);
  };

  const submitForm = async () => {
    if (!formState.title.trim()) {
      setFormError("Please enter an appointment title.");
      return;
    }
    if (!formState.dateTime) {
      setFormError("Please choose a date and time for the appointment.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      title: formState.title.trim(),
      description: formState.description.trim() || undefined,
      location: formState.location.trim() || undefined,
      date: new Date(formState.dateTime).toISOString(),
      type: formState.type,
    };

    try {
      if (formMode === "create") {
        await api.post("/appointments", payload);
      } else if (editingAppointment) {
        await api.patch(`/appointments/${editingAppointment.id}`, payload);
      }
      closeForm();
      load();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to save appointment.");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async (appointment: Appointment) => {
    try {
      await api.patch(`/appointments/${appointment.id}`, { completed: !appointment.completed });
      load();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (appointment: Appointment) => {
    if (!confirm("Delete this appointment?")) return;
    try {
      await api.delete(`/appointments/${appointment.id}`);
      load();
    } catch {
      // ignore
    }
  };

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div className="flex-1">
              <h3 className="mb-1">{appointment.title}</h3>
              <p className="text-xs text-muted-foreground">{appointment.type}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEditForm(appointment)}>
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </div>
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
          <div className="flex flex-wrap gap-3 items-center text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMarkComplete(appointment)}
            >
              {appointment.completed ? "Mark as upcoming" : "Mark as complete"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(appointment)}>
              <Trash className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
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
            onClick={openCreateForm}
            className="w-full mb-6 rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 shadow-lg h-14"
          >
            <Plus className="w-5 h-5" />
            Book New Appointment
          </Button>

          {formOpen ? (
            <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3>{formMode === "create" ? "New appointment" : "Edit appointment"}</h3>
                  <p className="text-sm text-muted-foreground">
                    Use the date and time picker for quick scheduling.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={closeForm}>
                  Cancel
                </Button>
              </div>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    value={formState.title}
                    onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Prenatal checkup, ultrasound, telehealth call"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date & time</label>
                  <Input
                    type="datetime-local"
                    value={formState.dateTime}
                    onChange={(event) => setFormState((prev) => ({ ...prev, dateTime: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <Input
                    value={formState.location}
                    onChange={(event) => setFormState((prev) => ({ ...prev, location: event.target.value }))}
                    placeholder="Doctor's office, clinic, telehealth"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <Textarea
                    value={formState.description}
                    onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Add details like preparation instructions or what to ask the provider"
                    rows={3}
                  />
                </div>
                {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={closeForm} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={submitForm} disabled={saving}>
                    {saving ? "Saving..." : formMode === "create" ? "Save appointment" : "Update appointment"}
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}

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
