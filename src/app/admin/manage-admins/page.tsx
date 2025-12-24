
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFunctions, useUser } from '@/firebase';
import type { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, UserCog } from 'lucide-react';

// Roles that can be assigned via the UI. Superadmin is excluded for security.
const ASSIGNABLE_ROLES = ['deposit_admin', 'withdrawal_admin', 'match_admin', 'user'];

export default function ManageAdminsPage() {
    const functions = useFunctions();
    const { toast } = useToast();
    const { user: currentUser, userData } = useUser(); // The currently logged-in superadmin
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [targetUid, setTargetUid] = useState('');
    const [newRole, setNewRole] = useState('');

    const { data: users, loading } = useCollection<UserProfile>('users');
    
    const admins = useMemo(() => {
        if (!users) return [];
        return users.filter(u => u.roles && !u.roles.includes('user'));
    }, [users]);


    // Sort so that superadmins are always at the top
    const sortedAdmins = useMemo(() => {
        if (!admins) return [];
        return [...admins].sort((a, b) => {
            if (a.roles.includes('superadmin')) return -1;
            if (b.roles.includes('superadmin')) return 1;
            return 0;
        });
    }, [admins]);

    const handleRoleChange = async (uid: string, role: string) => {
        if (!functions || !currentUser) return;

        // Security Check: Prevent a superadmin from demoting themselves
        if (currentUser.uid === uid && role !== 'superadmin') {
            toast({ variant: "destructive", title: "Action Not Allowed", description: "Superadmins cannot change their own role." });
            return;
        }

        setIsSubmitting(true);
        try {
            const setUserRole = httpsCallable(functions, 'setUserRole');
            await setUserRole({ userId: uid, role: role });
            toast({ title: "Role Updated", description: `The user's role has been changed to ${role}.` });
            // Close the form if it was used for adding a new admin
            if(isFormOpen) {
                setIsFormOpen(false);
                setTargetUid('');
                setNewRole('');
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Update Failed", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddNewAdmin = () => {
        if (!targetUid || !newRole) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please provide a User ID and select a role.' });
            return;
        }
        handleRoleChange(targetUid, newRole);
    };

    if (userData?.roles && !userData.roles.includes('superadmin')) {
        return <p>You do not have permission to view this page.</p>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Admin Role Management</h1>
                    <p className="text-muted-foreground">Assign or change admin roles for platform users.</p>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Admin</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Assign New Admin</DialogTitle>
                            <DialogDescription>Enter the user's unique ID (UID) to grant them admin privileges.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                             <div className="space-y-2">
                                <Label htmlFor="uid">User ID</Label>
                                <Input id="uid" placeholder="Enter user UID" value={targetUid} onChange={(e) => setTargetUid(e.target.value)} />
                             </div>
                             <div className="space-y-2">
                                 <Label htmlFor="new-role">Role to Assign</Label>
                                <Select onValueChange={setNewRole} value={newRole}>
                                    <SelectTrigger id="new-role">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ASSIGNABLE_ROLES.filter(r => r !== 'user').map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace('_', ' ')}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                             </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddNewAdmin} disabled={isSubmitting}>{isSubmitting ? 'Assigning...' : 'Assign Role'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Admin User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-10 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : sortedAdmins.length > 0 ? (
                            sortedAdmins.map(admin => (
                                <TableRow key={admin.uid}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border">
                                                <AvatarImage src={admin.photoURL} alt={admin.displayName} />
                                                <AvatarFallback>{admin.displayName?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="grid gap-0.5">
                                                <p className="font-medium">{admin.displayName}</p>
                                                <p className="text-xs text-muted-foreground">{admin.uid}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="capitalize font-medium">{admin.roles.join(', ').replace(/_/g, ' ')}</TableCell>
                                    <TableCell className="text-right">
                                        {!admin.roles.includes('superadmin') ? (
                                            <Select
                                                defaultValue={admin.roles.find(r => ASSIGNABLE_ROLES.includes(r))}
                                                onValueChange={(newRole) => handleRoleChange(admin.uid, newRole)}
                                                disabled={isSubmitting}
                                            >
                                                <SelectTrigger className="w-[180px] ml-auto">
                                                    <SelectValue placeholder="Change role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ASSIGNABLE_ROLES.map(role => (
                                                        <SelectItem key={role} value={role} className="capitalize">{role.replace('_', ' ')}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-right italic">Cannot be changed</p>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    <UserCog className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-semibold">No Admins Configured</h3>
                                    <p className="text-muted-foreground mt-1">Use the button above to assign the first admin role.</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
