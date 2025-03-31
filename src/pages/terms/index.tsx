
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </Button>

        <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
        
        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
          <p className="text-lg text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            Welcome to Prompt-Gineer! These Terms of Service govern your use of our website and services. 
            By accessing or using Prompt-Gineer, you agree to be bound by these Terms. If you disagree with 
            any part of these terms, you may not access our services.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Accounts</h2>
          <p>
            When you create an account with us, you must provide accurate and complete information. 
            You are responsible for maintaining the confidentiality of your account and password, 
            including restricting access to your computer and/or account. You agree to accept 
            responsibility for all activities that occur under your account or password.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Services and Pricing</h2>
          <p>
            Prompt-Gineer offers tools for creating, sharing, and optimizing AI prompts. Our basic 
            services are free to use, but we may offer premium features in the future that require 
            payment. Pricing for any premium services will be clearly displayed on our website.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. User Content</h2>
          <p>
            When you upload or share prompts or templates through our platform, you retain ownership 
            of your content, but grant us a license to use, reproduce, and display that content in 
            connection with our services. You are solely responsible for your content and confirm 
            that you have all necessary rights to share it.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Acceptable Use</h2>
          <p>
            You agree not to use our service for any unlawful purpose or to engage in any activity that 
            could damage, disable, or impair our services. This includes attempts to gain unauthorized 
            access to any part of our service or interfere with another user's use of the service.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Intellectual Property</h2>
          <p>
            The Prompt-Gineer name, logo, website design, and other distinctive features of our service 
            are protected by copyright, trademark, and other laws. You may not use any of these without 
            our prior written permission.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Disclaimer of Warranties</h2>
          <p>
            Our services are provided "as is" without any warranty of any kind, either express or implied. 
            We do not guarantee that our services will be uninterrupted, secure, or error-free.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, 
            special, consequential, or punitive damages resulting from your use of or inability to use 
            our services.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will provide notice of significant 
            changes by posting the updated Terms on our website. Your continued use of our services after 
            such changes constitutes your acceptance of the new Terms.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at support@prompt-gineer.com.
          </p>
        </div>
      </div>
    </div>
  );
}
