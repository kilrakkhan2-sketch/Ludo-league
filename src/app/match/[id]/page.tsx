'use client';

import { doc, runTransaction, updateDoc, arrayUnion, Timestamp, collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { useDoc, useUser, useCollection, useFirebase } from '@/firebase';
import { Match, UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Trophy, Swords, Calendar, Hourglass, ClipboardCopy, Upload, Crown, ArrowLeft, CheckCircle, Plus, Info } from 'lucide-react';
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
  
  const playerIds = useMemo(() => {
      if (!match?.players) return ['_']; // Firestore 'in' query requires a non-empty array
      return match.players.length > 0 ? match.players : ['_'];
  }, [match]);

  const { data: playersData, loading: playersLoading } = useCollection<UserProfile>(
    'users', { where: ['uid', 'in', playerIds] }
  );

  const players = useMemo(() => playersData || [], [playersData]);

  const loading = matchLoading || playersLoading;

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
