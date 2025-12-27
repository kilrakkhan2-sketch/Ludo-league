
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useCollection } from '@/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Copy, RefreshCw, Banknote, Target, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UpiAccount } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UpiAccountForm } from './UpiAccountForm';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';


export default function UpiManagementPage() {
    const { data: accounts, loading, refetch } = useCollection<UpiAccount>('upi-accounts', { orderBy: ['createdAt', 'desc'] });
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [formOpen, setFormOpen] = useState(false);
    const [selected, setSelected] = useState<UpiAccount | null>(null);
    const [alert, setAlert] = useState<{ type: 'delete' | 'reset', id: string } | null>(null);

    const stats = useMemo(() => {
        if (!accounts) return { totalReceived: 0, totalLimit: 0, activeAccounts: 0, overallProgress: 0 };
        const activeAccounts = accounts.filter(acc => acc.isActive);
        const totalReceived = activeAccounts.reduce((sum, acc) => sum + (acc.dailyAmountReceived || 0), 0);
        const totalLimit = activeAccounts.reduce((sum, acc) => sum + (acc.dailyLimit || 0), 0);
        const overallProgress = totalLimit > 0 ? (totalReceived / totalLimit) * 100 : 0;
        return { totalReceived, totalLimit, activeAccounts: activeAccounts.length, overallProgress };
    }, [accounts]);

    const handleAction = async () => {
        if (!firestore || !alert) return;
        try {
            if (alert.type === 'delete') {
                await deleteDoc(doc(firestore, 'upi-accounts', alert.id));
                toast({ title: 'UPI Account Deleted' });
            } else if (alert.type === 'reset') {
                await updateDoc(doc(firestore, 'upi-accounts', alert.id), { dailyAmountReceived: 0, dailyTransactionCount: 0 });
                toast({ title: 'Stats Reset', description: 'The daily transaction stats for this account have been reset to zero.' });
            }
            refetch();
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
        }
        setAlert(null);
    };

    const toggleActive = async (account: UpiAccount) => {
        if (!firestore) return;
        await updateDoc(doc(firestore, 'upi-accounts', account.id), { isActive: !account.isActive });
        toast({ title: `Account ${!account.isActive ? 'Activated' : 'Deactivated'}`});
        refetch();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">UPI Gateway Dashboard</h1>
                    <p className="text-muted-foreground">Manage and monitor UPI IDs for receiving payments.</p>
                </div>
                <Button onClick={() => { setSelected(null); setFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Add Account</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Today's Platform-Wide Stats</CardTitle>
                    <CardDescription>Live overview of all active payment gateways.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-24" /> : (
                        <>
                            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                                <div className="p-4 bg-muted rounded-lg"><div className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Total Received</div><div className="text-2xl font-bold">₹{stats.totalReceived.toLocaleString()}</div></div>
                                <div className="p-4 bg-muted rounded-lg"><div className="text-sm text-muted-foreground flex items-center gap-2"><Target className="h-4 w-4" /> Combined Limit</div><div className="text-2xl font-bold">₹{stats.totalLimit.toLocaleString()}</div></div>
                                <div className="p-4 bg-muted rounded-lg"><div className="text-sm text-muted-foreground flex items-center gap-2"><Banknote className="h-4 w-4" /> Active Accounts</div><div className="text-2xl font-bold">{stats.activeAccounts}</div></div>
                            </div>
                            <div className="mt-4">
                                <Label className="text-xs text-muted-foreground">Overall Daily Capacity</Label>
                                <Progress value={stats.overallProgress} className="h-2 mt-1" />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Configured UPI Accounts</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Account</TableHead><TableHead>Today's Progress</TableHead><TableHead className="text-center">Active</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {loading && <TableRow><TableCell colSpan={4}><Skeleton className="h-20 w-full" /></TableCell></TableRow>}
                            {!loading && accounts.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">No UPI accounts configured. Add one to start accepting payments.</TableCell></TableRow>
                            ) : ( accounts.map(acc => {
                                const progress = acc.dailyLimit > 0 ? ((acc.dailyAmountReceived || 0) / acc.dailyLimit) * 100 : 0;
                                const limitReached = (acc.dailyAmountReceived || 0) >= acc.dailyLimit;
                                return (
                                    <TableRow key={acc.id} className={limitReached ? 'bg-destructive/10' : ''}>
                                        <TableCell>
                                            <div className="font-medium">{acc.displayName}</div>
                                            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">{acc.upiId} <Copy className="h-3 w-3 cursor-pointer hover:text-primary" onClick={() => navigator.clipboard.writeText(acc.upiId)} /></div>
                                        </TableCell>
                                        <TableCell>
                                            <Progress value={progress} className="h-2" />
                                            <p className='text-xs text-muted-foreground mt-1.5'>
                                                ₹{(acc.dailyAmountReceived || 0).toLocaleString()} / ₹{acc.dailyLimit.toLocaleString()}
                                                <Badge variant={limitReached ? 'destructive' : 'outline'} className="ml-2">
                                                    {limitReached ? 'Limit Full' : `${acc.dailyTransactionCount || 0} txns`}
                                                </Badge>
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-center"><Switch checked={acc.isActive} onCheckedChange={() => toggleActive(acc)} disabled={limitReached && acc.isActive} /></TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button variant="ghost" size="icon" title="Reset daily stats" onClick={() => setAlert({ type: 'reset', id: acc.id })}><RefreshCw className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" title="Edit" onClick={() => { setSelected(acc); setFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" title="Delete" className="text-destructive hover:text-destructive" onClick={() => setAlert({ type: 'delete', id: acc.id })}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            }))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={formOpen} onOpenChange={setFormOpen}><UpiAccountForm account={selected} onSave={() => { refetch(); }} onOpenChange={setFormOpen} /></Dialog>
            
            <AlertDialog open={!!alert} onOpenChange={(isOpen) => !isOpen && setAlert(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {alert?.type === 'delete' ? 'This will permanently delete the UPI account. This action cannot be undone.' : 'This will reset the daily transaction and amount stats to zero for this account.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleAction} className={alert?.type === 'delete' ? "bg-destructive text-destructive-foreground" : ""}>Confirm</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
