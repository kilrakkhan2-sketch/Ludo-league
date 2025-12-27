import { FieldValue } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: 'superadmin' | 'deposit_admin' | 'withdrawal_admin' | 'match_admin' | 'user';
  status?: 'online' | 'offline';
  isBlocked?: boolean;
  isVerified?: boolean;
  stats: {
    matchesPlayed: number;
    matchesWon: number;
    totalWinnings: number;
  };
  rating: number;
  xp: number;
  wallet: {
    balance: number;
  };
  referralCode: string;
  referralEarnings: number;
  referredBy?: string;
  notifications?: {
    friendRequests: boolean;
    matchUpdates: boolean;
    newsletter: boolean;
  }
  createdAt: FieldValue;
}

export type MatchStatus = 'open' | 'waiting' | 'room_code_pending' | 'room_code_shared' | 'game_started' | 'result_submitted' | 'AUTO_VERIFIED' | 'FLAGGED' | 'COMPLETED' | 'PAID' | 'verification' | 'disputed' | 'cancelled';


export interface Match {
  id: string;
  title: string;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  creatorId: string;
  players: string[];
  status: MatchStatus;
  createdAt: any;
  roomCode?: string | null;
  joinerId?: string | null;
  creatorPosition?: number | null;
  joinerPosition?: number | null;
  winnerId?: string | null;
  startedAt?: any | null;
  completedAt?: any | null;
  fraudReasons?: string[];
  payoutStatus?: 'pending' | 'paid' | 'failed';
  finalCommission?: number;
  payoutAmount?: number;
  resolvedBy?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'entry_fee' | 'prize' | 'referral_bonus' | 'win' | 'add_money' | 'refund' | 'platform-fee' | 'prize_win' | 'penalty' | 'withdrawal_refund' | 'entry_fee_refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: any;
  description?: string;
  relatedId?: string;
}

export interface DepositRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    amount: number;
    transactionId: string;
    screenshotUrl: string;
    upiAccountId: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
    createdAt: any;
    processedAt?: any;
    processedBy?: string;
    method?: string; // e.g. 'upi'
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  method: string;
  details: any;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  processedAt?: any;
  processedBy?: string;
  rejectionReason?: string;
}

export interface MatchResult {
  id: string;
  userId: string;
  confirmedWinStatus: 'win' | 'loss';
  creatorPosition?: number;
  joinerPosition?: number;
  screenshotUrl: string;
  submittedAt: any;
}


export interface KycRequest {
    id: string;
    userId: string;
    fullName: string;
    documentType: string;
    documentNumber: string;
    documentUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any;
    processedAt?: any;
    documentFrontImage?: string;
}

export interface Tournament {
    id: string;
    name: string;
    description?: string;
    game?: string;
    entryFee: number;
    prizePool: number;
    maxPlayers: number;
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'live';
    startDate: any; // Changed from startTime
    endTime?: any;
    rounds?: any[];
    bannerUrl?: string;
    prizeDistribution?: any;
    creatorId?: string;
    createdAt?: any;
    players: string[];
}


export interface MaintenanceSettings {
  isAppDisabled: boolean;
  appDisabledMessage?: string;
  
  areDepositsDisabled: boolean;
  depositsTimeScheduled: boolean;
  depositsStartTime?: string;
  depositsEndTime?: string;

  areWithdrawalsDisabled: boolean;
  withdrawalsTimeScheduled: boolean;
  withdrawalsStartTime?: string;
  withdrawalsEndTime?: string;

  areMatchesDisabled: boolean;
  matchesTimeScheduled: boolean;
  matchesStartTime?: string;
  matchesEndTime?: string;
}

export interface UpiAccount {
  id: string;
  upiId: string;
  displayName: string;
  dailyLimit: number;
  isActive: boolean;
  dailyAmountReceived: number;
  dailyTransactionCount: number;
  createdAt: any;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'News' | 'Promo' | 'Update' | 'Warning';
  createdAt: any;
}

export interface Message {
  id: string;
  userId: string;
  userName: string; // Added for displaying name in chat
  text: string;
  role: 'user' | 'admin';
  createdAt: any;
}

export interface AdminChatMessage extends Message {}

export interface CommissionSettings {
    isEnabled: boolean;
    rate: number;
}

export interface Penalty {
    id: string;
    userId: string;
    reason: 'wrong_result' | 'abusive_language' | 'other';
    amount: number;
    description: string;
    adminId: string;
    createdAt: FieldValue;
    relatedMatchId?: string;
}

export interface PersonalNotification {
  id: string;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: any;
}
