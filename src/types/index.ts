import { FieldValue } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  roles: string[];
  isBlocked?: boolean;
  isVerified?: boolean;
  stats: {
    matchesPlayed: number;
    matchesWon: number;
    totalEarnings: number;
  };
  wallet: {
    balance: number;
  };
  createdAt: FieldValue;
}

export type MatchStatus = 'waiting' | 'in-progress' | 'completed' | 'cancelled' | 'disputed';

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
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'entry-fee' | 'prize-money';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: any;
  details: any; 
}

export interface DepositRequest extends Transaction {
  type: 'deposit';
  method: string; // e.g., 'upi', 'razorpay'
  transactionId: string;
  screenshotUrl?: string; // Added this line
}

export interface WithdrawalRequest extends Transaction {
  type: 'withdrawal';
  method: string; // e.g., 'upi', 'bank'
  details: {
    accountHolderName: string;
    upiId?: string;
    bankAccountNumber?: string;
    ifscCode?: string;
  };
}

export interface KycRequest {
    id: string;
    userId: string;
    name: string;
    dob: string;
    documentType: 'aadhar' | 'pan';
    documentNumber: string;
    documentFrontImage: string;
    documentBackImage?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any;
    lastUpdated: any;
}

export interface Tournament {
    id: string;
    name: string;
    game: string; // e.g., 'ludo', 'freefire'
    entryFee: number;
    prizePool: number;
    maxPlayers: number;
    registeredPlayers: number;
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    startTime: any;
    endTime?: any;
    rounds: any[]; // Define a more specific type for rounds if needed
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
