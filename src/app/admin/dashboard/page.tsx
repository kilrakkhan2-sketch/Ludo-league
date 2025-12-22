
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useCollectionGroup, useUser } from "@/firebase";
import type { Match, UserProfile, DepositRequest, WithdrawalRequest, Tournament, Transaction } from "@/types";
import { Users, Sword, CircleArrowUp, Landmark, FileKey, BadgeCheck, ShieldAlert, Gamepad2, Ticket, Wallet, Award } from 'lucide-react';
import { useMemo } from "react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";
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

const AdminDashboardPage = () => {
    // ----------- ACTIONABLE ITEMS -----------
  const { count: pendingDeposits, loading: pendingDepositsLoading } = useCollection("deposit-requests", { where: ["status", "==", "pending"] });
  const { count: pendingWithdrawals, loading: pendingWithdrawalsLoading } = useCollection("withdrawal-requests", { where: ["status", "==", "pending"] });
  const { count: pendingKyc, loading: pendingKycLoading } = useCollection("kyc-requests", { where: ["status", "==", "pending"] });
  const { count: pendingMatches, loading: pendingMatchesLoading } = useCollection("matches", { where: ["status", "==", "verification"] });
  const { count: disputedMatches, loading: disputedMatchesLoading } = useCollection("matches", { where: ["status", "==", "disputed"] });
  
  // ----------- PLATFORM OVERVIEW -----------
  const { count: totalUsers, loading: usersLoading } = useCollection("users");
  const { count: openMatches, loading: openMatchesLoading } = useCollection("matches", { where: ["status", "==", "open"] });
  const { count: ongoingMatches, loading: ongoingMatchesLoading } = useCollection("matches", { where: ["status", "==", "ongoing"] });
  const { count: liveTournaments, loading: liveTournamentsLoading } = useCollection("tournaments", { where: ["status", "==", "live"] });
  
  const { data: deposits, loading: depositsLoading } = useCollection<DepositRequest>("deposit-requests", { where: ["status", "==", "approved"] });
  const { data: withdrawals, loading: withdrawalsLoading } = useCollection<WithdrawalRequest>("withdrawal-requests", { where: ["status", "==", "approved"] });
  const { data: prizes, loading: prizesLoading } = useCollectionGroup<Transaction>('transactions', { where: ['type', '==', 'prize'] });
  
  const totalDeposits = useMemo(() => deposits?.reduce((acc, d) => acc + (d.amount || 0), 0) || 0, [deposits]);
  const totalWithdrawals = useMemo(() => withdrawals?.reduce((acc, w) => acc + (w.amount || 0), 0) || 0, [withdrawals]);
  const totalPrizes = useMemo(() => prizes?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0, [prizes]);
  const platformFee = totalPrizes * 0.05; // Assuming 5% fee on prizes

  const loading = usersLoading || depositsLoading || withdrawalsLoading || prizesLoading || openMatchesLoading;
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard title="Total Users" value={totalUsers} icon={Users} loading={usersLoading} href="/admin/users" />
          <StatCard title="Open Matches" value={openMatches} icon={Sword} loading={loading} href="/admin/matches" />
          <StatCard title="Ongoing Matches" value={ongoingMatches} icon={Gamepad2} loading={ongoingMatchesLoading} href="/admin/matches" />
          <StatCard title="Live Tournaments" value={liveTournaments} icon={Ticket} loading={liveTournamentsLoading} href="/admin/tournaments" />
          <StatCard title="Platform Fee (5%)" value={`₹${platformFee.toLocaleString()}`} icon={Wallet} loading={prizesLoading} />
          <StatCard title="Total Prizes" value={`₹${totalPrizes.toLocaleString()}`} icon={Award} loading={prizesLoading} />
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
                      <AreaChart data={revenueData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" tickLine={false} axisLine={false} />
                          <YAxis tickLine={false} axisLine={false} width={80} tickFormatter={(value) => `₹${value/1000}k`}/>
                           <Tooltip content={<ChartTooltipContent />} />
                          <Area type="monotone" dataKey="revenue" strokeWidth={2} stroke="var(--color-revenue)" fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                  </ChartContainer>
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle>New User Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                   <ChartContainer config={registrationChartConfig} className="h-[300px] w-full">
                      <BarChart data={registrationsData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" tickLine={false} axisLine={false} />
                          <YAxis tickLine={false} axisLine={false} width={80} />
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

const MatchAdminDashboard = () => {
   // ----------- ACTIONABLE ITEMS -----------
  const { count: pendingMatches, loading: pendingMatchesLoading } = useCollection("matches", { where: ["status", "==", "verification"] });
  const { count: disputedMatches, loading: disputedMatchesLoading } = useCollection("matches", { where: ["status", "==", "disputed"] });

  // ----------- PLATFORM OVERVIEW -----------
  const { count: openMatches, loading: openMatchesLoading } = useCollection("matches", { where: ["status", "==", "open"] });
  const { count: ongoingMatches, loading: ongoingMatchesLoading } = useCollection("matches", { where: ["status", "==", "ongoing"] });
  const { count: liveTournaments, loading: liveTournamentsLoading } = useCollection("tournaments", { where: ["status", "==", "live"] });
  const { data: prizes, loading: prizesLoading } = useCollectionGroup<Transaction>('transactions', { where: ['type', '==', 'prize'] });
  const totalPrizes = useMemo(() => prizes?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0, [prizes]);
  const platformFee = totalPrizes * 0.05; // Assuming 5% fee on prizes
  
  const loading = openMatchesLoading || ongoingMatchesLoading || liveTournamentsLoading || prizesLoading;
  const pendingLoading = pendingMatchesLoading || disputedMatchesLoading;

  return (
    <>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Match & Tournament Overview</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard title="Match Verification" value={pendingMatches} icon={BadgeCheck} loading={pendingLoading} href="/admin/matches" description="Matches needing result verification"/>
          <StatCard title="Disputed Matches" value={disputedMatches} icon={ShieldAlert} loading={pendingLoading} href="/admin/matches" description="Matches with result conflicts"/>
          <StatCard title="Open Matches" value={openMatches} icon={Sword} loading={loading} href="/admin/matches" />
          <StatCard title="Ongoing Matches" value={ongoingMatches} icon={Gamepad2} loading={loading} href="/admin/matches" />
          <StatCard title="Live Tournaments" value={liveTournaments} icon={Ticket} loading={loading} href="/admin/tournaments" />
           <StatCard title="Platform Fee (5%)" value={`₹${platformFee.toLocaleString()}`} icon={Wallet} loading={prizesLoading} />
          <StatCard title="Total Prizes Awarded" value={`₹${totalPrizes.toLocaleString()}`} icon={Award} loading={prizesLoading} />
        </div>
      </div>
    </>
  )
}


export default function DashboardRouter() {
    const { userData, loading } = useUser();
    
    if (loading) {
        return (
            <div className="space-y-6">
                 <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                        {[...Array(5)].map(i => <Skeleton key={i} className="h-28 w-full" />)}
                    </div>
                </div>
                 <Separator className="my-6" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {[...Array(6)].map(i => <Skeleton key={i} className="h-28 w-full" />)}
                    </div>
                </div>
            </div>
        )
    }

    switch(userData?.role) {
        case 'superadmin':
            return <AdminDashboardPage />;
        case 'match_admin':
            return <MatchAdminDashboard />;
        default:
            return <p>You do not have a dashboard assigned to your role.</p>;
    }
}
