
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

// Mock data - replace with Firebase data
const withdrawalRequests = [
  { id: 'wd1', userId: 'user123', amount: 500, method: 'UPI', details: 'user@upi', date: '2024-07-28', status: 'pending' },
  { id: 'wd2', userId: 'user456', amount: 1200, method: 'Bank Transfer', details: 'AC 123456789', date: '2024-07-27', status: 'pending' },
];

export default function AdminWithdrawalsPage() {

  const handleProcessRequest = (id: string, action: 'approve' | 'reject') => {
    alert(`Processing request ${id} with action: ${action}`);
    // Add logic here to update Firestore
    // 1. Update the withdrawal request status
    // 2. If approved, create a 'withdrawal' transaction
    // 3. User balance is already deducted when the request is made (or should be)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Withdrawal Requests</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pending Withdrawals</CardTitle>
          <CardDescription>
            Process user withdrawal requests. Ensure funds are sent before approving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawalRequests.length > 0 ? withdrawalRequests.map(req => (
                <TableRow key={req.id}>
                  <TableCell>{req.date}</TableCell>
                  <TableCell className="font-mono text-xs">{req.userId}</TableCell>
                  <TableCell className="font-semibold text-destructive">-₹{req.amount.toLocaleString()}</TableCell>
                  <TableCell>{req.method}</TableCell>
                  <TableCell>{req.details}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" onClick={() => handleProcessRequest(req.id, 'approve')}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleProcessRequest(req.id, 'reject')}>Reject</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">No pending withdrawal requests.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
