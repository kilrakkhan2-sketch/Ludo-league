
import { Timestamp } from 'firebase/firestore';

export interface Match {
  id: string;
  title: string;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  players: string[];
  status: 'open' | 'ongoing' | 'completed' | 'disputed' | 'verification' | 'processing';
  creatorId: string;
  winnerId?: string | null;
  roomCode?: string | null;
  createdAt: Timestamp;
  startedAt?: Timestamp | null;
  completedAt?: Timestamp | null;
}
