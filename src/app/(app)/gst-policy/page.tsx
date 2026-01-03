
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBadge } from "lucide-react";

export default function GstPolicyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileBadge className="h-6 w-6 text-primary" />
          GST Policy
        </CardTitle>
      </CardHeader>
      <CardContent className="prose dark:prose-invert max-w-full">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2>1. GST on Deposits</h2>
        <p>As per the government regulations in India, a Goods and Services Tax (GST) of 28% is applicable on all deposits made by the user into their Ludo League wallet.</p>
        <p>For example, if you deposit ₹100, an amount of ₹21.87 (which is 28% of the taxable value of ₹78.13) will be deducted as GST. The final amount credited to your wallet will be ₹78.13.</p>

        <h2>2. GST on Winnings</h2>
        <p>There is no GST levied on the winnings from the matches or tournaments. However, winnings are subject to Tax Deducted at Source (TDS) as per the Income Tax Act, 1961.</p>
        
        <h2>3. Invoices</h2>
        <p>A tax invoice for the GST paid on your deposits will be made available to you and can be accessed from your transaction history or requested from our support team.</p>

        <h2>4. Contact Us</h2>
        <p>If you have any questions regarding our GST policy, please contact us at: finance@ludoleague.app</p>
      </CardContent>
    </Card>
  );
}
