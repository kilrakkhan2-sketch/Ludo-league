'use server';
/**
 * @fileOverview A flow to distribute winnings for a completed tournament.
 *
 * - distributeTournamentWinnings - Calculates and distributes the prize pool for a tournament.
 * - DistributeTournamentWinningsInput - Input for the function.
 * - DistributeTournamentWinningsOutput - Output for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { doc, runTransaction, collection, serverTimestamp, getFirestore, writeBatch } from 'firebase/firestore';
import { getFirebaseApp } from '@/firebase/server';

const DistributeTournamentWinningsInputSchema = z.object({
  tournamentId: z.string().describe('The ID of the tournament.'),
});
export type DistributeTournamentWinningsInput = z.infer<typeof DistributeTournamentWinningsInputSchema>;

const DistributeTournamentWinningsOutputSchema = z.object({
  success: z.boolean().describe('Whether the distribution was successful.'),
  message: z.string().describe('A message indicating the result of the operation.'),
});
export type DistributeTournamentWinningsOutput = z.infer<typeof DistributeTournamentWinningsOutputSchema>;

export async function distributeTournamentWinnings(
  input: DistributeTournamentWinningsInput
): Promise<DistributeTournamentWinningsOutput> {
  return distributeTournamentWinningsFlow(input);
}

// This is a simplified prize distribution logic.
// In a real-world scenario, this would be much more complex.
const getPrizeDistribution = (prizePool: number, playerCount: number) => {
    const prizes: { [rank: number]: number } = {};
    if (playerCount < 4) {
        prizes[1] = prizePool; // Winner takes all
    } else {
        prizes[1] = prizePool * 0.5; // 50%
        prizes[2] = prizePool * 0.3; // 30%
        prizes[3] = prizePool * 0.2; // 20%
    }
    return prizes;
};


const distributeTournamentWinningsFlow = ai.defineFlow(
  {
    name: 'distributeTournamentWinningsFlow',
    inputSchema: DistributeTournamentWinningsInputSchema,
    outputSchema: DistributeTournamentWinningsOutputSchema,
  },
  async ({ tournamentId }) => {
    const firestore = getFirestore(getFirebaseApp());

    try {
      await runTransaction(firestore, async (transaction) => {
        const tournamentRef = doc(firestore, 'tournaments', tournamentId);
        const tournamentDoc = await transaction.get(tournamentRef);

        if (!tournamentDoc.exists()) {
          throw new Error('Tournament not found.');
        }

        const tournamentData = tournamentDoc.data();
        if (tournamentData.status !== 'completed') {
          throw new Error('Winnings can only be distributed for completed tournaments.');
        }
        if (tournamentData.prizeDistributed) {
          throw new Error('Prizes have already been distributed for this tournament.');
        }

        const commission = tournamentData.commissionValue || 0; // Assuming a value is set
        const netPrizePool = tournamentData.prizePool - commission;
        
        // This is a placeholder for fetching tournament rankings.
        // In a real app, you'd have a collection storing final tournament ranks.
        // For now, we'll simulate by picking the first 3 players as winners.
        const playerIds = tournamentData.playerIds;
        const rankings = playerIds.slice(0, 3).map((id: string, index: number) => ({ userId: id, rank: index + 1 }));

        const prizeDistribution = getPrizeDistribution(netPrizePool, playerIds.length);
        
        const batch = writeBatch(firestore);

        for (const winner of rankings) {
            const prizeAmount = prizeDistribution[winner.rank];
            if (prizeAmount && prizeAmount > 0) {
                const userRef = doc(firestore, 'users', winner.userId);
                const userDoc = await transaction.get(userRef);
                if (userDoc.exists()) {
                    const newBalance = (userDoc.data().walletBalance || 0) + prizeAmount;
                    batch.update(userRef, { walletBalance: newBalance });

                    // Log transaction
                    const transactionRef = doc(collection(firestore, 'transactions'));
                    batch.set(transactionRef, {
                        userId: winner.userId,
                        type: 'winnings',
                        amount: prizeAmount,
                        status: 'completed',
                        createdAt: serverTimestamp(),
                        relatedTournamentId: tournamentId,
                        description: `Rank ${winner.rank} prize in tournament ${tournamentData.name}.`,
                    });
                }
            }
        }
        
        batch.update(tournamentRef, { prizeDistributed: true });
        
        await batch.commit();
      });

      return {
        success: true,
        message: 'Tournament winnings distributed successfully!',
      };
    } catch (error: any) {
      console.error('Tournament Winnings Distribution Error:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred during prize distribution.',
      };
    }
  }
);
