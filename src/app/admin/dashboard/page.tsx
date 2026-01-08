
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
import { collection, getDocs, query, where, orderBy, limit, onSnapshot, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Transaction, UserProfile } from '@/lib/types';


interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, description, icon }: StatCardProps) => (
  <Card className="shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
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
            // Fetch Users count
            const usersCollection = collection(firestore, 'users');
            const usersSnapshot = await getDocs(usersCollection);
            setStats(prev => ({ ...prev, totalUsers: usersSnapshot.size }));

            // Fetch Transactions for revenue calculation
            const transactionsSnapshot = await getDocs(collection(firestore, 'transactions'));
            let totalDeposits = 0;
            let totalWithdrawals = 0;
            const monthlyRevenue: { [key: string]: number } = {};

            transactionsSnapshot.forEach(doc => {
                const t = doc.data();
                if (t.status === 'completed') {
                    if (t.type === 'deposit') {
                        totalDeposits += t.amount;
                    } else if (t.type === 'withdrawal') {
                        totalWithdrawals += Math.abs(t.amount);
                    }
                }
                // Aggregate monthly revenue for the chart
                const date = t.createdAt.toDate();
                const month = date.toLocaleString('default', { month: 'short' });
                if(!monthlyRevenue[month]) monthlyRevenue[month] = 0;

                // Revenue is 10% of entry fees
                if(t.type === 'entry-fee' && t.status === 'completed') {
                    monthlyRevenue[month] += Math.abs(t.amount) * 0.10;
                }
            });

            const totalRevenue = Object.values(monthlyRevenue).reduce((acc, cur) => acc + cur, 0);
            const revenueChartData = Object.entries(monthlyRevenue).map(([name, total]) => ({ name, total: Math.round(total) }));
            setRevenueData(revenueChartData);

            setStats(prev => ({ ...prev, totalRevenue, totalDeposits, totalWithdrawals }));

        } catch (error) {
            console.error("Error fetching dashboard data: ", error);
        } finally {
            setLoading(false);
        }
    };

    // Listener for recent transactions
    const recentTransQuery = query(
      collection(firestore, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    const unsubscribe = onSnapshot(recentTransQuery, async (snapshot) => {
        const transData = await Promise.all(snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const userDocRef = doc(firestore, 'users', data.userId);
            const userDoc = await getDoc(userDocRef);
            const user = userDoc.exists() ? userDoc.data() : {};
            return { ...data, id: docSnap.id, user };
        }));
        setRecentTransactions(transData);
    });

    fetchData();
    return () => unsubscribe();
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toFixed(2)}`} description="Total commission earned" icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title="Total Users" value={`${stats.totalUsers}`} description="Total registered users" icon={<Users className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title="Total Deposits" value={`₹${stats.totalDeposits.toFixed(2)}`} description="All-time user deposits" icon={<CreditCard className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title="Total Withdrawals" value={`₹${stats.totalWithdrawals.toFixed(2)}`} description="All-time user withdrawals" icon={<Activity className="h-4 w-4 text-muted-foreground" />} />
        </div>
        <div className="grid gap-4 lg:grid-cols-7 flex-col lg:flex-row">
            <Card className="lg:col-span-4">
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
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>The last 5 transactions across the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                       {recentTransactions.length > 0 ? recentTransactions.map(t => (
                            <div key={t.id} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                <AvatarImage src={t.user?.photoURL} alt="Avatar" />
                                <AvatarFallback>{t.user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{t.user?.displayName || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground">{t.description || t.type}</p>
                                </div>
                                <div className={`ml-auto font-medium ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{t.amount > 0 ? '+' : ''}₹{t.amount.toFixed(2)}</div>
                            </div>
                        )) : <p className="text-sm text-muted-foreground text-center">No recent transactions.</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
