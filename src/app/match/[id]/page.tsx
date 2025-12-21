
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
                                <AvatarImage src={p.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.uid}`} />
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

    return (
        <div className="flex flex-col flex-grow">
            <main className="flex-grow p-4 space-y-4">
                <PlayerListLobby match={match} players={players} />
            </main>
            <footer className="p-4 sticky bottom-0 bg-background border-t space-y-2">
                 {isCreator && match.players.length < match.maxPlayers &&
                    <div className='text-center p-4 bg-muted rounded-lg'>
                        <p className='font-bold'>Waiting for players...</p>
                        <p className='text-sm text-muted-foreground'>The match will begin once all slots are filled.</p>
                    </div>
                }
            </footer>
        </div>
    );
};


const MatchJoined = ({ match, players }: { match: Match, players: UserProfile[] }) => {
    const { user } = useUser();
    const isCreator = match.creatorId === user?.uid;

    return (
        <div className="flex flex-col flex-grow">
            <main className="flex-grow p-4 space-y-4">
                <PlayerListLobby match={match} players={players} />
                 {!isCreator && (
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
    return (
        <div className="p-4 space-y-6">
            <Card>
                <CardContent className="p-6 text-center space-y-4">
                     <p className="text-sm text-muted-foreground">Match is in progress</p>
                     <p className='text-sm text-muted-foreground max-w-xs mx-auto'>
                         The game is now ongoing. The creator will submit results once it's finished.
                     </p>
                </CardContent>
            </Card>
             <ChatRoom matchId={match.id} />
        </div>
    );
};


const MatchVerification = () => {
    return (
         <div className="p-8 text-center space-y-4">
             <Card className="bg-blue-100 text-blue-900">
                <CardHeader>
                    <CardTitle>Result Pending Verification</CardTitle>
                    <CardDescription className="text-blue-800">The result is awaiting verification from the admin. You will be notified once the prize money is distributed.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
};


const MatchCompleted = ({ match, players }: { match: Match, players: UserProfile[] }) => {
    const { user } = useUser();
    const { width, height } = useWindowSize();
    const winner = players.find(p => p.id === match.winnerId);
    const isWinner = user?.uid === winner?.uid;
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    return (
         <div className="p-4 space-y-4">
            {isClient && isWinner && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} tweenDuration={5000} />}
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

  const { data: match, loading: matchLoading } = useDoc<Match>(`matches/${params.id}`);
  
  const playerIds = useMemo(() => {
      if (!match?.players) return ['_']; 
      return match.players.length > 0 ? match.players : ['_'];
  }, [match]);

  const { data: playersData, loading: playersLoading } = useCollection<UserProfile>(
    'users', { where: ['uid', 'in', playerIds] }
  );

  const players = useMemo(() => playersData || [], [playersData]);

  const loading = matchLoading || playersLoading || userLoading || profileLoading;

  const renderContent = () => {
    if (loading || !match || !profile) {
      return <MatchPageSkeleton />;
    }

    let title;
    let content;
    
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
        const isFull = match.players.length >= match.maxPlayers;
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
