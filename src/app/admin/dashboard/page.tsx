
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
  ArrowUpRight,
  DollarSign,
  CircleDashed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useCollectionCount, useCollectionGroup } from "@/firebase";
import type { Match, DepositRequest, Transaction } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useMemo } from "react";


const StatCard = ({ title, value, change, icon: Icon, loading, to }: { title: string, value: string, change?: string, icon: React.ElementType, loading: boolean, to?: string }) => {
    const CardContentWrapper = to ? Link : 'div';
    return (
        <Card asChild={!!to} className={to ? 'hover:bg-muted/50 cursor-pointer' : ''}>
            <CardContentWrapper href={to || ''}>
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
            </CardContentWrapper>
        </Card>
    )
}

export default function AdminDashboardPage() {
  const { count: userCount, loading: usersLoading } = useCollectionCount('users');
  const { count: activeMatchesCount, loading: matchesLoading } = useCollectionCount('matches', { where: ['status', '==', 'ongoing'] });
  const { count: pendingDepositsCount, loading: depositsLoading } = useCollectionCount('deposit-requests', { where: ['status', '==', 'pending'] });
  const { data: transactions, loading: transactionsLoading } = useCollectionGroup<Transaction>('transactions', { orderBy: ['createdAt', 'desc'], limit: 5 });
  const { data: pendingVerifications, loading: verificationsLoading } = useCollection<Match>('matches', { where: ['status', '==', 'verification'] });
  const { data: revenueData, loading: revenueLoading } = useCollectionGroup<Transaction>('transactions', { where: ['type', '==', 'entry_fee']});

  const totalRevenue = useMemo(() => {
    return revenueData.reduce((acc, tx) => acc + tx.amount, 0);
  }, [revenueData]);

  const stats = [
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      loading: revenueLoading,
    },
    {
      title: "Active Matches",
      value: `${activeMatchesCount}`,
      icon: Swords,
      loading: matchesLoading,
    },
    {
      title: "Pending Deposits",
      value: `${pendingDepositsCount}`,
      icon: Wallet,
      loading: depositsLoading,
      to: '/admin/deposits'
    },
    {
      title: "Total Users",
      value: `${userCount}`,
      icon: Users,
      loading: usersLoading,
      to: '/admin/users'
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
              <Link href="/admin/transactions">
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
                                    {tx.createdAt?.seconds ? format(new Date(tx.createdAt.seconds * 1000), 'dd MMM yyyy') : 'N/A'}
                                </TableCell>
                                <TableCell className={`text-right font-semibold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString()}
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
                 </div>
             ) : pendingVerifications.length > 0 ? (
                pendingVerifications.map(match => (
                    <div className="flex items-center" key={match.id}>
                        <CircleDashed className="h-9 w-9 text-muted-foreground" />
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">{match.title}</p>
                            <p className="text-sm text-muted-foreground">{match.players.length} players. Prize: ₹{match.prizePool}</p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto" asChild>
                            <Link href={`/admin/results/${match.id}`}>Verify</Link>
                        </Button>
                    </div>
                ))
             ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                    <p>No pending verifications.</p>
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
