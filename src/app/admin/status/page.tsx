
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { useEffect } from "react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";
import { MaintenanceSettings } from "@/types";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  isAppDisabled: z.boolean().default(false),
  appDisabledMessage: z.string().optional(),
  areDepositsDisabled: z.boolean().default(false),
  areWithdrawalsDisabled: z.boolean().default(false),
});

export default function AdminStatusPage() {
  const { data: settings, loading } = useDoc<MaintenanceSettings>('settings/maintenance');
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isAppDisabled: false,
      appDisabledMessage: '',
      areDepositsDisabled: false,
      areWithdrawalsDisabled: false,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        isAppDisabled: settings.isAppDisabled || false,
        appDisabledMessage: settings.appDisabledMessage || '',
        areDepositsDisabled: settings.areDepositsDisabled || false,
        areWithdrawalsDisabled: settings.areWithdrawalsDisabled || false,
      });
    }
  }, [settings, form]);


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    const settingsRef = doc(firestore, "settings", "maintenance");
    setDoc(settingsRef, values, { merge: true })
        .then(() => {
            toast({
                title: "Success",
                description: `App status updated successfully.`,
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
      <h1 className="text-3xl font-bold font-headline">App Status & Maintenance</h1>
      <Card className="max-w-2xl">
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Maintenance Mode</CardTitle>
            <CardDescription>
              Control app availability and disable specific features. Changes take effect immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="isAppDisabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Disable Entire App</FormLabel>
                        <FormDescription>
                          If enabled, all users will see the maintenance message and be blocked.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="appDisabledMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maintenance Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., The app is currently down for scheduled maintenance. We will be back online in approximately 1 hour."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This message will be shown to users if the app is disabled.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <h3 className="text-lg font-semibold pt-4 border-t">Feature Toggles</h3>
                
                 <FormField
                  control={form.control}
                  name="areDepositsDisabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Disable Deposits</FormLabel>
                        <FormDescription>
                          Users will not be able to add money to their wallets.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="areWithdrawalsDisabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Disable Withdrawals</FormLabel>
                        <FormDescription>
                           Users will not be able to request withdrawals.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

              </>
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

