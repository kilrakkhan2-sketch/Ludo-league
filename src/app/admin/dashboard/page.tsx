
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
  DollarSign,
  Users,
  CreditCard,
  Activity,
  AlertTriangle, // For disputes
  FileCheck,     // For KYC
  ArrowDownLeft, // For Withdrawals
  ArrowUpRight,  // For Deposits
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';


interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

// Enhanced StatCard that is now a clickable link
const StatCard = ({ title, value, description, icon: Icon, href }: StatCardProps) => (
    <Link href={href} className="block">
        <Card className="shadow-md hover:shadow-lg transition-shadow hover:bg-muted/50 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    </Link>
);

// Custom hook for live counting documents
const useCollectionCount = (collectionName: string, status?: string) => {
    const firestore = useFirestore();
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore) return;
        const collRef = collection(firestore, collectionName);
        const q = status ? query(collRef, where('status', '==', status)) : query(collRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCount(snapshot.size);
            setLoading(false);
        }, (error) => {
            console.error(`Error counting ${collectionName}:`, error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, collectionName, status]);

    return { count, loading };
}

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const { count: pendingKycCount } = useCollectionCount('kyc-requests', 'pending');
  const { count: pendingDepositCount } = useCollectionCount('transactions', 'pending');
  const { count: pendingWithdrawalCount } = useCollectionCount('withdrawals', 'pending');
  const { count: disputedMatchesCount } = useCollectionCount('matches', 'disputed');
  const { count: totalUsersCount } = useCollectionCount('users');
  
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loadingRevenue, setLoadingRevenue] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    setLoadingRevenue(true);
    const transQuery = query(
        collection(firestore, 'transactions'), 
        where('type', '==', 'entry-fee')
    );

    const unsubscribe = onSnapshot(transQuery, (snapshot) => {
        let total = 0;
        const monthlyRevenue: { [key: string]: number } = {};
        snapshot.forEach(doc => {
            const t = doc.data();
            if (t.status === 'completed') {
                const revenue = Math.abs(t.amount) * 0.10; // 10% commission
                total += revenue;

                const date = t.createdAt.toDate();
                const month = date.toLocaleString('default', { month: 'short' });
                if(!monthlyRevenue[month]) monthlyRevenue[month] = 0;
                monthlyRevenue[month] += revenue;
            }
        });
        
        setTotalRevenue(total);
        const revenueChartData = Object.entries(monthlyRevenue).map(([name, total]) => ({ name, total: Math.round(total) }));
        setRevenueData(revenueChartData);
        setLoadingRevenue(false);
    });

    return () => unsubscribe();
  }, [firestore]);


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight mb-4">Admin Dashboard</h2>
      
        {/* --- Actionable Stat Cards --- */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
                title="Pending KYC" 
                value={String(pendingKycCount)} 
                description="New KYC requests to review" 
                icon={FileCheck}
                href="/admin/kyc-requests"
            />
            <StatCard 
                title="Pending Deposits" 
                value={String(pendingDepositCount)} 
                description="Manual deposits to approve" 
                icon={ArrowUpRight}
                href="/admin/deposits"
            />
            <StatCard 
                title="Pending Withdrawals" 
                value={String(pendingWithdrawalCount)} 
                description="Withdrawals to process" 
                icon={ArrowDownLeft}
                href="/admin/withdrawals"
            />
            <StatCard 
                title="Disputed Matches" 
                value={String(disputedMatchesCount)} 
                description="Matches needing resolution" 
                icon={AlertTriangle}
                href="/admin/matches?status=disputed"
            />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
             <StatCard 
                title="Total Users" 
                value={String(totalUsersCount)} 
                description="Total registered users" 
                icon={Users}
                href="/admin/users"
            />
             <StatCard 
                title="Total Revenue" 
                value={`₹${totalRevenue.toFixed(2)}`} 
                description="Total commission earned" 
                icon={DollarSign}
                href="/admin/transactions?type=entry-fee"
            />
        </div>

        {/* --- Charts --- */}
        <div className="grid gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Revenue Overview</CardTitle>
                    <CardDescription>Commission earned from entry fees per month.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                   {loadingRevenue ? (
                        <div className="flex justify-center items-center h-[350px]">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                   ) : (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={revenueData}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                            <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                        </BarChart>
                    </ResponsiveContainer>
                   )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
