"use client";

import { Bell, Heart, LogOut, Moon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function ProfilePage() {
  const router = useRouter();
  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-background px-4 md:px-8 pt-8 pb-16 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl mb-6">Profile</h1>
            <Card className="rounded-3xl border-none shadow-lg p-6 -mb-12">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src="https://images.unsplash.com/photo-1664312550457-7573b60ee093?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" alt="profile" />
                  <AvatarFallback>SJ</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2>Sarah Johnson</h2>
                  <p className="text-sm text-muted-foreground">sarah.johnson@email.com</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-full">Edit</Button>
              </div>
            </Card>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 md:px-8 mt-16">
          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-primary" />
              <h3>Pregnancy Information</h3>
            </div>
            <p className="text-sm text-muted-foreground">Due Date: July 14, 2026 • Week 24</p>
          </Card>
          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-secondary" />
              <h3>Notifications</h3>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl">
              <span className="text-sm">Appointment reminders</span>
              <Switch checked />
            </div>
          </Card>
          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Moon className="w-6 h-6 text-accent-foreground" />
              <h3>Appearance</h3>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
              <span className="text-sm">Dark Mode</span>
              <ThemeToggle />
            </div>
          </Card>
          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
            <h3 className="mb-2">Medical Records</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload scan reports, review history, download, and manage records.
            </p>
            <Link href="/medical-records">
              <Button className="rounded-full">Open Medical Records</Button>
            </Link>
          </Card>
          <Button
            variant="outline"
            onClick={() => router.push("/login")}
            className="w-full rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
