
import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-12 animate-in fade-in duration-500">
      <Link
        to="/"
        className="mb-8 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Home
      </Link>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="mt-2 text-muted-foreground">Last updated: April 3, 2025</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p>
            Welcome to Prompt-Gineer ("we," "our," or "us"). By accessing or using our services, you agree to be bound by these Terms of Service ("Terms"). Please read these Terms carefully.
          </p>
          <p>
            Our platform provides tools for creating, sharing, and managing AI prompts. These Terms govern your access to and use of our website, applications, and services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. Account Registration</h2>
          <p>
            To access certain features of our service, you may need to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
          </p>
          <p>
            You are responsible for safeguarding your password. You agree not to disclose your password to any third party and to take sole responsibility for any activities or actions under your account, whether or not you have authorized such activities or actions.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. User Content</h2>
          <p>
            Our service allows you to create, post, link to, store, share, and otherwise make available certain information, text, graphics, or other material ("User Content"). You are responsible for the User Content that you post on or through our service.
          </p>
          <p>
            By posting User Content on or through our service, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, modify, create derivative works based on, distribute, publicly display, publicly perform, and otherwise use your User Content in any way related to operating and promoting our services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Community Guidelines</h2>
          <p>
            You agree not to post User Content that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Is unlawful, harmful, threatening, abusive, harassing, defamatory, or invasive of another's privacy</li>
            <li>Infringes any patent, trademark, trade secret, copyright, or other intellectual property right</li>
            <li>Constitutes unauthorized or unsolicited advertising, promotional materials, junk mail, spam, or any other form of solicitation</li>
            <li>Contains software viruses or any other code designed to interrupt, destroy, or limit the functionality of any computer software or hardware</li>
            <li>Impersonates any person or entity or falsely states or otherwise misrepresents your affiliation with a person or entity</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Intellectual Property</h2>
          <p>
            Our service and its original content (excluding User Content), features, and functionality are and will remain the exclusive property of Prompt-Gineer and its licensors. Our service is protected by copyright, trademark, and other laws.
          </p>
          <p>
            Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Prompt-Gineer.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">6. Termination</h2>
          <p>
            We may terminate or suspend your account and bar access to our service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
          </p>
          <p>
            If you wish to terminate your account, you may simply discontinue using our service, or notify us that you wish to delete your account.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">7. Limitation of Liability</h2>
          <p>
            In no event shall Prompt-Gineer, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your access to or use of or inability to access or use our service</li>
            <li>Any conduct or content of any third party on our service</li>
            <li>Any content obtained from our service</li>
            <li>Unauthorized access, use, or alteration of your transmissions or content</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">8. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
          </p>
          <p>
            Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">9. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page.
          </p>
          <p>
            By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using our service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">10. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <Button asChild className="mt-2">
            <Link to="/contact">Contact Page</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
