
export type UserProfile = {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  username?: string;
  photoURL?: string;
  walletBalance: number;
  isVerified: boolean;
  role: 'superadmin' | 'deposit_admin' | 'withdrawal_admin' | 'match_admin' | 'user';
  createdAt?: any;
  rating?: number;
  xp?: number;
  rank?: number;
  bannerUrl?: string;
  displayName?: string;
  referralCode?: string;
  referredBy?: string;
  referralEarnings?: number;
  friends?: string[];
  matchesPlayed?: number;
  matchesWon?: number;
};

export type Match = {
  id: string;
  title: string;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  creatorId: string;
  players: string[];
  roomCode: string | null;
  status: "open" | "ongoing" | "processing" | "verification" | "completed" | "disputed";
  resultStage?: "none" | "stage1" | "stage2" | "verified";
  autoPayoutAllowed?: boolean;
  createdAt: any;
  startedAt: any | null;
  completedAt: any | null;
  winnerId?: string;
};

export type MatchResult = {
  id: string;
  userId: string;
  position: number;
  winStatus: 'win' | 'loss';
  screenshotUrl: string;
  submittedAt: any;
  confirmedPosition?: number;
  confirmedWinStatus?: 'win' | 'loss';
  confirmedAt?: any;
  status: 'submitted' | 'confirmed' | 'mismatch' | 'locked';
};

export type Transaction = {
  id: string;
  userId: string;
  userName?: string; // Denormalized for easier display
  userEmail?: string; // Denormalized for easier display
  type: "deposit" | "withdrawal" | "entry_fee" | "prize" | "win" | "add_money" | "referral_bonus";
  amount: number;
  status: "pending" | "completed" | "failed";
  createdAt: any; // Can be server timestamp
  relatedId?: string; // e.g., matchId or depositId
  description?: string;
};

export type DepositRequest = {
  id: string;
  userId: string;
  userName: string; // Denormalized for easier display
  userEmail: string; // Denormalized for easier display
  amount: number;
  transactionId: string;
  screenshotUrl: string;
  upiAccountId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: any; // Can be server timestamp
  processedAt?: any;
  processedBy?: string; // UID of the admin who processed it
};

export type WithdrawalRequest = {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    amount: number;
    method: string;
    details: string; // e.g., UPI ID or bank account info
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any;
    processedAt?: any;
    processedBy?: string; // UID of the admin who processed it
}

export type UpiAccount = {
  id: string;
  upiId: string;
  displayName: string;
  isActive: boolean;
  dailyLimit: number;
  dailyAmountReceived: number;
  dailyTransactionCount: number;
  totalTransactions: number;
  totalAmountReceived: number;
  createdAt: any;
};

export type UpiDailyStat = {
  amount: number;
  transactionCount: number;
}

export type MaintenanceSettings = {
  id: string;
  isAppDisabled?: boolean;
  appDisabledMessage?: string;
  areDepositsDisabled?: boolean;
  depositsTimeScheduled?: boolean;
  depositsStartTime?: string; // e.g., "22:00"
  depositsEndTime?: string; // e.g., "10:00"
  areWithdrawalsDisabled?: boolean;
  withdrawalsTimeScheduled?: boolean;
  withdrawalsStartTime?: string;
  withdrawalsEndTime?: string;
  areMatchesDisabled?: boolean;
  matchesTimeScheduled?: boolean;
  matchesStartTime?: string;
  matchesEndTime?: string;
};

export type CommissionSettings = {
    id: string;
    isEnabled: boolean;
    rate: number; // e.g., 0.05 for 5%
}


export type Message = {
    id: string;
    userId: string;
    text: string;
    createdAt: any;
}

export type AdminChatMessage = {
    id: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: any;
}


export type KycRequest = {
  id: string;
  userId: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  processedAt?: any;
  processedBy?: string;
}

export type Referral = {
    id: string;
    referrerId: string; // User who referred
    referredId: string;  // User who was referred
    status: 'pending' | 'completed'; // Completed after referred user plays first game
    createdAt: any;
}

export type FriendRequest = {
  id: string;
  from: string;
  to: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
};

export type Tournament = {
  id: string;
  name: string;
  description: string;
  prizePool: number;
  entryFee: number;
  startDate: any;
  endDate: any;
  status: 'upcoming' | 'live' | 'completed';
  players: string[];
  maxPlayers: number;
  creatorId: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  type: 'News' | 'Promo' | 'Update' | 'Warning';
  createdAt: any;
  link?: string;
};

export type PersonalNotification = {
    id: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: any;
    link?: string;
};

    