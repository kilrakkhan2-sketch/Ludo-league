
'use client';

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "@/firebase";
import type { UserProfile } from "@/types";
import { CheckCircle, XCircle, Shield } from "lucide-react";

export default function AdminUsersPage() {
  const { data: users, loading } = useCollection<UserProfile>('users');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getRoleBadgeVariant = (role: UserProfile['role']) => {
    switch (role) {
      case 'superadmin':
        return 'destructive';
      case 'deposit_admin':
      case 'match_admin':
        return 'default';
      default:
        return 'secondary';
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">User Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Browse and manage all registered users.
          </CardDescription>
          <div className="pt-4">
             <Input 
                placeholder="Search by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
             />
          </div>
        </CardHeader>
        <CardContent>
           {loading ? (
             <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
             </div>
           ) : (
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>KYC</TableHead>
                        <TableHead className="text-right">Wallet Balance</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredUsers.length > 0 ? filteredUsers.map(user => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                            </TableCell>
                            <TableCell>
                               <Badge variant={getRoleBadgeVariant(user.role)}>
                                    {user.role}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {user.isVerified ? (
                                    <Badge variant="outline" className="text-success border-success">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Verified
                                    </Badge>
                                ) : (
                                     <Badge variant="outline" className="text-destructive border-destructive">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Not Verified
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                                ₹{user.walletBalance.toLocaleString()}
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">
                                No users found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
