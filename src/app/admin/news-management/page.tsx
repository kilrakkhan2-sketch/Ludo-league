
'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, Edit, Newspaper, Save } from 'lucide-react';
import type { News } from '@/lib/types';
import { useUser } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from '@/components/ui/dialog';

export default function NewsManagementPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [newsItems, setNewsItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<Partial<News>>({ title: '', content: '' });
  const [editingNews, setEditingNews] = useState<News | null>(null);

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    const q = query(collection(firestore, 'news'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as News)
      );
      setNewsItems(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !formState.title || !formState.content) {
      toast({ title: 'Title and content are required.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    try {
      await addDoc(collection(firestore, 'news'), {
        ...formState,
        authorId: user.uid,
        authorName: user.displayName,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'News Item Created Successfully', className: 'bg-green-100 text-green-800' });
      setFormState({ title: '', content: '' });
    } catch (error: any) {
      toast({ title: 'Failed to create news item', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'news', id));
      toast({ title: 'News Item Deleted', variant: 'destructive' });
    } catch (error: any) {
      toast({ title: 'Failed to delete item', description: error.message, variant: 'destructive' });
    }
  };
  
  const handleEdit = (news: News) => {
    setEditingNews(news);
  };
  
  const handleUpdate = async () => {
    if(!firestore || !editingNews) return;
    try {
      const newsRef = doc(firestore, 'news', editingNews.id);
      await updateDoc(newsRef, {
        title: editingNews.title,
        content: editingNews.content,
      });
      toast({ title: "News item updated!", className: "bg-green-100 text-green-800"});
      setEditingNews(null);
    } catch(error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-6 w-6 text-primary" />
              Existing News Items
            </CardTitle>
            <CardDescription>View, edit, or delete current news items.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary"/></TableCell></TableRow>}
                {!loading && newsItems.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No news items found.</TableCell></TableRow>}
                {!loading && newsItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold">{item.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.content}</TableCell>
                    <TableCell>{item.createdAt?.toDate().toLocaleString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEdit(item)}><Edit className="h-4 w-4"/></Button>
                      <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4"/></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-primary" />
              Create News Item
            </CardTitle>
            <CardDescription>Add a new announcement to the news ticker.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" value={formState.title} onChange={handleInputChange} placeholder="e.g., New Tournament!" required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" name="content" value={formState.content} onChange={handleInputChange} placeholder="Describe the news in detail..." required rows={5} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                Add News Item
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      
      {editingNews && (
        <Dialog open={!!editingNews} onOpenChange={() => setEditingNews(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit News Item</DialogTitle>
              <DialogDescription>Make changes to the news item below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" value={editingNews.title} onChange={(e) => setEditingNews({...editingNews, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea id="edit-content" value={editingNews.content} onChange={(e) => setEditingNews({...editingNews, content: e.target.value})} rows={5} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleUpdate}><Save className="mr-2 h-4 w-4"/>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
