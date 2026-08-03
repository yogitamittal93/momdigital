"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { fetchMe, ApiUser } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const context = searchParams.get("context") ?? undefined;

  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then((user) => {
        if (!user) {
          router.replace("/login");
          return;
        }
        const role = user.role ?? "MOTHER";
        const isExpert = ["MBBS", "AYURVEDA", "NUTRITIONIST", "CHEF", "YOGA_TRAINER", "WORKOUT_TRAINER", "DANCE_TEACHER", "ADMIN"].includes(role);
        if (isExpert || user.isAdmin) {
          router.replace("/pro");
          return;
        }
        setProfile(user);
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return null;

  const isMentalHealth = context === "mental-health";

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div
          className={`px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem] ${
            isMentalHealth
              ? "bg-gradient-to-br from-secondary/20 via-accent/10 to-background"
              : "bg-gradient-to-br from-primary/20 via-secondary/10 to-background"
          }`}
        >
          <div className="max-w-4xl mx-auto">
            {isMentalHealth ? (
              <>
                <h1 className="text-2xl md:text-3xl mb-2">Mental Health Support</h1>
                <p className="text-muted-foreground">
                  You&apos;re not alone. Talk to Matrny &mdash; your compassionate maternal health companion.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl md:text-3xl mb-2">Maternity Help</h1>
                <p className="text-muted-foreground">Ask Matrny about your maternal and infant health query</p>
              </>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 mt-6">
          <ChatWindow context={context} />
        </div>
      </div>
    </AppShell>
  );
}
