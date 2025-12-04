
'use client'

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Upload,
  Wallet as WalletIcon,
  Copy
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDoc } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

type AppSettings = {
  id: string;
  upiId?: string;
}

const transactions = [
  {
    id: "txn_1",
    type: "Deposit",
    amount: 500,
    date: "2024-07-20",
    status: "Completed",
  },
  {
    id: "txn_2",
    type: "Entry Fee",
    amount: -50,
    date: "2024-07-20",
    status: "Completed",
  },
  {
    id: "txn_3",
    type: "Win Prize",
    amount: 190,
    date: "2024-07-19",
    status: "Completed",
  },
  {
    id: "txn_4",
    type: "Withdrawal",
    amount: -200,
    date: "2024-07-18",
    status: "Pending",
  },
  {
    id: "txn_5",
    type: "Deposit",
    amount: 100,
    date: "2024-07-17",
    status: "Completed",
  },
];

export default function WalletPage() {
  const { data: settings, loading: settingsLoading } = useDoc<AppSettings>('settings/payment');
  const { toast } = useToast();
  
  const upiId = settings?.upiId || "loading...";

  const handleCopy = () => {
    if (upiId && upiId !== "loading...") {
      navigator.clipboard.writeText(upiId);
      toast({
        title: "Copied!",
        description: "UPI ID copied to clipboard.",
      });
    }
  };


  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">My Wallet</h1>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Current Balance</CardTitle>
              <CardDescription>Available balance for playing</CardDescription>
            </div>
            <WalletIcon className="h-8 w-8 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">
              ₹1,250{" "}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex-1">
                  <Upload className="mr-2 h-4 w-4" /> Deposit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Deposit Funds</DialogTitle>
                  <DialogDescription>
                    Complete the payment and submit the details for verification.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                   <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input id="amount" type="number" placeholder="Min amount: 100" />
                   </div>
                   <div className="space-y-2 text-center bg-muted p-4 rounded-md">
                      <Label>Pay using UPI</Label>
                      <div className="flex items-center justify-center gap-2">
                        {settingsLoading ? (
                             <div className="h-5 w-48 bg-background rounded-md animate-pulse" />
                        ): (
                            <p className="text-sm font-semibold text-primary">{upiId}</p>
                        )}
                        <Button variant="ghost" size="icon" onClick={handleCopy} disabled={settingsLoading}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Scan QR or copy UPI ID</p>
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="transactionId">Transaction ID / UPI Reference No.</Label>
                      <Input id="transactionId" placeholder="Enter your transaction ID" />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="screenshot">Upload Screenshot</Label>
                      <Input id="screenshot" type="file" />
                   </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">Submit Deposit Request</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="secondary" className="flex-1">
              <Download className="mr-2 h-4 w-4" /> Withdraw
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Your recent wallet activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount (₹)</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tx.amount > 0 ? (
                          <div className="p-1.5 bg-success/20 rounded-full">
                            <ArrowUpRight className="h-4 w-4 text-success" />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-destructive/20 rounded-full">
                            <ArrowDownLeft className="h-4 w-4 text-destructive" />
                          </div>
                        )}
                        <span className="font-medium">{tx.type}</span>
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold",
                        tx.amount > 0 ? "text-success" : "text-destructive"
                      )}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount}
                    </TableCell>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell>
                      <Badge
                        variant={"outline"}
                        className={cn(
                          "font-medium",
                          tx.status === "Completed" &&
                            "bg-success/20 text-success border-success/20",
                          tx.status === "Pending" &&
                            "bg-warning/20 text-warning border-warning/20"
                        )}
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
