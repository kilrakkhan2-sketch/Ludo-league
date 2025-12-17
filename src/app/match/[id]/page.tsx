
'use client';

import { doc, runTransaction, updateDoc, arrayUnion, Timestamp, collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { useDoc, useUser, useCollection, useFirebase } from '@/firebase';
import { Match, UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Trophy, Swords, Calendar, Hourglass, ClipboardCopy, Upload, Crown, ArrowLeft, CheckCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { useState, useMemo, useEffect } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const MatchPageHeader = ({ title, showBackButton = true }: { title: string, showBackButton?: boolean }) => {
    const router = useRouter();
    return (
        <div className="bg-primary text-primary-foreground p-4 flex items-center gap-4 sticky top-0 z-10 shadow-md">
            {showBackButton && (
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
            )}
            <h1 className="text-xl font-bold">{title}</h1>
        </div>
    );
};

const MatchPageSkeleton = () => (
     <>
        <MatchPageHeader title="Loading Match..." />
        <div className="p-4 space-y-4">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    </>
)

const PlayerListLobby = ({ match, players }: { match: Match, players: UserProfile[] }) => {
    const emptySlots = Array.from({ length: Math.max(0, match.maxPlayers - players.length) });

    return (
        <Card className="bg-transparent shadow-none border-0">
            <CardHeader className="text-center">
                <CardDescription>Players</CardDescription>
                <CardTitle className="text-2xl">{players.length} / {match.maxPlayers}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {players.map(p => (
                     <div key={p.id} className="flex items-center justify-between p-3 bg-card border-2 border-green-500 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={p.photoURL || undefined} />
                                <AvatarFallback>{p.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{p.displayName}</p>
                                <p className="text-xs text-muted-foreground">{p.uid === match.creatorId ? 'Creator - Ready' : 'Ready'}</p>
                            </div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                ))}
                 {emptySlots.map((_, index) => (
                     <div key={`empty-${index}`} className="flex items-center p-3 bg-card border border-dashed rounded-lg">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarFallback>?</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-muted-foreground">Waiting for player...</p>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};


const MatchOpen = ({ match, profile, players }: { match: Match, profile: UserProfile, players: UserProfile[] }) => {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isJoining, setIsJoining] = useState(false);

    const alreadyJoined = match.players.includes(user?.uid || '');
    const isFull = match.players.length >= match.maxPlayers;
    const isCreator = match.creatorId === user?.uid;
    
    const handleJoinMatch = async () => {
        if (!user || !profile || !firestore) return;
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
                
                const newPrizePool = currentMatch.entryFee * (currentMatch.players.length + 1) * 0.9;
                transaction.update(matchRef, { players: arrayUnion(user.uid), prizePool: newPrizePool });

                const txRef = doc(collection(firestore, `users/${user.uid}/transactions`));
                transaction.set(txRef, {
                    matchId: match.id,
                    amount: -currentMatch.entryFee,
                    type: 'entry_fee',
                    description: `Entry fee for "${currentMatch.title}"`,
                    createdAt: Timestamp.now(),
                    status: 'completed',
                });
            });
            toast({ title: 'Successfully Joined!', description: `You are now in the match "${match.title}".` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Could Not Join', description: error.message });
        }
        setIsJoining(false);
    };

    return (
        <div className="flex flex-col flex-grow">
            <main className="flex-grow p-4 space-y-4">
                <PlayerListLobby match={match} players={players} />
            </main>
            <footer className="p-4 sticky bottom-0 bg-background border-t space-y-2">
                 {!alreadyJoined && !isFull && (
                    <Button className="w-full text-lg py-6 bg-gradient-to-r from-primary to-purple-600" onClick={handleJoinMatch} disabled={isJoining || (profile?.walletBalance || 0) < match.entryFee}>
                        {isJoining ? 'Joining...' : `Join for ₹${match.entryFee}`}
                    </Button>
                )}
                 {isCreator && match.players.length < match.maxPlayers &&
                    <div className='text-center p-4 bg-muted rounded-lg'>
                        <p className='font-bold'>Waiting for players...</p>
                        <p className='text-sm text-muted-foreground'>The match will begin once all slots are filled.</p>
                    </div>
                }
                 <Button variant="outline" className="w-full text-lg py-6">
                    Invite Friends
                </Button>
            </footer>
        </div>
    );
};


const MatchJoined = ({ match, players }: { match: Match, players: UserProfile[] }) => {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [roomCode, setRoomCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isCreator = match.creatorId === user?.uid;

    const handleRoomCodeSubmit = async () => {
        if (!firestore || !isCreator || !roomCode) return;
        setIsSubmitting(true);
        try {
            const matchRef = doc(firestore, 'matches', match.id);
            await updateDoc(matchRef, { ludoKingCode: roomCode, status: 'ongoing' });
            toast({ title: 'Room Code Shared!', description: 'The match is now ready to start.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not share the room code.' });
        }
        setIsSubmitting(false);
    };

    return (
        <div className="flex flex-col flex-grow">
            <main className="flex-grow p-4 space-y-4">
                <PlayerListLobby match={match} players={players} />
                 {isCreator ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Enter Room Code</CardTitle>
                            <CardDescription>Another player has joined. Please enter the Ludo King room code to start the match.</CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-2'>
                             <Label htmlFor="room-code">Ludo King Room Code</Label>
                             <Input id="room-code" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} placeholder="e.g., 12345678" />
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={handleRoomCodeSubmit} disabled={isSubmitting || !roomCode}>
                                {isSubmitting ? 'Sharing...' : 'Share Code & Start'}
                            </Button>
                        </CardFooter>
                    </Card>
                 ) : (
                    <div className='text-center p-8 bg-card rounded-lg'>
                        <p className='font-bold text-lg'>Waiting for Room Code</p>
                        <p className='text-sm text-muted-foreground'>The match creator is setting up the room. The code will appear here shortly.</p>
                    </div>
                 )}
            </main>
        </div>
    );
};


const MatchOngoing = ({ match }: { match: Match }) => {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [resultStatus, setResultStatus] = useState<'won' | 'lost' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const hasSubmitted = match.results?.some(r => r.userId === user?.uid);

     const copyRoomCode = () => {
        if (!match.ludoKingCode) return;
        navigator.clipboard.writeText(match.ludoKingCode);
        toast({ title: 'Room Code Copied!' });
    };

    const handleResultSubmit = async () => {
        if (!user || !firestore || !screenshot || !resultStatus) {
             toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select your status and upload a screenshot.' });
             return;
        }
        setIsSubmitting(true);
        try {
            const storage = getStorage();
            const screenshotRef = ref(storage, `match-results/${match.id}/${user.uid}_${screenshot.name}`);
            await uploadBytes(screenshotRef, screenshot);
            const screenshotUrl = await getDownloadURL(screenshotRef);

            const matchRef = doc(firestore, 'matches', match.id);
            const resultData = { 
                userId: user.uid, 
                screenshotUrl, 
                status: resultStatus,
                submittedAt: Timestamp.now() 
            };
            
            // Atomically update the match document
            await updateDoc(matchRef, { 
                results: arrayUnion(resultData),
                status: 'verification' 
            });

            toast({ title: 'Result Submitted', description: 'Your result is now awaiting verification from the admin.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your result.' });
        }
        setIsSubmitting(false);
    };

    if (hasSubmitted) {
        return (
             <div className="p-8 text-center space-y-4">
                 <Card className="bg-green-100 text-green-900">
                    <CardHeader>
                        <CardTitle>Result Submitted</CardTitle>
                        <CardDescription className="text-green-800">You have successfully submitted your result. The match admin will verify it shortly. You can now leave this page.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <Card>
                <CardContent className="p-6 text-center space-y-4">
                     <p className="text-sm text-muted-foreground">Ludo King Room Code</p>
                     <div className="flex items-center justify-center gap-4">
                        <p className="text-3xl font-mono tracking-widest">{match.ludoKingCode}</p>
                        <Button variant="ghost" size="icon" onClick={copyRoomCode}><ClipboardCopy /></Button>
                     </div>
                     <p className='text-sm text-muted-foreground max-w-xs mx-auto'>
                         Use this code to join the private room in Ludo King. The game is now ongoing.
                     </p>
                </CardContent>
            </Card>

            <Card className="bg-card">
                <CardHeader>
                    <CardTitle>Submit Your Result</CardTitle>
                    <CardDescription>The match is complete. Please select your status and upload a screenshot of the victory/loss screen.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label className='font-semibold'>1. Select your final status</Label>
                        <RadioGroup onValueChange={(val: 'won' | 'lost') => setResultStatus(val)} className='mt-2 grid grid-cols-2 gap-4'>
                            <div>
                                <RadioGroupItem value="won" id="r-won" className='sr-only' />
                                <Label htmlFor='r-won' className='flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 font-bold text-2xl hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground [&:has([data-state=checked])]:border-primary'>
                                    I WON
                                </Label>
                            </div>
                             <div>
                                <RadioGroupItem value="lost" id="r-lost" className='sr-only' />
                                <Label htmlFor='r-lost' className='flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 font-bold text-2xl hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-destructive peer-data-[state=checked]:bg-destructive peer-data-[state=checked]:text-destructive-foreground [&:has([data-state=checked])]:border-destructive'>
                                    I LOST
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                     <div>
                        <Label className='font-semibold'>2. Upload winning screenshot</Label>
                        <label htmlFor="screenshot-upload" className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                {screenshot ? (
                                    <p className="font-semibold text-primary">{screenshot.name}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                                )}
                            </div>
                            <Input id="screenshot-upload" type="file" className="hidden" onChange={(e) => setScreenshot(e.target.files ? e.target.files[0] : null)} accept="image/*" />
                        </label>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full bg-gradient-to-r from-primary to-purple-600" onClick={handleResultSubmit} disabled={isSubmitting || !screenshot || !resultStatus}>
                        {isSubmitting ? 'Uploading...' : 'Submit Result for Verification'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};


const MatchVerification = () => {
    return (
         <div className="p-8 text-center space-y-4">
             <Card className="bg-blue-100 text-blue-900">
                <CardHeader>
                    <CardTitle>Result Pending Verification</CardTitle>
                    <CardDescription className="text-blue-800">Your submitted result is awaiting verification from the admin. You will be notified once the prize money is distributed.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
};


const MatchCompleted = ({ match, players }: { match: Match, players: UserProfile[] }) => {
    const { width, height } = useWindowSize();
    const winner = players.find(p => p.id === match.winnerId);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    return (
         <div className="p-4 space-y-4">
            {isClient && winner && <Confetti width={width} height={height} recycle={false} />}
            <Card className="text-center bg-gradient-to-b from-primary to-purple-800 text-primary-foreground">
                <CardHeader>
                    <CardTitle className="text-2xl">Congratulations, {winner?.displayName || 'Winner'}!</CardTitle>
                    <CardDescription className="text-primary-foreground/80">The match is complete and prizes have been distributed.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <p className="text-sm">You won</p>
                    <p className="text-4xl font-bold">₹{match.prizePool?.toLocaleString()}</p>
                </CardContent>
            </Card>
            <div className="flex justify-center">
                <Button asChild>
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
         </div>
    )
};


export default function MatchPage({ params }: { params: { id: string } }) {
  const { user, loading: userLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');
  const { firestore } = useFirebase();

  const { data: match, loading: matchLoading } = useDoc<Match>(`matches/${params.id}`);
  
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);

  useEffect(() => {
    if (match?.players && match.players.length > 0 && firestore) {
      const fetchPlayers = async () => {
        setPlayersLoading(true);
        const playersRef = collection(firestore, 'users');
        const q = query(playersRef, where('uid', 'in', match.players));
        const snapshot = await getDocs(q);
        const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        setPlayers(playersData);
        setPlayersLoading(false);
      };
      fetchPlayers();
    } else if (match) { // If match exists but has no players or an empty player array
        setPlayers([]);
        setPlayersLoading(false);
    }
  }, [match, firestore]);

  const loading = matchLoading || playersLoading || userLoading || profileLoading;

  const renderContent = () => {
    if (loading || !match || !profile) {
      return <MatchPageSkeleton />;
    }

    let title;
    let content;

    const isFull = match.players.length >= match.maxPlayers;

    if (match.status === 'completed') {
        title = 'Match Completed';
        content = <MatchCompleted match={match} players={players} />;
    } else if (match.status === 'verification') {
        title = 'Awaiting Verification';
        content = <MatchVerification />;
    } else if (match.status === 'ongoing') {
        title = 'Game in Progress';
        content = <MatchOngoing match={match} />;
    } else if (match.status === 'open') {
        if (isFull) {
            title = 'Ready to Start';
            content = <MatchJoined match={match} players={players} />;
        } else {
            title = 'Waiting for Players';
            content = <MatchOpen match={match} profile={profile} players={players} />;
        }
    } else {
        title = 'Match Status Unknown';
        content = <div className="p-8 text-center">Could not determine match status.</div>;
    }
    
    return (
        <div className="flex flex-col min-h-screen">
            <MatchPageHeader title={title} />
            {content}
        </div>
    );
  };
  
  return <div className="bg-muted/30">{renderContent()}</div>;
}
