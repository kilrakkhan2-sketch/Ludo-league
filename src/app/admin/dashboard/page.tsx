
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useCollectionCount, useCollectionGroup } from "@/firebase";
import type { Match, UserProfile, DepositRequest, WithdrawalRequest, Tournament } from "@/types";
import { Users, Sword, CircleArrowUp, Landmark, FileKey, BadgeCheck, ShieldAlert, Gamepad2, Ticket, Wallet } from 'lucide-react';
import { useMemo } from "react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const StatCard = ({ title, value, icon: Icon, loading, href, description }: { title: string, value: string | number, icon: React.ElementType, loading: boolean, href?: string, description?: string }) => (
  <Card className="hover:bg-muted/50 transition-colors">
    <Link href={href || '#'}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-1/2" />
          ) : (
            <div className="text-2xl font-bold">{value}</div>
          )}
          {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
        </CardContent>
    </Link>
  </Card>
);

export default function AdminDashboardPage() {
  // ----------- ACTIONABLE ITEMS -----------
  const { count: pendingDeposits, loading: pendingDepositsLoading } = useCollectionCount("deposit-requests", { where: ["status", "==", "pending"] });
  const { count: pendingWithdrawals, loading: pendingWithdrawalsLoading } = useCollectionCount("withdrawal-requests", { where: ["status", "==", "pending"] });
  const { count: pendingKyc, loading: pendingKycLoading } = useCollectionCount("kyc-requests", { where: ["status", "==", "pending"] });
  const { count: pendingMatches, loading: pendingMatchesLoading } = useCollectionCount("matches", { where: ["status", "==", "verification"] });
  const { count: disputedMatches, loading: disputedMatchesLoading } = useCollectionCount("matches", { where: ["status", "==", "disputed"] });
  
  // ----------- PLATFORM OVERVIEW -----------
  const { count: totalUsers, loading: usersLoading } = useCollectionCount("users");
  const { count: ongoingMatches, loading: ongoingMatchesLoading } = useCollectionCount("matches", { where: ["status", "==", "ongoing"] });
  const { count: liveTournaments, loading: liveTournamentsLoading } = useCollectionCount("tournaments", { where: ["status", "==", "live"] });
  
  const twentyFourHoursAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
  }, []);
  const { count: newUsersToday, loading: newUsersLoading } = useCollectionCount("users", { where: ["createdAt", ">=", twentyFourHoursAgo] });

  const { data: deposits, loading: depositsLoading } = useCollection<DepositRequest>("deposit-requests", { where: ["status", "==", "approved"] });
  const { data: withdrawals, loading: withdrawalsLoading } = useCollection<WithdrawalRequest>("withdrawal-requests", { where: ["status", "==", "approved"] });
  const { data: commissions, loading: commissionsLoading } = useCollectionGroup<any>('transactions', { where: ['type', '==', 'referral_bonus'] });
  
  const totalDeposits = useMemo(() => deposits?.reduce((acc, d) => acc + (d.amount || 0), 0) || 0, [deposits]);
  const totalWithdrawals = useMemo(() => withdrawals?.reduce((acc, w) => acc + (w.amount || 0), 0) || 0, [withdrawals]);
  const totalCommissions = useMemo(() => commissions?.reduce((acc, c) => acc + (c.amount || 0), 0) || 0, [commissions]);

  const loading = usersLoading || depositsLoading || withdrawalsLoading || commissionsLoading;
  const pendingLoading = pendingDepositsLoading || pendingWithdrawalsLoading || pendingKycLoading || pendingMatchesLoading || disputedMatchesLoading;
  
  const revenueData = [
    { month: 'Jan', revenue: 2000 }, { month: 'Feb', revenue: 1800 },
    { month: 'Mar', revenue: 2200 }, { month: 'Apr', revenue: 2500 },
    { month: 'May', revenue: 2300 }, { month: 'Jun', revenue: 3200 },
    { month: 'Jul', revenue: 3500 },
  ];

  const registrationsData = [
    { month: 'Jan', users: 120 }, { month: 'Feb', users: 150 },
    { month: 'Mar', users: 170 }, { month: 'Apr', users: 210 },
    { month: 'May', users: 250 }, { month: 'Jun', users: 280 },
    { month: 'Jul', users: 310 },
  ];
  
  const revenueChartConfig = { revenue: { label: "Revenue", color: "hsl(var(--primary))" } };
  const registrationChartConfig = { users: { label: "Users", color: "hsl(var(--primary))" } };


  return (
    <>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Immediate Actions</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          <StatCard title="Pending Deposits" value={pendingDeposits} icon={CircleArrowUp} loading={pendingLoading} href="/admin/deposits" />
          <StatCard title="Pending Withdrawals" value={pendingWithdrawals} icon={Landmark} loading={pendingLoading} href="/admin/withdrawals" />
          <StatCard title="Pending KYC" value={pendingKyc} icon={FileKey} loading={pendingLoading} href="/admin/kyc" />
          <StatCard title="Match Verification" value={pendingMatches} icon={BadgeCheck} loading={pendingLoading} href="/admin/matches" />
          <StatCard title="Disputed Matches" value={disputedMatches} icon={ShieldAlert} loading={disputedMatchesLoading} href="/admin/matches" />
        </div>
      </div>
      
      <Separator className="my-6" />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Platform Overview</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          <StatCard title="Total Users" value={totalUsers} icon={Users} loading={usersLoading} href="/admin/users" />
          <StatCard title="Ongoing Matches" value={ongoingMatches} icon={Gamepad2} loading={ongoingMatchesLoading} href="/admin/matches" />
          <StatCard title="Live Tournaments" value={liveTournaments} icon={Ticket} loading={liveTournamentsLoading} href="/admin/tournaments" />
          <StatCard title="New Users (24h)" value={newUsersToday} icon={Users} loading={newUsersLoading} />
          <StatCard title="Total Commission" value={`₹${totalCommissions.toLocaleString()}`} icon={Wallet} loading={commissionsLoading} />
        </div>
      </div>
      
      <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-2">
          <StatCard title="Total Deposits" value={`₹${totalDeposits.toLocaleString()}`} icon={CircleArrowUp} loading={loading} href="/admin/transactions" description="Approved deposits value" />
          <StatCard title="Total Withdrawals" value={`₹${totalWithdrawals.toLocaleString()}`} icon={Landmark} loading={loading} href="/admin/transactions" description="Approved withdrawals value" />
      </div>

      <div className="grid gap-4 pt-4 md:grid-cols-2">
          <Card>
              <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                  <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
                      <BarChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ChartContainer>
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle>New User Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                   <ChartContainer config={registrationChartConfig} className="h-[300px] w-full">
                      <BarChart data={registrationsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                           <Tooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ChartContainer>
              </CardContent>
          </Card>
      </div>
    </>
  );
}
