'use server';
/**
 * @fileOverview A flow to delete old records from Firestore to save space.
 *
 * - deleteOldRecords - Deletes matches and transactions older than a specified number of months.
 * - DeleteOldRecordsInput - The input type for the function.
 * - DeleteOldRecordsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, query, where, getDocs, writeBatch, Timestamp, getFirestore } from 'firebase/firestore';
import { getFirebaseApp } from '@/firebase/server';

const DeleteOldRecordsInputSchema = z.object({
  months: z.number().int().positive().describe('The age in months. Records older than this will be deleted.'),
});
export type DeleteOldRecordsInput = z.infer<typeof DeleteOldRecordsInputSchema>;

const DeleteOldRecordsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  deletedMatchesCount: z.number().optional(),
  deletedTransactionsCount: z.number().optional(),
});
export type DeleteOldRecordsOutput = z.infer<typeof DeleteOldRecordsOutputSchema>;

export async function deleteOldRecords(input: DeleteOldRecordsInput): Promise<DeleteOldRecordsOutput> {
  return deleteOldRecordsFlow(input);
}

const deleteOldRecordsFlow = ai.defineFlow(
  {
    name: 'deleteOldRecordsFlow',
    inputSchema: DeleteOldRecordsInputSchema,
    outputSchema: DeleteOldRecordsOutputSchema,
  },
  async ({ months }) => {
    const firestore = getFirestore(getFirebaseApp());

    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);
      const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

      let deletedMatchesCount = 0;
      let deletedTransactionsCount = 0;

      // Batch deletion for matches
      const matchesQuery = query(
        collection(firestore, 'matches'),
        where('status', '==', 'completed'),
        where('createdAt', '<', cutoffTimestamp)
      );
      const matchesSnapshot = await getDocs(matchesQuery);
      
      let matchBatch = writeBatch(firestore);
      matchesSnapshot.forEach((doc, index) => {
        matchBatch.delete(doc.ref);
        deletedMatchesCount++;
        if ((index + 1) % 500 === 0) {
          matchBatch.commit();
          matchBatch = writeBatch(firestore);
        }
      });
      await matchBatch.commit();

      // Batch deletion for transactions
      const transactionsQuery = query(
        collection(firestore, 'transactions'),
        where('createdAt', '<', cutoffTimestamp)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);

      let transBatch = writeBatch(firestore);
      transactionsSnapshot.forEach((doc, index) => {
        transBatch.delete(doc.ref);
        deletedTransactionsCount++;
        if ((index + 1) % 500 === 0) {
          transBatch.commit();
          transBatch = writeBatch(firestore);
        }
      });
      await transBatch.commit();

      return {
        success: true,
        message: `Successfully deleted ${deletedMatchesCount} matches and ${deletedTransactionsCount} transactions.`,
        deletedMatchesCount,
        deletedTransactionsCount,
      };

    } catch (error: any) {
      console.error('Error deleting old records:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred during cleanup.',
      };
    }
  }
);
