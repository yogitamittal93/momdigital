"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Eye, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
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
            <Eye className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Introduction */}
        <Card className="rounded-3xl border-none shadow-lg p-6 mb-8 bg-muted/40">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            At Mom Digital, your privacy is paramount. This Privacy Policy details the data we collect, how it is stored and analyzed, and your rights concerning your personal information.
          </p>
        </Card>

        {/* Sections */}
        <Card className="rounded-3xl border-none shadow-lg p-8 mb-8 space-y-6">
          {/* Section 1 */}
          <div>
            <h2 className="text-base sm:text-lg font-display font-semibold mb-2">
              1. Information We Collect
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-2">
              To provide our maternal assistance dashboard, checklists, and chat systems, we collect the following:
            </p>
            <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Account Credentials:</strong> Email, name, and hashed password.</li>
              <li><strong>Authentication Data:</strong> Third-party OAuth tokens if signing in via Google or GitHub.</li>
              <li><strong>Survey Responses:</strong> Pregnancy status, baby birth date, weight, height, and delivery type.</li>
              <li><strong>Profile Information:</strong> Professional fields, external portfolio links, and contact handles (for experts).</li>
              <li><strong>AI Conversation History:</strong> Chat messages exchanged with our AI maternal helper to support conversation threads.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div>
            <h2 className="text-base sm:text-lg font-display font-semibold mb-2">
              2. How Information Is Used
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-2">
              Collected information is used exclusively to:
            </p>
            <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Manage your user account credentials securely.</li>
              <li>Personalize checklists and exercise recovery logs.</li>
              <li>Generate relevant, contextual responses from our AI helper.</li>
              <li>Improve platform stability and technical capabilities.</li>
              <li>Respond to customer support and technical bug inquiries.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div>
            <h2 className="text-base sm:text-lg font-display font-semibold mb-2">
              3. AI Features &amp; Third-Party Processing
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Our AI chatbot generates guidance messages using third-party AI services. Chat message contents (excluding direct credentials) are sent to these processors. Please note that AI responses should not replace professional healthcare advice, and outputs should be verified independently.
            </p>
          </div>

          {/* Section 4 */}
          <div>
            <h2 className="text-base sm:text-lg font-display font-semibold mb-2">
              4. Data Storage &amp; Protection
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              We leverage cloud database infrastructure (Supabase PostgreSQL) to save your account files, logs, and messages. All server endpoints utilize SSL encryption during transmission. We implement industry-standard administrative and technical safeguards to keep your personal data secure.
            </p>
          </div>

          {/* Section 5 */}
          <div>
            <h2 className="text-base sm:text-lg font-display font-semibold mb-2">
              5. User Rights &amp; Data Deletion
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-2">
              You retain full control over your data. You have the right to:
            </p>
            <ul className="text-xs sm:text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Review or update your profile details inside the application setting dashboard.</li>
              <li>Request the complete deletion of your account and all associated chat history.</li>
              <li>To request database deletion, email us at <a href="mailto:support@momdigital.live" className="text-primary underline">support@momdigital.live</a>. We will process your deletion request within 30 days.</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div>
            <h2 className="text-base sm:text-lg font-display font-semibold mb-2">
              6. Contact Information
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              For compliance questions, please contact our privacy representative:
            </p>
            <div className="mt-3 space-y-1 text-sm">
              <p>Email: <a href="mailto:privacy@momdigital.live" className="text-primary hover:underline font-semibold">privacy@momdigital.live</a></p>
              <p>Support: <a href="mailto:support@momdigital.live" className="text-primary hover:underline font-semibold">support@momdigital.live</a></p>
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
            <Link href="/contact" className="text-primary hover:underline">
              Contact Us
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="/support" className="text-primary hover:underline">
              Help &amp; Support
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
