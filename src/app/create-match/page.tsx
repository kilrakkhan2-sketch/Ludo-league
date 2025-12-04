
'use client';

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";

const twoPlayerFees = ["50", "100", "200", "500"];
const multiPlayerFees = ["500", "1000", "2000", "5000"];

export default function CreateMatchPage() {
  const [maxPlayers, setMaxPlayers] = useState("2");
  const [entryFee, setEntryFee] = useState("50");
  const [availableFees, setAvailableFees] = useState(twoPlayerFees);

  useEffect(() => {
    if (maxPlayers === "2") {
      setAvailableFees(twoPlayerFees);
      // If current fee is not in the new list, reset to the minimum
      if (!twoPlayerFees.includes(entryFee) && entryFee !== 'custom') {
        setEntryFee(twoPlayerFees[0]);
      }
    } else {
      setAvailableFees(multiPlayerFees);
       // If current fee is not in the new list, reset to the minimum
      if (!multiPlayerFees.includes(entryFee) && entryFee !== 'custom') {
        setEntryFee(multiPlayerFees[0]);
      }
    }
  }, [maxPlayers, entryFee]);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 font-headline">
          Create New Match
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Match Settings</CardTitle>
            <CardDescription>
              Configure your Ludo match and invite others to play.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="match-name">Match Title</Label>
              <Input id="match-name" placeholder="e.g., Quick Game" />
            </div>

            <div className="space-y-2">
              <Label>Max Players</Label>
              <RadioGroup 
                value={maxPlayers} 
                onValueChange={setMaxPlayers}
                className="flex gap-4 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="players-2" />
                  <Label htmlFor="players-2" className="font-normal">2</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="players-3" />
                  <Label htmlFor="players-3" className="font-normal">3</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4" id="players-4" />
                  <Label htmlFor="players-4" className="font-normal">4</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Entry Fee (₹)</Label>
              <p className="text-xs text-muted-foreground">
                Minimum fee for {maxPlayers} players is ₹{availableFees[0]}.
              </p>
              <RadioGroup 
                value={entryFee}
                onValueChange={setEntryFee}
                className="flex flex-wrap gap-4 pt-2"
              >
                {availableFees.map(fee => (
                  <div key={`fee-${fee}`} className="flex items-center space-x-2">
                    <RadioGroupItem value={fee} id={`fee-${fee}`} />
                    <Label htmlFor={`fee-${fee}`} className="font-normal">{fee}</Label>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="fee-custom" />
                  <Label htmlFor="fee-custom" className="font-normal">Custom</Label>
                </div>
              </RadioGroup>
              {entryFee === 'custom' && (
                  <Input type="number" placeholder={`Enter amount (min ₹${availableFees[0]})`} className="mt-2" />
              )}
            </div>
            
             <div className="space-y-2">
              <Label>Privacy</Label>
              <RadioGroup defaultValue="public" className="flex gap-4 pt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="privacy-public" />
                  <Label htmlFor="privacy-public" className="font-normal">Public</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="privacy-private" />
                  <Label htmlFor="privacy-private" className="font-normal">Private</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
                <Label htmlFor="room-code">Ludo King Room Code</Label>
                <Input id="room-code" placeholder="Enter 6-character code from Ludo King" />
                <p className="text-xs text-muted-foreground">You must create a room in the Ludo King app first.</p>
            </div>
            <Button type="submit" size="lg" className="w-full">
              Create Match
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
