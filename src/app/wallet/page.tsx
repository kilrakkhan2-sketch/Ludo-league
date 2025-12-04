import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Upload,
  Wallet as WalletIcon,
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
  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">My Wallet</h1>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Current Balance</CardTitle>
              <CardDescription>Available credits for playing</CardDescription>
            </div>
            <WalletIcon className="h-8 w-8 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">
              1,250{" "}
              <span className="text-2xl text-muted-foreground">credits</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button className="flex-1">
                <Upload className="mr-2 h-4 w-4" /> Deposit
              </Button>
              <Button variant="secondary" className="flex-1">
                <Download className="mr-2 h-4 w-4" /> Withdraw
              </Button>
            </div>
          </CardContent>
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
                  <TableHead className="text-right">Amount</TableHead>
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
