
"use client"

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser, useDoc } from "@/firebase";
import { useEffect, useState } from "react";
import {
    getFirestore,
    collection,
    getCountFromServer,
} from "firebase/firestore";
import { DollarSign, Users, Package, CreditCard, Wallet } from "lucide-react";
import type { UserProfile } from "@/types";

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

    const [stats, setStats] = useState({
        totalRevenue: { value: '₹0', change: '+0.0% from last month' },
        totalUsers: { value: '0', change: '+0.0% from last month' },
        totalMatches: { value: '0', change: '+0.0% from last month' },
        pendingDeposits: { value: '0', change: '' },
        pendingWithdrawals: { value: '0', change: '' },
    });
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (user) {
                try {
                    const db = getFirestore();
                    
                    const fetchCollectionCount = async (collectionName: string) => {
                        const coll = collection(db, collectionName);
                        const snapshot = await getCountFromServer(coll);
                        return snapshot.data().count;
                    };
                    
                    const totalUsers = await fetchCollectionCount("users");
                    const totalMatches = await fetchCollectionCount("matches");
                    const pendingDeposits = await fetchCollectionCount("deposit-requests");
                    const pendingWithdrawals = await fetchCollectionCount("withdrawal-requests");


                    setStats(prevStats => ({
                        ...prevStats,
                        totalUsers: { ...prevStats.totalUsers, value: totalUsers.toString() },
                        totalMatches: { ...prevStats.totalMatches, value: totalMatches.toString() },
                        pendingDeposits: { ...prevStats.pendingDeposits, value: pendingDeposits.toString() },
                        pendingWithdrawals: { ...prevStats.pendingWithdrawals, value: pendingWithdrawals.toString() },
                    }));
                } catch (error) {
                    console.error("Error fetching stats: ", error);
                }
            }
            setLoadingStats(false);
        };

        if (!userLoading && !profileLoading) {
            fetchStats();
        }
    }, [user, userLoading, profileLoading]);

    const loading = userLoading || profileLoading || loadingStats;
    const userRole = profile?.role;
    
    const isSuperAdmin = userRole === 'superadmin';
    const isDepositAdmin = userRole === 'deposit_admin';
    const isMatchAdmin = userRole === 'match_admin';

    const statsData = [
        {
            title: "Total Revenue",
            value: stats.totalRevenue.value,
            change: stats.totalRevenue.change,
            icon: DollarSign,
            to: "/admin/deposits",
            isVisible: isSuperAdmin || isDepositAdmin
        },
        {
            title: "Pending Deposits",
            value: stats.pendingDeposits.value,
            change: stats.pendingDeposits.change,
            icon: CreditCard,
            to: "/admin/deposits",
            isVisible: isSuperAdmin || isDepositAdmin
        },
        {
            title: "Pending Withdrawals",
            value: stats.pendingWithdrawals.value,
            change: stats.pendingWithdrawals.change,
            icon: Wallet,
            to: "/admin/withdrawals",
            isVisible: isSuperAdmin || isDepositAdmin
        },
        {
            title: "Total Users",
            value: stats.totalUsers.value,
            change: stats.totalUsers.change,
            icon: Users,
            to: "/admin/users",
            isVisible: isSuperAdmin
        },
        {
            title: "Total Matches",
            value: stats.totalMatches.value,
            change: stats.totalMatches.change,
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
