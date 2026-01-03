
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { mockTransactions } from "@/lib/data"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { cn } from "@/lib/utils"
import { ArrowDownLeft, ArrowUpRight, UploadCloud, DownloadCloud, Landmark, Wallet as WalletIcon, AlertCircle } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

export default function WalletPage() {
  const qrCodeImage = PlaceHolderImages.find(img => img.id === 'qr-code');

  const balance = mockTransactions.reduce((acc, txn) => {
    if (txn.status === 'completed') {
      return acc + txn.amount;
    }
    return acc;
  }, 0);

  return (
    <>
      <div className="grid gap-8">
        <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="grid gap-2">
                    <CardTitle>Current Balance</CardTitle>
                    <CardDescription>
                        This is the total amount of funds in your wallet.
                    </CardDescription>
                </div>
                <div className="text-4xl font-bold text-primary">
                    ₹{balance.toFixed(2)}
                </div>
            </CardHeader>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
             <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UploadCloud className="h-6 w-6 text-green-500" />Deposit Funds</CardTitle>
                <CardDescription>Add money to your wallet to join matches.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Important: Name Match Required</AlertTitle>
                    <AlertDescription>
                        Please deposit from a bank account or UPI ID where the name matches your KYC documents. Mismatched names will result in rejection of the deposit.
                    </AlertDescription>
                </Alert>
                <div className="flex flex-col items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-center text-muted-foreground">Scan the QR code with your payment app and enter the UTR below.</p>
                    {qrCodeImage && <Image src={qrCodeImage.imageUrl} alt="QR Code" width={200} height={200} className="rounded-lg border-2" data-ai-hint={qrCodeImage.imageHint} />}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="utr">UTR / Transaction ID</Label>
                    <Input id="utr" placeholder="Enter the 12-digit UTR/Transaction ID" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="screenshot">Payment Screenshot</Label>
                    <Input id="screenshot" type="file" className="text-muted-foreground file:text-primary"/>
                </div>
                <Button className="w-full" variant="accent"><UploadCloud className="mr-2 h-4 w-4" /> Submit Deposit</Button>
            </CardContent>
            </Card>
            <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><DownloadCloud className="h-6 w-6 text-blue-500" />Withdraw Funds</CardTitle>
                <CardDescription>Request a withdrawal to your bank account.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <Alert variant='default' className="bg-blue-50 border-blue-200 text-blue-800">
                    <Landmark className="h-4 w-4 !text-blue-600" />
                    <AlertTitle>Withdrawal Policy</AlertTitle>
                    <AlertDescription>
                        Withdrawals are sent to the bank account/UPI ID verified via KYC. Ensure the name matches your KYC details. Approval may take up to 24 hours.
                    </AlertDescription>
                </Alert>
                <div className="grid gap-2">
                    <Label htmlFor="withdraw-amount">Amount (Min. ₹100)</Label>
                    <Input id="withdraw-amount" type="number" placeholder="e.g., 500" />
                </div>

                <Button className="w-full"><DownloadCloud className="mr-2 h-4 w-4" /> Request Withdrawal</Button>
            </CardContent>
            </Card>
        </div>


        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>A list of your recent wallet activity.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mockTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="font-medium">
                        <TableCell>
                        <div className="font-semibold flex items-center gap-2">
                            {transaction.amount > 0 ? <ArrowDownLeft className="h-4 w-4 text-green-500" /> : <ArrowUpRight className="h-4 w-4 text-red-500" />}
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1).replace('-', ' ')}
                        </div>
                        <div className="text-xs text-muted-foreground md:inline">
                           ID: {transaction.id}
                        </div>
                        </TableCell>
                         <TableCell className="text-center">
                        <Badge variant={transaction.status === 'completed' ? 'default' : transaction.status === 'pending' ? 'secondary' : 'destructive'} className={cn("text-xs", {
                            "bg-green-100 text-green-800 border-green-200 hover:bg-green-100": transaction.status === "completed",
                            "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100": transaction.status === "pending",
                            "bg-red-100 text-red-800 border-red-200 hover:bg-red-100": transaction.status === "rejected",
                        })}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                            {new Date(transaction.date).toLocaleString()}
                        </TableCell>
                        <TableCell className={cn("text-right font-bold text-lg", transaction.amount > 0 ? 'text-green-600' : 'text-red-600')}>
                        {transaction.amount > 0 ? '+' : '-'}₹{Math.abs(transaction.amount).toFixed(2)}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </>
  )
}
