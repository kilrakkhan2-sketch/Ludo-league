
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFunctions } from "@/firebase";
import { UserProfile } from "@/types";
import { MoreHorizontal } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { httpsCallable } from 'firebase/functions';

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const { toast } = useToast();
  const functions = useFunctions();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In a real, scalable app, search and pagination would be done server-side.
  // We simulate it here on the client-side for demonstration.
  const { data: users, loading, refetch } = useCollection<UserProfile>('users');

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const lowercasedFilter = searchTerm.toLowerCase();
    if (!lowercasedFilter) return users;
    
    return users.filter(user => 
        user.displayName?.toLowerCase().includes(lowercasedFilter) ||
        user.email?.toLowerCase().includes(lowercasedFilter) ||
        user.uid?.toLowerCase().includes(lowercasedFilter)
    );
  }, [users, searchTerm]);

  const handleBlockUser = async () => {
    if (!selectedUser || !functions) return;
    
    setIsSubmitting(true);
    try {
        const setUserBlockedStatus = httpsCallable(functions, 'setUserBlockedStatus');
        await setUserBlockedStatus({ userId: selectedUser.uid, blocked: !selectedUser.isBlocked });
        
        toast({ 
            title: `User ${selectedUser.isBlocked ? 'Unblocked' : 'Blocked'}!`,
            description: `${selectedUser.displayName} has been ${selectedUser.isBlocked ? 'unblocked' : 'blocked'}.`
        });
        refetch(); // Re-fetch the user data to show the updated status
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
    } finally {
        setIsAlertOpen(false);
        setSelectedUser(null);
        setIsSubmitting(false);
    }
  };

  const openConfirmation = (user: UserProfile) => {
      setSelectedUser(user);
      setIsAlertOpen(true);
  }

  return (
    <div className="space-y-4">
        <h1 className="text-2xl font-bold">Users Management</h1>
        <div className="bg-card p-4 rounded-lg border shadow-sm">
            <Input 
                type="text" 
                placeholder="Search by name, email or UID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
        </div>

      <div className="bg-card rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className='hidden md:table-cell'>Wallet Balance</TableHead>
                    <TableHead className='hidden lg:table-cell'>Stats</TableHead>
                    <TableHead className='hidden sm:table-cell'>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading && [...Array(PAGE_SIZE)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                        <TableCell className='hidden md:table-cell'><Skeleton className="h-8 w-24" /></TableCell>
                        <TableCell className='hidden lg:table-cell'><Skeleton className="h-8 w-20" /></TableCell>
                        <TableCell className='hidden sm:table-cell'><Skeleton className="h-8 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))}
                {!loading && filteredUsers.map((user) => (
                    <TableRow key={user.uid}>
                        <TableCell>
                           <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={user.photoURL} alt={user.displayName} />
                                    <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-0.5">
                                    <p className="font-medium">{user.displayName}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className='hidden md:table-cell font-mono font-medium'>
                            ₹{user.wallet?.balance?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className='hidden lg:table-cell text-xs'>
                           <div>Won: {user.stats?.matchesWon || 0}</div>
                           <div>Played: {user.stats?.matchesPlayed || 0}</div>
                        </TableCell>
                        <TableCell className='hidden sm:table-cell'>
                            <Badge variant="outline" className="capitalize">{user.role?.replace('_', ' ') || 'Player'}</Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant={user.isBlocked ? 'destructive' : 'default'} className={cn(!user.isBlocked && 'bg-green-500')}>
                                {user.isBlocked ? 'Blocked' : 'Active'}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openConfirmation(user)} className='text-red-500'>
                                        {user.isBlocked ? 'Unblock User' : 'Block User'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
          {!loading && filteredUsers.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No users found matching your search.</p>
              </div>
          )}
      </div>
       {/* Add Pagination Controls here */}

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action will {selectedUser?.isBlocked ? 'unblock' : 'block'} the user <span className='font-semibold'>{selectedUser?.displayName}</span>. 
                    {selectedUser?.isBlocked ? 'They will be able to access their account again.' : 'They will not be able to log in or use the app.'}
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBlockUser} disabled={isSubmitting} className={cn(selectedUser?.isBlocked ? '' : 'bg-destructive text-destructive-foreground')}>
                    {isSubmitting ? 'Processing...' : 'Confirm'}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}
