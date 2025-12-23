
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useFunctions } from '@/firebase/provider';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface StorageFile {
    name: string;
    size: string;
    contentType: string;
    createdAt: string;
}

const fileCategories = [
    { name: 'Deposit Screenshots', prefix: 'deposit-screenshots/' },
    { name: 'Match Results', prefix: 'match-results/' },
    { name: 'KYC Documents', prefix: 'kyc-documents/' },
    { name: 'Profile Pictures', prefix: 'profile-pictures/' },
    { name: 'Tournament Banners', prefix: 'tournament-banners/' },
];

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const FileList = ({ prefix }: { prefix: string }) => {
    const functions = useFunctions();
    const { toast } = useToast();
    const [files, setFiles] = useState<StorageFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchFiles = useCallback(async () => {
        if (!functions) return;
        setLoading(true);
        try {
            const listFilesFn = httpsCallable(functions, 'listStorageFiles');
            const result = await listFilesFn({ prefix });
            const data = result.data as { files: StorageFile[] };
            setFiles(data.files);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error listing files', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [functions, prefix, toast]);

    useState(() => {
        fetchFiles();
    });

    const handleDelete = async (filePath: string) => {
        if (!functions || !window.confirm(`Are you sure you want to delete this file?\n${filePath}`)) return;
        setDeleting(filePath);
        try {
            const deleteFileFn = httpsCallable(functions, 'deleteStorageFile');
            await deleteFileFn({ filePath });
            toast({ title: 'File Deleted' });
            fetchFiles(); // Refresh the list
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error deleting file', description: error.message });
        } finally {
            setDeleting(null);
        }
    }

    if (loading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }
    
    if (files.length === 0) {
        return <p className="text-muted-foreground text-center py-10">No files found in this category.</p>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {files.map(file => (
                    <TableRow key={file.name}>
                        <TableCell className="font-mono text-xs break-all">{file.name.split('/').pop()}</TableCell>
                        <TableCell>{formatBytes(Number(file.size))}</TableCell>
                        <TableCell>{format(new Date(file.createdAt), 'dd MMM yyyy, HH:mm')}</TableCell>
                        <TableCell className="text-right">
                            <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDelete(file.name)}
                                disabled={deleting === file.name}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {deleting === file.name ? 'Deleting...' : 'Delete'}
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default function StorageManagementPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Storage Manager</h1>
                <p className="text-muted-foreground">Browse and delete files from your Firebase Storage bucket.</p>
            </div>
            <Card>
                <CardContent className="p-0">
                    <Tabs defaultValue={fileCategories[0].prefix}>
                        <TabsList className="w-full justify-start rounded-none border-b p-0 h-auto bg-card">
                             {fileCategories.map(cat => (
                                <TabsTrigger key={cat.prefix} value={cat.prefix} className="rounded-none data-[state=active]:border-b-2 border-b-primary data-[state=active]:shadow-none -mb-px">
                                    {cat.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        
                        {fileCategories.map(cat => (
                            <TabsContent key={cat.prefix} value={cat.prefix} className="p-4">
                                <FileList prefix={cat.prefix} />
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
