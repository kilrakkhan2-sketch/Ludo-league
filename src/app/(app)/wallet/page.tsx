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
import { ArrowDownLeft, ArrowUpRight, UploadCloud } from "lucide-react"

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
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Wallet</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>A list of your recent wallet activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="font-medium flex items-center gap-2">
                        {transaction.amount > 0 ? <ArrowDownLeft className="h-4 w-4 text-green-500" /> : <ArrowUpRight className="h-4 w-4 text-red-500" />}
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1).replace('-', ' ')}
                      </div>
                      <div className="text-sm text-muted-foreground md:inline">
                        {new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.status === 'completed' ? 'default' : transaction.status === 'pending' ? 'secondary' : 'destructive'} className={cn({
                        "bg-green-500/20 text-green-700 hover:bg-green-500/30": transaction.status === "completed",
                        "bg-amber-500/20 text-amber-700 hover:bg-amber-500/30": transaction.status === "pending",
                        "bg-red-500/20 text-red-700 hover:bg-red-500/30": transaction.status === "rejected",
                      })}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("text-right font-semibold", transaction.amount > 0 ? 'text-green-600' : 'text-red-600')}>
                      ₹{Math.abs(transaction.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Deposit Funds</CardTitle>
            <CardDescription>Add money to your wallet to join matches.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-center text-muted-foreground">Scan the QR code with your payment app.</p>
                {qrCodeImage && <Image src={qrCodeImage.imageUrl} alt="QR Code" width={200} height={200} className="rounded-lg" data-ai-hint={qrCodeImage.imageHint} />}
            </div>
            <div className="grid gap-2">
                <Label htmlFor="utr">UTR Number</Label>
                <Input id="utr" placeholder="Enter the UTR/Transaction ID" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="screenshot">Payment Screenshot</Label>
                <Input id="screenshot" type="file" className="text-muted-foreground file:text-primary"/>
            </div>
            <Button className="w-full" variant="accent"><UploadCloud className="mr-2 h-4 w-4" /> Submit for Approval</Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
