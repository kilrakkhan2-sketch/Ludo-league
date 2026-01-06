'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
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
  AlertTriangle,
} from 'lucide-react';
import { deleteOldRecords } from '@/ai/flows/delete-old-records';

export default function StorageManagementPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteOldData = async () => {
    setIsDeleting(true);
    toast({
      title: 'Cleanup Initiated',
      description: 'Deleting records older than 24 months. This may take a while...',
    });
    try {
      const result = await deleteOldRecords({ months: 24 });
      if (result.success) {
        toast({
          title: 'Cleanup Successful',
          description: `Deleted ${result.deletedMatchesCount} matches and ${result.deletedTransactionsCount} transactions.`,
          className: 'bg-green-100 text-green-800',
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Cleanup Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <FolderKanban className="h-8 w-8 text-primary" />
          Storage Management
        </h2>
      </div>
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle />
            Danger Zone
          </CardTitle>
          <CardDescription>
            These actions are permanent and cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-medium">Clean Up Old Database Records</p>
          <p className="text-sm text-muted-foreground">
            Permanently delete completed matches and associated transactions
            that are older than 24 months to free up database storage.
          </p>
        </CardContent>
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Records Older Than 24 Months
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  all completed matches and transactions older than 24 months.
                  This is intended to free up database space and cannot be
                  recovered.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteOldData}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Yes, delete old records
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </>
  );
}
