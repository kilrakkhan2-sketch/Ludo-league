
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection } from "@/firebase";
import type { Match, UserProfile } from "@/types";
import { Users, Sword, CircleArrowUp, Landmark } from 'lucide-react';
import { useMemo } from "react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ChartTooltipContent } from "@/components/ui/chart";

const StatCard = ({ title, value, icon: Icon, loading }: { title: string, value: string | number, icon: React.ElementType, loading: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="h-8 w-1/2 animate-pulse rounded-md bg-muted" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);

export default function AdminDashboardPage() {
  const { data: users, loading: usersLoading } = useCollection<UserProfile>("users");
  const { data: matches, loading: matchesLoading } = useCollection<Match>("matches");
  const { data: deposits, loading: depositsLoading } = useCollection("deposit-requests", { where: ["status", "==", "approved"] });
  const { data: withdrawals, loading: withdrawalsLoading } = useCollection("withdrawal-requests", { where: ["status", "==", "approved"] });

  const totalUsers = users?.length || 0;
  const totalMatches = matches?.length || 0;
  const totalDeposits = useMemo(() => deposits?.reduce((acc, d: any) => acc + (d.amount || 0), 0) || 0, [deposits]);
  const totalWithdrawals = useMemo(() => withdrawals?.reduce((acc, w: any) => acc + (w.amount || 0), 0) || 0, [withdrawals]);

  const loading = usersLoading || matchesLoading || depositsLoading || withdrawalsLoading;
  
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


  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={totalUsers} icon={Users} loading={loading} />
        <StatCard title="Total Matches Played" value={totalMatches} icon={Sword} loading={loading} />
        <StatCard title="Total Deposits" value={`₹${totalDeposits.toLocaleString()}`} icon={CircleArrowUp} loading={loading} />
        <StatCard title="Total Withdrawals" value={`₹${totalWithdrawals.toLocaleString()}`} icon={Landmark} loading={loading} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
          <Card>
              <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
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
                           <Tooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>
      </div>
    </>
  );
}
