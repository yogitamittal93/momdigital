"use client";

import Link from "next/link";
import { ArrowLeft, Shield, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
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
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Healthcare Disclaimer Callout */}
        <Card className="rounded-3xl border-none shadow-lg p-6 mb-8 bg-gradient-to-br from-destructive/10 to-transparent border-l-4 border-destructive">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-destructive mb-1 font-display">
                Important Healthcare Disclaimer
              </h2>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
                The Mom Digital application (MidwifeBuddy) is intended solely for educational and informational purposes. The application and any AI-generated contents are NOT substitutes for professional medical advice, diagnosis, treatment, or clinical evaluation. Always seek the advice of your physician or qualified healthcare provider regarding medical concerns.
              </p>
            </div>
          </div>
        </Card>

        {/* Terms Content */}
        <Card className="rounded-3xl border-none shadow-lg p-8 mb-8 space-y-6">
          {/* Section 1 */}
          <div>
            <h2 className="text-base sm:text-lg font-display font-semibold mb-2">
              1. Acceptance of Terms
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              By accessing, registering, or using the Mom Digital application, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use the application.
            </p>
          </div>

          {/* Section 2 */}
          <div>
            <h2 className="text-base sm:text-lg font-display font-semibold mb-2">
              2. User Responsibilities
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-2">
              As a user, you agree to:
            </p>
            <ul className="text-xs sm:text-sm text-muted-foreground space-y-1.5 list-disc list-inside bg-muted/30 p-4 rounded-2xl">
              <li>Use the platform lawfully and in good faith.</li>
              <li>Provide accurate, current, and complete registration information.</li>
              <li>Maintain the confidentiality of your credentials.</li>
              <li>Avoid any abuse of the AI chatbot services or attempt to extract system prompts.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div>
            <h2 className="text-base sm:text-lg font-display font-semibold mb-2">
              3. AI Feature Limitations
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Our chatbot uses Retrieval-Augmented Generation (RAG) to provide fast educational advice. You acknowledge that AI-generated content may occasionally contain errors or inaccuracies. You should exercise independent judgment and verify critical suggestions.
            </p>
          </div>

          {/* Section 4 */}
          <div>
            <h2 className="text-base sm:text-lg font-display font-semibold mb-2">
              4. Healthcare &amp; Clinical Context
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Checklists, nutrition pathways, recovery exercises, and chatbot assistance are provided as general guideposts. They do not comprise clinical advice or care. Under no circumstances should you delay seeking clinical assistance because of information retrieved from Mom Digital.
            </p>
          </div>

          {/* Section 5 */}
          <div>
            <h2 className="text-base sm:text-lg font-display font-semibold mb-2">
              5. Limitation of Liability
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Mom Digital, its developers, and partners shall not be held liable for any decisions, physical injuries, nutritional choices, or clinical outcomes arising from or related to the usage of AI-generated responses or checklists without independent verification.
            </p>
          </div>

          {/* Section 6 */}
          <div>
            <h2 className="text-base sm:text-lg font-display font-semibold mb-2">
              6. Account Termination
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms, submit abusive queries to the chatbot, harass our contributors, or degrade the platform infrastructure.
            </p>
          </div>

          {/* Section 7 */}
          <div>
            <h2 className="text-base sm:text-lg font-display font-semibold mb-2">
              7. Contact Information
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              If you have any questions or feedback regarding these Terms, please contact support:
            </p>
            <a
              href="mailto:support@momdigital.live"
              className="inline-block mt-2 text-sm text-primary hover:underline font-semibold"
            >
              support@momdigital.live
            </a>
          </div>
        </Card>

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
            <Link href="/support" className="text-primary hover:underline">
              Help &amp; Support
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
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
