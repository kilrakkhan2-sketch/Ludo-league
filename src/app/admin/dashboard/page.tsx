
'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DollarSign,
  Users,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatCardProps {
  title: string;
  value: string;
  percentage: string;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, percentage, icon }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{percentage}</p>
    </CardContent>
  </Card>
);

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Users
        const usersSnapshot = await getDocs(collection(firestore, 'users'));
        setStats(prev => ({ ...prev, totalUsers: usersSnapshot.size }));

        // Fetch Transactions
        const transactionsSnapshot = await getDocs(collection(firestore, 'transactions'));
        let totalRevenue = 0;
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        
        const now = new Date();
        const monthlyRevenue: { [key: string]: number } = {};

        transactionsSnapshot.forEach(doc => {
          const t = doc.data();
          if (t.status === 'completed') {
            if (t.type === 'deposit') {
                totalDeposits += t.amount;
                // Assuming revenue is generated from deposits (e.g. fees)
                // This logic might need to be more complex based on the business model
                totalRevenue += t.amount * 0.1; // Example: 10% revenue on deposits
            } else if (t.type === 'withdrawal') {
                totalWithdrawals += Math.abs(t.amount);
            }
          }
          
          // Aggregate monthly revenue for the chart
          const date = t.createdAt.toDate();
          if (date.getFullYear() === now.getFullYear()) {
              const month = date.toLocaleString('default', { month: 'short' });
              if(!monthlyRevenue[month]) monthlyRevenue[month] = 0;
              if(t.type === 'deposit' && t.status === 'completed') monthlyRevenue[month] += t.amount;
          }
        });
        
        const revenueChartData = Object.entries(monthlyRevenue).map(([name, total]) => ({ name, total }));
        setRevenueData(revenueChartData);

        setStats(prev => ({ ...prev, totalRevenue, totalDeposits, totalWithdrawals }));

        // Fetch Recent Transactions
        const recentTransQuery = query(
          collection(firestore, 'transactions'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentTransSnapshot = await getDocs(recentTransQuery);
        const transData = await Promise.all(recentTransSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const userDocSnapshot = await getDocs(query(collection(firestore, 'users'), where('uid', '==', data.userId), limit(1)));
            const user = userDocSnapshot.docs.length > 0 ? userDocSnapshot.docs[0].data() : {};
            return { ...data, id: doc.id, user };
        }));
        setRecentTransactions(transData);

      } catch (error) {
        console.error("Error fetching dashboard data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [firestore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight mb-4">Dashboard</h2>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toFixed(2)}`} percentage="+20.1% from last month" icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title="Total Users" value={`${stats.totalUsers}`} percentage="+180.1% from last month" icon={<Users className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title="Total Deposits" value={`₹${stats.totalDeposits.toFixed(2)}`} percentage="+19% from last month" icon={<CreditCard className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title="Total Withdrawals" value={`₹${stats.totalWithdrawals.toFixed(2)}`} percentage="+201 since last hour" icon={<Activity className="h-4 w-4 text-muted-foreground" />} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader><CardTitle>Revenue Overview</CardTitle></CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={revenueData}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                            <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>The last 5 transactions across the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentTransactions.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={t.user?.photoURL} />
                                                <AvatarFallback>{t.user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <span className='font-medium'>{t.user?.displayName || 'Unknown User'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={t.type === 'deposit' ? 'default': 'secondary'} className={t.amount > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{t.type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {t.amount > 0 ? '+' : ''}₹{t.amount.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
