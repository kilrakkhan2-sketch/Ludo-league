
'use client';

import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCollection, useCollectionGroup } from "@/firebase";
import { UserProfile, Transaction } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const UserCardSkeleton = () => (
    <div className="bg-card p-4 rounded-lg shadow-sm space-y-4">
        <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-40" />
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
        <div className="flex gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    </div>
);

const UserCard = ({ user, stats }: { user: UserProfile, stats: any }) => {
    const isProfit = stats.netProfit >= 0;
    
    return (
        <div className="bg-card p-4 rounded-xl shadow-md border space-y-4">
            <div className="flex items-center">
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                    <AvatarImage src={user.photoURL || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.displayName} />
                    <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="ml-4">
                    <p className="font-bold text-base">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="ml-auto text-sm font-semibold text-green-600 self-start">
                    Active
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-muted p-3 rounded-lg">
                    <p className="text-muted-foreground">Wallet</p>
                    <p className="font-bold text-base truncate">₹{user.walletBalance?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                    <p className="text-muted-foreground">Profit/Loss</p>
                    <p className={`font-bold text-base truncate ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {isProfit ? '+' : '-'}₹{Math.abs(stats.netProfit).toLocaleString()}
                    </p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                    <p className="text-muted-foreground">Deposited</p>
                    <p className="font-bold text-base truncate">₹{stats.totalDeposited.toLocaleString()}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                    <p className="text-muted-foreground">Withdrawn</p>
                    <p className="font-bold text-base truncate">₹{stats.totalWithdrawn.toLocaleString()}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                    <p className="text-muted-foreground">Played</p>
                    <p className="font-bold text-base">{user.matchesPlayed || 0}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                    <p className="text-muted-foreground">Won / Lost</p>
                    <p className="font-bold text-base">{user.matchesWon || 0} / {stats.matchesLost}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                    <p className="text-muted-foreground">Win %</p>
                    <p className="font-bold text-base">{stats.winRate}%</p>
                </div>
                 <div className="bg-muted p-3 rounded-lg">
                    <p className="text-muted-foreground">Role</p>
                    <p className="font-bold text-base capitalize">{user.role}</p>
                </div>
            </div>

             <div className="flex gap-2 pt-2">
                <Button variant="outline" className="w-full">View Details</Button>
                <Button variant="destructive" className="w-full">Block</Button>
            </div>
        </div>
    )
}

export default function AdminUsersPage() {
  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users');
  const { data: transactions, loading: txsLoading } = useCollectionGroup<Transaction>('transactions');
  const [searchTerm, setSearchTerm] = useState('');

  const userStats = useMemo(() => {
    if (!users || !transactions) return new Map();

    const statsMap = new Map();
    users.forEach(user => {
      const userTxs = transactions.filter(t => t.userId === user.uid);
      const totalDeposited = userTxs.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
      const totalWithdrawn = userTxs.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
      const prizeMoney = userTxs.filter(t => t.type === 'prize').reduce((sum, t) => sum + t.amount, 0);
      const entryFees = userTxs.filter(t => t.type === 'entry_fee').reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const matchesPlayed = user.matchesPlayed || 0;
      const matchesWon = user.matchesWon || 0;
      const matchesLost = matchesPlayed - matchesWon;
      const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;
      const netProfit = prizeMoney - entryFees;

      statsMap.set(user.uid, {
        totalDeposited,
        totalWithdrawn,
        netProfit,
        matchesLost,
        winRate,
      });
    });
    return statsMap;
  }, [users, transactions]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchTerm) return users;
    
    const lowercasedFilter = searchTerm.toLowerCase();
    return users.filter(user => 
        user.displayName?.toLowerCase().includes(lowercasedFilter) ||
        user.email?.toLowerCase().includes(lowercasedFilter) ||
        user.uid?.toLowerCase().includes(lowercasedFilter)
    );
  }, [users, searchTerm]);
  
  const loading = usersLoading || txsLoading;

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold font-headline">Users Management</h1>
        <div className="sticky top-16 sm:top-0 bg-background/80 backdrop-blur-sm py-4 z-10">
            <Input 
                type="text" 
                placeholder="Search by name, email or UID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <>
              <UserCardSkeleton />
              <UserCardSkeleton />
              <UserCardSkeleton />
            </>
          ) : (
            filteredUsers.map((user) => {
                const stats = userStats.get(user.uid);
                if (!stats) return <UserCardSkeleton key={user.id} />
                return <UserCard key={user.id} user={user} stats={stats} />
            })
          )}
      </div>
      {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-16 col-span-full">
            <p className="text-muted-foreground">No users found.</p>
          </div>
      )}
    </div>
  );
}

