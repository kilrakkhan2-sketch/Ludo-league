
'use client';

import { AdminShell } from "@/components/layout/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection } from "@/firebase";
import type { Match, User } from "@/types";
import { Users, Sword, Shield, IndianRupee } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default function AdminDashboardPage() {
  const { data: users, loading: usersLoading } = useCollection<User>("users");
  const { data: matches, loading: matchesLoading } = useCollection<Match>("matches");

  const totalUsers = users.length;
  const totalMatches = matches.length;
  const openMatches = matches.filter(m => m.status === 'open').length;
  const totalPrizePool = matches.reduce((acc, m) => acc + (m.prizePool || 0), 0);

  const loading = usersLoading || matchesLoading;

  return (
    <AdminShell pageTitle="Dashboard">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={loading ? '...' : totalUsers} icon={Users} />
        <StatCard title="Total Matches" value={loading ? '...' : totalMatches} icon={Sword} />
        <StatCard title="Open Matches" value={loading ? '...' : openMatches} icon={Shield} />
        <StatCard title="Total Prize Pool" value={loading ? '...' : `₹${totalPrizePool}`} icon={IndianRupee} />
      </div>
    </AdminShell>
  );
}
