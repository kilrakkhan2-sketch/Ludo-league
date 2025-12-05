
'use client';

import { doc, runTransaction, updateDoc, arrayUnion, Timestamp, collection } from 'firebase/firestore';
import { useDoc, useUser, useCollection, useFirebase } from '@/firebase';
import { Match, UserProfile } from '@/types';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Trophy, Swords, Calendar, Hourglass, ClipboardCopy, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const StatItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex flex-col items-center gap-1 p-2 border rounded-lg">
        <Icon className="h-6 w-6 text-muted-foreground" />
        <p className="font-semibold text-lg">{value}</p>
        <p className="text-xs text-muted-foreground uppercase">{label}</p>
    </div>
)

const MatchPageSkeleton = () => (
    <AppShell>
        <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                 <Card>
                    <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                         <div>
                            <Skeleton className="h-8 w-64 mb-2" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                        <div className="mt-4 sm:mt-0 flex items-center gap-4">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                         <div>
                            <Skeleton className="h-6 w-48 mb-4" />
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                               <Skeleton className="h-12 w-full" />
                               <Skeleton className="h-12 w-full" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                 <Card>
                    <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                    <CardContent><Skeleton className="h-40 w-full" /></CardContent>
                </Card>
            </div>
        </div>
    </AppShell>
)

export default function MatchPage({ params }: { params: { id: string } }) {
  const { user, loading: userLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const { data: match, loading: matchLoading, error } = useDoc<Match>(`matches/${params.id}`);
  const { data: players, loading: playersLoading } = useCollection<UserProfile>('users', {
    where: match ? ['uid', 'in', match.players] : undefined
  });

  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [resultScreenshot, setResultScreenshot] = useState<File | null>(null);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);

  const alreadyJoined = match?.players.includes(user?.uid || '') || false;
  const isFull = match ? match.players.length >= match.maxPlayers : false;
  const isCreator = match?.creatorId === user?.uid;
  const hasSubmittedResult = match?.results?.some(r => r.userId === user?.uid);

    const handleJoinMatch = async () => {
        if (!user || !profile || !firestore || !match) return;
        setIsJoining(true);
        try {
            await runTransaction(firestore, async (transaction) => {
                const userRef = doc(firestore, 'users', user.uid);
                const matchRef = doc(firestore, 'matches', match.id);

                const userDoc = await transaction.get(userRef);
                const matchDoc = await transaction.get(matchRef);

                if (!userDoc.exists() || !matchDoc.exists()) throw new Error("User or match not found");
                
                const currentMatch = matchDoc.data() as Match;
                if (currentMatch.players.length >= currentMatch.maxPlayers) throw new Error("Match is already full");
                if ((userDoc.data().walletBalance || 0) < currentMatch.entryFee) throw new Error("Insufficient balance");

                const newBalance = userDoc.data().walletBalance - currentMatch.entryFee;
                transaction.update(userRef, { walletBalance: newBalance });

                const newPrizePool = (currentMatch.prizePool || 0) + (currentMatch.entryFee * 0.9);
                transaction.update(matchRef, { 
                    players: arrayUnion(user.uid),
                    prizePool: newPrizePool
                });

                const txRef = doc(collection(firestore, `users/${user.uid}/transactions`));
                const txData = {
                    matchId: match.id,
                    amount: -currentMatch.entryFee,
                    type: 'entry_fee',
                    description: `Entry fee for "${currentMatch.title}"`,
                    createdAt: Timestamp.now(),
                    userName: user.displayName,
                    userEmail: user.email
                };
                transaction.set(txRef, txData);
            });
            toast({ title: 'Successfully Joined!', description: `You have joined the match "${match.title}".` });
        } catch (error: any) {
            console.error("Join match error:", error);
            toast({ variant: 'destructive', title: 'Could Not Join', description: error.message });
        }
        setIsJoining(false);
    }

  const handleStartMatch = async () => {
    if (!firestore || !match || !isCreator) return;
    setIsStarting(true);
    try {
        const matchRef = doc(firestore, 'matches', match.id);
        await updateDoc(matchRef, { status: 'ongoing' });
        toast({ title: 'Match Started!', description: 'The match is now live. Good luck!' });
    } catch (error) {
        console.error("Start match error:", error);
        toast({ variant: 'destructive', title: 'Start Failed', description: 'Could not start the match.' });
    }
    setIsStarting(false);
  }
  
  const handleResultSubmit = async () => {
    if (!user || !firestore || !match || !resultScreenshot) return;
    setIsSubmittingResult(true);
    try {
        const storage = getStorage();
        const screenshotRef = ref(storage, `match-results/${match.id}/${user.uid}_${resultScreenshot.name}`);
        await uploadBytes(screenshotRef, resultScreenshot);
        const screenshotUrl = await getDownloadURL(screenshotRef);

        const matchRef = doc(firestore, 'matches', match.id);
        const resultData = {
            userId: user.uid,
            screenshotUrl,
            submittedAt: Timestamp.now(),
        };

        await updateDoc(matchRef, {
            results: arrayUnion(resultData),
            status: 'verification'
        });

        toast({ title: 'Result Submitted', description: 'Your result is awaiting verification.' });
    } catch (error) {
        console.error("Result submission error:", error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your result.' });
    }
    setIsSubmittingResult(false);
  };

  const copyRoomCode = () => {
    if (!match?.ludoKingCode) return;
    navigator.clipboard.writeText(match.ludoKingCode);
    toast({ title: 'Room Code Copied!' });
  }

  if (matchLoading || playersLoading || userLoading || profileLoading) {
    return <MatchPageSkeleton />;
  }

  if (!match) {
    return <AppShell><div className="text-center p-8">Match not found.</div></AppShell>;
  }

  const creatorProfile = players.find((p: UserProfile) => p.id === match.creatorId);
  const createdAtTime = match.createdAt ? (match.createdAt as Timestamp).toDate() : new Date();

  return (
    <AppShell>
        <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <CardTitle className="text-3xl font-headline">{match.title}</CardTitle>
                            <CardDescription>Created by {creatorProfile?.displayName || '...'}</CardDescription>
                        </div>
                        <div className="mt-4 sm:mt-0 flex items-center gap-4">
                           <Badge variant={match.status === 'open' ? 'secondary' : match.status === 'ongoing' ? 'default' : 'destructive'} className="capitalize">{match.status}</Badge>
                           <div className="flex items-center gap-1.5">
                                <Trophy className="h-6 w-6 text-yellow-500" />
                                <p className="text-2xl font-bold">₹{match.prizePool?.toLocaleString() || '0'}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                           <StatItem icon={Trophy} label="Entry Fee" value={`₹${match.entryFee}`} />
                           <StatItem icon={Users} label="Max Players" value={`${match.maxPlayers}`} />
                           <StatItem icon={Calendar} label="Created" value={formatDistanceToNow(createdAtTime, { addSuffix: true })} />
                           <StatItem icon={Hourglass} label="Status" value={match.status} />
                        </div>
                        
                        {match.status === 'open' && (
                             <div className="bg-muted/50 border rounded-lg p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-lg">Ludo King Room Code</p>
                                    <p className="text-2xl font-mono tracking-widest">{match.ludoKingCode}</p>
                                </div>
                                <Button variant="outline" size="icon" onClick={copyRoomCode}><ClipboardCopy className="h-4 w-4" /></Button>
                             </div>
                        )}

                        <div>
                            <h3 className="font-bold mb-4">Players ({match.players.length}/{match.maxPlayers})</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {players.map((p: UserProfile) => (
                                    <div key={p.id} className="flex items-center gap-3 p-2 border rounded-lg bg-background">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={p.photoURL || undefined} />
                                            <AvatarFallback>{p.displayName?.[0] || 'P'}</AvatarFallback>
                                        </Avatar>
                                        <p className="font-medium truncate">{p.displayName}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
                        {match.status === 'open' && !alreadyJoined && !isFull && (
                            <Button onClick={handleJoinMatch} disabled={isJoining || (profile?.walletBalance || 0) < match.entryFee}>
                                {isJoining ? 'Joining...' : `Join for ₹${match.entryFee}`}
                            </Button>
                        )}
                        {match.status === 'open' && isCreator && match.players.length >= 2 && (
                            <Button onClick={handleStartMatch} disabled={isStarting}>
                                <Swords className="h-4 w-4 mr-2" />
                                {isStarting ? 'Starting...' : 'Start Match'}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
                 {match.status === 'ongoing' && alreadyJoined && !hasSubmittedResult && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Submit Match Result</CardTitle>
                            <CardDescription>Upload a screenshot of the final scoreboard from Ludo King. Please be honest!</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <Input id="result-screenshot" type="file" onChange={(e) => setResultScreenshot(e.target.files ? e.target.files[0] : null)} accept="image/*" />
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleResultSubmit} disabled={isSubmittingResult || !resultScreenshot}>
                                 <Upload className="h-4 w-4 mr-2" />
                                {isSubmittingResult ? 'Submitting...' : 'Submit Result'}
                            </Button>
                        </CardFooter>
                    </Card>
                )}
                 {hasSubmittedResult && (
                     <div className="p-4 text-center bg-green-100 text-green-800 rounded-lg">
                         <p>You have submitted your result. Please wait for the admin to verify it.</p>
                     </div>
                 )}
                 {match.status === 'verification' && (
                     <div className="p-4 text-center bg-yellow-100 text-yellow-800 rounded-lg">
                         <p>Results are under verification by the admin.</p>
                     </div>
                 )}
                  {match.status === 'completed' && (
                     <div className="p-4 text-center bg-blue-100 text-blue-800 rounded-lg">
                         <p>This match is complete. The winner has been declared.</p>
                     </div>
                 )}
            </div>

            <div className="lg:col-span-1">
                {alreadyJoined ? (
                    <ChatRoom matchId={params.id} />
                ) : (
                    <div className="border rounded-lg p-8 text-center bg-card">
                        <h3 className="font-bold text-lg">Join the Match to Chat</h3>
                        <p className="text-muted-foreground">The match chat is only available to players who have joined.</p>
                    </div>
                )}
            </div>
        </div>
    </AppShell>
  );
}
