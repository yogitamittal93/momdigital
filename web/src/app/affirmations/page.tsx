"use client";

import { ChevronLeft, ChevronRight, Heart, Sparkles, Star } from "lucide-react";
import { useState } from "react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

export default function AffirmationsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const affirmations = [
    {
      id: 1,
      title: "You Are Beautiful",
      message:
        "Every stretch mark tells a story of strength. Your body is powerful and deserving of love.",
      image:
        "https://images.unsplash.com/photo-1745433207341-a695b14e24da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      color: "from-primary/20 to-primary/10",
    },
    {
      id: 2,
      title: "You Are Doing Amazing",
      message:
        "In sleepless nights and challenges, your love and effort are exactly what your baby needs.",
      image:
        "https://images.unsplash.com/photo-1773243086673-66bef34f6969?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      color: "from-accent/30 to-accent/10",
    },
  ];

  const currentAffirmation = affirmations[currentIndex];

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl mb-1">Daily Affirmations</h1>
                <p className="text-sm text-muted-foreground">Words of love and strength for you</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-4">
          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6 bg-gradient-to-br from-chart-5/20 to-primary/10">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-primary mt-1" />
              <p className="text-sm text-muted-foreground">
                Daily affirmations help combat negative self-talk and build postpartum confidence.
              </p>
            </div>
          </Card>

          <Card className={`rounded-3xl border-none shadow-2xl overflow-hidden bg-gradient-to-br ${currentAffirmation.color}`}>
            <div className="relative h-80 md:h-96">
              <ImageWithFallback src={currentAffirmation.image} alt={currentAffirmation.title} className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-primary fill-primary" />
                  <p className="text-sm text-muted-foreground">Today's Message</p>
                </div>
                <h2 className="mb-4">{currentAffirmation.title}</h2>
                <p className="text-base leading-relaxed">{currentAffirmation.message}</p>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-between mt-6">
            <Button variant="outline" size="icon" className="rounded-full w-12 h-12" onClick={() => setCurrentIndex((p) => (p - 1 + affirmations.length) % affirmations.length)}>
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full w-12 h-12" onClick={() => setCurrentIndex((p) => (p + 1) % affirmations.length)}>
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
