'use server';
/**
 * @fileOverview A flow to distribute winnings for a completed match.
 *
 * - distributeWinnings - Calculates commission, updates winner's wallet, and logs the transaction.
 * - DistributeWinningsInput - The input type for the distributeWinnings function.
 * - DistributeWinningsOutput - The return type for the distributeWinnings function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { doc, runTransaction, collection, serverTimestamp, getFirestore, getDoc } from 'firebase/firestore';
import { getFirebaseApp } from '@/firebase/server'; // Can use this to get firestore instance on server
import { calculateWinRate } from './calculate-win-rate';

const DistributeWinningsInputSchema = z.object({
  matchId: z.string().describe('The ID of the match to distribute winnings for.'),
});
export type DistributeWinningsInput = z.infer<typeof DistributeWinningsInputSchema>;

const DistributeWinningsOutputSchema = z.object({
  success: z.boolean().describe('Whether the distribution was successful.'),
  message: z.string().describe('A message indicating the result of the operation.'),
  newBalance: z.number().optional().describe("The winner's new wallet balance."),
});
export type DistributeWinningsOutput = z.infer<typeof DistributeWinningsOutputSchema>;

export async function distributeWinnings(input: DistributeWinningsInput): Promise<DistributeWinningsOutput> {
  return distributeWinningsFlow(input);
}

const distributeWinningsFlow = ai.defineFlow(
  {
    name: 'distributeWinningsFlow',
    inputSchema: DistributeWinningsInputSchema,
    outputSchema: DistributeWinningsOutputSchema,
  },
  async ({ matchId }) => {
    // Initialize Firestore on the server-side.
    const firestore = getFirestore(getFirebaseApp());
    const matchRef = doc(firestore, 'matches', matchId);
    
    try {
        const matchDoc = await getDoc(matchRef);
        if (!matchDoc.exists()) {
            throw new Error('Match not found.');
        }
        const matchData = matchDoc.data();
        const winnerId = matchData.winnerId;

        if (!winnerId) {
            throw new Error('No winner has been declared for this match.');
        }
        
      const newBalance = await runTransaction(firestore, async (transaction) => {
        // We re-fetch the match doc inside the transaction to ensure atomicity
        const freshMatchDoc = await transaction.get(matchRef);
        if (!freshMatchDoc.exists()) throw new Error('Match not found.');
        
        const freshMatchData = freshMatchDoc.data();
        if (freshMatchData.status !== 'completed') throw new Error('Winnings can only be distributed for completed matches.');
        if (freshMatchData.prizeDistributed) throw new Error('Winnings have already been distributed for this match.');

        const winnerRef = doc(firestore, 'users', winnerId);
        const winnerDoc = await transaction.get(winnerRef);
        if (!winnerDoc.exists()) throw new Error('Winner not found.');

        const winnerData = winnerDoc.data();
        const prizePool = freshMatchData.prizePool;
        const commission = prizePool * 0.05; // 5% commission
        const amountToCredit = prizePool - commission;
        
        const currentBalance = winnerData.walletBalance || 0;
        const updatedBalance = currentBalance + amountToCredit;
        
        // Update winner's wallet
        transaction.update(winnerRef, { walletBalance: updatedBalance });
        
        // Mark match as prize distributed
        transaction.update(matchRef, { prizeDistributed: true });
        
        // Log the winnings transaction in a new document in 'transactions' collection
        const transactionRef = doc(collection(firestore, 'transactions'));
        transaction.set(transactionRef, {
          userId: winnerId,
          type: 'winnings',
          amount: amountToCredit,
          status: 'completed',
          createdAt: serverTimestamp(),
          relatedMatchId: matchId,
          description: `Winnings for match ${matchId}`,
        });

        return updatedBalance;
      });

      // After winnings are distributed, update stats for all players in the match
      const finalMatchDoc = await getDoc(matchRef); // Re-fetch to get latest player list
      const playerIds = finalMatchDoc.data()?.playerIds || [];
      for (const playerId of playerIds) {
          await calculateWinRate({ userId: playerId });
      }

      return {
        success: true,
        message: 'Winnings distributed successfully and player stats updated!',
        newBalance: newBalance,
      };

    } catch (error: any) {
      console.error('Winnings Distribution Error:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred during prize distribution.',
      };
    }
  }
);
