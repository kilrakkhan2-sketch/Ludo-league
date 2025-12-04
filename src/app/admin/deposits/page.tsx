import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminDepositsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Deposit Requests</h1>
       <Card>
        <CardHeader>
          <CardTitle>Pending Deposits</CardTitle>
          <CardDescription>
            Verify and approve or reject deposit requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Pending deposit requests will be listed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
