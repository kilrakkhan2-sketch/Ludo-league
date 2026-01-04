'use server';
/**
 * @fileOverview A flow to calculate and update a user's win rate.
 *
 * - calculateWinRate - Fetches user's matches, calculates win rate, and updates their profile.
 * - CalculateWinRateInput - The input type for the calculateWinRate function.
 * - CalculateWinRateOutput - The return type for the calculateWinRate function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, query, where, getDocs, doc, updateDoc, getFirestore } from 'firebase/firestore';
import { getFirebaseApp } from '@/firebase/server';

const CalculateWinRateInputSchema = z.object({
  userId: z.string().describe("The ID of the user whose win rate needs to be calculated."),
});
export type CalculateWinRateInput = z.infer<typeof CalculateWinRateInputSchema>;

const CalculateWinRateOutputSchema = z.object({
  success: z.boolean().describe("Whether the calculation and update were successful."),
  winRate: z.number().optional().describe("The user's new win rate in percentage."),
  totalMatches: z.number().optional().describe("Total matches played by the user."),
  totalWins: z.number().optional().describe("Total matches won by the user."),
  message: z.string().describe("A message indicating the result."),
});
export type CalculateWinRateOutput = z.infer<typeof CalculateWinRateOutputSchema>;

export async function calculateWinRate(input: CalculateWinRateInput): Promise<CalculateWinRateOutput> {
  return calculateWinRateFlow(input);
}

const calculateWinRateFlow = ai.defineFlow(
  {
    name: 'calculateWinRateFlow',
    inputSchema: CalculateWinRateInputSchema,
    outputSchema: CalculateWinRateOutputSchema,
  },
  async ({ userId }) => {
    const firestore = getFirestore(getFirebaseApp());

    try {
      const matchesRef = collection(firestore, 'matches');
      
      // Query for matches where the user was a player and the match is completed
      const playedMatchesQuery = query(
        matchesRef,
        where('playerIds', 'array-contains', userId),
        where('status', '==', 'completed')
      );
      
      // Query for matches where the user was the winner
      const wonMatchesQuery = query(
        matchesRef,
        where('winnerId', '==', userId),
        where('status', '==', 'completed')
      );

      const [playedSnapshot, wonSnapshot] = await Promise.all([
        getDocs(playedMatchesQuery),
        getDocs(wonMatchesQuery),
      ]);

      const totalMatches = playedSnapshot.size;
      const totalWins = wonSnapshot.size;
      
      const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

      // Update the user's profile
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        winRate: winRate,
        totalMatchesPlayed: totalMatches,
        totalMatchesWon: totalWins
      });

      return {
        success: true,
        winRate,
        totalMatches,
        totalWins,
        message: `Win rate for user ${userId} updated to ${winRate}%.`,
      };
    } catch (error: any) {
      console.error('Error calculating win rate:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred while calculating win rate.',
      };
    }
  }
);
