'use client';

import { useMemo } from 'react';
import { useCollection } from '@/firebase';
import type { UserProfile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface PlayerAvatarListProps {
  playerIds: string[];
  maxPlayers: number;
}

const PlayerAvatarSkeleton = () => (
    <div className="flex items-center -space-x-2">
        <Skeleton className="h-6 w-6 rounded-full border-2 border-background" />
        <Skeleton className="h-6 w-6 rounded-full border-2 border-background" />
    </div>
);


export const PlayerAvatarList = ({ playerIds, maxPlayers }: PlayerAvatarListProps) => {
  const queryOptions = useMemo(() => ({
    where: ['uid', 'in', playerIds.length > 0 ? playerIds : ['_']] as const,
  }), [playerIds]);

  const { data: players, loading } = useCollection<UserProfile>('users', queryOptions);

  const playersMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    players.forEach(p => map.set(p.uid, p));
    return map;
  }, [players]);

  if (loading) {
    return <PlayerAvatarSkeleton />;
  }
  
  const emptySlots = Array.from({ length: Math.max(0, maxPlayers - playerIds.length) });

  return (
    <TooltipProvider>
        <div className="flex items-center -space-x-2">
            {playerIds.map(id => {
                const player = playersMap.get(id);
                return (
                    <Tooltip key={id}>
                        <TooltipTrigger>
                            <Avatar className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={player?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${id}`} />
                                <AvatarFallback>{player?.displayName?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{player?.displayName || 'Player'}</p>
                        </TooltipContent>
                    </Tooltip>
                );
            })}
             {emptySlots.map((_, i) => (
                 <Tooltip key={`empty-${i}`}>
                    <TooltipTrigger>
                        <Avatar className="h-6 w-6 border-2 border-background bg-muted">
                            <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Waiting for player...</p>
                    </TooltipContent>
                </Tooltip>
            ))}
        </div>
    </TooltipProvider>
  );
};
