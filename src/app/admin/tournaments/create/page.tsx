"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, Info, UploadCloud } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React, { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useFirebase, useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PrizeDistributionModels from '@/lib/prize-distribution-models.json';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";


export default function AdminCreateTournamentPage() {
  const { firestore, storage } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalCollected, setTotalCollected] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prizeModel, setPrizeModel] = useState<string>("winner-takes-all");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [commissionRate, setCommissionRate] = useState([0.1]); // 10% default

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setBannerFile(event.target.files[0]);
    }
  };

  const prizePool = useMemo(() => {
    const total = Number(entryFee) * Number(maxPlayers);
    if (isNaN(total) || total <= 0) return 0;
    const commission = total * commissionRate[0];
    return total - commission;
  }, [entryFee, maxPlayers, commissionRate]);

  const handleSubmit = async () => {
    const selectedModel = PrizeDistributionModels.find(m => m.slug === prizeModel);

    if (!firestore || !user || !name || !entryFee || !startDate || !maxPlayers || !selectedModel) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill out all required fields.",
        });
        return;
    }
    setIsSubmitting(true);

    try {
        let bannerUrl = null;
        if (bannerFile && storage) {
             const bannerRef = ref(storage, `tournament-banners/${Date.now()}_${bannerFile.name}`);
             await uploadBytes(bannerRef, bannerFile);
             bannerUrl = await getDownloadURL(bannerRef);
        }
        
        const totalCollectedAmount = Number(entryFee) * Number(maxPlayers);

        await addDoc(collection(firestore, "tournaments"), {
            name,
            description,
            bannerUrl,
            prizePool,
            entryFee: Number(entryFee),
            maxPlayers: Number(maxPlayers),
            commissionRate: commissionRate[0],
            prizeDistribution: selectedModel.distribution,
            startDate: Timestamp.fromDate(startDate),
            endDate: endDate ? Timestamp.fromDate(endDate) : null,
            status: 'upcoming',
            players: [],
            creatorId: user.uid,
        });
        toast({
            title: "Tournament Created!",
            description: "Your new tournament is now listed.",
        });
        router.push('/admin/tournaments');
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Creation Failed",
            description: error.message || "Could not create the tournament.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const selectedModel = PrizeDistributionModels.find(m => m.slug === prizeModel);

  return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">Create New Tournament</h1>
        <Card>
          <CardHeader>
            <CardTitle>Tournament Details</CardTitle>
            <CardDescription>
              Set up the new tournament and define the rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tournament-name">Tournament Name</Label>
              <Input id="tournament-name" placeholder="e.g., Summer Ludo Open" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="banner-upload">Banner Image</Label>
                <label htmlFor="banner-upload" className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
                         {bannerFile ? (
                           <p className="text-sm font-semibold text-primary">{bannerFile.name}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center"><span className="font-semibold">Click to upload banner</span></p>
                        )}
                    </div>
                    <Input id="banner-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entry-fee">Entry Fee (₹)</Label>
                <Input id="entry-fee" type="number" placeholder="e.g., 100" value={entryFee} onChange={(e) => setEntryFee(e.target.value)}/>
              </div>
               <div className="space-y-2">
                    <Label htmlFor="max-players">Max Players</Label>
                    <Input id="max-players" type="number" placeholder="e.g., 64" value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Label>Admin Commission</Label>
                    <span className="text-lg font-bold text-primary">{(commissionRate[0] * 100).toFixed(0)}%</span>
                </div>
                <Slider
                    value={commissionRate}
                    onValueChange={setCommissionRate}
                    min={0}
                    max={0.25}
                    step={0.01}
                />
            </div>

             <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-lg">Prize Calculation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Total Collection:</span> <span className="font-medium">₹{(Number(entryFee) * Number(maxPlayers)) || 0}</span></div>
                    <div className="flex justify-between"><span>Admin Commission ({ (commissionRate[0] * 100).toFixed(0)}%):</span> <span className="font-medium text-destructive">- ₹{((Number(entryFee) * Number(maxPlayers)) * commissionRate[0]).toFixed(2)}</span></div>
                    <div className="flex justify-between border-t pt-2 mt-2 font-bold"><span>Final Prize Pool:</span> <span>₹{prizePool.toFixed(2)}</span></div>
                </CardContent>
            </Card>


             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Prize Distribution Model</Label>
                     <Select value={prizeModel} onValueChange={setPrizeModel}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                            {PrizeDistributionModels.map(model => (
                                <SelectItem key={model.slug} value={model.slug}>
                                    {model.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {selectedModel && (
                    <div className="p-4 border rounded-lg bg-muted/40">
                        <div className="flex items-center mb-2">
                            <h4 className="font-semibold text-sm mr-2">Prize Breakdown</h4>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{selectedModel.description}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="space-y-1.5 text-sm text-muted-foreground">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? (
                        format(startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rules">Rules & Description</Label>
              <Textarea
                id="rules"
                placeholder="Describe the tournament format, prize distribution, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Tournament'}
            </Button>
          </CardContent>
        </Card>
      </div>
  );
}
