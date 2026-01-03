// This file is a placeholder for a real data service.
// In a real application, this would be replaced with API calls to a backend or a direct connection to a database.
// For this prototype, we are keeping the mock data to ensure the UI is functional.

import {
  mockMatches,
  mockUsers,
  mockTransactions,
  mockDepositRequests,
  mockFraudAlerts,
  mockTournaments,
} from './data';
import type {
  Match,
  User,
  Transaction,
  DepositRequest,
  FraudAlert,
  Tournament,
} from './data';

// Simulate a delay to mimic network latency
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function getMatches(): Promise<Match[]> {
  await delay(500);
  return mockMatches;
}

export async function getMatch(id: string): Promise<Match | undefined> {
  await delay(300);
  return mockMatches.find((m) => m.id === id);
}

export async function getUsers(): Promise<User[]> {
  await delay(200);
  return mockUsers;
}

export async function getUser(id: string): Promise<User | undefined> {
  await delay(100);
  return mockUsers.find((u) => u.id === id);
}

export async function getTransactions(): Promise<Transaction[]> {
  await delay(400);
  return mockTransactions;
}

export async function getDepositRequests(): Promise<DepositRequest[]> {
  await delay(600);
  return mockDepositRequests;
}

export async function getFraudAlerts(): Promise<FraudAlert[]> {
  await delay(700);
  return mockFraudAlerts;
}

export async function getTournaments(): Promise<Tournament[]> {
    await delay(500);
    return mockTournaments;
}

export async function getTournament(id: string): Promise<Tournament | undefined> {
    await delay(300);
    return mockTournaments.find((t) => t.id === id);
}

// In a real app, these mutation functions would interact with a database.
export async function createMatch(newMatch: Omit<Match, 'id' | 'players' | 'status'>) {
    await delay(1000);
    const user = await getUser('user-1'); // Assume creator is user-1
    if (!user) throw new Error("User not found");

    const match: Match = {
        ...newMatch,
        id: `match-${Date.now()}`,
        players: [user],
        status: 'waiting',
    };
    mockMatches.unshift(match);
    return match;
}

export async function joinMatch(matchId: string, userId: string) {
    await delay(500);
    const match = mockMatches.find(m => m.id === matchId);
    const user = mockUsers.find(u => u.id === userId);
    if (match && user && match.players.length < match.maxPlayers && !match.players.some(p => p.id === userId)) {
        match.players.push(user);
        return match;
    }
    throw new Error("Failed to join match");
}

export async function submitMatchResult(data: {matchId: string, userId: string, position: number, status: 'win' | 'loss', screenshotUrl: string}) {
    await delay(1000);
    const match = mockMatches.find(m => m.id === data.matchId);
    if (!match) throw new Error("Match not found");
    if (!match.results) match.results = [];

    // Simple conflict detection
    if(data.status === 'win' && match.results.some(r => r.status === 'win')) {
        match.status = 'disputed';
    }

    match.results.push({
        userId: data.userId,
        position: data.position,
        status: data.status,
        screenshotUrl: data.screenshotUrl,
    });
    return { match, isDisputed: match.status === 'disputed' };
}
