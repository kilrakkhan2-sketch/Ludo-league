
'use client';

import { useParams } from 'next/navigation';
import { useDoc } from '@/firebase';
import { Match, UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import MatchActions from './_components/MatchActions';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminChatRoom } from '@/components/chat/AdminChatRoom';

const PlayerCard = ({ uid, isCreator }: { uid: string, isCreator: boolean }) => {
    const { data: player, loading } = useDoc<UserProfile>(`users/${uid}`);

    if (loading) return <Card className="flex-1"><CardHeader><Skeleton className="h-12 w-48"/></CardHeader><CardContent><Skeleton className="h-24 w-full"/></CardContent></Card>
    if (!player) return <Card className="flex-1"><CardHeader><CardTitle>Player Not Found</CardTitle></CardHeader></Card>
    
    const winRate = (player.matchesPlayed || 0) > 0 ? ((player.matchesWon || 0) / player.matchesPlayed * 100).toFixed(1) : 0;

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
                <Avatar><AvatarImage src={player.photoURL} /><AvatarFallback>{player.displayName?.charAt(0) ?? 'U'}</AvatarFallback></Avatar>
                <div>
                    <CardTitle>{player.displayName}</CardTitle>
                    <CardDescription>{isCreator ? 'Creator' : 'Joiner'} (UID: {player.uid})</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm flex-grow">
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span> <strong>{player.email}</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Wallet Balance</span> <strong>₹{player.walletBalance ?? 0}</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Matches Played</span> <strong>{player.matchesPlayed ?? 0}</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Win Rate</span> <strong>{winRate}%</strong></div>
            </CardContent>
        </Card>
    );
};

export default function MatchDetailsPage() {
    const params = useParams();
    const matchId = params?.matchId as string | null;
    const { data: match, loading: matchLoading, error } = useDoc<Match>(matchId ? `matches/${matchId}`: null);

    if (matchLoading) return <div className="text-center">Loading match details...</div>;
    if (error) return <div className="text-center text-red-500">Error: {error.message}</div>;
    if (!match) return <div className="text-center">Match not found.</div>;

    return (
        <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Match Details</h1>
                        <p className="text-muted-foreground font-mono text-xs">ID: {match.id}</p>
                    </div>
                    <MatchActions match={match} />
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                             <CardTitle className="flex items-center gap-3">Game Info <Badge className="capitalize">{match.status.replace(/_/g, ' ')}</Badge></CardTitle>
                             <div className="text-sm text-muted-foreground">Created At: {new Date(match.createdAt.seconds * 1000).toLocaleString()}</div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="p-4 bg-muted rounded-lg"><div className="text-sm text-muted-foreground">Entry Fee</div><div className="text-2xl font-bold">₹{match.entryFee}</div></div>
                            <div className="p-4 bg-muted rounded-lg"><div className="text-sm text-muted-foreground">Prize Pool</div><div className="text-2xl font-bold">₹{match.prizePool}</div></div>
                            <div className="p-4 bg-muted rounded-lg"><div className="text-sm text-muted-foreground">Room Code</div><div className="text-2xl font-bold font-mono">{match.roomCode || 'N/A'}</div></div>
                            <div className="p-4 bg-muted rounded-lg"><div className="text-sm text-muted-foreground">Winner</div><div className="text-2xl font-bold truncate">{match.winnerId ? match.winnerId.substring(0, 6) + '..' : 'TBD'}</div></div>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="grid md:grid-cols-2 gap-6">
                    {match.players.map(uid => <PlayerCard key={uid} uid={uid} isCreator={uid === match.creatorId} />)}
                </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
                 <AdminChatRoom contextPath={`matches/${matchId}`} />
            </div>
        </div>
    );
}
