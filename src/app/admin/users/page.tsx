
'use client';
import { useState, useEffect } from 'react';
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
  startAt,
  endAt,
} from 'firebase/firestore';
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
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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

  const handleWalletUpdate = async () => {
      if (!firestore || !adminUser || !walletAdjustment || !adjustmentReason) {
        toast({ title: 'Amount and reason are required', variant: 'destructive'});
        return;
      }
      const userRef = doc(firestore, 'users', user.uid);
      const newBalance = (user.walletBalance || 0) + walletAdjustment;

      const batch = writeBatch(firestore);
      batch.update(userRef, { walletBalance: newBalance });
      
      const logRef = doc(collection(firestore, 'adminLogs'));
      batch.set(logRef, {
        adminId: adminUser.uid,
        action: 'manual_wallet_adjustment',
        targetUserId: user.uid,
        timestamp: serverTimestamp(),
        notes: `Adjusted by ${walletAdjustment}. New balance: ${newBalance}. Reason: ${adjustmentReason}`
      });

      try {
        await batch.commit();
        toast({ title: 'Wallet updated successfully', className: 'bg-green-100 text-green-800' });
        onOpenChange(false); // Close dialog
      } catch (e: any) {
        toast({ title: 'Failed to update wallet', description: e.message, variant: 'destructive' });
      }
  };
  
  const handleAdminToggle = async () => {
    if(!firestore || !adminUser) return;
    const userRef = doc(firestore, 'users', user.uid);
    const newIsAdmin = !(user as any).isAdmin;
    try {
        await updateDoc(userRef, { isAdmin: newIsAdmin });
        toast({ title: `User ${newIsAdmin ? 'promoted to' : 'demoted from'} admin` });
        onOpenChange(false);
    } catch(e: any) {
        toast({ title: 'Failed to update admin status', description: e.message, variant: 'destructive' });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>{user.displayName} - {user.email}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            {/* User details */}
            <p><strong>User ID:</strong> {user.uid}</p>
            <p><strong>Wallet Balance:</strong> ₹{user.walletBalance?.toFixed(2)}</p>
            <p><strong>KYC Status:</strong> <Badge>{user.kycStatus}</Badge></p>
            
            <div className='space-y-2 pt-4 border-t'>
                <h4 className='font-semibold'>Adjust Wallet</h4>
                <div className='flex gap-2'>
                    <Input type="number" placeholder="e.g., 100 or -50" value={walletAdjustment} onChange={e => setWalletAdjustment(Number(e.target.value))}/>
                    <Input placeholder="Reason for adjustment" value={adjustmentReason} onChange={e => setAdjustmentReason(e.target.value)}/>
                </div>
                <Button onClick={handleWalletUpdate} disabled={!walletAdjustment || !adjustmentReason}>Apply Adjustment</Button>
            </div>
             <div className='space-y-2 pt-4 border-t'>
                <h4 className='font-semibold'>Admin Status</h4>
                <Button onClick={handleAdminToggle} variant="secondary">
                  {(user as any).isAdmin ? <ShieldOff className='mr-2 h-4 w-4'/> : <ShieldCheck className='mr-2 h-4 w-4'/>}
                  {(user as any).isAdmin ? 'Demote from Admin' : 'Promote to Admin'}
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
  const { user: adminUser } = useUser();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);

    let q;
    const usersRef = collection(firestore, 'users');

    if (searchTerm) {
      q = query(
        usersRef,
        orderBy('displayName'),
        startAt(searchTerm),
        endAt(searchTerm + '\uf8ff')
      );
    } else {
      q = query(usersRef, orderBy('displayName'), startAt(''), endAt('\uf8ff'));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ uid: doc.id, ...doc.data() } as UserProfile)
        );
        setUsers(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error fetching users',
          description: error.message,
          variant: 'destructive',
        });
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [firestore, toast, searchTerm]);
  
  const handleAction = async (userId: string, action: 'block' | 'suspend' | 'freezeWallet') => {
      if(!firestore || !adminUser) return;
      const userRef = doc(firestore, 'users', userId);
      const batch = writeBatch(firestore);

      let fieldToUpdate = '';
      if(action === 'block') fieldToUpdate = 'isBlocked';
      if(action === 'suspend') fieldToUpdate = 'isSuspended';
      if(action === 'freezeWallet') fieldToUpdate = 'isWalletFrozen';

      batch.update(userRef, { [fieldToUpdate]: true });
      
      const logRef = doc(collection(firestore, 'adminLogs'));
      batch.set(logRef, {
        adminId: adminUser.uid,
        action: action,
        targetUserId: userId,
        timestamp: serverTimestamp(),
        notes: `User ${userId} was ${action}ed.`
      });

      try {
        await batch.commit();
        toast({ title: `User ${action}ed successfully`, variant: 'destructive'});
      } catch(e: any) {
        toast({ title: 'Action failed', description: e.message, variant: 'destructive'});
      }
  };

  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight mb-4">User Management</h2>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Search, view, and manage all users on the platform.
          </CardDescription>
          <div className="flex w-full max-w-sm items-center space-x-2 pt-4">
            <Input
              type="text"
              placeholder="Search by name, email, or UID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" /> Search
            </Button>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              )}
              {!loading && users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
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
                          <AvatarImage src={user.photoURL} />
                          <AvatarFallback>
                            {user.displayName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>₹{user.walletBalance?.toFixed(2)}</TableCell>
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
                    <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}><Eye className="h-4 w-4 mr-2"/>View</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleAction(user.uid, 'block')}><Ban className="h-4 w-4 mr-2"/>Block</Button>
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

    