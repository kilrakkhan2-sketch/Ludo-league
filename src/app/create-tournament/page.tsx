
"use client";

import { AppShell } from "@/components/layout/AppShell";
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
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useFirebase, useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CreateTournamentPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!firestore || !user || !name || !prizePool || !entryFee || !startDate || !maxPlayers) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill out all required fields.",
        });
        return;
    }
    setIsSubmitting(true);

    try {
        const docRef = await addDoc(collection(firestore, "tournaments"), {
            name,
            description,
            prizePool: Number(prizePool),
            entryFee: Number(entryFee),
            maxPlayers: Number(maxPlayers),
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
        router.push('/tournaments');
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

  return (
    <AppShell pageTitle="Host New Tournament">
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tournament Details</CardTitle>
            <CardDescription>
              Set up your tournament and define the rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tournament-name">Tournament Name</Label>
              <Input id="tournament-name" placeholder="e.g., Summer Ludo Open" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prize-pool">Total Prize Pool (₹)</Label>
                <Input id="prize-pool" type="number" placeholder="e.g., 10000" value={prizePool} onChange={(e) => setPrizePool(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry-fee">Entry Fee (₹)</Label>
                <Input id="entry-fee" type="number" placeholder="e.g., 100" value={entryFee} onChange={(e) => setEntryFee(e.target.value)}/>
              </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="max-players">Max Players</Label>
                <Input id="max-players" type="number" placeholder="e.g., 64" value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} />
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
    </AppShell>
  );
}
