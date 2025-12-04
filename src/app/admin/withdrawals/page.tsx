import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminWithdrawalsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Withdrawal Requests</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pending Withdrawals</CardTitle>
          <CardDescription>
            Process user withdrawal requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Pending withdrawal requests will be listed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
