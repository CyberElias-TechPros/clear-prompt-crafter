
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </Button>

        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
          <p className="text-lg text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
          <p>
            Prompt-Gineer collects information that you provide directly to us:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Account information (name, email, password)</li>
            <li>Profile information (display name, profile picture)</li>
            <li>Content you create or share (prompts, templates, comments)</li>
            <li>Communications with us</li>
            <li>Information about how you use our services</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide, maintain, and improve our services</li>
            <li>Create and maintain your account</li>
            <li>Process transactions</li>
            <li>Send you technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Develop new products and services</li>
            <li>Monitor and analyze trends and usage</li>
            <li>Protect against fraud and abuse</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Information Sharing</h2>
          <p>
            Prompt-Gineer may share your information in the following circumstances:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>With your consent</li>
            <li>With service providers who need access to perform services for us</li>
            <li>To comply with legal obligations</li>
            <li>In connection with a merger, sale, or acquisition</li>
            <li>In an aggregated or anonymized form that cannot be used to identify you</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Your Choices</h2>
          <p>
            You can access and update certain information about your account in your profile settings. 
            You can also request that we delete your personal information, though we may retain certain 
            information as required by law or for legitimate business purposes.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Security</h2>
          <p>
            We take reasonable measures to help protect your personal information from loss, theft, 
            misuse, unauthorized access, disclosure, alteration, and destruction. However, no internet 
            or email transmission is ever fully secure or error-free.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. International Data Transfers</h2>
          <p>
            Your information may be transferred to, and maintained on, computers located outside of your 
            state, province, country, or other governmental jurisdiction where privacy laws may not be as 
            protective as those in your jurisdiction.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Children's Privacy</h2>
          <p>
            Our services are not directed to children under 13, and we do not knowingly collect personal 
            information from children under 13. If you are a parent or guardian and believe we have collected 
            information from your child, please contact us.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. We will notify you of any changes by posting the 
            new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for 
            any changes.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at privacy@prompt-gineer.com.
          </p>
        </div>
      </div>
    </div>
  );
}
