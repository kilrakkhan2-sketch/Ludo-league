
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, UserCog } from 'lucide-react';

const ROLES = ['deposit_admin', 'withdrawal_admin', 'match_admin', 'user'];

const AdminCard = ({ adminUser, onRoleChange, isSubmitting }: { adminUser: UserProfile, onRoleChange: Function, isSubmitting: boolean }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-12 w-12 border">
                    <AvatarImage src={adminUser.photoURL || undefined} alt={adminUser.displayName} />
                    <AvatarFallback>{adminUser.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-base">{adminUser.displayName}</CardTitle>
                    <CardDescription>{adminUser.email}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Label htmlFor={`role-${adminUser.id}`}>Role</Label>
                    <Select
                        defaultValue={adminUser.role}
                        onValueChange={(newRole) => onRoleChange(adminUser.uid, newRole)}
                        disabled={isSubmitting}
                    >
                        <SelectTrigger id={`role-${adminUser.id}`}>
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="superadmin">Super Admin</SelectItem>
                            {ROLES.map(role => (
                                <SelectItem key={role} value={role} className="capitalize">{role.replace('_', ' ')}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
};

export default function ManageAdminsPage() {
    const functions = useFunctions();
    const { toast } = useToast();
    const { data: allUsers, loading } = useCollection<UserProfile>('users');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');

    const admins = useMemo(() => {
        if (!allUsers) return [];
        return allUsers.filter(u => u.role !== 'user');
    }, [allUsers]);

    const handleRoleChange = async (uid: string, newRole: string) => {
        if (!functions) return;
        setIsSubmitting(true);
        try {
            const setUserRole = httpsCallable(functions, 'setUserRole');
            await setUserRole({ userId: uid, role: newRole });
            toast({ title: "Role Updated", description: "The user's role has been successfully changed." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Update Failed", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
     const handleAddNewAdmin = async () => {
        if (!functions || !email || !role) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please enter an email and select a role.' });
            return;
        };
        
        const targetUser = allUsers.find(u => u.email === email);
        if (!targetUser) {
            toast({ variant: 'destructive', title: 'User Not Found', description: 'No user found with that email address.' });
            return;
        }

        await handleRoleChange(targetUser.uid, role);
        setIsFormOpen(false);
        setEmail('');
        setRole('');
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Manage Roles</h1>
                    <p className="text-muted-foreground">Assign or change admin roles for users.</p>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button>
                           <PlusCircle className="mr-2 h-4 w-4" /> Add New Admin
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Assign New Admin Role</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                             <div className="space-y-2">
                                <Label htmlFor="email">User Email</Label>
                                <Input id="email" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                             </div>
                             <div className="space-y-2">
                                 <Label htmlFor="new-role">Role</Label>
                                <Select onValueChange={setRole} value={role}>
                                    <SelectTrigger id="new-role">
                                        <SelectValue placeholder="Select a role to assign" />
                                    </SelectTrigger>
                                    <SelectContent>
                                         <SelectItem value="superadmin">Super Admin</SelectItem>
                                        {ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace('_', ' ')}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                             </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddNewAdmin} disabled={isSubmitting}>
                                {isSubmitting ? 'Assigning...' : 'Assign Role'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            ) : admins.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {admins.map(admin => (
                        <AdminCard key={admin.id} adminUser={admin} onRoleChange={handleRoleChange} isSubmitting={isSubmitting} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 col-span-full border-2 border-dashed rounded-lg">
                    <UserCog className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Admins Found</h3>
                    <p className="text-muted-foreground mt-1">No users currently have admin roles.</p>
                </div>
            )}
        </div>
    );
}

    