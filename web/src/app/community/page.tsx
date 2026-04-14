"use client";

import { Heart, MessageCircle, Plus, Users } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function CommunityPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-br from-chart-5/30 via-chart-5/20 to-background px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl mb-2">Community</h1>
                <p className="text-muted-foreground">Connect, share, and support each other</p>
              </div>
              <Button className="rounded-full bg-chart-5 hover:bg-chart-5/90 text-foreground gap-2">
                <Plus className="w-5 h-5" /> Post
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-4 space-y-6">
          <Card className="rounded-3xl border-none shadow-lg p-6 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              <div>
                <h3>Community Impact</h3>
                <p className="text-sm text-muted-foreground">15.2K moms sharing practical support and trusted advice.</p>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-none shadow-lg p-5">
            <div className="flex items-start gap-3 mb-3">
              <Avatar><AvatarFallback>ER</AvatarFallback></Avatar>
              <div className="flex-1">
                <p>Emma Rodriguez</p>
                <p className="text-xs text-muted-foreground">Week 28 • 2h ago</p>
              </div>
              <Badge variant="secondary">Wellness</Badge>
            </div>
            <p className="text-sm mb-4">
              Prenatal yoga helped my third-trimester back pain and stress. Sharing this for anyone feeling overwhelmed.
            </p>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Heart className="w-4 h-4" />234</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />18 comments</span>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
