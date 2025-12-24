
'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCollection, useDoc } from '@/firebase';
import { Match, UserProfile, MatchResult } from '@/types';
import { useFirebase, useFunctions } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CircleAlert, ArrowLeft, Trophy, Ban, ShieldAlert, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { AdminChatRoom } from '@/components/chat/AdminChatRoom';
import { httpsCallable } from 'firebase/functions';

const PlayerResultCard = ({ player, result, onDeclareWinner, onDeleteScreenshot, isSubmitting }: {
    player: UserProfile;
    result?: MatchResult;
    onDeclareWinner: (id: string) => void;
    onDeleteScreenshot: (url: string) => void;
    isSubmitting: boolean;
}) => (
    <Card className="flex flex-col">
        <CardHeader className="flex-row items-center gap-4">
            <Avatar><AvatarImage src={player.photoURL} /><AvatarFallback>{player.displayName.charAt(0)}</AvatarFallback></Avatar>
            <div><CardTitle>{player.displayName}</CardTitle><CardDescription>UID: {player.uid}</CardDescription></div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm flex-grow">
            <div className="flex justify-between"><strong>Declared Status:</strong> <Badge variant={result?.confirmedWinStatus === 'win' ? 'default' : 'secondary'}>{result?.confirmedWinStatus || 'N/A'}</Badge></div>
            <div className="flex justify-between"><strong>Declared Rank:</strong> <span className="font-bold">{result?.confirmedPosition || 'N/A'}</span></div>
            {result?.screenshotUrl ? (
                <div className="relative group">
                     <a href={result.screenshotUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border hover:border-primary transition-colors">
                        <Image src={result.screenshotUrl} alt={`Screenshot from ${player.displayName}`} width={300} height={150} className="w-full object-cover"/>
                     </a>
                     <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="destructive" size="icon" className="h-7 w-7 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Screenshot?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the image from storage. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteScreenshot(result.screenshotUrl!)} className="bg-destructive text-destructive-foreground">Confirm & Delete</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                     </AlertDialog>
                </div>
             ) : <div className="text-center text-muted-foreground py-8 border rounded-lg bg-muted/40">No Screenshot</div>}
        </CardContent>
        <CardFooter>
            <AlertDialog>
                <AlertDialogTrigger asChild><Button className="w-full" disabled={isSubmitting}><Trophy className="mr-2 h-4 w-4"/> Declare Winner</Button></AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Declare {player.displayName} as Winner?</AlertDialogTitle><AlertDialogDescription>This will mark the match as completed and award the prize. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDeclareWinner(player.uid)}>Confirm & Payout</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
    </Card>
);

export default function AdminMatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const functions = useFunctions();
  const matchId = params.matchId as string;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: match, loading: matchLoading, refetch: refetchMatch } = useDoc<Match>(`matches/${matchId}`);
  const { data: results, loading: resultsLoading, refetch: refetchResults } = useCollection<MatchResult>(`matches/${matchId}/results`);
  const playerIds = useMemo(() => match?.players || ['_'], [match]);
  const { data: players, loading: playersLoading } = useCollection<UserProfile>('users', { where: ['uid', 'in', playerIds]});
  const resultsMap = useMemo(() => new Map(results?.map(r => [r.userId, r])), [results]);

  const handleAction = async (action: Promise<any>, successTitle: string, successMsg: string) => {
    setIsSubmitting(true);
    try {
        await action;
        toast({ title: successTitle, description: successMsg });
        router.push('/admin/matches');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleDeclareWinner = async (winnerId: string) => {
    if (!functions) return;
    const resolveMatch = httpsCallable(functions, 'resolveMatch');
    await handleAction(resolveMatch({ matchId, winnerId }), 'Match Resolved', 'The winner has been declared and payout is triggered.');
  };

  const handleCancelMatch = async () => {
    if (!functions) return;
    const cancelMatch = httpsCallable(functions, 'cancelMatch');
    await handleAction(cancelMatch({ matchId }), 'Match Cancelled', 'Entry fees will be refunded to all players.');
  }

  const handleDeleteScreenshot = async (screenshotUrl: string) => {
      if (!functions) return;
      setIsSubmitting(true);
      try {
        const deleteStorageFile = httpsCallable(functions, 'deleteStorageFile');
        const filePath = decodeURIComponent(new URL(screenshotUrl).pathname.split('/o/')[1].split('?')[0]);
        await deleteStorageFile({ filePath });
        toast({ title: 'Screenshot Deleted'});
        refetchResults(); // Refetch results to remove the deleted screenshot from view
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
      } finally {
          setIsSubmitting(false);
      }
  }

  const loading = matchLoading || playersLoading || resultsLoading;
  if (loading) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
  if (!match) return <Alert variant="destructive"><CircleAlert className="h-4 w-4" /> <AlertTitle>Match Not Found</AlertTitle></Alert>;

  const canTakeAction = ['verification', 'disputed', 'processing'].includes(match.status);

  return (
    <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4"/> Back to Matches</Button>
         <Card>
            <CardHeader><div className="flex justify-between items-start">
                <div><CardTitle className="text-2xl">Adjudicate: {match.title}</CardTitle><CardDescription>Match ID: {match.id}</CardDescription></div>
                <Badge variant={match.status === 'disputed' ? 'destructive' : 'secondary'} className="capitalize text-base">{match.status}</Badge>
            </div></CardHeader>
            {match.status === 'disputed' && <CardContent><Alert variant="destructive"><ShieldAlert className="h-4 w-4" /><AlertTitle>Result Conflict Detected</AlertTitle><AlertDescription>Review player submissions carefully and declare a winner, or cancel the match.</AlertDescription></Alert></CardContent>}
        </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {players?.map(player => <PlayerResultCard key={player.id} player={player} result={resultsMap.get(player.id)} onDeclareWinner={handleDeclareWinner} onDeleteScreenshot={handleDeleteScreenshot} isSubmitting={isSubmitting} />)}
            </div>
            <AdminChatRoom contextPath={`matches/${matchId}`} />
        </div>
        <div>
            <Card className="sticky top-20">
                <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {canTakeAction ? (
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" className="w-full" disabled={isSubmitting}><Ban className="mr-2 h-4 w-4"/> Cancel Match & Refund</Button></AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Cancel Match?</AlertDialogTitle><AlertDialogDescription>This will refund the entry fee to all players and permanently cancel the match. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleCancelMatch} className="bg-destructive text-destructive-foreground">Confirm & Refund</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                         <Alert><CircleAlert className="h-4 w-4" /><AlertTitle>Match Resolved</AlertTitle><AlertDescription>This match is already {match.status} and no further actions are needed.</AlertDescription></Alert>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
