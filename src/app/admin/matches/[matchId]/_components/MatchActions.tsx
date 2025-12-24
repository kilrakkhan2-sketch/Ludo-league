'use client';

import { Match } from '@/types';
import { Button } from '@/components/ui/button';

// TODO: Implement actual match actions
export default function MatchActions({ match }: { match: Match }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">Declare Result</Button>
      <Button variant="destructive" size="sm">Cancel Match</Button>
    </div>
  );
}
