
'use client';

import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useDoc, useUser, useFirebase, useFunctions, useCollection } from '@/firebase';
import type { Match, UserProfile, MatchResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Hourglass, ClipboardCopy, Upload, Gamepad2, Trash2, Swords, CheckCircle2, AlertTriangle, Users, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { httpsCallable } from 'firebase/functions';
import { AppShell } from '@/components/layout/AppShell';

// ==========================================================================
// 0. SIDEBAR & SHARED COMPONENTS
// ==========================================================================

const PlayerList = ({ playerIds, creatorId }: { playerIds: string[], creatorId: string }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> Players</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            {playerIds.map(uid => <PlayerCard key={uid} uid={uid} isCreator={uid === creatorId} />)}
        </CardContent>
    </Card>
);

const PlayerCard = ({ uid, isCreator }: { uid: string, isCreator: boolean }) => {
    const { data: user } = useDoc<UserProfile>(`users/${uid}`);
    return (
        <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-muted">
                <AvatarImage src={user?.photoURL || ''} />
                <AvatarFallback>{user?.displayName?.[0] || 'P'}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold leading-tight">{user?.displayName || 'Player'}</p>
                <p className="text-xs text-muted-foreground">{isCreator ? 'Creator' : 'Joined'}</p>
            </div>
        </div>
    );
};

const MatchInfoCard = ({ match }: { match: Match }) => (
    <Card>
        <CardContent className="pt-6 flex justify-around items-center text-center">
            <div>
                <p className="text-sm text-muted-foreground">Entry</p>
                <p className="font-bold text-lg">₹{match.entryFee}</p>
            </div>
            <div className="text-center">
                 <p className="text-sm text-muted-foreground">Prize</p>
                <div className="flex items-center gap-1.5">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <p className="font-bold text-lg">₹{match.prizePool * 0.9}</p>
                </div>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-bold text-lg capitalize">{match.status.replace('_', ' ')}</p>
            </div>
        </CardContent>
    </Card>
);

// ==========================================================================
// 1. WAITING FOR PLAYER
// ==========================================================================

const WaitingForPlayerContent = ({ match }: { match: Match }) => {
    const { user } = useUser();
    const { toast } = useToast();
    const functions = useFunctions();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const isCreator = user?.uid === match.creatorId;

    const handleCancelMatch = async () => {
        if (!functions || !window.confirm("Are you sure you want to cancel this match?")) return;
        setIsLoading(true);
        const cancelMatchFn = httpsCallable(functions, 'cancelMatch'); // Assumes this function exists
        try {
            await cancelMatchFn({ matchId: match.id });
            toast({ title: 'Match Cancelled', description: 'Fee refunded.' });
            router.push('/');
        } catch (error: any) { toast({ variant: 'destructive', title: 'Error', description: error.message }); }
        finally { setIsLoading(false); }
    };

    const handleJoinMatch = async () => {
        if (!functions || !user) return;
        setIsLoading(true);
        const joinMatchFn = httpsCallable(functions, 'joinMatch');
        try {
            await joinMatchFn({ matchId: match.id });
            toast({ title: 'Successfully Joined!' });
        } catch (error: any) { toast({ variant: 'destructive', title: 'Could Not Join', description: error.message }); }
        finally { setIsLoading(false); }
    };

    return (
        <Card className="w-full">
            <CardHeader><CardTitle>Waiting for an Opponent</CardTitle></CardHeader>
            <CardContent>
                 <div className="text-center p-6 border-2 border-dashed rounded-lg bg-muted/50">
                    <p className="text-muted-foreground font-medium">The match will begin once another player joins.</p>
                </div>
            </CardContent>
            <CardFooter>
            {isCreator ? (
                <Button onClick={handleCancelMatch} disabled={isLoading} variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" /> {isLoading ? 'Cancelling...' : 'Cancel Match'}
                </Button>
            ) : (
                <Button onClick={handleJoinMatch} disabled={isLoading} className="w-full py-6 text-lg">
                    {isLoading ? 'Joining...' : `Join for ₹${match.entryFee}`}
                </Button>
            )}
            </CardFooter>
        </Card>
    );
};

// ==========================================================================
// 2. ROOM CODE MANAGEMENT
// ==========================================================================

const RoomCodeContent = ({ match }: { match: Match }) => {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [roomCode, setRoomCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isCreator = user?.uid === match.creatorId;

    const handleUpdateRoomCode = async () => {
        if (!firestore || roomCode.length < 4) return;
        setIsSubmitting(true);
        try {
            await updateDoc(doc(firestore, 'matches', match.id), { roomCode: roomCode, status: 'room_code_shared' });
            toast({ title: 'Room Code Shared!' });
        } catch(e) { toast({ variant: 'destructive', title: 'Error', description: 'Could not update room code.'}); }
        finally { setIsSubmitting(false); }
    };

    const copyRoomCode = () => {
        if (match.roomCode) {
            navigator.clipboard.writeText(match.roomCode);
            toast({ title: 'Room Code Copied!' });
        }
    };

    const handleGameStarted = async () => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'matches', match.id), { status: 'game_started', startedAt: serverTimestamp() });
        } catch(e) { toast({ variant: 'destructive', title: 'Error', description: 'Could not update match status.'}); }
    };

    // UI for Creator to submit code
    if (isCreator && match.status === 'room_code_pending') {
        return (
            <Card className="bg-neutral-900 border-neutral-700 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-neutral-100">Share Room Code</CardTitle>
                    <CardDescription className="text-neutral-400">Create a private room in Ludo King and enter the code below.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                    <Input placeholder="Ludo King Code" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} className="text-center text-lg tracking-widest font-mono"/>
                    <Button onClick={handleUpdateRoomCode} disabled={isSubmitting || !roomCode}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
                </CardContent>
            </Card>
        );
    }

    // UI for both players after code is shared or pending
    return (
         <Card>
            <CardHeader><CardTitle>Join Room in Ludo King</CardTitle></CardHeader>
            <CardContent className='space-y-4'>
                {match.roomCode ? (
                    <>
                        <div className="font-mono tracking-widest text-2xl bg-muted p-4 rounded-lg flex items-center justify-between cursor-pointer" onClick={copyRoomCode}>
                            <span>{match.roomCode}</span>
                            <ClipboardCopy className="h-6 w-6 text-muted-foreground" />
                        </div>
                         <Button onClick={handleGameStarted} variant="outline" className="w-full">Confirm You've Joined & Start Game</Button>
                    </>
                ) : (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground p-8 text-center">
                        <Hourglass className="h-5 w-5 animate-spin" />
                        <span>Waiting for creator to share the room code...</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


// ==========================================================================
// 3. RESULT SUBMISSION
// ==========================================================================

const ResultSubmissionContent = ({ match, results }: { match: Match; results: MatchResult[] }) => {
    const { user } = useUser();
    const { firestore, storage } = useFirebase();
    const functions = useFunctions();
    const { toast } = useToast();
    const [position, setPosition] = useState<number>(0);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasSubmitted = results.some(r => r.userId === user?.uid);

    const handleSubmitResult = async () => {
        if (!user || !firestore || !storage || !functions || !position || !screenshot) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select your position and upload a screenshot.' });
            return;
        }
        setIsSubmitting(true);
        const submitResultFn = httpsCallable(functions, 'submitResult');

        try {
            const screenshotRef = ref(storage, `match-results/${match.id}/${user.uid}_${screenshot.name}`);
            await uploadBytes(screenshotRef, screenshot);
            const screenshotUrl = await getDownloadURL(screenshotRef);

            await submitResultFn({ matchId: match.id, position, screenshotUrl });
            toast({ title: 'Result Submitted!' });
        } catch (error: any) { toast({ variant: 'destructive', title: 'Submission Failed', description: error.message }); }
        finally { setIsSubmitting(false); }
    };

    if (hasSubmitted) {
        return (
             <Card>
                <CardHeader><CardTitle>Result Submitted</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-3 text-center p-8">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                    <p className="text-muted-foreground">Your result is recorded. Waiting for the other player to submit their result.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit Game Result</CardTitle>
                <CardDescription>Upload a screenshot of the Ludo King results screen showing your position.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <Label className="font-semibold">1. Select Your Position</Label>
                     <RadioGroup value={String(position)} onValueChange={(v) => setPosition(Number(v))}>
                        <div className="grid grid-cols-2 gap-4">
                             <Label htmlFor="pos-1" className="flex items-center justify-center gap-2 cursor-pointer border rounded-md p-4 text-lg font-semibold has-[:checked]:bg-green-600 has-[:checked]:text-white has-[:checked]:border-green-700 transition-colors">
                                <RadioGroupItem value="1" id="pos-1" /> 1st
                            </Label>
                             <Label htmlFor="pos-2" className="flex items-center justify-center gap-2 cursor-pointer border rounded-md p-4 text-lg font-semibold has-[:checked]:bg-blue-600 has-[:checked]:text-white has-[:checked]:border-blue-700 transition-colors">
                                <RadioGroupItem value="2" id="pos-2" /> 2nd
                            </Label>
                        </div>
                    </RadioGroup>
                </div>
                 <div className="space-y-3">
                    <Label className="font-semibold">2. Upload Proof</Label>
                     <label htmlFor="screenshot" className="mt-2 flex flex-col items-center justify-center w-full h-36 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                            <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                            {screenshot ? <p className="text-sm font-semibold text-primary px-2 break-all">{screenshot.name}</p> : <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload screenshot</span></p>}
                        </div>
                        <Input id="screenshot" type="file" className="hidden" onChange={(e) => setScreenshot(e.target.files?.[0] || null)} accept="image/*" />
                    </label>
                </div>
                 <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Warning: Penalty for Wrong Submission</AlertTitle>
                    <AlertDescription>
                        Submitting incorrect results or tampered screenshots will result in a penalty of **₹50** being deducted from your wallet.
                    </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleSubmitResult} disabled={isSubmitting || !position || !screenshot}>{isSubmitting ? 'Submitting...' : 'Submit Final Result'}</Button>
            </CardFooter>
        </Card>
    );
};


// ==========================================================================
// 4. FINAL STATE
// ==========================================================================

const FinalStateContent = ({ match }: { match: Match }) => {
    let state: { title: string, desc: string, icon: React.ElementType, color: string };

    switch (match.status) {
        case 'result_submitted':
        case 'FLAGGED':
        case 'verification':
            state = { title: "Result Under Review", desc: "We are verifying the results. You will be notified shortly.", icon: Hourglass, color: "text-blue-500" };
            break;
        case 'PAID':
            state = { title: "Match Completed!", desc: `The prize money has been sent to the winner.`, icon: CheckCircle2, color: "text-green-500" };
            break;
        case 'cancelled':
            state = { title: "Match Cancelled", desc: "This match was cancelled. Entry fees have been refunded.", icon: AlertTriangle, color: "text-destructive" };
            break;
        default:
            state = { title: "Unknown State", desc: "Something went wrong.", icon: AlertTriangle, color: "text-destructive" };
    }

    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 text-center p-8">
                <state.icon className={`h-12 w-12 ${state.color}`} />
                <h3 className="text-xl font-bold">{state.title}</h3>
                <p className="text-muted-foreground">{state.desc}</p>
            </CardContent>
        </Card>
    )
};


// ==========================================================================
// MAIN PAGE COMPONENT
// ==========================================================================

export default function MatchPage({ params }: { params: { id: string } }) {
  const { data: match, loading: matchLoading } = useDoc<Match>(`matches/${params.id}`);
  const { data: results, loading: resultsLoading } = useCollection<MatchResult>(`matches/${params.id}/results`);

  const loading = matchLoading || resultsLoading;

  if (loading || !match) {
    return (
        <AppShell pageTitle="Loading Match..." showBackButton>
            <div className="p-4 lg:grid lg:grid-cols-3 lg:gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-48 w-full" />
                </div>
                <div className="hidden lg:block space-y-6">
                     <Skeleton className="h-24 w-full" />
                     <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </AppShell>
    );
  }

  const renderMainContent = () => {
      switch(match.status) {
        case 'waiting': return <WaitingForPlayerContent match={match} />;
        case 'room_code_pending':
        case 'room_code_shared': return <RoomCodeContent match={match} />;
        case 'game_started': return <ResultSubmissionContent match={match} results={results || []} />;
        case 'result_submitted':
        case 'FLAGGED':
        case 'verification':
        case 'PAID':
        case 'cancelled': return <FinalStateContent match={match} />;
        default: return <p>Unknown match status: {match.status}</p>;
      }
  }

  return (
    <AppShell pageTitle={match.title || "Ludo Match"} showBackButton>
        <div className="p-4 sm:p-6 lg:p-8 lg:grid lg:grid-cols-3 lg:gap-8">
            {/* --- Main Content (Left on Desktop) --- */}
            <div className="lg:col-span-2 space-y-6">
                {renderMainContent()}
            </div>

            {/* --- Sidebar (Right on Desktop, Bottom on Mobile) --- */}
            <div className="lg:col-span-1 space-y-6 mt-6 lg:mt-0">
                <MatchInfoCard match={match} />
                <PlayerList playerIds={match.players} creatorId={match.creatorId} />
                <ChatRoom matchId={match.id} />
            </div>
        </div>
    </AppShell>
  );
}

    