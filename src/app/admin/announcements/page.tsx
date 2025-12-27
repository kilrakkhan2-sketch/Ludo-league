
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Megaphone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AnnouncementForm } from './AnnouncementForm';

type Announcement = {
    id: string;
    title: string;
    content: string;
    type: 'News' | 'Promo' | 'Update' | 'Warning';
    createdAt: Timestamp;
};

const getTypeVariant = (type: Announcement['type']) => {
    switch (type) {
        case 'Warning': return 'destructive';
        case 'Promo': return 'default'; // Often primary color
        case 'Update': return 'secondary';
        case 'News': return 'outline';
        default: return 'outline';
    }
};

export default function AdminAnnouncementsPage() {
    const { data: announcements, loading } = useCollection<Announcement>('announcements', { orderBy: ['createdAt', 'desc'] });
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [formOpen, setFormOpen] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState<string | null>(null);
    const [selected, setSelected] = useState<Announcement | null>(null);

    const handleDelete = async () => {
        if (!firestore || !deleteAlert) return;
        try {
            await deleteDoc(doc(firestore, 'announcements', deleteAlert));
            toast({ title: 'Announcement Deleted' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
        setDeleteAlert(null);
    };
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">News & Announcements</h1>
                    <p className="text-muted-foreground">Manage platform-wide notifications for users.</p>
                </div>
                <Button onClick={() => { setSelected(null); setFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Create New</Button>
            </div>

            <Card>
                <CardHeader><CardTitle>Published Announcements</CardTitle></CardHeader>
                <CardContent>
                    {loading && <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>}
                    {!loading && announcements.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed rounded-lg">
                            <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No Announcements Yet</h3>
                            <p className="text-muted-foreground mt-1 mb-4">Get started by creating the first announcement.</p>
                            <Button onClick={() => { setSelected(null); setFormOpen(true); }}>Create Announcement</Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {announcements.map(ann => (
                                <div key={ann.id} className="border p-4 rounded-lg flex items-start justify-between gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-3 mb-1">
                                            <Badge variant={getTypeVariant(ann.type)}>{ann.type}</Badge>
                                            <p className="font-semibold text-base">{ann.title}</p>
                                        </div>
                                        <p className="text-muted-foreground text-sm">{ann.content}</p>
                                        <p className="text-xs text-muted-foreground mt-3">
                                            Posted on {ann.createdAt ? format(ann.createdAt.toDate(), 'dd MMM, yyyy') : '...'}
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => { setSelected(ann); setFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteAlert(ann.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <AnnouncementForm announcement={selected} onSave={() => { setFormOpen(false); setSelected(null); }} onOpenChange={setFormOpen} />
            </Dialog>
            
            <AlertDialog open={!!deleteAlert} onOpenChange={(isOpen) => !isOpen && setDeleteAlert(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the announcement.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
