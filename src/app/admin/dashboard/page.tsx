
"use client"

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser, useDoc, useCollection } from "@/firebase";
import type { UserProfile, DepositRequest, WithdrawalRequest, Match } from "@/types";
import { DollarSign, Users, Package, CreditCard, Wallet, Hourglass, CheckCircle } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, ResponsiveContainer } from "recharts";

type StatCardProps = {
    title: string;
    value: string;
    description?: string;
    icon: React.ElementType;
    loading: boolean;
    to?: string;
    isVisible?: boolean;
}

const StatCard = ({ title, value, description, icon: Icon, loading, to, isVisible = true }: StatCardProps) => {
    if (!isVisible) return null;

    const cardContent = (
      <Card className="hover:bg-muted/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
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
                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </>
            )}
        </CardContent>
      </Card>
    );

    if (to) {
        return (
             <Link href={to} className="block">
                {cardContent}
            </Link>
        );
    }

    return cardContent;
};

export default function AdminDashboardPage() {
    const { user, loading: userLoading, claims } = useUser();
    
    const { data: allUsers, loading: usersLoading } = useCollection<UserProfile>("users");
    const { data: allMatches, loading: matchesLoading } = useCollection<Match>("matches");
    const { data: pendingDeposits, loading: depositsLoading } = useCollection<DepositRequest>("deposit-requests", { where: ['status', '==', 'pending'] });
    const { data: pendingWithdrawals, loading: withdrawalsLoading } = useCollection<WithdrawalRequest>("withdrawal-requests", { where: ['status', '==', 'pending'] });
    
    const loading = userLoading || usersLoading || matchesLoading || depositsLoading || withdrawalsLoading;
    const userRole = claims?.role;
    
    const isSuperAdmin = userRole === 'superadmin';
    const isDepositAdmin = userRole === 'deposit_admin';
    const isMatchAdmin = userRole === 'match_admin';

    const totalRevenue = allUsers.reduce((acc, user) => acc + (user.walletBalance || 0), 0);

    const statsData = [
        {
            title: "Total Users",
            value: allUsers.length.toString(),
            description: `${allUsers.filter(u => u.createdAt && new Date(u.createdAt.seconds * 1000) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length} new this month`,
            icon: Users,
            to: "/admin/users",
            isVisible: isSuperAdmin
        },
        {
            title: "Active Matches",
            value: allMatches.filter(m => m.status === 'ongoing' || m.status === 'open').length.toString(),
            description: `${allMatches.filter(m => m.status === 'completed').length} completed`,
            icon: Package,
            to: "/admin/matches",
            isVisible: isSuperAdmin || isMatchAdmin
        },
        {
            title: "Total Revenue",
            value: `₹${totalRevenue.toLocaleString()}`,
            description: "Total money in all user wallets",
            icon: DollarSign,
            to: "/admin/transactions",
            isVisible: isSuperAdmin
        },
        {
            title: "Pending Withdrawals",
            value: pendingWithdrawals.length.toString(),
            description: "Require manual payment",
            icon: Wallet,
            to: "/admin/withdrawals",
            isVisible: isSuperAdmin || isDepositAdmin
        },
    ];

    const revenueData = [
      { month: 'Jan', revenue: 1200, profit: 800 },
      { month: 'Feb', revenue: 1500, profit: 1000 },
      { month: 'Mar', revenue: 1800, profit: 1200 },
      { month: 'Apr', revenue: 2200, profit: 1500 },
      { month: 'May', revenue: 2500, profit: 1700 },
      { month: 'Jun', revenue: 2800, profit: 1900 },
    ];

    const registrationsData = [
      { month: 'Jan', users: 30 },
      { month: 'Feb', users: 45 },
      { month: 'Mar', users: 60 },
      { month: 'Apr', users: 50 },
      { month: 'May', users: 70 },
      { month: 'Jun', users: 90 },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {statsData.map((stat, index) => (
                    <StatCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        description={stat.description}
                        icon={stat.icon}
                        loading={loading}
                        to={stat.to}
                        isVisible={stat.isVisible}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue vs Payouts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                                <Line type="monotone" dataKey="profit" stroke="hsl(var(--destructive))" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>New User Registrations</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={registrationsData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {loading && !user && (
                 <div className="text-center p-8">
                    <p className="text-muted-foreground">Loading your dashboard...</p>
                </div>
            )}

            {!loading && !claims?.role && (
                <div className="text-center p-8">
                    <p className="text-muted-foreground">You do not have permission to view this page.</p>
                </div>
            )}
        </div>
    );
}
