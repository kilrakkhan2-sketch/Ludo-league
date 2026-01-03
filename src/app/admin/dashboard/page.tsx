'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ban, Eye, ShieldCheck, ThumbsDown, Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  collectionGroup,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { UserProfile, MatchResult, Match } from '@/lib/types';
import Link from 'next/link';

type FraudAlert = MatchResult & {
  matchId: string;
};

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const [suspiciousUsers, setSuspiciousUsers] = useState<UserProfile[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    // Fetch suspicious users (e.g., win rate > 80%)
    setLoadingUsers(true);
    const usersRef = collection(firestore, 'users');
    const suspiciousQuery = query(
      usersRef,
      where('winRate', '>=', 80),
      limit(20)
    );
    const unsubscribeUsers = onSnapshot(suspiciousQuery, (snapshot) => {
      setSuspiciousUsers(
        snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as UserProfile))
      );
      setLoadingUsers(false);
    });

    // Fetch fraud alerts using a collectionGroup query
    setLoadingAlerts(true);
    const resultsRef = collectionGroup(firestore, 'results');
    const fraudQuery = query(resultsRef, where('isFlaggedForFraud', '==', true), limit(20));
    const unsubscribeAlerts = onSnapshot(fraudQuery, (snapshot) => {
        const alerts = snapshot.docs.map(doc => {
            const matchId = doc.ref.parent.parent?.id || 'unknown';
            return {
                id: doc.id,
                matchId: matchId,
                ...doc.data()
            } as FraudAlert;
        });
        setFraudAlerts(alerts);
        setLoadingAlerts(false);
    }, (error) => {
        console.error("Error fetching fraud alerts: ", error);
        setLoadingAlerts(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeAlerts();
    };
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
                Submissions automatically flagged by the system for review (e.g.
                duplicate screenshots).
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
                  {loadingAlerts && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  )}
                  {!loadingAlerts && fraudAlerts.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No fraud alerts to show.
                      </TableCell>
                    </TableRow>
                  )}
                  {!loadingAlerts &&
                    fraudAlerts.map((alert) => (
                      <TableRow key={`${alert.matchId}-${alert.id}`}>
                        <TableCell className="font-medium">
                          {alert.userName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">Duplicate Screenshot</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {alert.matchId}
                        </TableCell>
                        <TableCell>
                          {alert.submittedAt?.toDate().toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/matches?matchId=${alert.matchId}`}>
                                <Eye className="mr-2 h-4 w-4" /> Review
                            </Link>
                          </Button>
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
                  {loadingUsers && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  )}
                  {!loadingUsers && suspiciousUsers.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No suspicious users found.
                      </TableCell>
                    </TableRow>
                  )}
                  {!loadingUsers &&
                    suspiciousUsers.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell className="font-medium">
                          {user.displayName}
                        </TableCell>
                        <TableCell>{user.winRate}%</TableCell>
                        <TableCell>₹{user.winnings || 0}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.kycStatus === 'approved'
                                ? 'default'
                                : 'secondary'
                            }
                            className={
                              user.kycStatus === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : ''
                            }
                          >
                            {user.kycStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="secondary" size="sm">
                              Suspend
                            </Button>
                            <Button variant="destructive" size="sm">
                              <Ban className="mr-2 h-4 w-4" />
                              Block
                            </Button>
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
  );
}
