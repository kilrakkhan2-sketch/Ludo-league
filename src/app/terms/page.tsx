
import { AppShell } from "@/components/layout/AppShell";

export default function TermsOfServicePage() {
  return (
    <AppShell pageTitle="Terms of Service" showBackButton>
      <div className="p-4 sm:p-6">
        <div className="prose dark:prose-invert max-w-none bg-card p-6 rounded-lg shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">Terms of Service</h1>
            <p className="text-sm text-muted-foreground">Last updated: July 24, 2024</p>

            <p>Please read these terms and conditions carefully before using Our Service.</p>

            <h2 className="text-xl sm:text-2xl font-semibold mt-6 mb-3">Interpretation and Definitions</h2>
            <h3 className="text-lg sm:text-xl font-semibold mt-4 mb-2">Interpretation</h3>
            <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
            <h3 className="text-lg sm:text-xl font-semibold mt-4 mb-2">Definitions</h3>
            <p>For the purposes of these Terms and Conditions:</p>
            <ul className="list-disc space-y-2 pl-5">
                <li>
                    <p><strong>"Application"</strong> means the software program provided by the Company downloaded by You on any electronic device, named LudoLeague.</p>
                </li>
                <li>
                    <p><strong>"Company"</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to LudoLeague.</p>
                </li>
                <li>
                    <p><strong>"Country"</strong> refers to: India</p>
                </li>
                <li>
                    <p><strong>"Service"</strong> refers to the Application.</p>
                </li>
                <li>
                    <p><strong>"Terms and Conditions"</strong> (also referred as "Terms") mean these Terms and Conditions that form the entire agreement between You and the Company regarding the use of the Service.</p>
                </li>
                <li>
                    <p><strong>"You"</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</p>
                </li>
            </ul>

            <h2 className="text-xl sm:text-2xl font-semibold mt-6 mb-3">Acknowledgment</h2>
            <p>These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.</p>
            <p>Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.</p>
            <p>By accessing or using the Service You agree to be bound by these Terms and Conditions. If You disagree with any part of these Terms and Conditions then You may not access the Service.</p>
            <p>You represent that you are over the age of 18. The Company does not permit those under 18 to use the Service.</p>
            <p>Your access to and use of the Service is also conditioned on Your acceptance of and compliance with the Privacy Policy of the Company. Our Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your personal information when You use the Application or the Website and tells You about Your privacy rights and how the law protects You. Please read Our Privacy Policy carefully before using Our Service.</p>

            <h2 className="text-xl sm:text-2xl font-semibold mt-6 mb-3">Changes to These Terms and Conditions</h2>
            <p>We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.</p>
            <p>By continuing to access or use Our Service after those revisions become effective, You agree to be bound by the revised terms. If You do not agree to the new terms, in whole or in part, please stop using the website and the Service.</p>

            <h2 className="text-xl sm:text-2xl font-semibold mt-6 mb-3">Contact Us</h2>
            <p>If you have any questions about these Terms and Conditions, You can contact us:</p>
            <ul className="list-disc space-y-2 pl-5">
                <li>By email: support@ludoleague.com</li>
            </ul>
        </div>
    </div>
    </AppShell>
  );
}
