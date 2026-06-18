"use client";

import Link from "next/link";
import { ArrowLeft, MessageSquare, AlertCircle, UserCheck, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SupportPage() {
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
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
            Support Center
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Troubleshoot system errors, query account features, or submit bugs directly.
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {/* Contact Support */}
          <Card className="rounded-3xl border-none shadow-md p-6 bg-card">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold mb-2 font-display">
                  Section 1 - Contact Support
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  For all technical or platform questions, please reach our help desk via email:
                </p>
                <a
                  href="mailto:support@momdigital.live"
                  className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                >
                  support@momdigital.live
                </a>
              </div>
            </div>
          </Card>

          {/* Bug Reports */}
          <Card className="rounded-3xl border-none shadow-md p-6 bg-card">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-secondary/20 text-secondary-foreground shrink-0">
                <AlertCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold mb-2 font-display">
                  Section 2 - Bug Reports
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  If you encounter issues, please email us with a detailed description. We appreciate reports on:
                </p>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-1.5 list-disc list-inside bg-muted/30 p-4 rounded-2xl">
                  <li><strong>App Crashes:</strong> System halts, blank screens, or sudden device closures.</li>
                  <li><strong>Incorrect AI Responses:</strong> Guidance warnings or critical conversational errors.</li>
                  <li><strong>Broken Features:</strong> Buttons, links, or image uploaders that do not trigger.</li>
                  <li><strong>Technical Issues:</strong> Authentication blocks or slow loading times.</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Account Assistance */}
          <Card className="rounded-3xl border-none shadow-md p-6 bg-card">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-accent/20 text-accent-foreground shrink-0">
                <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold mb-2 font-display">
                  Section 3 - Account Assistance
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  Reach out for help managing your user profile or credentials:
                </p>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-1.5 list-disc list-inside bg-muted/30 p-4 rounded-2xl">
                  <li><strong>Login Issues:</strong> Password reset questions or registration errors.</li>
                  <li><strong>Account Issues:</strong> Expert role settings or incorrect status tags.</li>
                  <li><strong>Data Deletion Requests:</strong> Complete removal of account files, chat history, and vitals.</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Response Time */}
          <Card className="rounded-3xl border-none shadow-md p-6 bg-card border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold mb-1 font-display">
                  Section 4 - Response Time
                </h2>
                <p className="text-sm font-medium text-foreground">
                  &ldquo;We aim to respond within 2-5 business days.&rdquo;
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="text-center pt-8 border-t border-border/50">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
            <Link href="/about" className="text-primary hover:underline">
              About Us
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="/contact" className="text-primary hover:underline">
              Contact Us
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
