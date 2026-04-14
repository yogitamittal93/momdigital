"use client";

import { Calendar, Clock, MapPin, Video, Plus, ChevronRight, Phone } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AppointmentsPage() {
  const upcomingAppointments = [
    {
      id: 1,
      type: "Prenatal Checkup",
      doctor: "Dr. Emily Chen",
      specialty: "OB-GYN",
      date: "March 25, 2026",
      time: "10:00 AM",
      location: "Women's Health Center",
      address: "123 Medical Plaza, Suite 200",
      mode: "in-person",
      notes: "Bring previous test results",
    },
    {
      id: 2,
      type: "Nutrition Consultation",
      doctor: "Sarah Williams, RD",
      specialty: "Registered Dietitian",
      date: "April 8, 2026",
      time: "11:00 AM",
      location: "Virtual",
      address: "Telehealth",
      mode: "virtual",
      notes: "Keep food diary for past 3 days",
    },
  ];

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
          <Button className="w-full mb-6 rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 shadow-lg h-14">
            <Plus className="w-5 h-5" />
            Book New Appointment
          </Button>

          <Tabs defaultValue="upcoming" className="mb-6">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/50 mb-6">
              <TabsTrigger value="upcoming" className="rounded-2xl">Upcoming</TabsTrigger>
              <TabsTrigger value="past" className="rounded-2xl">Past</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} className="rounded-3xl border-none shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3>{appointment.type}</h3>
                        <Badge
                          variant="secondary"
                          className={`rounded-full ${
                            appointment.mode === "virtual"
                              ? "bg-accent/30 text-accent-foreground"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {appointment.mode === "virtual" ? (
                            <><Video className="w-3 h-3 mr-1" /> Virtual</>
                          ) : (
                            <><MapPin className="w-3 h-3 mr-1" /> In-Person</>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{appointment.doctor}</p>
                      <p className="text-xs text-muted-foreground">{appointment.specialty}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="space-y-3 mb-4 text-sm">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{appointment.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{appointment.time}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p>{appointment.location}</p>
                        <p className="text-xs text-muted-foreground">{appointment.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-accent/10 rounded-2xl p-3 mb-4">
                    <p className="text-xs text-muted-foreground mb-1">Note:</p>
                    <p className="text-sm">{appointment.notes}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-full border-border">Reschedule</Button>
                    <Button className="flex-1 rounded-full bg-primary hover:bg-primary/90">Open Details</Button>
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          <Card className="rounded-3xl border-none shadow-lg p-6 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <Phone className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1">Emergency Contact</h3>
                <p className="text-sm text-muted-foreground">Available 24/7 for urgent concerns</p>
              </div>
              <Button variant="outline" className="rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                Call Now
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
