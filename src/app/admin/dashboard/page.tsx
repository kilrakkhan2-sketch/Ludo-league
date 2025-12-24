
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCollection, useCollectionGroup, useUser } from "@/firebase";
import type { DepositRequest, Transaction, UserProfile, WithdrawalRequest, Match, KycRequest, Tournament } from "@/types";
import { Users, Sword, CircleArrowUp, Landmark, FileKey, BadgeCheck, ShieldAlert, Gamepad2, Ticket, Wallet, Award, Banknote } from 'lucide-react';
import { useMemo, useEffect, useState } from "react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const StatCard = ({ title, value, icon: Icon, href, description, isLoading }: { title: string, value: string | number, icon: React.ElementType, href?: string, description?: string, isLoading: boolean }) => (
  <Card className="hover:bg-muted/50 transition-colors flex flex-col justify-between">
    <Link href={href || '#'} className="flex-grow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-1/2 mt-1" />
          ) : (
            <div className="text-2xl font-bold">{value}</div>
          )}
          {description && !isLoading && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
        </CardContent>
    </Link>
  </Card>
);

// Mocks for chart data - in a real app, this would come from a backend API call
const generateLast7DaysData = (key: string, max: number) => {
    return [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return { date: d.toLocaleDateString('en-US', { weekday: 'short' }), [key]: Math.floor(Math.random() * max) };
    }).reverse();
};

const weeklyRevenueData = generateLast7DaysData('revenue', 3000);
const weeklyRegistrationsData = generateLast7DaysData('users', 50);

const revenueChartConfig = { revenue: { label: "Revenue", color: "hsl(var(--primary))" } };
const registrationChartConfig = { users: { label: "Users", color: "hsl(var(--primary))" } };


export default function AdminDashboardPage() {
  const { userData, loading: userLoading } = useUser();
  const role = userData?.role || '';

  // ----------- DATA FETCHING -----------
  const { count: pendingDeposits, loading: l1 } = useCollection<DepositRequest>("deposit-requests", { where: ["status", "==", "pending"] });
  const { count: pendingWithdrawals, loading: l2 } = useCollection<WithdrawalRequest>("withdrawal-requests", { where: ["status", "==", "pending"] });
  const { count: pendingKyc, loading: l3 } = useCollection<KycRequest>("kyc-requests", { where: ["status", "==", "pending"] });
  const { count: pendingMatches, loading: l4 } = useCollection<Match>("matches", { where: ["status", "==", "verification"] });
  const { count: disputedMatches, loading: l5 } = useCollection<Match>("matches", { where: ["status", "==", "disputed"] });
  const { count: totalUsers, loading: l6 } = useCollection<UserProfile>("users");
  const { count: ongoingMatches, loading: l7 } = useCollection<Match>("matches", { where: ["status", "==", "ongoing"] });
  const { data: fees, loading: l8 } = useCollectionGroup<Transaction>('transactions', { where: ['type', '==', 'platform-fee'] });

  const isLoading = userLoading || l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8;
  
  const platformRevenue = useMemo(() => fees?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0, [fees]);

  const superAdminStats = [
      { title: "Total Users", value: totalUsers, icon: Users, href: "/admin/users" },
      { title: "Platform Revenue", value: `₹${platformRevenue.toLocaleString()}`, icon: Wallet, description: "Total fees collected" },
  ]

  const actionItems = [
      { title: "Pending Deposits", value: pendingDeposits, icon: CircleArrowUp, href: "/admin/deposits", roles: ['superadmin', 'deposit_admin'] },
      { title: "Pending Withdrawals", value: pendingWithdrawals, icon: Landmark, href: "/admin/withdrawals", roles: ['superadmin', 'withdrawal_admin'] },
      { title: "Pending KYC", value: pendingKyc, icon: FileKey, href: "/admin/kyc", roles: ['superadmin'] },
      { title: "Match Verification", value: pendingMatches, icon: BadgeCheck, href: "/admin/matches", roles: ['superadmin', 'match_admin'] },
      { title: "Disputed Matches", value: disputedMatches, icon: ShieldAlert, href: "/admin/matches", roles: ['superadmin', 'match_admin'] },
  ].filter(item => item.roles.includes(role));

  return (
    <div className="space-y-6">
      {actionItems.length > 0 && (
        <section>
            <h2 className="text-xl font-semibold mb-4">Immediate Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {actionItems.map(item => <StatCard key={item.title} {...item} isLoading={isLoading} />)}
            </div>
        </section>
      )}
      
      <Separator />

      <section>
        <h2 className="text-xl font-semibold mb-4">Platform Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Ongoing Matches" value={ongoingMatches} icon={Gamepad2} isLoading={isLoading} href="/admin/matches" />
          {role === 'superadmin' && superAdminStats.map(item => <StatCard key={item.title} {...item} isLoading={isLoading} />)}
        </div>
      </section>
      
      {role === 'superadmin' && (
        <section className="grid gap-6 pt-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Weekly Revenue</CardTitle>
                    <CardDescription>Revenue from platform fees over the last 7 days.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-72" /> : (
                        <ChartContainer config={revenueChartConfig} className="h-72 w-full">
                            <AreaChart data={weeklyRevenueData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                                <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1}/>
                                </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis tickLine={false} axisLine={false} width={80} tickFormatter={(value) => `₹${value/1000}k`}/>
                                <Tooltip content={<ChartTooltipContent />} />
                                <Area type="monotone" dataKey="revenue" strokeWidth={2} stroke="var(--color-revenue)" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Registrations</CardTitle>
                    <CardDescription>New users who joined in the last 7 days.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-72" /> : (
                        <ChartContainer config={registrationChartConfig} className="h-72 w-full">
                            <BarChart data={weeklyRegistrationsData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis tickLine={false} axisLine={false} width={80} />
                                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                                <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>
        </section>
      )}
    </div>
  );
}
