
'use client';

import { doc, runTransaction, updateDoc, arrayUnion, Timestamp, collection } from 'firebase/firestore';
import { useDoc, useUser, useCollection, useFirebase } from '@/firebase';
import { Match, UserProfile } from '@/types';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Trophy, Swords, Calendar, Hourglass, ClipboardCopy, Upload, Crown, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

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


const StatItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex flex-col items-center gap-1 p-2 border rounded-lg bg-card text-card-foreground">
        <Icon className="h-6 w-6 text-muted-foreground" />
        <p className="font-semibold text-lg">{value}</p>
        <p className="text-xs text-muted-foreground uppercase">{label}</p>
    </div>
)

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

const PlayerList = ({ players }: { players: UserProfile[] }) => (
    <Card>
        <CardHeader>
            <CardTitle>Players ({players.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            {players.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={p.photoURL || undefined} />
                            <AvatarFallback>{p.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{p.displayName}</p>
                            <p className="text-xs text-muted-foreground">Rating: {p.rating || 1000}</p>
                        </div>
                    </div>
                    {/* Add ready status if needed */}
                </div>
            ))}
        </CardContent>
    </Card>
);

const MatchOpen = ({ match, profile, players }: { match: Match, profile: UserProfile, players: UserProfile[] }) => {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isJoining, setIsJoining] = useState(false);
    const [isStarting, setIsStarting] = useState(false);

    const alreadyJoined = match.players.includes(user?.uid || '');
    const isFull = match.players.length >= match.maxPlayers;
    const isCreator = match.creatorId === user?.uid;
    const canStart = isCreator && match.players.length >= 2;

    const copyRoomCode = () => {
        if (!match.ludoKingCode) return;
        navigator.clipboard.writeText(match.ludoKingCode);
        toast({ title: 'Room Code Copied!' });
    };

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

                const newPrizePool = (currentMatch.prizePool || 0) + (currentMatch.entryFee * 0.9);
                transaction.update(matchRef, { players: arrayUnion(user.uid), prizePool: newPrizePool });

                const txRef = doc(collection(firestore, `users/${user.uid}/transactions`));
                transaction.set(txRef, {
                    matchId: match.id,
                    amount: -currentMatch.entryFee,
                    type: 'entry_fee',
                    description: `Entry fee for "${currentMatch.title}"`,
                    createdAt: Timestamp.now(),
                });
            });
            toast({ title: 'Successfully Joined!', description: `You are now in the match "${match.title}".` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Could Not Join', description: error.message });
        }
        setIsJoining(false);
    };

    const handleStartMatch = async () => {
        if (!firestore || !isCreator) return;
        setIsStarting(true);
        try {
            const matchRef = doc(firestore, 'matches', match.id);
            await updateDoc(matchRef, { status: 'ongoing' });
            toast({ title: 'Match Started!', description: 'Good luck to all players!' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Start Failed', description: 'Could not start the match.' });
        }
        setIsStarting(false);
    };

    return (
        <div className="p-4 space-y-4">
            <Card>
                 <CardHeader>
                    <CardTitle className="text-2xl">{match.title}</CardTitle>
                    <CardDescription>The match is waiting for players to join.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <StatItem icon={Trophy} label="Prize Pool" value={`₹${match.prizePool?.toLocaleString() || '0'}`} />
                    <StatItem icon={Users} label="Players" value={`${match.players.length}/${match.maxPlayers}`} />
                    <StatItem icon={Trophy} label="Entry Fee" value={`₹${match.entryFee}`} />
                    <StatItem icon={Calendar} label="Created" value={formatDistanceToNow(match.createdAt.toDate(), { addSuffix: true })} />
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    {!alreadyJoined && !isFull && (
                        <Button className="w-full" onClick={handleJoinMatch} disabled={isJoining || (profile?.walletBalance || 0) < match.entryFee}>
                            {isJoining ? 'Joining...' : `Join for ₹${match.entryFee}`}
                        </Button>
                    )}
                    {alreadyJoined && (
                        <div className="text-center p-3 bg-green-100 text-green-800 rounded-md w-full">You have joined this match.</div>
                    )}
                    {canStart && (
                        <Button className="w-full" onClick={handleStartMatch} disabled={isStarting}>
                            <Swords className="mr-2 h-4 w-4" />
                            {isStarting ? 'Starting...' : 'Start Match Now'}
                        </Button>
                    )}
                </CardFooter>
            </Card>

            <PlayerList players={players} />

            {alreadyJoined && <ChatRoom matchId={match.id} />}
        </div>
    );
};

const MatchOngoing = ({ match, players }: { match: Match, players: UserProfile[] }) => {
    const { toast } = useToast();
    const copyRoomCode = () => {
        if (!match.ludoKingCode) return;
        navigator.clipboard.writeText(match.ludoKingCode);
        toast({ title: 'Room Code Copied!' });
    };
    
    return (
        <div className="p-4 space-y-4">
            <Card>
                <CardContent className="p-6 text-center space-y-4">
                     <p className="text-sm text-muted-foreground">Room Code</p>
                     <div className="flex items-center justify-center gap-4">
                        <p className="text-3xl font-mono tracking-widest">{match.ludoKingCode}</p>
                        <Button variant="ghost" size="icon" onClick={copyRoomCode}><ClipboardCopy /></Button>
                     </div>
                     <p className="text-sm text-muted-foreground">Countdown</p>
                     <p className="text-5xl font-bold font-mono">00:15:00</p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full text-lg py-6 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">OPEN LUDO KING</Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader className="flex-row justify-between items-center">
                    <CardTitle>Players</CardTitle>
                    <p className="text-sm font-semibold">Winning</p>
                </CardHeader>
                <CardContent className="space-y-2">
                    {players.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={p.photoURL || undefined} />
                                    <AvatarFallback>{p.displayName?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{p.displayName}</p>
                                    {p.uid === match.creatorId && <p className="text-xs text-green-500">Creator - Ready</p>}
                                </div>
                            </div>
                            <p className="font-bold text-green-600">₹{match.prizePool?.toLocaleString() || '0'}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
};

const MatchVerification = ({ match, players }: { match: Match, players: UserProfile[] }) => {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const hasSubmitted = match.results?.some(r => r.userId === user?.uid);

    const handleResultSubmit = async () => {
        if (!user || !firestore || !screenshot) return;
        setIsSubmitting(true);
        try {
            const storage = getStorage();
            const screenshotRef = ref(storage, `match-results/${match.id}/${user.uid}_${screenshot.name}`);
            await uploadBytes(screenshotRef, screenshot);
            const screenshotUrl = await getDownloadURL(screenshotRef);

            const matchRef = doc(firestore, 'matches', match.id);
            const resultData = { userId: user.uid, screenshotUrl, submittedAt: Timestamp.now() };

            await updateDoc(matchRef, { results: arrayUnion(resultData) });

            toast({ title: 'Result Submitted', description: 'Your result is awaiting verification.' });
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
        <div className="p-4 text-center">
            <Card className="bg-card">
                <CardHeader>
                    <CardTitle>Result Verification</CardTitle>
                    <CardDescription>The match is over. Please upload a screenshot of the Ludo King victory screen to claim your prize.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <label htmlFor="screenshot-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50">
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
                </CardContent>
                <CardFooter>
                    <Button className="w-full bg-gradient-to-r from-primary to-purple-600" onClick={handleResultSubmit} disabled={isSubmitting || !screenshot}>
                        {isSubmitting ? 'Uploading...' : 'Upload Screenshot'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

const MatchCompleted = ({ match, players }: { match: Match, players: UserProfile[] }) => {
    const { width, height } = useWindowSize();
    const winner = players.find(p => p.id === match.winnerId);
    
    // Sort players by prize (mock for now, should be based on real results if available)
    const podiumPlayers = [...players].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const first = winner || podiumPlayers[0];
    const second = podiumPlayers.find(p => p.id !== first.id) || podiumPlayers[1];
    const third = podiumPlayers.find(p => p.id !== first.id && p.id !== second?.id) || podiumPlayers[2];

    return (
         <div className="p-4 space-y-4">
            {winner && <Confetti width={width} height={height} recycle={false} />}
            <Card className="text-center bg-gradient-to-b from-primary to-purple-800 text-primary-foreground">
                <CardHeader>
                    <CardTitle className="text-2xl">Congratulations, {winner?.displayName || 'Winner'}!</CardTitle>
                    <CardDescription className="text-primary-foreground/80">The match is complete and prizes have been distributed.</CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader className="items-center text-center">
                    <CardTitle>Final Standings</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-end gap-2 px-2">
                    {/* Second Place */}
                    {second && (
                        <div className="text-center w-1/3">
                            <Avatar className="h-16 w-16 mx-auto border-4 border-slate-400">
                                <AvatarImage src={second.photoURL || undefined} />
                                <AvatarFallback>{second.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="mt-2 p-2 h-20 flex flex-col justify-center bg-gradient-to-b from-purple-500 to-purple-600 text-white rounded-t-lg">
                                <p className="font-bold text-lg">2</p>
                                {/* Mock prize */}
                                <p className="font-semibold text-sm">₹{((match.prizePool || 0) * 0.3).toFixed(0)}</p>
                            </div>
                        </div>
                    )}

                    {/* First Place */}
                    {first && (
                        <div className="text-center w-1/3">
                             <Avatar className="h-20 w-20 mx-auto border-4 border-yellow-400">
                                <AvatarImage src={first.photoURL || undefined} />
                                <AvatarFallback>{first.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="mt-2 p-2 h-28 flex flex-col justify-center bg-gradient-to-b from-purple-600 to-purple-700 text-white rounded-t-lg">
                                <p className="font-bold text-2xl">1</p>
                                <p className="font-semibold text-lg">₹{match.prizePool?.toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Third Place */}
                    {third && (
                         <div className="text-center w-1/3">
                             <Avatar className="h-14 w-14 mx-auto border-4 border-orange-400">
                                <AvatarImage src={third.photoURL || undefined} />
                                <AvatarFallback>{third.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                             <div className="mt-2 p-2 h-16 flex flex-col justify-center bg-gradient-to-b from-purple-400 to-purple-500 text-white rounded-t-lg">
                                <p className="font-bold text-base">3</p>
                                {/* Mock prize */}
                                <p className="font-semibold text-xs">₹{((match.prizePool || 0) * 0.1).toFixed(0)}</p>
                            </div>
                        </div>
                    )}
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
  
  const { data: match, loading: matchLoading } = useDoc<Match>(`matches/${params.id}`);
  const { data: players, loading: playersLoading } = useCollection<UserProfile>('users', {
    where: match ? ['uid', 'in', match.players] : undefined
  });

  const loading = matchLoading || playersLoading || userLoading || profileLoading;

  const renderContent = () => {
    if (loading || !match || !profile) {
      return <MatchPageSkeleton />;
    }

    let title = "Match Details";
    let content;

    switch (match.status) {
        case 'open':
            title = 'Waiting Room';
            content = <MatchOpen match={match} profile={profile} players={players as UserProfile[]} />;
            break;
        case 'ongoing':
            title = 'Game In Progress';
            content = <MatchOngoing match={match} players={players as UserProfile[]} />;
            break;
        case 'verification':
             title = 'Submit Result';
             content = <MatchVerification match={match} players={players as UserProfile[]} />;
             break;
        case 'completed':
            title = 'Match Completed';
            content = <MatchCompleted match={match} players={players as UserProfile[]} />;
            break;
        case 'cancelled':
            title = 'Match Cancelled';
            content = <div className="p-8 text-center"><Card><CardHeader><CardTitle>Match Cancelled</CardTitle><CardDescription>This match has been cancelled.</CardDescription></CardHeader></Card></div>;
            break;
        default:
            title = 'Match Status Unknown';
            content = <div className="p-8 text-center">Could not determine match status.</div>;
    }
    
    return (
        <>
            <MatchPageHeader title={title} />
            {content}
        </>
    );
  };
  
  return <AppShell>{renderContent()}</AppShell>;
}

