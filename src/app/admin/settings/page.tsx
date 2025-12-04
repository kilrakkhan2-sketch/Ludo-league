
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDoc } from "@/firebase";
import { useFirestore } from "@/firebase/provider";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useEffect } from "react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";

type AppSettings = {
  id: string;
  upiId?: string;
}

const formSchema = z.object({
  upiId: z.string().min(3, 'UPI ID must be at least 3 characters long').regex(/@/, 'Please enter a valid UPI ID'),
});

export default function AdminSettingsPage() {
  const { data: settings, loading } = useDoc<AppSettings>('settings/payment');
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      upiId: '',
    },
  });

  useEffect(() => {
    if (settings?.upiId) {
      form.reset({ upiId: settings.upiId });
    }
  }, [settings, form]);


  const onSubmit = async (values: z.infer<typeof formSchema>>) => {
    if (!firestore) return;
    const settingsRef = doc(firestore, "settings", "payment");
    setDoc(settingsRef, values, { merge: true })
        .then(() => {
            toast({
                title: "Success",
                description: `Settings updated successfully.`,
            });
        })
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: settingsRef.path,
                operation: 'update',
                requestResourceData: values,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Site Settings</h1>
      <Card className="max-w-2xl">
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
            <CardDescription>
              Configure payment-related settings for the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
                <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
               <FormField
                control={form.control}
                name="upiId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UPI ID for Deposits</FormLabel>
                    <FormControl>
                      <Input placeholder="your-upi-id@bank" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={form.formState.isSubmitting || loading}>
                {form.formState.isSubmitting ? "Saving..." : "Save Settings"}
            </Button>
          </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
