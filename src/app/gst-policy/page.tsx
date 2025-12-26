
import { InfoPageShell } from "@/components/layout/InfoPageShell";

export default function GstPolicyPage() {
  return (
    <InfoPageShell pageTitle="GST Policy">
        <h2>Our Commitment to Transparency</h2>
        <p>At LudoLeague, we believe in complete transparency with our users, especially when it comes to financial matters. This page explains how Goods and Services Tax (GST) is applied to deposits on our platform.</p>

        <h2>Government Regulations on GST</h2>
        <p>As per the laws and regulations set by the Government of India, a 28% GST is applicable on all deposits made on online gaming platforms. We are legally required to comply with this regulation.</p>

        <h2>LudoLeague's 100% GST Credit Policy</h2>
        <p>We understand that this deduction can affect your playing amount. To ensure you get the maximum value for your money, we have a special policy in place:</p>
        <blockquote>
            <strong>For every deposit you make, LudoLeague credits the entire 28% GST amount back to your wallet as a bonus.</strong>
        </blockquote>
        <p>This means if you deposit ₹100, while ₹28 is paid towards GST, we will add ₹28 back into your wallet from our side. The net effect is that your wallet is credited with the full ₹100 you deposited.</p>

        <h3>Example Breakdown:</h3>
        <ul>
            <li>You deposit: <strong>₹1000</strong></li>
            <li>GST @28% (deducted as per law): <strong>₹280</strong></li>
            <li>Amount after GST: ₹720</li>
            <li>GST Credit from LudoLeague: <strong>+ ₹280</strong></li>
            <li><strong>Final Amount Credited to Your Wallet: ₹1000</strong></li>
        </ul>

        <h2>Why We Do This</h2>
        <p>Our goal is to build a long-lasting and trustworthy relationship with our players. By crediting the GST amount back, we absorb the cost to ensure that you can enjoy our platform without any hidden charges or reduced value on your deposits.</p>

        <p>If you have any further questions about our GST policy, please feel free to <a href="/contact">contact our support team</a>.</p>
    </InfoPageShell>
  );
}
