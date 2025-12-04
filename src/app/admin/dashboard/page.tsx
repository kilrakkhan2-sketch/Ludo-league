import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Wallet,
  Swords,
  Activity,
  ArrowUpRight,
  DollarSign,
  CircleDashed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const stats = [
  {
    title: "Total Revenue",
    value: "₹45,231.89",
    change: "+20.1% from last month",
    icon: DollarSign,
  },
  {
    title: "Active Matches",
    value: "+23",
    change: "+180.1% from last month",
    icon: Swords,
  },
  {
    title: "Pending Deposits",
    value: "+12",
    change: "+19% from last month",
    icon: Wallet,
  },
  {
    title: "Total Users",
    value: "+573",
    change: "+201 since last hour",
    icon: Users,
  },
];

const recentTransactions = [
    {
        user: "Olivia Martin",
        email: "olivia.martin@email.com",
        amount: "+₹1,999.00",
        type: "Deposit"
    },
     {
        user: "Jackson Lee",
        email: "jackson.lee@email.com",
        amount: "+₹39.00",
        type: "Deposit"
    },
     {
        user: "Isabella Nguyen",
        email: "isabella.nguyen@email.com",
        amount: "-₹299.00",
        type: "Withdrawal"
    },
      {
        user: "William Kim",
        email: "will@email.com",
        amount: "+₹99.00",
        type: "Deposit"
    },
      {
        user: "Sofia Davis",
        email: "sofia.davis@email.com",
        amount: "+₹39.00",
        type: "Deposit"
    },
]

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-7">
        <Card className="xl:col-span-4">
           <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Recent deposits and withdrawals.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/admin/deposits">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="hidden sm:table-cell">Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentTransactions.map(tx => (
                        <TableRow key={tx.email}>
                            <TableCell>
                                <div className="font-medium">{tx.user}</div>
                                <div className="hidden text-sm text-muted-foreground md:inline">{tx.email}</div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{tx.type}</TableCell>
                            <TableCell className="text-right">{tx.amount}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1 xl:col-span-3">
          <CardHeader>
            <CardTitle>Pending Result Verifications</CardTitle>
            <CardDescription>
              Matches that need administrator approval for results.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center">
                <CircleDashed className="h-9 w-9 text-muted-foreground" />
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">LUDO456</p>
                    <p className="text-sm text-muted-foreground">4 players submitted results. Conflict detected.</p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto">Verify</Button>
             </div>
             <div className="flex items-center">
                <CircleDashed className="h-9 w-9 text-muted-foreground" />
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">QUICK99</p>
                    <p className="text-sm text-muted-foreground">3/4 players submitted. 1 pending.</p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto">Verify</Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
