
import { Timestamp } from "firebase/firestore";

export type UserProfile = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    isAdmin?: boolean;
    walletBalance: number;
    kycStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected';
    kycRejectionReason?: string;
    upiId?: string;
    bankDetails?: string;
    isBlocked?: boolean;
    referralCode?: string;
    winnings?: number;
    winRate?: number;
    fcmToken?: string;
    activeMatchId?: string | null; // Added for new matchmaking logic
  };
  
  export type Match = {
    id: string;
    creatorId: string;
    players: any[]; 
    playerIds: string[];
    status: 'waiting' | 'in-progress' | 'completed' | 'disputed' | 'cancelled';
    entryFee: number;
    prizePool: number;
    maxPlayers: number;
    winnerId?: string | null;
    roomCode?: string;
    prizeDistributed?: boolean;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    reviewReason?: string;
  };
  
  export type Transaction = {
    id: string;
    userId: string;
    type: 'deposit' | 'withdrawal' | 'entry-fee' | 'winnings' | 'refund' | 'admin-credit' | 'admin-debit' | 'referral-bonus';
    amount: number;
    status: 'pending' | 'completed' | 'rejected' | 'approved';
    createdAt: Timestamp;
    description?: string;
    utr?: string;
    screenshotUrl?: string;
    relatedMatchId?: string;
  };

  export type Wallet = {
    balance: number;
    lastTransaction?: string;
    updatedAt: Timestamp;
  };

  export type DepositRequest = {
    id: string;
    userId: string;
    userName?: string;
    amount: number;
    utr: string;
    screenshotUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Timestamp;
    reviewedAt?: Timestamp;
    reviewedBy?: string; // Admin UID
    rejectionReason?: string;
  }

  export type WithdrawalRequest = {
    id: string;
    userId: string;
    userName?: string;
    amount: number;
    upiId: string;
    bankDetails?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Timestamp;
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

export interface KycApplication {
    id: string;
    userId: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: Timestamp;
    reviewedAt?: Timestamp;
    rejectionReason?: string;
    aadhaarPanUrl: string;
    selfieUrl: string;
    bankDetails?: string;
    upiId?: string;
    userName?: string;
    userAvatar?: string;
    fullName?: string;
    dateOfBirth?: string;
    aadhaarNumber?: string;
    panNumber?: string;
    aadhaarImage?: string;
    panImage?: string;
  }
  
  export interface MatchResult {
      id: string;
      userId: string;
      position: number;
      status: 'win' | 'loss';
      screenshotUrl: string;
      submittedAt: Timestamp;
      isFlaggedForFraud?: boolean;
  }
