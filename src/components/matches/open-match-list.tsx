
'use client';

import { Match } from '@/types/match';
import { Button } from '@/components/ui/button';
import { Swords, Users, Wallet } from 'lucide-react';
import Link from 'next/link';

interface OpenMatchListProps {
  matches: Match[];
}

export function OpenMatchList({ matches }: OpenMatchListProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold font-headline mb-4">Open Matches</h2>
      {matches && matches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map(match => (
            <div key={match.id} className="bg-card border rounded-lg shadow-sm hover:shadow-lg transition-shadow">
              <div className="p-5">
                <h3 className="text-xl font-bold truncate mb-2">{match.title}</h3>
                <div className="flex justify-between items-center text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span>Entry: ₹{match.entryFee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <Swords className="h-4 w-4 text-primary" />
                    <span>Prize: ₹{match.prizePool}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{match.players.length}/{match.maxPlayers}</span>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-muted/50 border-t">
                 <Button className="w-full" asChild>
                    <Link href={`/match/${match.id}`}>View & Join</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-semibold text-muted-foreground">No open matches right now.</h3>
          <p className="text-muted-foreground mt-2">Why not create a new one?</p>
        </div>
      )}
    </div>
  );
}
