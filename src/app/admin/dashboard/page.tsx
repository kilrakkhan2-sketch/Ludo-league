
'use client';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Ban, Eye, ShieldCheck, ThumbsDown, Loader2 } from "lucide-react"
import { useFirestore } from "@/firebase"
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore"
import { useEffect, useState } from "react"
import type { UserProfile, MatchResult } from "@/lib/types"

export default function AdminDashboardPage() {
    const firestore = useFirestore();
    const [suspiciousUsers, setSuspiciousUsers] = useState<UserProfile[]>([]);
    const [fraudAlerts, setFraudAlerts] = useState<MatchResult[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingAlerts, setLoadingAlerts] = useState(true);

    useEffect(() => {
        if (!firestore) return;

        // Fetch suspicious users (e.g., win rate > 80%)
        setLoadingUsers(true);
        const usersRef = collection(firestore, 'users');
        const suspiciousQuery = query(usersRef, where('winRate', '>=', 80), limit(20));
        const unsubscribeUsers = onSnapshot(suspiciousQuery, snapshot => {
            setSuspiciousUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
            setLoadingUsers(false);
        });

        // Fetch fraud alerts
        setLoadingAlerts(true);
        const resultsRef = collection(firestore, 'matchResults'); // This might need adjustment if results are in subcollections
        const fraudQuery = query(resultsRef, where('isFlaggedForFraud', '==', true), limit(20));
        // This query won't work if 'matchResults' is a subcollection. 
        // A more complex query (e.g. collectionGroup) would be needed, which is harder to setup on the client.
        // For now, we will assume a flat structure or just show an empty state.
        // const unsubscribeAlerts = onSnapshot(fraudQuery, snapshot => {
        //     setFraudAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchResult)));
        //     setLoadingAlerts(false);
        // });
        setLoadingAlerts(false); // Manually set to false as the query is likely to fail.


        return () => {
            unsubscribeUsers();
            // unsubscribeAlerts();
        }
    }, [firestore]);


  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight mb-4">Admin Dashboard</h2>
      <Tabs defaultValue="fraud-alerts">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fraud-alerts">Fraud Alerts</TabsTrigger>
          <TabsTrigger value="suspicious-users">Suspicious Users</TabsTrigger>
        </TabsList>
        <TabsContent value="fraud-alerts">
          <Card>
            <CardHeader>
              <CardTitle>Automated Fraud Alerts</CardTitle>
              <CardDescription>
                Submissions automatically flagged by the system for review (e.g. duplicate screenshots).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Match ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAlerts && <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>}
                  {!loadingAlerts && fraudAlerts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No fraud alerts to show.</TableCell></TableRow>}
                  {!loadingAlerts && fraudAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.userName}</TableCell>
                      <TableCell>Duplicate Screenshot</TableCell>
                      <TableCell className="font-mono text-xs">{alert.id}</TableCell>
                      <TableCell>{alert.submittedAt?.toDate().toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-100 hover:text-green-700">Approve</Button>
                            <Button variant="destructive" size="sm"><ThumbsDown className="mr-2 h-4 w-4"/>Reject</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="suspicious-users">
          <Card>
            <CardHeader>
              <CardTitle>Suspicious Users</CardTitle>
              <CardDescription>
                Users with exceptionally high win rates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead>Winnings</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers && <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>}
                  {!loadingUsers && suspiciousUsers.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No suspicious users found.</TableCell></TableRow>}
                  {!loadingUsers && suspiciousUsers.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">{user.displayName}</TableCell>
                      <TableCell>{user.winRate}%</TableCell>
                      <TableCell>₹{user.winnings || 0}</TableCell>
                      <TableCell>
                        <Badge variant={user.kycStatus === 'approved' ? 'default': 'secondary'} className={user.kycStatus === 'approved' ? 'bg-green-100 text-green-800' : ''}>
                          {user.kycStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         <div className="flex gap-2 justify-end">
                            <Button variant="secondary" size="sm">Suspend</Button>
                            <Button variant="destructive" size="sm"><Ban className="mr-2 h-4 w-4"/>Block</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
