
'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useUser, useDoc, useCollection } from '@/firebase';
import { useFirebase } from '@/firebase/provider';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, Transaction, PersonalNotification } from '@/types';
import { Upload, Crown, Swords, Wallet, TrendingUp, Percent, LogOut, Settings as SettingsIcon, Bell } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import { getAuth, signOut, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function ProfileLoadingSkeleton() {
    return (
        <div className="p-4 space-y-6">
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
  const router = useRouter();
  
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');
  const { data: transactions, loading: txLoading } = useCollection<Transaction>(
    user ? `users/${user.uid}/transactions` : '',
    {
      orderBy: ['createdAt', 'desc'],
      limit: 50
    }
  );
  
   const { data: notifications, loading: notificationsLoading } = useCollection<PersonalNotification>(
    user ? `users/${user.uid}/personal_notifications` : '',
    {
      orderBy: ['createdAt', 'desc'],
      limit: 50
    }
  );

  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const auth = getAuth();
    if (!file || !user || !firestore || !storage || !auth.currentUser) return;

    setIsUploading(true);
    try {
      const filePath = `profile-pictures/${user.uid}/${file.name}`;
      const storageRef = ref(storage, filePath);
      
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      // Update Firebase Auth user profile
      await updateProfile(auth.currentUser, { photoURL });
      
      // Update Firestore user document
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
  
  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push('/login');
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
      });
    }
  };


  const loading = userLoading || profileLoading || txLoading || notificationsLoading;

  if (loading || !profile) {
      return <AppShell pageTitle="My Profile"><ProfileLoadingSkeleton /></AppShell>
  }

  // Calculate stats
  const matchesPlayed = profile.matchesPlayed || 0;
  const matchesWon = profile.matchesWon || 0;
  const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;
  const totalWinnings = transactions
    .filter((t: Transaction) => t.type === 'prize' || t.type === 'win')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    
  const hasUnreadNotifications = notifications.some(n => !n.isRead);


  return (
    <AppShell pageTitle="My Profile">
        <div className="p-4 space-y-6 pb-20">
            {/* Profile Header */}
            <Card className="text-center flex flex-col items-center p-6 bg-card">
                <div className="relative group">
                    <Avatar className="w-24 h-24 text-6xl border-4 border-primary/50 shadow-lg">
                        <AvatarImage src={profile.photoURL || ''} alt={profile.displayName} />
                        <AvatarFallback>{profile.displayName?.[0] || user?.email?.[0]}</AvatarFallback>
                    </Avatar>
                    <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {isUploading ? <div className="w-6 h-6 border-2 border-white rounded-full animate-spin border-t-transparent" /> : <Upload className="w-8 h-8 text-white" />}
                        <input id="avatar-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleAvatarUpload} disabled={isUploading}/>
                    </label>
                </div>
                <h1 className="text-2xl font-bold mt-4 font-headline">{profile.displayName}</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                 <div className="mt-4 flex gap-2">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/settings"><SettingsIcon className='mr-2 h-4 w-4' /> Edit Profile</Link>
                    </Button>
                    <Button onClick={handleLogout} variant="destructive" size="sm">
                        <LogOut className="mr-2 h-4 w-4"/>
                        Logout
                    </Button>
                 </div>
            </Card>
            
            <Card>
                <CardContent className="p-2 grid grid-cols-2 gap-2">
                    <Link href="/refer" className="p-3 bg-muted rounded-lg hover:bg-primary/10 transition-colors">
                        <p className="font-bold">Refer & Earn</p>
                        <p className="text-xs text-muted-foreground">Invite friends and win rewards</p>
                    </Link>
                    <Link href="/kyc" className="p-3 bg-muted rounded-lg hover:bg-primary/10 transition-colors">
                        <p className="font-bold">KYC Verification</p>
                         <p className={`text-xs font-semibold ${profile.isVerified ? 'text-success' : 'text-destructive'}`}>{profile.isVerified ? 'Completed' : 'Pending'}</p>
                    </Link>
                </CardContent>
            </Card>


            {/* Stats Section */}
            <Card>
                <CardHeader>
                     <CardTitle>Your Stats</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground flex items-center gap-2"><Swords className='w-4 h-4'/> Played</p><p className="text-2xl font-bold">{matchesPlayed}</p></div>
                    <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground flex items-center gap-2"><Crown className='w-4 h-4'/> Won</p><p className="text-2xl font-bold">{matchesWon}</p></div>
                    <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground flex items-center gap-2"><Percent className='w-4 h-4'/> Win Rate</p><p className="text-2xl font-bold">{winRate}%</p></div>
                    <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className='w-4 h-4'/> Winnings</p><p className="text-2xl font-bold">₹{totalWinnings.toFixed(0)}</p></div>
                </CardContent>
            </Card>

            {/* History Section */}
            <Tabs defaultValue="transactions">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="transactions">Wallet History</TabsTrigger>
                    <TabsTrigger value="notifications">
                        <div className="relative">
                            Notifications
                            {hasUnreadNotifications && <span className="absolute -top-1 -right-3 h-2 w-2 rounded-full bg-primary" />}
                        </div>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="transactions">
                     <Card>
                        <CardContent className="p-4 space-y-2">
                            {transactions.length === 0 && <p className='text-muted-foreground text-center py-8'>No transactions found.</p>}
                            {transactions.slice(0,5).map((tx: Transaction) => (
                                <div key={tx.id} className='flex items-center justify-between p-3 rounded-lg bg-muted/50'>
                                    <div>
                                        <p className='font-semibold capitalize'>{tx.description || tx.type.replace(/_/g, ' ')}</p>
                                        <p className='text-sm text-muted-foreground'>
                                           {tx.createdAt && tx.createdAt.toDate ? format(tx.createdAt.toDate(), 'PP') : 'N/A'}
                                        </p>
                                    </div>
                                     <p className={`font-bold text-lg ${tx.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                                        {tx.amount > 0 ? '+' : ''}₹{tx.amount.toFixed(0)}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="notifications">
                     <Card>
                        <CardContent className="p-4 space-y-2">
                            {notifications.length === 0 && <p className='text-muted-foreground text-center py-8'>No notifications found.</p>}
                            {notifications.slice(0,10).map((n: PersonalNotification) => (
                                <div key={n.id} className='flex items-start gap-3 p-3 rounded-lg bg-muted/50'>
                                     {!n.isRead && <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />}
                                     <div className={n.isRead ? 'pl-4' : ''}>
                                        <p className='font-semibold'>{n.title}</p>
                                        <p className='text-sm text-muted-foreground'>{n.body}</p>
                                        <p className='text-xs text-muted-foreground mt-1'>
                                           {n.createdAt && n.createdAt.toDate ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : 'N/A'}
                                        </p>
                                    </div>
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
