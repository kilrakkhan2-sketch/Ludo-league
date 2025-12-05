
'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useUser, useDoc, useCollection } from '@/firebase';
import { useFirebase } from '@/firebase/provider';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, Match, Transaction } from '@/types';
import { Upload, Crown, Swords, Wallet, TrendingUp, Percent } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';

function ProfileLoadingSkeleton() {
    return (
        <div className="space-y-8">
            <Card className="text-center flex flex-col items-center p-8">
                <Skeleton className="h-24 w-24 rounded-full mb-4" />
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-56" />
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-32" />
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="p-4 rounded-lg bg-muted space-y-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                    ))}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-10 w-full max-w-sm" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const { firestore, storage } = useFirebase();
  const { toast } = useToast();
  
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');
  const { data: matches, loading: matchesLoading } = useCollection<Match>('matches', {
      where: ['players', 'array-contains', user?.uid || ''],
      orderBy: ['createdAt', 'desc'],
      limit: 50
  });
  const { data: transactions, loading: txLoading } = useCollection<Transaction>(
    user ? `users/${user.uid}/transactions` : '',
    {
      orderBy: ['createdAt', 'desc'],
      limit: 50
    }
  );

  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !firestore || !storage) return;

    setIsUploading(true);
    try {
      const filePath = `profile-pictures/${user.uid}/${file.name}`;
      const storageRef = ref(storage, filePath);
      
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, { photoURL });

      toast({ title: 'Avatar Updated!', description: 'Your new profile picture has been saved.' });
    } catch (error) {
      console.error("Avatar Upload Error:", error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload your avatar. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  const loading = userLoading || profileLoading || matchesLoading || txLoading;

  if (loading || !profile) {
      return <AppShell><ProfileLoadingSkeleton /></AppShell>
  }

  // Calculate stats
  const matchesPlayed = matches.length;
  const matchesWon = matches.filter(m => m.winnerId === user?.uid).length;
  const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;
  const totalWinnings = transactions
    .filter(t => t.type === 'match_winnings')
    .reduce((sum, t) => sum + t.amount, 0);


  return (
    <AppShell>
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Profile Header */}
            <Card className="text-center flex flex-col items-center p-8 bg-card/80 backdrop-blur-sm">
                <div className="relative group">
                    <Avatar className="w-24 h-24 text-6xl border-4 border-primary/50 shadow-lg">
                        <AvatarImage src={profile.photoURL || ''} alt={profile.displayName} />
                        <AvatarFallback>{profile.displayName?.[0] || user?.email?.[0]}</AvatarFallback>
                    </Avatar>
                    <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Upload className="w-8 h-8 text-white" />
                        <input id="avatar-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleAvatarUpload} disabled={isUploading}/>
                    </label>
                </div>
                <h1 className="text-3xl font-bold mt-4 font-headline">{profile.displayName}</h1>
                <p className="text-muted-foreground">{user?.email}</p>
                <div className="mt-4 text-2xl font-bold text-success flex items-center gap-2">
                    <Wallet className="w-7 h-7"/>
                    <span>₹{profile.balance?.toFixed(2) || '0.00'}</span>
                </div>
            </Card>

            {/* Stats Section */}
            <Card>
                <CardHeader>
                     <CardTitle>Your Stats</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground flex items-center gap-2"><Swords className='w-4 h-4'/> Matches Played</p><p className="text-2xl font-bold">{matchesPlayed}</p></div>
                    <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground flex items-center gap-2"><Crown className='w-4 h-4'/> Matches Won</p><p className="text-2xl font-bold">{matchesWon}</p></div>
                    <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground flex items-center gap-2"><Percent className='w-4 h-4'/> Win Rate</p><p className="text-2xl font-bold">{winRate}%</p></div>
                    <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className='w-4 h-4'/> Total Winnings</p><p className="text-2xl font-bold">₹{totalWinnings.toFixed(2)}</p></div>
                </CardContent>
            </Card>

            {/* History Section */}
            <Tabs defaultValue="matches">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="matches">Match History</TabsTrigger>
                    <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                </TabsList>
                <TabsContent value="matches">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Matches</CardTitle>
                            <CardDescription>Here are the last 50 matches you played.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {matches.length === 0 && <p className='text-muted-foreground text-center py-8'>No matches played yet.</p>}
                            {matches.map(match => (
                                <div key={match.id} className='flex items-center justify-between p-4 rounded-lg bg-muted/50'>
                                    <div>
                                        <p className='font-semibold'>{match.title}</p>
                                        <p className='text-sm text-muted-foreground'>
                                            {format(match.createdAt.toDate(), 'PPp')} ({formatDistanceToNow(match.createdAt.toDate(), { addSuffix: true })})
                                        </p>
                                    </div>
                                    <div className='text-right'>
                                         {match.winnerId === user?.uid ? (
                                            <p className='font-bold text-success'>WIN</p>
                                        ) : (
                                            <p className='font-bold text-destructive'>LOSS</p>
                                        )}
                                        <p className='text-sm text-muted-foreground'>Prize: ₹{match.prizePool}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="transactions">
                     <Card>
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                            <CardDescription>Here are your last 50 wallet transactions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {transactions.length === 0 && <p className='text-muted-foreground text-center py-8'>No transactions found.</p>}
                            {transactions.map(tx => (
                                <div key={tx.id} className='flex items-center justify-between p-4 rounded-lg bg-muted/50'>
                                    <div>
                                        <p className='font-semibold capitalize'>{tx.type.replace(/_/g, ' ')}</p>
                                        <p className='text-sm text-muted-foreground'>
                                           {format(tx.createdAt.toDate(), 'PPp')}
                                        </p>
                                    </div>
                                     <p className={`font-bold text-lg ${tx.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                                        {tx.amount > 0 ? '+' : ''}₹{tx.amount.toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    </AppShell>
  );
}
