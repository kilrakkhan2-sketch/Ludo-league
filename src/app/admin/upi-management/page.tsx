
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Banknote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UpiAccount, UpiDailyStat } from '@/types';
import { Badge } from '@/components/ui/badge';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

const UpiAccountForm = ({ account, onSave, onOpenChange }: { account?: UpiAccount | null, onSave: () => void, onOpenChange: (open: boolean) => void }) => {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [upiId, setUpiId] = useState(account?.upiId || '');
    const [displayName, setDisplayName] = useState(account?.displayName || '');
    const [dailyLimit, setDailyLimit] = useState(account?.dailyLimit || 50000);
    const [isActive, setIsActive] = useState(account?.isActive ?? true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!firestore || !upiId || !displayName) {
            toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill in all fields.' });
            return;
        }
        setIsSubmitting(true);
        const dataToSave = {
            upiId,
            displayName,
            dailyLimit: Number(dailyLimit),
            isActive,
        };

        try {
            if (account) {
                // Update existing account
                const docRef = doc(firestore, 'upi-accounts', account.id);
                await updateDoc(docRef, dataToSave);
                toast({ title: 'UPI Account Updated' });
            } else {
                // Create new account
                await addDoc(collection(firestore, 'upi-accounts'), {
                    ...dataToSave,
                    totalTransactions: 0,
                    totalAmountReceived: 0,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'UPI Account Added' });
            }
            onSave();
        } catch (error: any) {
            const permissionError = new FirestorePermissionError({
              path: account ? `upi-accounts/${account.id}` : 'upi-accounts',
              operation: account ? 'update' : 'create',
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{account ? 'Edit' : 'Add'} UPI Account</DialogTitle>
                <DialogDescription>
                    {account ? 'Edit the details of this UPI account.' : 'Add a new UPI account for receiving payments.'}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g., Primary Business UPI" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input id="upiId" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="e.g., your-id@okhdfcbank" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="dailyLimit">Daily Limit (₹)</Label>
                    <Input id="dailyLimit" type="number" value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))} placeholder="e.g., 50000" />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <Label htmlFor="is-active">Active for Payments</Label>
                         <p className="text-[0.8rem] text-muted-foreground">
                            If enabled, users will see this UPI ID.
                        </p>
                    </div>
                    <Switch
                        id="is-active"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Account'}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

const UpiAccountRow = ({ account }: { account: UpiAccount }) => {
    const { firestore } = useFirebase();
    const [dailyData, setDailyData] = useState<UpiDailyStat | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore) return;
        const today = format(new Date(), 'yyyy-MM-dd');
        const dailyStatRef = doc(firestore, 'upi-accounts', account.id, 'daily_stats', today);
        
        const unsubscribe = onSnapshot(dailyStatRef, (doc) => {
            if (doc.exists()) {
                setDailyData(doc.data() as UpiDailyStat);
            } else {
                setDailyData({ amount: 0, transactionCount: 0 });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, account.id]);
    
    const amountToday = dailyData?.amount || 0;
    const progress = account.dailyLimit > 0 ? (amountToday / account.dailyLimit) * 100 : 0;
    const limitReached = amountToday >= account.dailyLimit;

    return (
         <TableRow>
            <TableCell>
                <div className="font-medium">{account.displayName}</div>
                <div className="text-xs text-muted-foreground font-mono">{account.upiId}</div>
            </TableCell>
            <TableCell>
                <div className='space-y-2'>
                    <Progress value={progress} className="h-2" />
                    <p className='text-xs text-muted-foreground'>
                        ₹{amountToday.toLocaleString()} / ₹{account.dailyLimit.toLocaleString()}
                    </p>
                </div>
            </TableCell>
            <TableCell className="text-center">{dailyData?.transactionCount || 0}</TableCell>
            <TableCell>
                <Badge variant={limitReached ? 'destructive' : (account.isActive ? 'default' : 'secondary')}>
                    {limitReached ? 'Limit Reached' : (account.isActive ? 'Active' : 'Inactive')}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                {/* Actions can be re-enabled if needed, handled by parent component now */}
            </TableCell>
        </TableRow>
    )
}

export default function UpiManagementPage() {
    const { data: accounts, loading } = useCollection<UpiAccount>('upi-accounts', { orderBy: ['createdAt', 'desc'] });
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<UpiAccount | null>(null);

    const handleDelete = async (id: string) => {
        if (!firestore || !window.confirm('Are you sure you want to delete this UPI account? This action cannot be undone.')) return;
        try {
            await deleteDoc(doc(firestore, 'upi-accounts', id));
            toast({ title: 'UPI Account Deleted' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };
    
    const openFormForEdit = (account: UpiAccount) => {
        setSelectedAccount(account);
        setIsFormOpen(true);
    }
    
    const openFormForCreate = () => {
        setSelectedAccount(null);
        setIsFormOpen(true);
    }
    
    const onFormSave = () => {
        setIsFormOpen(false);
        setSelectedAccount(null);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">UPI Payment Management</h1>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openFormForCreate}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add UPI Account
                        </Button>
                    </DialogTrigger>
                    <UpiAccountForm account={selectedAccount} onSave={onFormSave} onOpenChange={setIsFormOpen} />
                </Dialog>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Configured UPI Accounts</CardTitle>
                    <CardDescription>
                        Manage and track the performance of UPI IDs used for receiving payments.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Account</TableHead>
                                    <TableHead className="w-[300px]">Today's Progress</TableHead>
                                    <TableHead className="text-center">Today's Txns</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accounts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No UPI accounts configured.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    accounts.map(acc => (
                                      <TableRow key={acc.id}>
                                        <TableCell>
                                            <div className="font-medium">{acc.displayName}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{acc.upiId}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className='space-y-2'>
                                                <Progress value={(acc.dailyAmountReceived / acc.dailyLimit) * 100} className="h-2" />
                                                <p className='text-xs text-muted-foreground'>
                                                    ₹{acc.dailyAmountReceived.toLocaleString()} / ₹{acc.dailyLimit.toLocaleString()}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">{acc.dailyTransactionCount || 0}</TableCell>
                                        <TableCell>
                                            <Badge variant={acc.dailyAmountReceived >= acc.dailyLimit ? 'destructive' : (acc.isActive ? 'default' : 'secondary')}>
                                                {acc.dailyAmountReceived >= acc.dailyLimit ? 'Limit Reached' : (acc.isActive ? 'Active' : 'Inactive')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openFormForEdit(acc)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(acc.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
