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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  isAppDisabled: z.boolean().default(false),
  appDisabledMessage: z.string().optional(),
  
  areDepositsDisabled: z.boolean().default(false),
  depositsTimeScheduled: z.boolean().default(false),
  depositsStartTime: z.string().optional(),
  depositsEndTime: z.string().optional(),

  areWithdrawalsDisabled: z.boolean().default(false),
  withdrawalsTimeScheduled: z.boolean().default(false),
  withdrawalsStartTime: z.string().optional(),
  withdrawalsEndTime: z.string().optional(),

  areMatchesDisabled: z.boolean().default(false),
  matchesTimeScheduled: z.boolean().default(false),
  matchesStartTime: z.string().optional(),
  matchesEndTime: z.string().optional(),
});

const FeatureControl = ({ form, name, label, description }: { form: any, name: string, label: string, description: string }) => {
  const isScheduled = form.watch(`${name}TimeScheduled`);

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <FormField
        control={form.control}
        name={`${name}Disabled`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <FormLabel>{label}</FormLabel>
              <FormDescription>{description}</FormDescription>
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
      <Separator />
      <FormField
        control={form.control}
        name={`${name}TimeScheduled`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <FormLabel className="text-sm">Enable time schedule</FormLabel>
              <FormDescription className="text-xs">
                Automatically disable this feature between specific times.
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
      {isScheduled && (
        <div className="grid grid-cols-2 gap-4 pt-2">
           <FormField
            control={form.control}
            name={`${name}StartTime`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Disable From</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name={`${name}EndTime`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Enable At</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
};


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
      depositsTimeScheduled: false,
      depositsStartTime: '22:00',
      depositsEndTime: '10:00',
      areWithdrawalsDisabled: false,
      withdrawalsTimeScheduled: false,
      withdrawalsStartTime: '22:00',
      withdrawalsEndTime: '10:00',
      areMatchesDisabled: false,
      matchesTimeScheduled: false,
      matchesStartTime: '22:00',
      matchesEndTime: '10:00',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        isAppDisabled: settings.isAppDisabled || false,
        appDisabledMessage: settings.appDisabledMessage || '',
        areDepositsDisabled: settings.areDepositsDisabled || false,
        depositsTimeScheduled: settings.depositsTimeScheduled || false,
        depositsStartTime: settings.depositsStartTime || '22:00',
        depositsEndTime: settings.depositsEndTime || '10:00',
        areWithdrawalsDisabled: settings.areWithdrawalsDisabled || false,
        withdrawalsTimeScheduled: settings.withdrawalsTimeScheduled || false,
        withdrawalsStartTime: settings.withdrawalsStartTime || '22:00',
        withdrawalsEndTime: settings.withdrawalsEndTime || '10:00',
        areMatchesDisabled: settings.areMatchesDisabled || false,
        matchesTimeScheduled: settings.matchesTimeScheduled || false,
        matchesStartTime: settings.matchesStartTime || '22:00',
        matchesEndTime: settings.matchesEndTime || '10:00',
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
              Control app availability and disable specific features, either manually or on a schedule.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            ) : (
              <>
                <div className="space-y-4 rounded-lg border p-4">
                  <FormField
                    control={form.control}
                    name="isAppDisabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Disable Entire App</FormLabel>
                          <FormDescription>
                            If enabled, all users will see the maintenance message.
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
                            placeholder="e.g., The app is currently down for scheduled maintenance..."
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <h3 className="text-lg font-semibold pt-4 border-t">Feature Toggles</h3>
                
                <FeatureControl 
                  form={form} 
                  name="deposits" 
                  label="Disable Deposits" 
                  description="Users will not be able to add money." 
                />
                <FeatureControl 
                  form={form} 
                  name="withdrawals" 
                  label="Disable Withdrawals" 
                  description="Users will not be able to request withdrawals." 
                />
                <FeatureControl 
                  form={form} 
                  name="matches" 
                  label="Disable Match Creation" 
                  description="Users will not be able to create new matches." 
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
