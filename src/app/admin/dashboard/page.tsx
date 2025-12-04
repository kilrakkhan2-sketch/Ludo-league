
"use client"

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser, useDoc, useCollectionCount } from "@/firebase";
import type { UserProfile } from "@/types";
import { DollarSign, Users, Package, CreditCard, Wallet } from "lucide-react";

type StatCardProps = {
    title: string;
    value: string;
    change?: string;
    icon: React.ElementType;
    loading: boolean;
    to?: string;
    isVisible?: boolean;
}

const StatCard = ({ title, value, change, icon: Icon, loading, to, isVisible = true }: StatCardProps) => {
    if (!isVisible) return null;

    const CardContentWrapper = to ? Link : 'div';
    const wrapperProps = to ? { href: to } : {};

    return (
        <Card asChild={!!to} className={to ? 'hover:bg-muted/50 cursor-pointer' : ''}>
            <CardContentWrapper {...wrapperProps}>
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
    );
};


export default function AdminDashboardPage() {
    const { user, loading: userLoading } = useUser();
    const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');

    const { count: totalUsers, loading: usersLoading } = useCollectionCount("users");
    const { count: totalMatches, loading: matchesLoading } = useCollectionCount("matches");
    const { count: pendingDeposits, loading: depositsLoading } = useCollectionCount("deposit-requests");
    const { count: pendingWithdrawals, loading: withdrawalsLoading } = useCollectionCount("withdrawal-requests");
    
    const loading = userLoading || profileLoading || usersLoading || matchesLoading || depositsLoading || withdrawalsLoading;
    const userRole = profile?.role;
    
    const isSuperAdmin = userRole === 'superadmin';
    const isDepositAdmin = userRole === 'deposit_admin';
    const isMatchAdmin = userRole === 'match_admin';

    const statsData = [
        {
            title: "Total Revenue",
            value: `₹${profile?.walletBalance?.toLocaleString() || 0}`,
            change: "Admin wallet balance",
            icon: DollarSign,
            to: "/admin/deposits",
            isVisible: isSuperAdmin
        },
        {
            title: "Pending Deposits",
            value: pendingDeposits.toString(),
            change: "",
            icon: CreditCard,
            to: "/admin/deposits",
            isVisible: isSuperAdmin || isDepositAdmin
        },
        {
            title: "Pending Withdrawals",
            value: pendingWithdrawals.toString(),
            change: "",
            icon: Wallet,
            to: "/admin/withdrawals",
            isVisible: isSuperAdmin || isDepositAdmin
        },
        {
            title: "Total Users",
            value: totalUsers.toString(),
            change: "+0.0% from last month",
            icon: Users,
            to: "/admin/users",
            isVisible: isSuperAdmin
        },
        {
            title: "Total Matches",
            value: totalMatches.toString(),
            change: "+0.0% from last month",
            icon: Package,
            to: "/admin/matches",
            isVisible: isSuperAdmin || isMatchAdmin
        },
    ];

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsData.map((stat, index) => (
                    <StatCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        change={stat.change}
                        icon={stat.icon}
                        loading={loading}
                        to={stat.to}
                        isVisible={stat.isVisible}
                    />
                ))}
            </div>

            {loading && !profile && (
                 <div className="text-center p-8">
                    <p className="text-muted-foreground">Loading your dashboard...</p>
                </div>
            )}

            {!loading && !profile?.role && (
                <div className="text-center p-8">
                    <p className="text-muted-foreground">You do not have permission to view this page.</p>
                </div>
            )}
        </div>
    );
}
