
import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-muted-foreground">Last updated: April 3, 2025</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p>
            At Prompt-Gineer, we respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
          </p>
          <p>
            This privacy policy applies to all users of our platform, including those who create, share, and access AI prompts and related content.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. Data We Collect</h2>
          <p>
            We may collect, use, store, and transfer different kinds of personal data about you which we have grouped as follows:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Identity Data</strong> includes first name, last name, username, or similar identifier.</li>
            <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access our website.</li>
            <li><strong>Usage Data</strong> includes information about how you use our website, products, and services.</li>
            <li><strong>Profile Data</strong> includes your username and password, your interests, preferences, feedback, and survey responses.</li>
            <li><strong>Content Data</strong> includes prompts, templates, and other content you create, share, or interact with on our platform.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. How We Use Your Data</h2>
          <p>
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>
          <p>
            Generally, we do not rely on consent as a legal basis for processing your personal data except in relation to sending direct marketing communications to you via email. You have the right to withdraw consent to marketing at any time by contacting us.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Data Sharing</h2>
          <p>
            We may share your personal data with the parties set out below for the purposes set out in this privacy policy:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Service providers who provide IT and system administration services.</li>
            <li>Professional advisers including lawyers, bankers, auditors, and insurers who provide consultancy, banking, legal, insurance, and accounting services.</li>
            <li>Regulators and other authorities who require reporting of processing activities in certain circumstances.</li>
            <li>Third parties to whom we may choose to sell, transfer or merge parts of our business or our assets. Alternatively, we may seek to acquire other businesses or merge with them. If a change happens to our business, then the new owners may use your personal data in the same way as set out in this privacy policy.</li>
          </ul>
          <p>
            We require all third parties to respect the security of your personal data and to treat it in accordance with the law. We do not allow our third-party service providers to use your personal data for their own purposes and only permit them to process your personal data for specified purposes and in accordance with our instructions.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Data Security</h2>
          <p>
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know. They will only process your personal data on our instructions, and they are subject to a duty of confidentiality.
          </p>
          <p>
            We have put in place procedures to deal with any suspected personal data breach and will notify you and any applicable regulator of a breach where we are legally required to do so.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">6. Data Retention</h2>
          <p>
            We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, regulatory, tax, accounting, or reporting requirements. We may retain your personal data for a longer period in the event of a complaint or if we reasonably believe there is a prospect of litigation in respect to our relationship with you.
          </p>
          <p>
            To determine the appropriate retention period for personal data, we consider the amount, nature, and sensitivity of the personal data, the potential risk of harm from unauthorized use or disclosure of your personal data, the purposes for which we process your personal data and whether we can achieve those purposes through other means, and the applicable legal, regulatory, tax, accounting, or other requirements.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">7. Your Legal Rights</h2>
          <p>
            Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Request access to your personal data.</li>
            <li>Request correction of your personal data.</li>
            <li>Request erasure of your personal data.</li>
            <li>Object to processing of your personal data.</li>
            <li>Request restriction of processing your personal data.</li>
            <li>Request transfer of your personal data.</li>
            <li>Right to withdraw consent.</li>
          </ul>
          <p>
            You can exercise any of these rights by contacting us. You will not have to pay a fee to access your personal data (or to exercise any of the other rights). However, we may charge a reasonable fee if your request is clearly unfounded, repetitive, or excessive. Alternatively, we could refuse to comply with your request in these circumstances.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">8. Cookie Policy</h2>
          <p>
            Our website uses cookies to distinguish you from other users of our website. This helps us to provide you with a good experience when you browse our website and also allows us to improve our site. By continuing to browse the site, you are agreeing to our use of cookies.
          </p>
          <p>
            A cookie is a small file of letters and numbers that we store on your browser or the hard drive of your computer if you agree. Cookies contain information that is transferred to your computer's hard drive.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">9. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. When we change this privacy policy in a material way, we will update the "last updated" date at the top of this privacy policy. We may also notify you in other ways from time to time about the processing of your personal information.
          </p>
          <p>
            Your continued use of our services after we publish or notify you about our changes to this privacy policy means that you are consenting to the updated privacy policy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">10. Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or our privacy practices, please contact us at:
          </p>
          <Button asChild className="mt-2">
            <Link to="/contact">Contact Page</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
