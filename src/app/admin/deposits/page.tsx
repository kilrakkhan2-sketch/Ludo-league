import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { mockDepositRequests } from "@/lib/data"
import { CheckCircle2, Eye, XCircle } from "lucide-react"

export default function AdminDepositsPage() {
  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight mb-4">Deposit Requests</h2>
      <Card>
        <CardHeader>
          <CardTitle>Pending Deposits</CardTitle>
          <CardDescription>
            Review and approve or reject user deposit requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>UTR</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Screenshot</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDepositRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={request.user.avatarUrl} />
                        <AvatarFallback>{request.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{request.user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>₹{request.amount}</TableCell>
                  <TableCell>{request.utr}</TableCell>
                  <TableCell>{new Date(request.date).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                        <a href={request.screenshotUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4 mr-2"/> View
                        </a>
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" className="text-green-600 border-green-500 hover:bg-green-100 hover:text-green-700">
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                        </Button>
                        <Button variant="destructive" size="sm">
                            <XCircle className="h-4 w-4 mr-2" /> Reject
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
