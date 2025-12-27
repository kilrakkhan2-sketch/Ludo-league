
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useCollection } from '@/firebase';
import { Match, UserProfile, MatchResult } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { MatchStatusBadge } from '@/components/match-status-badge';
import { UserHoverCard } from '@/components/user-hover-card';
import Image from 'next/image';
import MatchActions from './_components/MatchActions';

const PlayerInfo = ({ userId, label }: { userId: string, label: string }) => {
    const { data: user, loading } = useDoc<UserProfile>(userId ? `users/${userId}` : undefined);
    const { data: results, loading: resultsLoading } = useCollection<MatchResult>(`matches/${useParams()?.matchId}/results`, { where: ['userId', '==', userId] });

    if (loading) return <p>Loading player...</p>;
    if (!user) return <p>Player not found.</p>;

    const result = results[0];

    return (
        <div className="flex flex-col items-center space-y-2">
             <UserHoverCard userId={user.uid}>
                <Avatar className="h-16 w-16">
                    <AvatarImage src={user.photoURL} />
                    <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                </Avatar>
            </UserHoverCard>
            <p className="font-bold text-lg">{user.displayName}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            {resultsLoading && <p>Loading results...</p>}
            {result && (
                <div className="pt-2 text-center">
                    <p className="font-semibold">Result: <span className="font-normal">{result.confirmedWinStatus}</span></p>
                     <a href={result.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Screenshot</a>
                </div>
            )}
        </div>
    );
};

export default function MatchDetailPage() {
    const params = useParams();
    const matchId = params?.matchId as string | undefined;
    const { data: match, loading: matchLoading, error } = useDoc<Match>(matchId ? `matches/${matchId}` : undefined);

    if (matchLoading) return <div className="text-center">Loading match details...</div>;
    if (error) return <div className="text-center text-red-500">Error: {error.message}</div>;
    if (!match) return <div className="text-center">Match not found.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl">{match.title || `Match #${match.id}`}</CardTitle>
                        <CardDescription>Match ID: {match.id}</CardDescription>
                    </div>
                    <MatchStatusBadge status={match.status} />
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Prize Pool</p>
                        <p className="text-2xl font-bold">₹{match.prizePool}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Entry Fee</p>
                        <p className="text-2xl font-bold">₹{match.entryFee}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-muted-foreground">Created At</p>
                        <p className="font-mono">{format(match.createdAt.toDate(), 'PPpp')}</p>
                    </div>
                </CardContent>
             </Card>

             <Card>
                <CardHeader><CardTitle>Players</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 divide-x">
                   {match.creatorId && <PlayerInfo userId={match.creatorId} label="Creator" />}
                   {match.joinerId ? <PlayerInfo userId={match.joinerId} label="Joiner" /> : <div className="flex items-center justify-center"><p>Waiting for player...</p></div>}
                </CardContent>
             </Card>

            {match.status === 'verification' && (
                 <Card>
                    <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
                    <CardContent>
                        <MatchActions match={match} />
                    </CardContent>
                </Card>
            )}

            {match.fraudReasons && match.fraudReasons.length > 0 && (
                <Card className="border-red-500">
                    <CardHeader><CardTitle className="text-red-600">Fraud Flags</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-1">
                            {match.fraudReasons.map((reason, i) => <li key={i}>{reason}</li>)}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
