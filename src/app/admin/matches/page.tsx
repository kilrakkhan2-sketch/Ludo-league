import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminMatchesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Match Management</h1>
       <Card>
        <CardHeader>
          <CardTitle>All Matches</CardTitle>
          <CardDescription>
            Oversee all matches on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>A list of all matches (open, ongoing, completed) will be here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
