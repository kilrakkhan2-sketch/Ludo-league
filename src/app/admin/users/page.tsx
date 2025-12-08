
'use client';

import { AdminShell } from "@/components/layout/AdminShell";
import { useCollection } from "@/firebase";
import type { UserProfile } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersPage() {
  const { data: users, loading } = useCollection<UserProfile>('users', { 
    orderBy: ['createdAt', 'desc'], 
    limit: 20,
  });

  const SkeletonRow = () => (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-5 w-12" /></TableCell>
    </TableRow>
  )

  return (
    <AdminShell>
        <div>
            <h1 className="text-3xl font-bold font-headline">All Users</h1>
            <p className="text-muted-foreground">A complete list of all registered users on the platform.</p>
        </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Date Joined</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && users.length === 0 ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : users.map((user: UserProfile) => (
            <TableRow key={user.uid}>
              <TableCell>
                  <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback>{user.displayName?.[0] || user.email?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{user.displayName || '-'}</div>
                  </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {user.createdAt?.seconds ? format(new Date(user.createdAt.seconds * 1000), 'dd MMM yyyy') : 'N/A'}
              </TableCell>
              <TableCell className="text-right font-semibold">
                ₹{user.walletBalance?.toLocaleString() || 0}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </AdminShell>
  );
}
