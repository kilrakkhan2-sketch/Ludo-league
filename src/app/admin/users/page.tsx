
'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  addDoc,
  orderBy,
  startAfter,
  limit,
  getDocs,
  endBefore,
  limitToLast
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Search,
  Eye,
  Ban,
  UserCheck,
  ShieldCheck,
  ShieldOff,
  History,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { debounce } from 'lodash';

const UserDetailModal = ({
  user,
  isOpen,
  onOpenChange,
}: {
  user: UserProfile;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const { toast } = useToast();
  const [walletAdjustment, setWalletAdjustment] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleWalletUpdate = async () => {
      if (!firestore || !adminUser || !walletAdjustment || !adjustmentReason) {
        toast({ title: 'Amount and reason are required', variant: 'destructive'});
        return;
      }
      setIsProcessing(true);

      try {
        const transType = walletAdjustment > 0 ? 'admin-credit' : 'admin-debit';
        
        await addDoc(collection(firestore, 'transactions'), {
            userId: user.uid,
            type: transType,
            amount: walletAdjustment,
            status: 'completed', 
            createdAt: serverTimestamp(),
            description: `Admin adjustment: ${adjustmentReason}`
        });

        const logRef = doc(collection(firestore, 'adminLogs'));
        await setDoc(logRef, {
            adminId: adminUser.uid,
            action: 'manual_wallet_adjustment',
            targetUserId: user.uid,
            timestamp: serverTimestamp(),
            notes: `Adjusted by ${walletAdjustment}. Reason: ${adjustmentReason}`
        });

        toast({ title: 'Wallet adjustment transaction created', description: 'The user\'s balance will update shortly via cloud function.', className: 'bg-green-100 text-green-800' });
        onOpenChange(false); 
      } catch (e: any) {
        toast({ title: 'Failed to update wallet', description: e.message, variant: 'destructive' });
      } finally {
          setIsProcessing(false);
          setWalletAdjustment(0);
          setAdjustmentReason('');
      }
  };
  
  const handleAdminToggle = async () => {
    if (!adminUser) return;
    setIsProcessing(true);
    const functions = getFunctions();
    const setAdminClaim = httpsCallable(functions, 'setAdminClaim');
    const newIsAdmin = !(user as any).isAdmin;

    try {
      await setAdminClaim({ uid: user.uid, isAdmin: newIsAdmin });
      toast({
        title: `User ${newIsAdmin ? 'promoted to' : 'demoted from'} admin`,
        className: 'bg-green-100 text-green-800',
      });
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Failed to update admin status',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleStatusChange = async (newStatus: boolean) => {
    if (!firestore || !adminUser) return;
    setIsProcessing(true);
    const userRef = doc(firestore, 'users', user.uid);
    const batch = writeBatch(firestore);

    batch.update(userRef, { isBlocked: newStatus });

    const logRef = doc(collection(firestore, 'adminLogs'));
    batch.set(logRef, {
        adminId: adminUser.uid,
        action: newStatus ? 'user_banned' : 'user_unbanned',
        targetUserId: user.uid,
        timestamp: serverTimestamp(),
        notes: `User ${user.displayName} was ${newStatus ? 'banned' : 'unbanned'}.`
    });

    try {
        await batch.commit();
        toast({
            title: `User ${newStatus ? 'Banned' : 'Unbanned'}`,
            className: newStatus ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800',
        });
        onOpenChange(false);
    } catch (e: any) {
        toast({ title: 'Failed to update user status', description: e.message, variant: 'destructive' });
    } finally {
        setIsProcessing(false);
    }
};

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage User</DialogTitle>
          <DialogDescription>{user.displayName} - {user.email}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            {/* User details */}
            <p><strong>User ID:</strong> {user.uid}</p>
            <p><strong>Wallet Balance:</strong> ₹{(user.walletBalance || 0).toFixed(2)}</p>
            <div><strong>KYC Status:</strong> <Badge>{user.kycStatus}</Badge></div>
            
            <div className='space-y-2 pt-4 border-t'>
                <h4 className='font-semibold'>Adjust Wallet</h4>
                <div className='flex gap-2'>
                    <Input type="number" placeholder="e.g., 100 or -50" value={walletAdjustment} onChange={e => setWalletAdjustment(Number(e.target.value))}/>
                    <Input placeholder="Reason for adjustment" value={adjustmentReason} onChange={e => setAdjustmentReason(e.target.value)}/>
                </div>
                <Button onClick={handleWalletUpdate} disabled={!walletAdjustment || !adjustmentReason || isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Apply Adjustment
                </Button>
            </div>
             <div className='space-y-2 pt-4 border-t'>
                <h4 className='font-semibold'>Admin Status</h4>
                <Button onClick={handleAdminToggle} variant="secondary" disabled={isProcessing}>
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  {(user as any).isAdmin ? <ShieldOff className='mr-2 h-4 w-4'/> : <ShieldCheck className='mr-2 h-4 w-4'/>}
                  {(user as any).isAdmin ? 'Demote from Admin' : 'Promote to Admin'}
                </Button>
            </div>
            <div className='space-y-2 pt-4 border-t'>
                <h4 className='font-semibold'>Account Status</h4>
                <div className="text-sm text-muted-foreground">
                    Current status: {(user as any).isBlocked ? <Badge variant="destructive">Banned</Badge> : <Badge className="bg-green-100 text-green-800">Active</Badge>}
                </div>
                <Button 
                    onClick={() => handleStatusChange(!(user as any).isBlocked)} 
                    variant={(user as any).isBlocked ? "outline" : "destructive"}
                    disabled={isProcessing}
                >
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    {(user as any).isBlocked ? <UserCheck className='mr-2 h-4 w-4'/> : <Ban className='mr-2 h-4 w-4'/>}
                    {(user as any).isBlocked ? 'Unban User' : 'Ban User'}
                </Button>
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const handleSearch = useCallback(
    debounce((term) => {
        setLoading(true);
        if (!firestore) return;

        const usersRef = collection(firestore, 'users');
        // Simple search on display name for now. For more complex searches, an external service like Algolia would be better.
        const q = term 
            ? query(usersRef, orderBy('displayName'), startAt(term), endAt(term + '\uf8ff'))
            : query(usersRef, orderBy('displayName'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
            setUsers(data);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching users:', error);
            toast({ title: 'Error fetching users', description: error.message, variant: 'destructive' });
            setLoading(false);
        });

        return () => unsubscribe();
    }, 500),
    [firestore, toast]
  );

  useEffect(() => {
    handleSearch(searchTerm);
    return () => handleSearch.cancel();
  }, [searchTerm, handleSearch]);

  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight mb-4">User Management</h2>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Search, view, and manage all users on the platform.
          </CardDescription>
          <div className="relative w-full max-w-sm pt-4">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              )}
              {!loading && users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                users.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.photoURL || undefined} />
                          <AvatarFallback>
                            {user.displayName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>₹{(user.walletBalance || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.kycStatus === 'approved' ? 'default' : 'secondary'
                        }
                        className={user.kycStatus === 'approved' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {user.kycStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(user as any).isBlocked ? (
                        <Badge variant="destructive">Banned</Badge>
                       ) : (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                       )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}><Eye className="h-4 w-4 mr-2"/>Manage</Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/users/${user.uid}`}>
                                <History className="h-4 w-4 mr-2"/> History
                            </Link>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedUser && (
        <UserDetailModal user={selectedUser} isOpen={!!selectedUser} onOpenChange={() => setSelectedUser(null)} />
      )}
    </>
  );
}
