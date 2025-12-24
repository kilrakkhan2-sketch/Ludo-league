
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Info, UploadCloud, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React, { useState, useMemo, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useFirebase, useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PrizeDistributionModels from '@/lib/prize-distribution-models.json';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Image from "next/image";

const tournamentSchema = z.object({
  name: z.string().min(5, "Name must be at least 5 characters."),
  description: z.string().optional(),
  entryFee: z.coerce.number().positive("Entry fee must be positive."),
  maxPlayers: z.coerce.number().int().min(2, "Must have at least 2 players."),
  commissionRate: z.number().min(0).max(0.5),
  prizeModel: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
  bannerFile: z.instanceof(File).optional(),
});

export default function AdminCreateTournamentPage() {
  const { firestore, storage } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof tournamentSchema>>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      description: "",
      entryFee: 10,
      maxPlayers: 16,
      commissionRate: 0.1,
      prizeModel: "winner-takes-all",
      startDate: new Date(),
    },
  });

  const { entryFee, maxPlayers, commissionRate, prizeModel, bannerFile } = form.watch();

  const prizePool = useMemo(() => {
    const total = entryFee * maxPlayers;
    if (isNaN(total) || total <= 0) return 0;
    const commission = total * commissionRate;
    return total - commission;
  }, [entryFee, maxPlayers, commissionRate]);

  const onSubmit = async (values: z.infer<typeof tournamentSchema>) => {
    if (!firestore || !user) return;

    try {
        let bannerUrl: string | null = null;
        if (values.bannerFile && storage) {
             const bannerRef = ref(storage, `tournament-banners/${Date.now()}_${values.bannerFile.name}`);
             await uploadBytes(bannerRef, values.bannerFile);
             bannerUrl = await getDownloadURL(bannerRef);
        }
        
        const selectedModel = PrizeDistributionModels.find(m => m.slug === values.prizeModel);

        await addDoc(collection(firestore, "tournaments"), {
            name: values.name,
            description: values.description,
            bannerUrl,
            prizePool,
            entryFee: values.entryFee,
            maxPlayers: values.maxPlayers,
            commissionRate: values.commissionRate,
            prizeDistribution: selectedModel?.distribution || [],
            startDate: Timestamp.fromDate(values.startDate),
            endDate: values.endDate ? Timestamp.fromDate(values.endDate) : null,
            status: 'upcoming',
            players: [],
            creatorId: user.uid,
            createdAt: Timestamp.now(),
        });
        toast({ title: "Tournament Created!" });
        router.push('/admin/tournaments');
    } catch (error: any) {
        toast({ variant: "destructive", title: "Creation Failed", description: error.message });
    }
  }

  const selectedModel = PrizeDistributionModels.find(m => m.slug === prizeModel);

  return (
      <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Create New Tournament</h1>
            <p className="text-muted-foreground">Use this launchpad to configure and create a new tournament.</p>
        </div>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Core Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Tournament Name</FormLabel><FormControl><Input placeholder="e.g., Summer Ludo Open" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bannerFile" render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                        <FormLabel>Banner Image (Optional)</FormLabel>
                        {bannerFile ? (
                            <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                               <Image src={URL.createObjectURL(bannerFile)} alt="Banner preview" fill className="object-cover" />
                               <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-7 w-7" onClick={() => form.setValue('bannerFile', undefined)}><X className="h-4 w-4"/></Button>
                            </div>
                        ) : (
                            <FormControl>
                                <label className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50">
                                    <div className="flex flex-col items-center justify-center"><UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" /><p className="text-sm text-muted-foreground">Click to upload a banner</p></div>
                                    <Input type="file" className="hidden" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} {...rest} />
                                </label>
                            </FormControl>
                        )}
                         <FormMessage />
                    </FormItem>
                 )} />
                 <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Rules & Description</FormLabel><FormControl><Textarea placeholder="Describe the tournament format, prize distribution, etc." {...field} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Financials & Prizes</CardTitle></CardHeader>
             <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField control={form.control} name="entryFee" render={({ field }) => (<FormItem><FormLabel>Entry Fee (₹)</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="maxPlayers" render={({ field }) => (<FormItem><FormLabel>Max Players</FormLabel><FormControl><Input type="number" placeholder="16" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="commissionRate" render={({ field }) => (
                    <FormItem>
                        <div className="flex justify-between items-center"><FormLabel>Admin Commission</FormLabel><span className="font-bold text-primary">{(field.value * 100).toFixed(0)}%</span></div>
                        <FormControl><Slider value={[field.value]} onValueChange={(v) => field.onChange(v[0])} min={0} max={0.5} step={0.01} /></FormControl>
                        <FormMessage />
                    </FormItem>
                 )} />
                <Card className="bg-muted/50"><CardContent className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span>Total Collection:</span> <span className="font-medium">₹{(entryFee * maxPlayers) || 0}</span></div>
                    <div className="flex justify-between"><span>Admin Cut ({(commissionRate * 100).toFixed(0)}%):</span> <span className="font-medium text-red-500">- ₹{((entryFee * maxPlayers) * commissionRate).toFixed(2)}</span></div>
                    <div className="flex justify-between border-t pt-2 mt-2 font-bold"><span>Final Prize Pool:</span> <span>₹{prizePool.toFixed(2)}</span></div>
                </CardContent></Card>
                 <FormField control={form.control} name="prizeModel" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Prize Distribution Model</FormLabel>
                        <div className="flex gap-4 items-start">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>{PrizeDistributionModels.map(m => (<SelectItem key={m.slug} value={m.slug}>{m.name}</SelectItem>))}</SelectContent>
                            </Select>
                             {selectedModel && (
                                <div className="p-3.5 border rounded-lg bg-muted/40 flex-grow text-sm">
                                    <p className="font-semibold text-muted-foreground">{selectedModel.description}</p>
                                    <div className="space-y-1 mt-2 text-muted-foreground">
                                        {selectedModel.distribution.map(tier => (
                                            <div key={tier.rank} className="flex justify-between items-center">
                                                <span>Rank {tier.rank} ({tier.percentage}%)</span>
                                                <span className="font-medium text-foreground">₹{(prizePool * (tier.percentage / 100)).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             )}
                        </div>
                         <FormMessage />
                    </FormItem>
                 )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Scheduling</CardTitle></CardHeader>
             <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover><FormMessage />
                    </FormItem>)} />
                 <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>End Date (Optional)</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                        </Popover><FormMessage />
                    </FormItem>)} />
            </CardContent>
          </Card>
          
          <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creating Tournament...' : 'Launch Tournament'}
          </Button>
        </form>
        </Form>
      </div>
  );
}
