'use client';
import { useState, useEffect } from 'react';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    DollarSign,
    Users,
    ArrowDownLeft, 
    ArrowUpRight,
    ShieldCheck,
    Swords,
    Scale
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { db } from '@/firebase';
import { collection, query, where, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { AppLogoLoader } from '@/components/ui/AppLogoLoader';
import { AnimatedCard } from '@/components/ui/animated-card';

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
  href?: string;
  loading?: boolean;
}

const StatCard = ({ title, value, description, icon: Icon, href, loading }: StatCardProps) => {
    const content = (
        <AnimatedCard>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="mt-2">
                    {loading ? (
                        <div className="h-6 w-6"><AppLogoLoader /></div>
                    ) : (
                        <p className="text-2xl font-bold">{value}</p>
                    )}
                    {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
                </div>
            </CardContent>
        </AnimatedCard>
    );

    return href ? <Link href={href} className="block hover:shadow-lg transition-shadow rounded-lg">{content}</Link> : <div>{content}</div>;
};

const useCollectionCount = (collectionName: string, status?: string) => {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const collRef = collection(db, collectionName);
        const q = status ? query(collRef, where('status', '==', status)) : query(collRef);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCount(snapshot.size);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [collectionName, status]);

    return { count, loading };
}

export default function AdminDashboardPage() {
    const { count: pendingKycCount, loading: kycLoading } = useCollectionCount('kyc', 'pending');
    const { count: pendingDepositCount, loading: depositLoading } = useCollectionCount('deposits', 'pending');
    const { count: pendingWithdrawalCount, loading: withdrawalLoading } = useCollectionCount('withdrawals', 'pending');
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 29), to: new Date() });
    const [financials, setFinancials] = useState({ totalRevenue: 0, totalPayouts: 0, platformEarnings: 0, totalUsers: 0 });
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!dateRange?.from || !dateRange?.to) return;
            setLoading(true);

            const start = Timestamp.fromDate(dateRange.from);
            const end = Timestamp.fromDate(dateRange.to);

            const depositsQuery = query(collection(db, 'deposits'), where('createdAt', '>=', start), where('createdAt', '<=', end), where('status', '==', 'processed'));
            const depositsSnap = await getDocs(depositsQuery);
            let totalRevenue = 0;
            depositsSnap.forEach(doc => totalRevenue += doc.data().amount);

            const withdrawalsQuery = query(collection(db, 'withdrawals'), where('createdAt', '>=', start), where('createdAt', '<=', end), where('status', '==', 'processed'));
            const withdrawalsSnap = await getDocs(withdrawalsQuery);
            let totalPayouts = 0;
            withdrawalsSnap.forEach(doc => totalPayouts += doc.data().amount);

            const usersQuery = query(collection(db, 'users'));
            const usersSnap = await getDocs(usersQuery);
            const totalUsers = usersSnap.size;

            const platformEarnings = totalRevenue * 0.10;

            setFinancials({ totalRevenue, totalPayouts, platformEarnings, totalUsers });

            const dailyData: { [key: string]: number } = {};
            depositsSnap.forEach(doc => {
                const data = doc.data();
                const date = (data.createdAt as Timestamp).toDate().toISOString().split('T')[0];
                dailyData[date] = (dailyData[date] || 0) + data.amount;
            });
            const chartData = Object.keys(dailyData).sort().map(date => ({ date, Revenue: dailyData[date] }));
            setRevenueData(chartData);

            setLoading(false);
        };

        fetchData();
    }, [dateRange]);

  return (
    <div className="flex-1 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-3xl font-bold tracking-tight">Financial Dashboard</h2>
            <DateRangePicker range={dateRange} onRangeChange={setDateRange} />
        </div>
      
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Revenue" value={`₹${financials.totalRevenue.toLocaleString()}`} icon={ArrowUpRight} loading={loading} />
            <StatCard title="Total Payouts" value={`₹${financials.totalPayouts.toLocaleString()}`} icon={ArrowDownLeft} loading={loading} />
            <StatCard title="Platform Earnings" value={`₹${financials.platformEarnings.toLocaleString()}`} description="10% of total revenue" icon={Scale} loading={loading} />
            <StatCard title="Total Users" value={financials.totalUsers.toLocaleString()} icon={Users} loading={loading} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             <StatCard title="Pending Deposits" value={pendingDepositCount.toLocaleString()} href="/admin/deposits" icon={Swords} loading={depositLoading} />
             <StatCard title="Pending Withdrawals" value={pendingWithdrawalCount.toLocaleString()} href="/admin/withdrawals" icon={DollarSign} loading={withdrawalLoading} />
             <StatCard title="Pending KYC" value={pendingKycCount.toLocaleString()} href="/admin/kyc-requests" icon={ShieldCheck} loading={kycLoading} />
        </div>

        <AnimatedCard>
            <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Total deposits processed within the selected date range.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-[350px]"><AppLogoLoader /></div>
                ) : (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={revenueData}>
                            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                            <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} labelStyle={{ color: 'black' }} />
                            <Bar dataKey="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </AnimatedCard>
    </div>
  );
}
