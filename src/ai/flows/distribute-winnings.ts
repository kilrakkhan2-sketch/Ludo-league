'use server';
/**
 * @fileOverview A flow to distribute winnings for a completed match.
 *
 * - distributeWinnings - Calculates commission, creates a 'winnings' transaction, and updates player stats.
 * - DistributeWinningsInput - The input type for the distributeWinnings function.
 * - DistributeWinningsOutput - The return type for the distributeWinnings function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { doc, runTransaction, collection, serverTimestamp, getFirestore, getDoc, writeBatch } from 'firebase/firestore';
import { getFirebaseApp } from '@/firebase/server'; // Can use this to get firestore instance on server
import { calculateWinRate } from './calculate-win-rate';

const DistributeWinningsInputSchema = z.object({
  matchId: z.string().describe('The ID of the match to distribute winnings for.'),
});
export type DistributeWinningsInput = z.infer<typeof DistributeWinningsInputSchema>;

const DistributeWinningsOutputSchema = z.object({
  success: z.boolean().describe('Whether the distribution was successful.'),
  message: z.string().describe('A message indicating the result of the operation.'),
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
    const batch = writeBatch(firestore);
    
    try {
      const matchRef = doc(firestore, 'matches', matchId);
      const matchDoc = await getDoc(matchRef);

      if (!matchDoc.exists()) {
          throw new Error('Match not found.');
      }
      
      const matchData = matchDoc.data();
      if (matchData.status !== 'completed') {
          throw new Error('Winnings can only be distributed for completed matches.');
      }
      if (matchData.prizeDistributed) {
          throw new Error('Winnings have already been distributed for this match.');
      }
      
      const winnerId = matchData.winnerId;
      if (!winnerId) {
          throw new Error('No winner has been declared for this match.');
      }

      const prizePool = matchData.prizePool;
      const commission = prizePool * 0.10; // 10% commission
      const amountToCredit = prizePool - commission;
      
      // Mark match as prize distributed
      batch.update(matchRef, { prizeDistributed: true });
      
      // Log the winnings transaction. The onTransactionCreate cloud function will handle the balance update.
      const transactionRef = doc(collection(firestore, 'transactions'));
      batch.set(transactionRef, {
        userId: winnerId,
        type: 'winnings',
        amount: amountToCredit,
        status: 'completed',
        createdAt: serverTimestamp(),
        relatedMatchId: matchId,
        description: `Winnings for match ${matchId}`,
      });

      await batch.commit();

      // After winnings transaction is created, update stats for all players in the match
      const playerIds = matchData.playerIds || [];
      for (const playerId of playerIds) {
          await calculateWinRate({ userId: playerId });
      }

      return {
        success: true,
        message: 'Winnings distribution initiated and player stats updated! The winner\'s wallet will be credited shortly.',
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

    