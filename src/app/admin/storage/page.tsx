
'use client';
import React, { useState, useEffect } from 'react';
import {
  getStorage,
  ref,
  listAll,
  deleteObject,
  type StorageReference,
} from 'firebase/storage';
import { Button } from '@/components/ui/button';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  FolderKanban,
  Loader2,
  Trash2,
  Folder,
  File,
  Home,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type FileItem = {
  name: string;
  fullPath: string;
  type: 'folder' | 'file';
  ref: StorageReference;
};

export default function StorageManagementPage() {
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const storage = getStorage();
        const listRef = ref(storage, currentPath);
        const res = await listAll(listRef);

        const folders: FileItem[] = res.prefixes.map((folderRef) => ({
          name: folderRef.name,
          fullPath: folderRef.fullPath,
          type: 'folder',
          ref: folderRef,
        }));

        const files: FileItem[] = res.items.map((itemRef) => ({
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          type: 'file',
          ref: itemRef,
        }));

        setItems([...folders, ...files]);
      } catch (error: any) {
        toast({
          title: 'Error Listing Files',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [currentPath, toast]);

  const handleDelete = async (itemRef: StorageReference) => {
    setDeletingPath(itemRef.fullPath);
    try {
      await deleteObject(itemRef);
      toast({
        title: 'File Deleted',
        description: `Successfully deleted ${itemRef.name}.`,
      });
      // Refresh list
      setItems((prev) => prev.filter((item) => item.fullPath !== itemRef.fullPath));
    } catch (error: any) {
      toast({
        title: 'Error Deleting File',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeletingPath(null);
    }
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };
  
  const Breadcrumbs = () => {
      const parts = currentPath.split('/').filter(Boolean);
      let path = '/';
      return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <button onClick={() => handleNavigate('/')} className="hover:text-primary"><Home className="h-4 w-4"/></button>
              {parts.map((part, i) => {
                  path += `${part}/`;
                  const currentPath = path;
                  return (
                      <React.Fragment key={i}>
                          <ChevronRight className="h-4 w-4"/>
                          <button onClick={() => handleNavigate(currentPath)} className="hover:text-primary">{part}</button>
                      </React.Fragment>
                  )
              })}
          </div>
      )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <FolderKanban className="h-8 w-8 text-primary" />
          Storage Management
        </h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>File Browser</CardTitle>
          <CardDescription>
            Browse and delete files from your Firebase Storage bucket. Deletions
            are permanent.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Breadcrumbs />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-8 text-muted-foreground"
                  >
                    This folder is empty.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.fullPath}>
                    <TableCell>
                      <button
                        onClick={
                          item.type === 'folder'
                            ? () => handleNavigate(item.fullPath)
                            : undefined
                        }
                        className={cn('flex items-center gap-2', {
                          'hover:underline cursor-pointer': item.type === 'folder',
                          'cursor-default': item.type === 'file',
                        })}
                        disabled={item.type !== 'folder'}
                      >
                        {item.type === 'folder' ? (
                          <Folder className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <File className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="font-medium">{item.name}</span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.type === 'folder' ? 'secondary' : 'outline'}
                      >
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.type === 'file' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deletingPath === item.fullPath}
                            >
                              {deletingPath === item.fullPath ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete the file{' '}
                                <code className="bg-muted px-1 py-0.5 rounded">
                                  {item.name}
                                </code>
                                .
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(item.ref)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Yes, delete file
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
