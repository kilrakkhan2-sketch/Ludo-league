
import { Timestamp } from 'firebase/firestore';

export interface Match {
  id: string;
  title: string;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  players: string[];
  status: 'waiting' | 'room_code_pending' | 'room_code_shared' | 'game_started' | 'result_submitted' | 'verification' | 'completed' | 'disputed' | 'cancelled';
  creatorId: string;
  joinerId?: string | null;
  winnerId?: string | null;
  roomCode?: string | null;
  creatorPosition?: number | null;
  joinerPosition?: number | null;
  proofImage?: string;
  createdAt: Timestamp;
  startedAt?: Timestamp | null;
  completedAt?: Timestamp | null;
}
