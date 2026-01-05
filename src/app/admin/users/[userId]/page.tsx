
'use client';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  orderBy,
} from 'firebase/firestore';
import { useParams } from 'next/navigation';
import type { UserProfile, Transaction } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UserHistoryPage() {
  const firestore = useFirestore();
  const params = useParams();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !userId) return;

    const fetchUserData = async () => {
      setLoading(true);
      // Fetch user profile
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUser({ uid: userSnap.id, ...userSnap.data() } as UserProfile);
      } else {
        console.error('User not found');
      }

      // Fetch user transactions
      const transQuery = query(
        collection(firestore, 'transactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(transQuery, (snapshot) => {
        const transData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Transaction)
        );
        setTransactions(transData);
        setLoading(false);
      }, (error) => {
          console.error("Error fetching transactions: ", error);
          setLoading(false);
      });

      return () => unsubscribe();
    };

    fetchUserData();
  }, [firestore, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <p>User not found.</p>;
  }

  return (
    <>
        <div className="mb-4">
            <Button asChild variant="outline" size="sm">
                <Link href="/admin/users">
                    <ArrowLeft className="h-4 w-4 mr-2"/>
                    Back to All Users
                </Link>
            </Button>
        </div>
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16 border">
                <AvatarImage src={user.photoURL} />
                <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-2xl">{user.displayName}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Wallet Balance</p>
                    <p className="text-xl font-bold">₹{user.walletBalance?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">KYC Status</p>
                     <Badge
                        variant={user.kycStatus === 'approved' ? 'default' : 'secondary'}
                        className={user.kycStatus === 'approved' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {user.kycStatus}
                      </Badge>
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Status</p>
                    {(user as any).isBlocked ? (
                        <Badge variant="destructive">Banned</Badge>
                       ) : (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                       )}
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>A complete log of all financial activities for this user.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No transactions found for this user.
                    </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.createdAt?.toDate().toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                    <TableCell className={`font-medium ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{t.amount.toFixed(2)}
                    </TableCell>
                    <TableCell><Badge>{t.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.description}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
