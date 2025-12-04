import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminResultsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Result Verification</h1>
       <Card>
        <CardHeader>
          <CardTitle>Pending Verifications</CardTitle>
          <CardDescription>
            Verify match results submitted by players.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Matches awaiting result verification will be listed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
