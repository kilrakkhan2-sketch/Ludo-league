
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
  createdAt: any; // Can be server timestamp
  resultScreenshotURL?: string;
  winnerId?: string;
  prizePool?: number;
};

export type Transaction = {
  id: string;
  userId: string;
  userName?: string; // Denormalized for easier display
  userEmail?: string; // Denormalized for easier display
  type: "deposit" | "withdrawal" | "entry_fee" | "prize";
  amount: number;
  status: "pending" | "completed" | "failed";
  createdAt: any; // Can be server timestamp
  relatedId?: string; // e.g., matchId or depositId
};

export type DepositRequest = {
  id: string;
  userId: string;
  userName: string; // Denormalized for easier display
  userEmail: string; // Denormalized for easier display
  amount: number;
  transactionId: string;
  screenshotURL: string;
  status: "pending" | "approved" | "rejected";
  createdAt: any; // Can be server timestamp
};

export type AppSettings = {
  id: string;
  upiId?: string;
};
