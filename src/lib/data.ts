
export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  winRate: number;
  ipAddress: string;
  deviceId: string;
};

export type Match = {
  id: string;
  entryFee: number;
  prizePool: number;
  players: User[];
  maxPlayers: number;
  status: 'waiting' | 'in-progress' | 'completed' | 'disputed';
  roomCode?: string;
  results?: MatchResult[];
};

export type MatchResult = {
  userId: string;
  position: number;
  status: 'win' | 'loss';
  screenshotUrl: string;
};

export type Transaction = {
  id: string;
  type: 'deposit' | 'withdrawal' | 'entry-fee' | 'winnings';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'rejected';
};

export type DepositRequest = {
  id: string;
  user: User;
  amount: number;
  utr: string;
  screenshotUrl: string;
  date: string;
};

export type FraudAlert = {
    id: string;
    matchId: string;
    user: User;
    reason: string;
    screenshotUrl: string;
    date: string;
}

export const mockUsers: User[] = [
  { id: 'user-1', name: 'PlayerOne', avatarUrl: 'https://picsum.photos/seed/avatar1/40/40', winRate: 65, ipAddress: '192.168.1.1', deviceId: 'device-abc-123' },
  { id: 'user-2', name: 'PlayerTwo', avatarUrl: 'https://picsum.photos/seed/avatar2/40/40', winRate: 58, ipAddress: '192.168.1.2', deviceId: 'device-def-456' },
  { id: 'user-3', name: 'PlayerThree', avatarUrl: 'https://picsum.photos/seed/avatar3/40/40', winRate: 72, ipAddress: '192.168.1.1', deviceId: 'device-ghi-789' },
  { id: 'user-4', name: 'PlayerFour', avatarUrl: 'https://picsum.photos/seed/avatar4/40/40', winRate: 91, ipAddress: '192.168.1.4', deviceId: 'device-jkl-012' },
];

export const mockMatches: Match[] = [
  {
    id: 'match-1',
    entryFee: 100,
    prizePool: 380,
    players: mockUsers.slice(0, 3),
    maxPlayers: 4,
    status: 'waiting',
  },
  {
    id: 'match-2',
    entryFee: 50,
    prizePool: 190,
    players: mockUsers.slice(0, 4),
    maxPlayers: 4,
    status: 'in-progress',
    roomCode: '12345678',
    results: [
        { userId: 'user-1', position: 2, status: 'loss', screenshotUrl: 'https://picsum.photos/seed/ludoA1/600/400'},
        { userId: 'user-2', position: 1, status: 'win', screenshotUrl: 'https://picsum.photos/seed/ludoA2/600/400'},
    ]
  },
  {
    id: 'match-3',
    entryFee: 200,
    prizePool: 760,
    players: mockUsers.slice(1, 3),
    maxPlayers: 4,
    status: 'waiting',
  },
  {
    id: 'match-4',
    entryFee: 500,
    prizePool: 1900,
    players: mockUsers.slice(0, 4),
    maxPlayers: 4,
    status: 'completed',
    results: [
        { userId: 'user-1', position: 1, status: 'win', screenshotUrl: 'https://picsum.photos/seed/ludoB1/600/400'},
        { userId: 'user-2', position: 2, status: 'loss', screenshotUrl: 'https://picsum.photos/seed/ludoB2/600/400'},
        { userId: 'user-3', position: 3, status: 'loss', screenshotUrl: 'https://picsum.photos/seed/ludoB3/600/400'},
        { userId: 'user-4', position: 4, status: 'loss', screenshotUrl: 'https://picsum.photos/seed/ludoB4/600/400'},
    ]
  },
  {
    id: 'match-5',
    entryFee: 150,
    prizePool: 280,
    players: mockUsers.slice(0, 2),
    maxPlayers: 2,
    status: 'disputed',
    results: [
        { userId: 'user-1', position: 1, status: 'win', screenshotUrl: 'https://picsum.photos/seed/ludoC1/600/400'},
        { userId: 'user-2', position: 1, status: 'win', screenshotUrl: 'https://picsum.photos/seed/ludoC2/600/400'},
    ]
  },
];

export const mockTransactions: Transaction[] = [
  { id: 'txn-1', type: 'deposit', amount: 500, date: '2024-05-20', status: 'completed' },
  { id: 'txn-2', type: 'entry-fee', amount: -100, date: '2024-05-21', status: 'completed' },
  { id: 'txn-3', type: 'winnings', amount: 380, date: '2024-05-22', status: 'completed' },
  { id: 'txn-4', type: 'withdrawal', amount: -500, date: '2024-05-23', status: 'pending' },
  { id: 'txn-5', type: 'deposit', amount: 200, date: '2024-05-24', status: 'rejected' },
  { id: 'txn-6', type: 'entry-fee', amount: -50, date: '2024-05-25', status: 'completed' },
];

export const mockDepositRequests: DepositRequest[] = [
  {
    id: 'dep-1',
    user: mockUsers[0],
    amount: 500,
    utr: 'UTR1234567890',
    screenshotUrl: 'https://picsum.photos/seed/payment1/300/500',
    date: '2024-05-24T10:00:00Z',
  },
  {
    id: 'dep-2',
    user: mockUsers[1],
    amount: 1000,
    utr: 'UTR0987654321',
    screenshotUrl: 'https://picsum.photos/seed/payment2/300/500',
    date: '2024-05-24T11:30:00Z',
  },
];


export const mockFraudAlerts: FraudAlert[] = [
    {
        id: 'fraud-1',
        matchId: 'match-101',
        user: mockUsers[2],
        reason: 'Duplicate screenshot detected. Previously used in match-98.',
        screenshotUrl: 'https://picsum.photos/seed/ludo-fraud/600/400',
        date: '2024-05-23T14:00:00Z',
    },
    {
        id: 'fraud-2',
        matchId: 'match-102',
        user: mockUsers[0],
        reason: 'Suspiciously high win rate (91%) over last 10 games.',
        screenshotUrl: 'https://picsum.photos/seed/ludo-fraud-2/600/400',
        date: '2024-05-22T18:00:00Z',
    }
]
