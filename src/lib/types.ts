
import { Timestamp } from "firebase/firestore";

export type UserProfile = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    isAdmin?: boolean;
    balance?: number;
    // Any other user-specific fields
  };
  
  export type Match = {
    id: string;
    players: string[]; // UIDs of players
    status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
    entryFee: number;
    winner?: string | null;
    gameData?: any; // To store game state, e.g., Ludo board positions
    createdAt: Timestamp;
    updatedAt: Timestamp;
  };
  
  export type Transaction = {
    id: string;
    userId: string;
    type: 'deposit' | 'withdrawal' | 'entry-fee' | 'winnings';
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    createdAt: Timestamp;
    updatedAt: Timestamp;
    details?: Record<string, any>; // e.g., { matchId: 'xyz' } or { upiId: 'abc' }
  };

  export type Wallet = {
    balance: number;
    lastTransaction?: string;
    updatedAt: Timestamp;
  };

  export type LobbyBanner = {
    imageUrl: string;
    imageHint: string;
    active: boolean;
    createdAt: Timestamp;
  };

  export type UpiDetails = {
    id: string; // The UPI ID itself, e.g., user@okhdfcbank
    name: string; // Account holder's name
    isPrimary: boolean;
    userId: string; // Foreign key to the user
    createdAt: Timestamp;
    verified: boolean;
  }

  export type WithdrawalRequest = {
    id: string;
    userId: string;
    amount: number;
    upiId: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: Timestamp;
    processedAt?: Timestamp;
    rejectionReason?: string;
    processedBy?: string; // Admin UID
  }
  
  export type Tournament = {
    id: string;
    name: string;
    bannerImageUrl: string;
    entryFee: number;
    totalSlots: number;
    filledSlots: number;
    prizePool: number;
    startTime: Timestamp;
    endTime: Timestamp;
    status: 'upcoming' | 'live' | 'completed' | 'cancelled';
    commissionType: 'percentage' | 'fixed';
    commissionValue: number;
    rules: string;
    playerIds: string[];
    createdBy: string;
  };
  
  export type UpiConfiguration = {
      activeUpiId: string;
      updatedAt: Timestamp;
  };
  
  export type News = {
      id: string;
      title: string;
      content: string;
      authorId: string;
      authorName: string;
      createdAt: Timestamp;
  }
  
  export const getTournamentStatus = (tournament: Tournament): Tournament['status'] => {
    // Guard against incomplete tournament data
    if (!tournament || !tournament.startTime || !tournament.endTime) {
        return tournament?.status || 'upcoming'; // Return existing status or a safe default
    }

    const now = new Date();
    const startTime = tournament.startTime.toDate();
    const endTime = tournament.endTime.toDate();

    // Do not re-calculate for settled statuses
    if (tournament.status === 'cancelled' || tournament.status === 'completed') {
        return tournament.status;
    }

    if (now < startTime) {
        return 'upcoming';
    } else if (now >= startTime && now <= endTime) {
        return 'live';
    } else {
        return 'completed';
    }
};