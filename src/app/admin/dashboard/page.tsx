
"use client"

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/firebase";
import { useEffect, useState } from "react";
import {
    getFirestore,
    doc,
    getDoc,
    collection,
    getCountFromServer,
} from "firebase/firestore";
import { DollarSign, Users, Package, CreditCard } from "lucide-react";

const StatCard = ({ title, value, change, icon: Icon, loading, to }: { title: string, value: string, change?: string, icon: React.ElementType, loading: boolean, to?: string }) => {
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
    const [stats, setStats] = useState({
        totalRevenue: { value: '0', change: '+0.0% from last month' },
        totalUsers: { value: '0', change: '+0.0% from last month' },
        totalMatches: { value: '0', change: '+0.0% from last month' },
        totalDeposits: { value: '0', change: '+0.0% from last month' },
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (user) {
                try {
                    const db = getFirestore();

                    // Total Users
                    const usersCol = collection(db, "users");
                    const usersSnapshot = await getCountFromServer(usersCol);
                    const totalUsers = usersSnapshot.data().count;

                    // Total Matches
                    const matchesCol = collection(db, "matches");
                    const matchesSnapshot = await getCountFromServer(matchesCol);
                    const totalMatches = matchesSnapshot.data().count;

                    setStats(prevStats => ({
                        ...prevStats,
                        totalUsers: { ...prevStats.totalUsers, value: totalUsers.toString() },
                        totalMatches: { ...prevStats.totalMatches, value: totalMatches.toString() },
                    }));
                } catch (error) {
                    console.error("Error fetching stats: ", error);
                }
            }
            setLoading(false);
        };

        if (!userLoading) {
            fetchStats();
        }
    }, [user, userLoading]);

    const statsData = [
        {
            title: "Total Revenue",
            value: stats.totalRevenue.value,
            change: stats.totalRevenue.change,
            icon: DollarSign,
            to: "/admin/deposits"
        },
        {
            title: "Total Users",
            value: stats.totalUsers.value,
            change: stats.totalUsers.change,
            icon: Users,
            to: "/admin/users"
        },
        {
            title: "Total Matches",
            value: stats.totalMatches.value,
            change: stats.totalMatches.change,
            icon: Package,
            to: "/admin/matches"
        },
        {
            title: "Total Deposits",
            value: stats.totalDeposits.value,
            change: stats.totalDeposits.change,
            icon: CreditCard,
            to: "/admin/deposits"
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
                        loading={loading || userLoading}
                        to={stat.to}
                    />
                ))}
            </div>

            {/* Add more dashboard components here, e.g., recent matches, user activity chart */}
        </div>
    );
}
