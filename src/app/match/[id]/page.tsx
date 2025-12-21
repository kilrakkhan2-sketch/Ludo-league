'use client';

import { doc, runTransaction, updateDoc, arrayUnion, Timestamp, collection, getDocs, query, where, writeBatch, setDoc } from 'firebase/firestore';
import { useDoc, useUser, useCollection, useFirebase } from '@/firebase';
import { Match, UserProfile, MatchResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Trophy, Swords, Calendar, Hourglass, ClipboardCopy, Upload, Crown, ArrowLeft, CheckCircle, Plus, Info, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { useState, useMemo } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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

const PlayerList = ({ match, players, title = "Players" }: { match: Match, players: UserProfile[], title?: string }) => {
    const emptySlots = Array.from({ length: Math.max(0, match.maxPlayers - players.length) });

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription>{players.length} / {match.maxPlayers} joined</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {players.map(p => (
                     <div key={p.id} className="flex items-center justify-between p-3 bg-muted rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={p.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.uid}`} />
                                <AvatarFallback>{p.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{p.displayName}</p>
                                <p className="text-xs text-muted-foreground">{p.uid === match.creatorId ? 'Creator' : 'Player'}</p>
                            </div>
                        </div>
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

const ResultSubmissionForm = ({ match }: { match: Match }) => {
    const { user } = useUser();
    const { firestore, storage } = useFirebase();
    const { toast } = useToast();
    const [position, setPosition] = useState<string>('');
    const [result, setResult] = useState<'won' | 'lost' | ''>('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!user || !firestore || !storage || !position || !result || !screenshot) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select your position, result, and upload a screenshot.' });
            return;
        }
        setIsSubmitting(true);
        try {
            const screenshotRef = ref(storage, `match-results/${match.id}/${user.uid}-${screenshot.name}`);
            await uploadBytes(screenshotRef, screenshot);
            const screenshotUrl = await getDownloadURL(screenshotRef);

            const resultRef = doc(firestore, `matches/${match.id}/results`, user.uid);
            await setDoc(resultRef, {
                userId: user.uid,
                position: parseInt(position, 10),
                status: result,
                screenshotUrl,
                submittedAt: Timestamp.now()
            });

            toast({ title: 'Result Submitted', description: 'Your result has been recorded and is pending verification.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit Your Result</CardTitle>
                <CardDescription>All players must submit their results for the match to be completed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Step 1: Position */}
                <div className="space-y-2">
                    <Label className="font-semibold">Step 1: Select Your Position</Label>
                    <RadioGroup value={position} onValueChange={setPosition} className="grid grid-cols-2 gap-2">
                        {Array.from({ length: match.maxPlayers }, (_, i) => i + 1).map(p => (
                            <Label key={p} htmlFor={`pos-${p}`} className="flex items-center gap-2 cursor-pointer border rounded-md p-3 text-sm has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-colors">
                                <RadioGroupItem value={p.toString()} id={`pos-${p}`} />
                                Position {p}
                            </Label>
                        ))}
                    </RadioGroup>
                </div>
                
                {/* Step 2: Result and Screenshot (appears after position is selected) */}
                {position && (
                     <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                            <Label className="font-semibold">Step 2: Confirm Result & Upload Proof</Label>
                             <RadioGroup value={result} onValueChange={(v) => setResult(v as 'won'|'lost')}>
                                <div className="flex gap-4">
                                     <Label htmlFor="res-won" className="flex-1 flex items-center gap-2 cursor-pointer border rounded-md p-3 text-sm has-[:checked]:bg-green-500 has-[:checked]:text-white has-[:checked]:border-green-600 transition-colors">
                                        <RadioGroupItem value="won" id="res-won" /> I WON
                                    </Label>
                                     <Label htmlFor="res-lost" className="flex-1 flex items-center gap-2 cursor-pointer border rounded-md p-3 text-sm has-[:checked]:bg-destructive has-[:checked]:text-white has-[:checked]:border-destructive transition-colors">
                                        <RadioGroupItem value="lost" id="res-lost" /> I LOST
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="screenshot">Upload Screenshot of Ludo King Result</Label>
                             <label htmlFor="screenshot" className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                    {screenshot ? (
                                    <p className="text-sm font-semibold text-primary">{screenshot.name}</p>
                                    ) : (
                                    <p className="text-sm text-muted-foreground text-center"><span className="font-semibold">Click to upload</span></p>
                                    )}
                                </div>
                                <Input id="screenshot" type="file" className="hidden" onChange={(e) => setScreenshot(e.target.files?.[0] || null)} accept="image/*" />
                            </label>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleSubmit} disabled={!position || !result || !screenshot || isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Final Result'}
                </Button>
            </CardFooter>
        </Card>
    )
}

const MatchOngoingContent = ({ match, players, results }: { match: Match, players: UserProfile[], results: MatchResult[] }) => {
    const { user } = useUser();
    const { toast } = useToast();
    const [isStarting, setIsStarting] = useState(false);
    
    const userHasSubmittedResult = useMemo(() => {
        if (!user) return true;
        return results.some(r => r.userId === user.uid);
    }, [user, results]);

    const copyRoomCode = () => {
        if (match.roomCode) {
            navigator.clipboard.writeText(match.roomCode);
            toast({ title: 'Room Code Copied!' });
        }
    };

    return (
        <div className="flex flex-col flex-grow">
            <main className="flex-grow p-4 space-y-4">
                <Card>
                     <CardHeader>
                        <CardTitle>Ludo King Room Code</CardTitle>
                        <CardDescription>Join this room in Ludo King to play.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {match.roomCode ? (
                             <div className="font-mono tracking-widest text-2xl bg-muted p-4 rounded-lg flex items-center justify-between cursor-pointer" onClick={copyRoomCode}>
                                <span>{match.roomCode}</span>
                                <ClipboardCopy className="h-6 w-6 text-muted-foreground" />
                            </div>
                        ) : user?.uid === match.creatorId ? (
                            <p className='text-muted-foreground'>Please enter the room code in the input below once you have created it in Ludo King.</p>
                        ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Hourglass className="h-4 w-4 animate-spin" />
                                <span>Waiting for creator to add room code...</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {userHasSubmittedResult ? (
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>Result Submitted</AlertTitle>
                        <AlertDescription>
                            Your result has been recorded. Waiting for other players to submit their results.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <ResultSubmissionForm match={match} />
                )}

                 <PlayerList match={match} players={players} title="Players in Match" />
            </main>
        </div>
    )
}

const MatchOpenContent = ({ match, players }: { match: Match, players: UserProfile[] }) => {
    const { user } = useUser();
    const { toast } = useToast();
    const [isJoining, setIsJoining] = useState(false);

    const hasJoined = useMemo(() => user && match.players.includes(user.uid), [user, match.players]);

    const handleJoinMatch = async () => {
        setIsJoining(true);
        // This logic will be implemented in the next step.
        toast({ title: "Joining functionality coming soon!" });
        setIsJoining(false);
    };

    return (
        <div className="flex flex-col flex-grow">
            <main className="flex-grow p-4 space-y-4">
                <PlayerList match={match} players={players} />
            </main>
            <footer className="p-4 sticky bottom-0 bg-background border-t">
                {hasJoined ? (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>You have joined!</AlertTitle>
                        <AlertDescription>
                            Waiting for other players. The match will begin once full.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Button onClick={handleJoinMatch} disabled={isJoining} className="w-full text-lg py-6">
                        {isJoining ? 'Joining...' : `Join for ₹${match.entryFee}`}
                    </Button>
                )}
            </footer>
        </div>
    );
};

export default function MatchPage({ params }: { params: { id: string } }) {
  const { data: match, loading: matchLoading } = useDoc<Match>(`matches/${params.id}`);
  const { data: results, loading: resultsLoading } = useCollection<MatchResult>(`matches/${params.id}/results`);
  
  const playerIds = useMemo(() => {
      if (!match?.players) return ['_'];
      return match.players.length > 0 ? match.players : ['_'];
  }, [match]);

  const { data: playersData, loading: playersLoading } = useCollection<UserProfile>(
    'users', { where: ['uid', 'in', playerIds] }
  );

  const players = useMemo(() => playersData || [], [playersData]);

  const loading = matchLoading || playersLoading || resultsLoading;

  const renderContent = () => {
    if (loading || !match) {
      return <MatchPageSkeleton />;
    }

    let title = "Match Details";
    let content;

    switch(match.status) {
        case 'open':
            title = 'Waiting for Players';
            content = <MatchOpenContent match={match} players={players} />;
            break;
        case 'ongoing':
            title = 'Match In Progress';
            content = <MatchOngoingContent match={match} players={players} results={results} />;
            break;
        case 'verification':
             title = 'Verifying Results';
             content = (
                <div className="p-4">
                    <Alert>
                        <Hourglass className="h-4 w-4" />
                        <AlertTitle>Results Pending Verification</AlertTitle>
                        <AlertDescription>
                            All results have been submitted and are now being verified by our team. Please be patient.
                        </AlertDescription>
                    </Alert>
                </div>
            )
            break;
        case 'disputed':
             title = 'Match Disputed';
             content = (
                <div className="p-4">
                    <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>Match Under Review</AlertTitle>
                        <AlertDescription>
                            There was a conflict in the submitted results. An admin will review the match shortly to determine the correct outcome.
                        </AlertDescription>
                    </Alert>
                </div>
            )
            break;
        case 'completed':
            title = "Match Completed";
            content = <PlayerList match={match} players={players} title={`Winner: ${players.find(p => p.uid === match.winnerId)?.displayName || 'N/A'}`} />
            break;
        default:
            title = "Match: " + match.status.replace('_', ' ');
            content = <div className="p-4"><PlayerList match={match} players={players} title={`Status: ${match.status}`} /></div>
            break;
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
