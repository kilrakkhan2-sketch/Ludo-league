
import type { Timestamp } from "firebase/firestore";

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  walletBalance: number;
  kycStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  kycRejectionReason?: string;
  winRate?: number;
  winnings?: number;
  ipAddress?: string;
  deviceId?: string;
  totalMatchesPlayed?: number;
  totalMatchesWon?: number;
  isBlocked?: boolean;
  isSuspended?: boolean;
  isWalletFrozen?: boolean;
  isAdmin?: boolean;
  referralCode?: string;
  referredBy?: string;
};

export type PlayerInfo = {
    id: string;
    name: string;
    avatarUrl: string;
    winRate?: number;
}

export type Match = {
  id: string;
  creatorId: string;
  entryFee: number;
  prizePool: number;
  players: PlayerInfo[];
  playerIds: string[];
  maxPlayers: number;
  status: 'waiting' | 'in-progress' | 'completed' | 'disputed' | 'cancelled';
  roomCode?: string;
  createdAt: Timestamp;
  winnerId?: string;
  prizeDistributed?: boolean;
};

export type MatchResult = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  position: number;
  status: 'win' | 'loss';
  screenshotUrl: string;
  submittedAt: Timestamp;
  isFlaggedForFraud?: boolean;
};

export type Transaction = {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'entry-fee' | 'winnings' | 'refund' | 'tournament-fee' | 'referral-bonus';
  amount: number;
  createdAt: Timestamp;
  status: 'completed' | 'pending' | 'rejected';
  relatedMatchId?: string;
  relatedTournamentId?: string;
  description: string;
  utr?: string;
  screenshotUrl?: string;
  rejectionReason?: string;
  reviewedAt?: Timestamp;
  upiId?: string;
  bankDetails?: string;
};


export type KycApplication = {
    id: string; // doc id is user id
    userId: string;
    userName: string;
    userAvatar: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: Timestamp;
    reviewedAt?: Timestamp;
    rejectionReason?: string;
    aadhaarPanUrl: string;
    selfieUrl: string;
    bankDetails?: string;
    upiId?: string;
};


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
    const now = new Date();
    const startTime = tournament.startTime.toDate();
    const endTime = tournament.endTime.toDate();

    if (tournament.status === 'cancelled' || tournament.status === 'completed') {
        return tournament.status;
    }

    if (now < startTime) {
        return 'upcoming';
    } else if (now >= startTime && now < endTime) {
        return 'live';
    } else {
        return 'completed';
    }
};

    