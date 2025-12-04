

export type UserProfile = {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  photoURL: string;
  walletBalance: number;
  isVerified: boolean;
  role: 'superadmin' | 'deposit_admin' | 'match_admin' | 'user';
};

export type Match = {
  id: string;
  creatorId: string;
  title: string;
  entryFee: number;
  maxPlayers: number;
  privacy: "public" | "private";
  roomCode?: string;
  status: "open" | "ongoing" | "completed" | "cancelled" | "verification";
  players: string[];
  createdAt: string; // ISO 8601 date string
  resultScreenshotURL?: string;
  winnerId?: string;
};

export type Transaction = {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  type: "deposit" | "withdrawal" | "entry_fee" | "prize";
  amount: number;
  status: "pending" | "completed" | "failed";
  createdAt: string; // ISO 8601 date string
  relatedId?: string; // e.g., matchId or depositId
};

export type DepositRequest = {
  id: string;
  userId: string;
  amount: number;
  transactionId: string;
  screenshotURL: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string; // ISO 8601 date string
};

export type AppSettings = {
  id: string;
  upiId?: string;
};

    
