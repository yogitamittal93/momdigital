"use client";

import Link from "next/link";
import { ArrowLeft, Heart, Shield, MessageSquare, Baby, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="rounded-full gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to App
            </Button>
          </Link>
        </div>

        {/* Branding & Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <Heart className="w-8 h-8 fill-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
            About Mom Digital
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
            MidwifeBuddy Platform
          </p>
        </div>

        {/* Mission Section */}
        <Card className="rounded-3xl border-none shadow-lg p-8 mb-8 bg-gradient-to-br from-primary/15 via-transparent to-secondary/10">
          <h2 className="text-xl sm:text-2xl mb-4 text-foreground font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Our Mission
          </h2>
          <p className="text-base sm:text-lg text-foreground/90 leading-relaxed font-display">
            &ldquo;Mom Digital aims to provide mothers with trusted resources, educational guidance, recovery support, and AI-assisted tools designed to help them navigate motherhood with greater confidence.&rdquo;
          </p>
        </Card>

        {/* Platform Overview */}
        <div className="space-y-6 mb-8">
          <h2 className="text-xl sm:text-2xl font-display font-semibold mb-4 px-2">
            Platform Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trusted Help */}
            <Card className="rounded-3xl border-none shadow-md p-6 bg-card hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-accent/25 text-accent-foreground shrink-0">
                  <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-2 font-display">
                    Trusted Help Resources
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Interactive checklists, safety protocols, and daily hygiene tracking tools for postpartum helpers, nannies, and chefs.
                  </p>
                </div>
              </div>
            </Card>

            {/* AI Chat */}
            <Card className="rounded-3xl border-none shadow-md p-6 bg-card hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-primary/20 text-primary shrink-0">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-2 font-display">
                    AI Chat &amp; Discussions
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Personalized maternal and pediatric guidance powered by RAG technology, verified against certified clinical databases.
                  </p>
                </div>
              </div>
            </Card>

            {/* Recovery & Support */}
            <Card className="rounded-3xl border-none shadow-md p-6 bg-card hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-secondary/20 text-secondary-foreground shrink-0">
                  <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-2 font-display">
                    Recovery &amp; Support
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Customized postpartum physical rehabilitation exercises, maternal mental health affirmations, and core recovery logging.
                  </p>
                </div>
              </div>
            </Card>

            {/* Educational Guidance */}
            <Card className="rounded-3xl border-none shadow-md p-6 bg-card hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-primary/15 text-foreground shrink-0">
                  <Baby className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-2 font-display">
                    Educational Guidance
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Age-gated pediatric nutrition pathways, baby food introduction timelines, and expert curated maternal guidance.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="text-center pt-8 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-4">
            Have questions about Mom Digital?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
            <Link href="/contact" className="text-primary hover:underline">
              Contact Us
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="/support" className="text-primary hover:underline">
              Help &amp; Support
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-6">
            &copy; {new Date().getFullYear()} Mom Digital. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
