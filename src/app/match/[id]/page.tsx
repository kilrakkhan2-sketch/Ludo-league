
'use client';

import { doc, runTransaction, updateDoc, arrayUnion } from 'firebase/firestore';
import { useDocument } from '@/firebase/firestore/use-document';
import { useUser } from '@/firebase/auth/use-user';
import { useFirebase } from '@/firebase/provider';
import { Match, UserProfile } from '@/types';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Trophy, Swords, Calendar, Hourglass, ClipboardCopy, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useCollection } from '@/firebase/firestore/use-collection';
import { formatDistanceToNow } from 'date-fns';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Input } from '@/components/ui/input';

export default function MatchPage({ params }: { params: { id: string } }) {
  const { user, loading: userLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDocument<UserProfile>(user ? `users/${user.uid}` : undefined);
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const { data: match, loading: matchLoading } = useDocument<Match>(`matches/${params.id}`);
  const { data: players, loading: playersLoading } = useCollection<UserProfile>('users', {
    where: match ? ['uid', 'in', match.players] : undefined
  });

  const [resultScreenshot, setResultScreenshot] = useState<File | null>(null);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);

  const alreadyJoined = match?.players.includes(user?.uid || '') || false;
  const isFull = match ? match.players.length >= match.maxPlayers : false;
  const isCreator = match?.creatorId === user?.uid;
  const hasSubmittedResult = match?.results?.some(r => r.userId === user?.uid);

  const handleJoinMatch = async () => {
    if (!user || !profile || !firestore || !match) return;
    // ... (join match logic)
  }

  const handleStartMatch = async () => {
    if (!firestore || !match || !isCreator) return;
    // ... (start match logic)
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
            submittedAt: new Date(),
        };

        await updateDoc(matchRef, {
            results: arrayUnion(resultData),
            status: 'verification' // Move to verification once one player submits
        });

        toast({ title: 'Result Submitted', description: 'Your result is awaiting verification from the admin.' });
    } catch (error) {
        console.error("Result submission error:", error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your result.' });
    }
    setIsSubmittingResult(false);
  };

  const copyRoomCode = () => {
    // ... (copy room code logic)
  }

  if (matchLoading || playersLoading || userLoading || profileLoading) {
    return <AppShell><div className="text-center p-8">Loading match details...</div></AppShell>;
  }

  if (!match) {
    return <AppShell><div className="text-center p-8">Match not found.</div></AppShell>;
  }

  const creatorProfile = players.find(p => p.id === match.creatorId);

  return (
    <AppShell>
        <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    {/* ... (match details card content) ... */}
                </Card>
                {match.status === 'ongoing' && alreadyJoined && !hasSubmittedResult && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Submit Match Result</CardTitle>
                            <CardDescription>Upload a screenshot of the final scoreboard from Ludo King.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label htmlFor="result-screenshot" className="block text-sm font-medium text-gray-700">Screenshot</label>
                                <Input id="result-screenshot" type="file" onChange={(e) => setResultScreenshot(e.target.files ? e.target.files[0] : null)} accept="image/*" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleResultSubmit} disabled={isSubmittingResult || !resultScreenshot}>
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
                    <div className="border rounded-lg p-8 text-center">
                        <h3 className="font-bold text-lg">Join the Match to Chat</h3>
                        <p className="text-muted-foreground">The match chat is only available to players who have joined.</p>
                    </div>
                )}
            </div>
        </div>
    </AppShell>
  );
}
