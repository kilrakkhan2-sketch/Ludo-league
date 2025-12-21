
'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCollection } from "@/firebase";
import { UserProfile } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

const UserRowSkeleton = () => (
    <TableRow>
        <TableCell className="w-1/2">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                </div>
            </div>
        </TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    </TableRow>
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/2">User</TableHead>
                            <TableHead>Wallet Balance</TableHead>
                            <TableHead>Joined</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && (
                            <>
                                <UserRowSkeleton />
                                <UserRowSkeleton />
                                <UserRowSkeleton />
                                <UserRowSkeleton />
                            </>
                        )}
                        {!loading && filteredUsers.map(user => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-4 font-medium">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={user.photoURL || undefined} />
                                            <AvatarFallback>{user.displayName?.[0] || user.email?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div>{user.displayName}</div>
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>₹{user.walletBalance?.toLocaleString() || 0}</TableCell>
                                <TableCell>{user.createdAt ? format((user.createdAt as any).toDate(), 'dd MMM yyyy') : 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
