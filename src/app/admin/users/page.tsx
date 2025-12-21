
'use client';

import { AdminShell } from "@/components/layout/AdminShell";
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

const UserRowSkeleton = () => (
    <TableRow>
        <TableCell>
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                </div>
            </div>
        </TableCell>
        <TableCell>
            <Skeleton className="h-4 w-24" />
        </TableCell>
    </TableRow>
);


export default function AdminUsersPage() {
  const { data: users, loading } = useCollection<UserProfile>('users');

  return (
    <AdminShell pageTitle="Users">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
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
                {!loading && users.map(user => (
                    <TableRow key={user.id}>
                        <TableCell>
                            <div className="flex items-center gap-4 font-medium">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.photoURL || undefined} />
                                    <AvatarFallback>{user.displayName?.[0] || user.email?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div>{user.displayName}</div>
                                    <div className="text-sm text-muted-foreground">{user.id}</div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </AdminShell>
  );
}
