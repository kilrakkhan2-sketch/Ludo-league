
'use client';

import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCollection } from "@/firebase";
import { UserProfile } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { format } from 'date-fns';
import { Wallet } from 'lucide-react';

const UserCardSkeleton = () => (
    <Card>
        <CardHeader>
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
        </CardContent>
    </Card>
);

export default function AdminUsersPage() {
  const { data: users, loading } = useCollection<UserProfile>('users');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => 
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Users</h1>
        <Card>
            <CardHeader>
                <CardTitle>All Users</CardTitle>
                <div className='pt-4'>
                  <Input 
                    placeholder='Search by name or email...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
            </CardHeader>
            <CardContent>
                 {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <UserCardSkeleton />
                        <UserCardSkeleton />
                        <UserCardSkeleton />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredUsers.map(user => (
                            <Card key={user.id}>
                                <CardHeader>
                                    <div className="flex items-center gap-4 font-medium">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={user.photoURL || undefined} />
                                            <AvatarFallback>{user.displayName?.[0] || user.email?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-semibold">{user.displayName}</div>
                                            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-1 text-sm">
                                   <div className="flex items-center gap-2">
                                     <Wallet className="h-4 w-4 text-muted-foreground" />
                                     <span>Balance: ₹{user.walletBalance?.toLocaleString() || 0}</span>
                                   </div>
                                   <p className="text-xs text-muted-foreground pt-1">
                                    Joined: {user.createdAt ? format((user.createdAt as any).toDate(), 'dd MMM yyyy') : 'N/A'}
                                   </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
