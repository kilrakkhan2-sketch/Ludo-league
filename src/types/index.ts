

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
  role: 'superadmin' | 'deposit_admin' | 'match_admin' | 'user';
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
  creatorId: string;
  title: string;
  entryFee: number;
  maxPlayers: number;
  privacy: "public" | "private";
  ludoKingCode?: string;
  status: "open" | "ongoing" | "completed" | "cancelled" | "verification";
  players: string[];
  createdAt: any; // Can be server timestamp
  winnerId?: string;
  prizePool?: number;
  results?: {
      userId: string;
      screenshotUrl: string;
      status: 'won' | 'lost';
      submittedAt: any;
  }[];
  winnerDeclaredBy?: string;
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

export type AppSettings = {
  id: string;
  upiId?: string;
};

export type Message = {
    id: string;
    userId: string;
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
