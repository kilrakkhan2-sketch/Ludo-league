'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCollection, useUser } from "@/firebase";
import type { UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const UserCardSkeleton = () => (
    <Card>
        <CardHeader className="flex flex-row items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                 <Skeleton className="h-16 w-full" />
                 <Skeleton className="h-16 w-full" />
                 <Skeleton className="h-16 w-full" />
                 <Skeleton className="h-16 w-full" />
            </div>
             <div className="flex gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </CardContent>
    </Card>
);


const UserCard = ({ user }: { user: UserProfile }) => {
    const netProfit = (user.totalWinnings || 0) - (user.totalEntryFees || 0);
    const isProfit = netProfit >= 0;
    
    // Mock data for now as per the user's HTML
    const matchesPlayed = user.matchesPlayed || 120;
    const matchesWon = user.matchesWon || 72;
    const matchesLost = matchesPlayed - matchesWon;
    
    return (
        <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                    <AvatarImage src={user.photoURL || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.displayName} />
                    <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold text-base">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                 <div className="ml-auto text-sm font-semibold text-green-600">
                    Active
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted p-3 rounded-lg">
                        <p className="text-muted-foreground">Wallet Balance</p>
                        <p className="font-bold text-base">₹{user.walletBalance?.toLocaleString() || '0'}</p>
                    </div>
                     <div className="bg-muted p-3 rounded-lg">
                        <p className="text-muted-foreground">Net Profit/Loss</p>
                        <p className={`font-bold text-base ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                           {isProfit ? '+' : '-'}₹{Math.abs(netProfit).toLocaleString()}
                        </p>
                    </div>
                     <div className="bg-muted p-3 rounded-lg">
                        <p className="text-muted-foreground">Matches Played</p>
                        <p className="font-bold text-base">{matchesPlayed}</p>
                    </div>
                     <div className="bg-muted p-3 rounded-lg">
                        <p className="text-muted-foreground">Wins / Loss</p>
                        <p className="font-bold text-base">{matchesWon} / {matchesLost}</p>
                    </div>
                </div>
                 <div className="flex gap-2">
                    <Button variant="outline" className="w-full">View Full Profile</Button>
                    <Button variant="destructive" className="w-full">Block User</Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function ManageAdminsPage() {
  const { data: users, loading } = useCollection<UserProfile>('users');
  const [searchTerm, setSearchTerm] = useState('');
  
   const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchTerm) return users;
    
    return users.filter(user => 
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.uid?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold font-headline">Users Management</h1>
        <div className="sticky top-16 sm:top-0 bg-muted/40 backdrop-blur-sm py-4 z-10">
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
            filteredUsers.map((user) => <UserCard key={user.id} user={user} />)
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
