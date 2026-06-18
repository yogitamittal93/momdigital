"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Heart, Globe, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
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

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
            Contact Us
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            We are here to support you on your maternal journey. Get in touch with our team.
          </p>
        </div>

        {/* Email Channels Card */}
        <Card className="rounded-3xl border-none shadow-lg p-8 mb-8 space-y-6">
          <h2 className="text-lg sm:text-xl font-display font-semibold border-b border-border pb-3">
            Inquiry Channels
          </h2>

          <div className="space-y-6">
            {/* General */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">General Inquiries</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1.5">
                  Questions regarding partnerships, collaborations, or general information about our platform.
                </p>
                <a
                  href="mailto:hello@momdigital.live"
                  className="text-sm text-primary hover:underline font-medium break-all"
                >
                  hello@momdigital.live
                </a>
              </div>
            </div>

            {/* Support */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-secondary/15 text-secondary-foreground shrink-0">
                <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">Technical &amp; Maternity Support</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1.5">
                  Need assistance with your account, app bugs, or expert dashboard operations?
                </p>
                <a
                  href="mailto:support@momdigital.live"
                  className="text-sm text-primary hover:underline font-medium break-all"
                >
                  support@momdigital.live
                </a>
              </div>
            </div>

            {/* Privacy */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-accent/20 text-accent-foreground shrink-0">
                <Heart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">Privacy &amp; Data Rights</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1.5">
                  Submit account deletion requests, query data usage, or reach our compliance coordinator.
                </p>
                <a
                  href="mailto:privacy@momdigital.live"
                  className="text-sm text-primary hover:underline font-medium break-all"
                >
                  privacy@momdigital.live
                </a>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer Actions */}
        <div className="text-center pt-8 border-t border-border/50">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
            <Link href="/about" className="text-primary hover:underline">
              About Us
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
