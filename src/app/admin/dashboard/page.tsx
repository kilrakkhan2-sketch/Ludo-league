
'use client';

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
import { useCollection } from "@/firebase/firestore/use-collection";
import type { UserProfile, Match, DepositRequest, Transaction } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";


const StatCard = ({ title, value, change, icon: Icon, loading }: { title: string, value: string, change?: string, icon: React.ElementType, loading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
            {title}
            </CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {loading ? (
                <>
                    <Skeleton className="h-8 w-24 mb-1" />
                    <Skeleton className="h-4 w-40" />
                </>
            ) : (
                <>
                    <div className="text-2xl font-bold">{value}</div>
                    {change && <p className="text-xs text-muted-foreground">{change}</p>}
                </>
            )}
        </CardContent>
    </Card>
)

export default function AdminDashboardPage() {
  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users');
  const { data: activeMatches, loading: matchesLoading } = useCollection<Match>('matches', { filter: { field: 'status', operator: '==', value: 'ongoing' } });
  const { data: pendingDeposits, loading: depositsLoading } = useCollection<DepositRequest>('deposit-requests', { filter: { field: 'status', operator: '==', value: 'pending' } });
  const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>('transactions', { sort: { field: 'createdAt', direction: 'desc' }, limit: 5, isCollectionGroup: true });
  const { data: pendingVerifications, loading: verificationsLoading } = useCollection<Match>('matches', { filter: { field: 'status', operator: '==', value: 'verification' } });

  const totalRevenue = transactions
    .filter(tx => tx.type === 'entry_fee')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const stats = [
    {
      title: "Total Revenue",
      value: `₹${(totalRevenue * -1).toLocaleString()}`, // entry fees are negative
      icon: DollarSign,
      loading: transactionsLoading,
    },
    {
      title: "Active Matches",
      value: `${activeMatches.length}`,
      icon: Swords,
      loading: matchesLoading,
    },
    {
      title: "Pending Deposits",
      value: `${pendingDeposits.length}`,
      icon: Wallet,
      loading: depositsLoading,
    },
    {
      title: "Total Users",
      value: `${users.length}`,
      icon: Users,
      loading: usersLoading,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-7">
        <Card className="xl:col-span-4">
           <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                The last 5 transactions across the platform.
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
             {transactionsLoading ? (
                 <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                 </div>
             ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map(tx => (
                            <TableRow key={tx.id}>
                                <TableCell>
                                    <div className="font-medium">{tx.userName || tx.userId.substring(0,6)}</div>
                                    <div className="hidden text-sm text-muted-foreground md:inline">{tx.userEmail}</div>
                                </TableCell>
                                <TableCell><Badge variant="outline">{tx.type}</Badge></TableCell>
                                 <TableCell>
                                    {tx.createdAt ? format(new Date(tx.createdAt.seconds * 1000), 'dd MMM yyyy') : 'N/A'}
                                </TableCell>
                                <TableCell className={`text-right ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.amount > 0 ? '+' : ''}₹{tx.amount.toLocaleString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             )}
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
             {verificationsLoading ? (
                 <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                 </div>
             ) : pendingVerifications.length > 0 ? (
                pendingVerifications.map(match => (
                    <div className="flex items-center" key={match.id}>
                        <CircleDashed className="h-9 w-9 text-muted-foreground" />
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">{match.title}</p>
                            <p className="text-sm text-muted-foreground">{match.players.length} players. Status: {match.status}</p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto" asChild>
                            <Link href={`/admin/results/${match.id}`}>Verify</Link>
                        </Button>
                    </div>
                ))
             ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                    No pending verifications.
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
