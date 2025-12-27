
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Announcement = {
    id: string;
    title: string;
    content: string;
    type: 'News' | 'Promo' | 'Update' | 'Warning';
    createdAt: Timestamp;
};

export const AnnouncementForm = ({ announcement, onSave, onOpenChange }: { announcement?: Announcement | null, onSave: () => void, onOpenChange: (open: boolean) => void }) => {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [title, setTitle] = useState(announcement?.title || '');
    const [content, setContent] = useState(announcement?.content || '');
    const [type, setType] = useState<Announcement['type']>(announcement?.type || 'News');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!firestore || !title.trim() || !content.trim()) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill in both title and content.' });
            return;
        }
        setIsSubmitting(true);
        try {
            if (announcement) {
                const docRef = doc(firestore, 'announcements', announcement.id);
                await updateDoc(docRef, { title, content, type });
                toast({ title: 'Announcement Updated' });
            } else {
                await addDoc(collection(firestore, 'announcements'), { title, content, type, createdAt: serverTimestamp() });
                toast({ title: 'Announcement Created' });
            }
            onSave();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{announcement ? 'Edit' : 'Create'} Announcement</DialogTitle>
                <DialogDescription>Craft a message to be displayed to all users on their dashboard.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label htmlFor="title">Title</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New Tournament Alert!" /></div>
                <div className="grid gap-2"><Label htmlFor="content">Content</Label><Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Describe the announcement..." /></div>
                <div className="grid gap-2"><Label htmlFor="type">Type</Label>
                    <Select value={type} onValueChange={(v: any) => setType(v)}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {['News', 'Update', 'Promo', 'Warning'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
        </DialogContent>
    );
}
