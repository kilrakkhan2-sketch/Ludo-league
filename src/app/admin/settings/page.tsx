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
import { CommissionSettings } from "@/types";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

const formSchema = z.object({
  isEnabled: z.boolean().default(false),
  rate: z.number().min(0).max(0.25).default(0.05),
});

export default function AdminSettingsPage() {
  const { data: settings, loading } = useDoc<CommissionSettings>('settings/commission');
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isEnabled: false,
      rate: 0.05, // Default to 5%
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        isEnabled: settings.isEnabled || false,
        rate: settings.rate || 0.05,
      });
    }
  }, [settings, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    const settingsRef = doc(firestore, "settings", "commission");
    setDoc(settingsRef, values, { merge: true })
        .then(() => {
            toast({
                title: "Success",
                description: `Commission settings updated successfully.`,
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

  const rateValue = form.watch('rate');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">App Settings</h1>
      <Card className="max-w-2xl">
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Referral Commission Settings</CardTitle>
            <CardDescription>
              Control the commission rate for user referrals. This percentage of a referred user's deposit will be given to the referrer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="isEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Referral Commission</FormLabel>
                        <FormDescription>
                          If enabled, users will receive a commission on their friends' deposits.
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
                  name="rate"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <FormLabel>Commission Rate</FormLabel>
                          <FormDescription>
                            Set the percentage for the commission.
                          </FormDescription>
                        </div>
                        <span className="text-lg font-bold text-primary">{(rateValue * 100).toFixed(0)}%</span>
                      </div>
                      <FormControl>
                         <Slider
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            min={0}
                            max={0.25}
                            step={0.01}
                            disabled={!form.watch('isEnabled')}
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
