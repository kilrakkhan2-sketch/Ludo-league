
import { InfoPageShell } from "@/components/layout/InfoPageShell";

export default function TermsOfServicePage() {
  return (
    <InfoPageShell pageTitle="Terms of Service">
      <div className="p-4 sm:p-6">
        <div className="prose dark:prose-invert max-w-none bg-card p-6 rounded-lg shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">Terms of Service</h1>
            <p className="text-sm text-muted-foreground">Last updated: July 25, 2024</p>

            <p>Please read these terms and conditions carefully before using Our Service.</p>

            <h2 className="text-xl sm:text-2xl font-semibold mt-6 mb-3">Interpretation and Definitions</h2>
            <h3 className="text-lg sm:text-xl font-semibold mt-4 mb-2">Interpretation</h3>
            <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
            <h3 className="text-lg sm:text-xl font-semibold mt-4 mb-2">Definitions</h3>
            <p>For the purposes of this Privacy Policy:</p>
            <ul className="list-disc space-y-2 pl-5">
                <li>
                    <p><strong>"Account"</strong> means a unique account created for You to access our Service or parts of our Service.</p>
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

            <h2 className="text-xl sm:text-2xl font-semibold mt-6 mb-3">User Accounts</h2>
            <p>When You create an account with Us, You must provide Us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.</p>
            <p>You are responsible for safeguarding the password that You use to access the Service and for any activities or actions under Your password, whether Your password is with Our Service or a Third-Party Social Media Service.</p>
            <p>You agree not to disclose Your password to any third party. You must notify Us immediately upon becoming aware of any breach of security or unauthorized use of Your account.</p>

            <h2 className="text-xl sm:text-2xl font-semibold mt-6 mb-3">Financial Terms</h2>
            <p><strong>Deposits:</strong> You may add funds to your wallet using the payment methods available. All deposits must be from a payment source on which you are the named account holder.</p>
            <p><strong>Withdrawals:</strong> You may request withdrawals from your wallet. We may require you to complete KYC verification before processing withdrawals. Withdrawals are subject to processing times and may be remitted only to the original source of deposit or a verified bank account.</p>
            <p><strong>Entry Fees:</strong> When you join a match or tournament, the corresponding entry fee will be deducted from your wallet. This fee is non-refundable once the match begins.</p>
            
            <h2 className="text-xl sm:text-2xl font-semibold mt-6 mb-3">Intellectual Property</h2>
            <p>The Service and its original content (excluding Content provided by You or other users), features and functionality are and will remain the exclusive property of the Company and its licensors. The Service is protected by copyright, trademark, and other laws of both the Country and foreign countries.</p>

            <h2 className="text-xl sm:text-2xl font-semibold mt-6 mb-3">Termination</h2>
            <p>We may terminate or suspend Your Account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms and Conditions.</p>
            <p>Upon termination, Your right to use the Service will cease immediately. If You wish to terminate Your Account, You may simply discontinue using the Service.</p>

            <h2 className="text-xl sm:text-2xl font-semibold mt-6 mb-3">Limitation of Liability</h2>
            <p>Notwithstanding any damages that You might incur, the entire liability of the Company and any of its suppliers under any provision of this Terms and Your exclusive remedy for all of the foregoing shall be limited to the amount actually paid by You through the Service or 100 USD if You haven't purchased anything through the Service.</p>

            <h2 className="text-xl sm:text-2xl font-semibold mt-6 mb-3">Governing Law</h2>
            <p>The laws of the Country, excluding its conflicts of law rules, shall govern this Terms and Your use of the Service. Your use of the Application may also be subject to other local, state, national, or international laws.</p>
            
            <h2 className="text-xl sm:text-2xl font-semibold mt-6 mb-3">Dispute Resolution</h2>
            <p>If You have any concern or dispute about the Service, You agree to first try to resolve the dispute informally by contacting the Company. If a resolution cannot be reached, you agree to submit to the exclusive jurisdiction of the courts located in the Country.</p>
            
            <h2 className="text-xl sm:text-2xl font-semibold mt-6 mb-3">Changes to These Terms and Conditions</h2>
            <p>We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.</p>

            <h2 className="text-xl sm:text-2xl font-semibold mt-6 mb-3">Contact Us</h2>
            <p>If you have any questions about these Terms and Conditions, You can contact us:</p>
            <ul className="list-disc space-y-2 pl-5">
                <li>By email: support@ludoleague.com</li>
            </ul>
        </div>
    </div>
    </InfoPageShell>
  );
}
