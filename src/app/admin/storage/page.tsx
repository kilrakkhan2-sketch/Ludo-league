
'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useFirebase, useFunctions } from '@/firebase/provider';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { Input } from '@/components/ui/input';

interface StorageFile {
    name: string;
    size: string;
    contentType: string;
    createdAt: string;
}

const fileCategories = [
    { name: 'App Images', prefix: 'appImages/' },
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

const FileUploadCard = ({ prefix, onUploadComplete }: { prefix: string, onUploadComplete: () => void }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { storage } = useFirebase();
    const { toast } = useToast();

    const handleUpload = async () => {
        if (!file || !storage) return;

        setIsUploading(true);
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const storageRef = ref(storage, `${prefix}${fileName}`);

        try {
            await uploadBytes(storageRef, file);
            toast({ title: 'Upload Successful', description: 'Your file has been uploaded.' });
            setFile(null);
            onUploadComplete();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload New Image</CardTitle>
                <CardDescription>
                    Upload a new image to the <span className="font-mono text-xs bg-muted p-1 rounded-sm">{prefix}</span> folder. Only admins can perform this action.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept="image/*" className="max-w-xs" />
                    <Button onClick={handleUpload} disabled={!file || isUploading}>
                        <Upload className="mr-2 h-4 w-4" />
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                </div>
            </CardContent>
            {file && <CardFooter><p className="text-sm text-muted-foreground">Selected: {file.name}</p></CardFooter>}
        </Card>
    );
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
        <div className="space-y-6">
            {prefix === 'appImages/' && 
                <FileUploadCard prefix={prefix} onUploadComplete={fetchFiles} />
            }
            <Card>
                 <CardHeader>
                    <CardTitle>Existing Files</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>
        </div>
    );
};

export default function StorageManagementPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Storage Manager</h1>
                <p className="text-muted-foreground">Browse and manage files in your Firebase Storage bucket.</p>
            </div>
            <Tabs defaultValue={fileCategories[0].prefix} className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b p-0 h-auto bg-transparent overflow-x-auto">
                        {fileCategories.map(cat => (
                        <TabsTrigger key={cat.prefix} value={cat.prefix} className="rounded-none data-[state=active]:border-b-2 border-b-primary data-[state=active]:shadow-none -mb-px px-4">
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
        </div>
    );
}
