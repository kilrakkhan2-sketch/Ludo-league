'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

// Define the type for our announcement object
type Announcement = {
    id: string;
    title: string;
    content: string;
    type: 'News' | 'Promo' | 'Update' | 'Warning';
    createdAt: any;
};

const AnnouncementForm = ({ announcement, onSave, onOpenChange }: { announcement?: Announcement | null, onSave: () => void, onOpenChange: (open: boolean) => void }) => {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [title, setTitle] = useState(announcement?.title || '');
    const [content, setContent] = useState(announcement?.content || '');
    const [type, setType] = useState<'News' | 'Promo' | 'Update' | 'Warning'>(announcement?.type || 'News');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!firestore || !title || !content) {
            toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill in title and content.' });
            return;
        }
        setIsSubmitting(true);
        try {
            if (announcement) {
                // Update existing announcement
                const docRef = doc(firestore, 'announcements', announcement.id);
                await updateDoc(docRef, { title, content, type });
                toast({ title: 'Announcement Updated' });
            } else {
                // Create new announcement
                await addDoc(collection(firestore, 'announcements'), {
                    title,
                    content,
                    type,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Announcement Created' });
            }
            onSave();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{announcement ? 'Edit' : 'Create'} Announcement</DialogTitle>
                <DialogDescription>
                    {announcement ? 'Edit the details of the announcement.' : 'Create a new announcement for all users.'}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <label htmlFor="title">Title</label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., New Tournament Alert!" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="content">Content</label>
                    <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Describe the announcement..." />
                </div>
                <div className="space-y-2">
                    <label htmlFor="type">Type</label>
                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="News">News</SelectItem>
                            <SelectItem value="Update">Update</SelectItem>
                            <SelectItem value="Promo">Promo</SelectItem>
                            <SelectItem value="Warning">Warning</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Announcement'}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function AdminAnnouncementsPage() {
    const { data: announcements, loading } = useCollection<Announcement>('announcements', { orderBy: ['createdAt', 'desc'] });
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    const handleDelete = async (id: string) => {
        if (!firestore || !window.confirm('Are you sure you want to delete this announcement?')) return;
        try {
            await deleteDoc(doc(firestore, 'announcements', id));
            toast({ title: 'Announcement Deleted' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };
    
    const openFormForEdit = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        setIsFormOpen(true);
    }
    
    const openFormForCreate = () => {
        setSelectedAnnouncement(null);
        setIsFormOpen(true);
    }
    
    const onFormSave = () => {
        setIsFormOpen(false);
        setSelectedAnnouncement(null);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">News & Announcements</h1>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openFormForCreate}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create New
                        </Button>
                    </DialogTrigger>
                    <AnnouncementForm announcement={selectedAnnouncement} onSave={onFormSave} onOpenChange={setIsFormOpen} />
                </Dialog>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Announcements</CardTitle>
                    <CardDescription>
                        Create, edit, or delete announcements that will be shown to users on their dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">No announcements found.</p>
                            <Button variant="link" onClick={openFormForCreate}>Create the first one</Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {announcements.map(ann => (
                                <div key={ann.id} className="border p-4 rounded-lg flex items-start justify-between">
                                    <div>
                                        <p className="font-bold text-lg">{ann.title} <span className="ml-2 text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{ann.type}</span></p>
                                        <p className="text-muted-foreground mt-1">{ann.content}</p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Posted on {ann.createdAt ? format(ann.createdAt.toDate(), 'PPP') : '...'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openFormForEdit(ann)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(ann.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
