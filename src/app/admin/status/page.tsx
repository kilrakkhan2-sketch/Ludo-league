'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Banknote, Landmark, Power, Swords, AlertTriangle, Save } from "lucide-react";
import { cn } from "@/lib/utils";

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

const FeatureControlCard = ({ form, name, label, description, icon: Icon }: { form: any, name: string, label: string, description: string, icon: React.ElementType }) => {
  const isScheduled = form.watch(`${name}TimeScheduled`);

  return (
    <Card>
        <CardHeader>
             <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-full">
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <CardTitle className="text-base">{label}</CardTitle>
                    <CardDescription className="text-xs">{description}</CardDescription>
                </div>
            </div>
        </CardHeader>
      <CardContent className="space-y-4 pt-0">
          <FormField
            control={form.control}
            name={`${name}Disabled`}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <FormLabel className="font-normal">Manually Disable</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="space-y-3 rounded-lg border p-3">
            <FormField
                control={form.control}
                name={`${name}TimeScheduled`}
                render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                    <FormLabel className="font-normal text-sm">Enable Time Schedule</FormLabel>
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
      </CardContent>
    </Card>
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
        appDisabledMessage: settings.appDisabledMessage || 'The app is currently down for scheduled maintenance. We will be back shortly!',
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
  
  const isAppDisabled = form.watch('isAppDisabled');

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold font-headline">App Status & Maintenance</h1>
                <p className="text-muted-foreground">
                Control app availability and disable specific features.
                </p>
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting || loading}>
                <Save className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? "Saving..." : "Save All Settings"}
            </Button>
        </div>

        {loading ? (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-64 lg:col-span-1" />
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
            </div>
        ) : (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                     <Card className={cn("transition-all", isAppDisabled && "border-destructive shadow-destructive/20")}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <CardTitle>Maintenance Mode</CardTitle>
                                 <div className={cn("p-2 rounded-full transition-colors", isAppDisabled ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                                    <Power className="h-5 w-5" />
                                </div>
                            </div>
                            <CardDescription>Enable to take the entire app offline for all users.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="isAppDisabled"
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4" data-state={field.value ? 'checked' : 'unchecked'}>
                                    <FormLabel className="text-base">Disable Entire App</FormLabel>
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
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <FeatureControlCard 
                        form={form} 
                        name="deposits" 
                        label="Deposit System" 
                        description="Users will not be able to add money."
                        icon={Banknote}
                    />
                    <FeatureControlCard 
                        form={form} 
                        name="withdrawals" 
                        label="Withdrawal System" 
                        description="Users will not be able to request withdrawals." 
                        icon={Landmark}
                    />
                    <FeatureControlCard 
                        form={form} 
                        name="matches" 
                        label="Match Creation" 
                        description="Users will not be able to create new matches."
                        icon={Swords}
                    />
                </div>
            </div>
        )}
        </form>
    </Form>
  );
}
