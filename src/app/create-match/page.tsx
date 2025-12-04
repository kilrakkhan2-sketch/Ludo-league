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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function CreateMatchPage() {
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
              <Label htmlFor="match-name">Match Name</Label>
              <Input id="match-name" placeholder="e.g., Weekend Rumble" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-fee">Entry Fee (credits)</Label>
              <Input id="entry-fee" type="number" placeholder="e.g., 50" />
            </div>
            <div className="space-y-2">
              <Label>Number of Players</Label>
              <RadioGroup defaultValue="4" className="flex gap-4 pt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="players-2" />
                  <Label htmlFor="players-2" className="font-normal">2 Players</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4" id="players-4" />
                  <Label htmlFor="players-4" className="font-normal">4 Players</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="game-mode">Game Mode</Label>
              <Select defaultValue="classic">
                <SelectTrigger id="game-mode">
                  <SelectValue placeholder="Select a game mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="quick">Quick Mode</SelectItem>
                  <SelectItem value="master">Master Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="private-match" className="flex flex-col gap-1">
                <span>Private Match</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Only players with a link can join.
                </span>
              </Label>
              <Switch id="private-match" />
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
