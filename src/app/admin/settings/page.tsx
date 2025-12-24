
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDoc, useDocs } from "@/firebase";
import { useFirestore } from "@/firebase/provider";
import { doc, setDoc, writeBatch } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Globe, Palette, ShieldCheck, TrendingUp } from "lucide-react";

// Schema for Referral Commission
const commissionSchema = z.object({
  isEnabled: z.boolean().default(false),
  rate: z.number().min(0).max(0.25).default(0.05),
});

// Schema for Platform Status
const platformStatusSchema = z.object({
  isMaintenanceMode: z.boolean().default(false),
  areRegistrationsOpen: z.boolean().default(true),
});

// Define types from schemas
type CommissionSettings = z.infer<typeof commissionSchema>;
type PlatformStatusSettings = z.infer<typeof platformStatusSchema>;


const CommissionCard = ({ settings, isLoading }: { settings: CommissionSettings | undefined, isLoading: boolean }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const form = useForm<CommissionSettings>({ resolver: zodResolver(commissionSchema), defaultValues: settings });

    useEffect(() => { if (settings) form.reset(settings); }, [settings, form]);

    const onSubmit = async (values: CommissionSettings) => {
        if (!firestore) return;
        await setDoc(doc(firestore, "settings", "commission"), values, { merge: true });
        toast({ title: "Success", description: "Commission settings have been updated." });
    };

    return (
        <Card>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5"/> Referral Commission</CardTitle>
                        <CardDescription>Control the commission rate users get from their friends' deposits.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading ? <Skeleton className="h-24 w-full" /> : (
                            <>
                                <FormField control={form.control} name="isEnabled" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5"><FormLabel>Enable Commission</FormLabel></div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="rate" render={({ field }) => (
                                    <FormItem>
                                        <div className="flex justify-between items-center">
                                            <FormLabel>Commission Rate</FormLabel>
                                            <span className="text-lg font-bold">{(form.watch('rate') * 100).toFixed(0)}%</span>
                                        </div>
                                        <FormControl>
                                            <Slider value={[field.value]} onValueChange={(v) => field.onChange(v[0])} min={0} max={0.25} step={0.01} disabled={!form.watch('isEnabled')} />
                                        </FormControl>
                                    </FormItem>
                                )}/>
                            </>
                        )}
                    </CardContent>
                    <CardFooter><Button type="submit" disabled={form.formState.isSubmitting || isLoading}>Save Commission</Button></CardFooter>
                </form>
            </Form>
        </Card>
    );
};

const PlatformStatusCard = ({ settings, isLoading }: { settings: PlatformStatusSettings | undefined, isLoading: boolean }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const form = useForm<PlatformStatusSettings>({ resolver: zodResolver(platformStatusSchema), defaultValues: settings });

    useEffect(() => { if (settings) form.reset(settings); }, [settings, form]);

    const onSubmit = async (values: PlatformStatusSettings) => {
        if (!firestore) return;
        await setDoc(doc(firestore, "settings", "platformStatus"), values, { merge: true });
        toast({ title: "Success", description: "Platform status has been updated." });
    };

    return (
        <Card>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5"/> Platform Status</CardTitle>
                        <CardDescription>Manage global settings like maintenance mode and user registrations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {isLoading ? <Skeleton className="h-24 w-full" /> : (
                            <>
                                <FormField control={form.control} name="isMaintenanceMode" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-amber-50 border-amber-200">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-amber-900">Maintenance Mode</FormLabel>
                                            <FormDescription className="text-amber-800">Temporarily disable access for all non-admin users.</FormDescription>
                                        </div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )}/>
                                 <FormField control={form.control} name="areRegistrationsOpen" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel>Allow New Sign-ups</FormLabel>
                                            <FormDescription>Control whether new users can create accounts.</FormDescription>
                                        </div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )}/>
                            </>
                         )}
                    </CardContent>
                    <CardFooter><Button type="submit" disabled={form.formState.isSubmitting || isLoading}>Save Status</Button></CardFooter>
                </form>
            </Form>
        </Card>
    );
};

export default function AdminSettingsPage() {
  const { data: settingsDocs, loading } = useDocs<any>(['settings/commission', 'settings/platformStatus']);
  
  const commissionSettings = settingsDocs?.find(d => d.id === 'commission') as CommissionSettings | undefined;
  const platformStatusSettings = settingsDocs?.find(d => d.id === 'platformStatus') as PlatformStatusSettings | undefined;

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Platform Settings</h1>
            <p className="text-muted-foreground">Manage global configuration for the entire application.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlatformStatusCard settings={platformStatusSettings} isLoading={loading} />
            <CommissionCard settings={commissionSettings} isLoading={loading} />
            {/* Other settings cards can be added here */}
        </div>
    </div>
  );
}
