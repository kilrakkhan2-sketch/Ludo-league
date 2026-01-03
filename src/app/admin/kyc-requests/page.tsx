
'use client';

import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { mockUsers } from "@/lib/data"
import { CheckCircle2, Download, Eye, Search, XCircle } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"


const mockKycRequests = [
    {
        id: 'kyc-1',
        user: mockUsers[0],
        date: new Date().toISOString(),
        status: 'pending',
        aadhaarPanUrl: 'https://picsum.photos/seed/aadhaar1/800/500',
        selfieUrl: 'https://picsum.photos/seed/selfie1/600/600',
        bankDetails: 'PlayerOne\nBank of Example\nAcct: 1234567890\nIFSC: EXAM0001234'
    },
    {
        id: 'kyc-2',
        user: mockUsers[1],
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        aadhaarPanUrl: 'https://picsum.photos/seed/aadhaar2/800/500',
        selfieUrl: 'https://picsum.photos/seed/selfie2/600/600',
        bankDetails: 'playertwo@exampleupi'
    },
]

export default function AdminKycRequestsPage() {
    const [requests, setRequests] = useState(mockKycRequests);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleAction = (id: string, action: 'approve' | 'reject') => {
        if(action === 'reject' && !rejectionReason){
            alert('Please provide a reason for rejection.');
            return;
        }

        console.log(`Request ${id} ${action}d. Reason: ${rejectionReason}`);
        setRequests(requests.filter(req => req.id !== id));
        setRejectionReason('');
    }

  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight mb-4">KYC Requests</h2>
      <Card>
        <CardHeader>
          <CardTitle>Pending KYC Submissions</CardTitle>
          <CardDescription>
            Review and process new KYC requests from users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
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
                  <TableCell>{new Date(request.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{request.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2"/> Review
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                            <DialogHeader>
                                <DialogTitle>Review KYC: {request.user.name}</DialogTitle>
                                <DialogDescription>
                                    Verify the user's documents and bank details.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid md:grid-cols-2 gap-6 mt-4 max-h-[70vh] overflow-y-auto p-2">
                                <div className="space-y-4">
                                    <h4 className="font-semibold">ID Proof (Aadhaar/PAN)</h4>
                                    <div className="relative group">
                                         <Image src={request.aadhaarPanUrl} alt="ID Proof" width={800} height={500} className="rounded-md border"/>
                                         <a href={request.aadhaarPanUrl} download target="_blank" className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Download className="h-5 w-5" />
                                         </a>
                                    </div>
                                    <h4 className="font-semibold">Selfie</h4>
                                     <div className="relative group">
                                        <Image src={request.selfieUrl} alt="Selfie" width={600} height={600} className="rounded-md border"/>
                                        <a href={request.selfieUrl} download target="_blank" className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Download className="h-5 w-5" />
                                         </a>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-semibold">Bank / UPI Details</h4>
                                    <p className="whitespace-pre-wrap p-4 bg-muted rounded-md text-sm">{request.bankDetails}</p>

                                    <div className="space-y-2">
                                        <Label htmlFor="rejection-reason">Rejection Reason (if any)</Label>
                                        <Textarea 
                                            id="rejection-reason" 
                                            placeholder="e.g., Selfie is blurry, ID document is expired."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button variant="destructive" onClick={() => handleAction(request.id, 'reject')}>
                                        <XCircle className="mr-2 h-4 w-4"/> Reject
                                    </Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button variant="accent" onClick={() => handleAction(request.id, 'approve')}>
                                        <CheckCircle2 className="mr-2 h-4 w-4"/> Approve
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
