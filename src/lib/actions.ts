'use server';
import { initializeFirebase } from '@/firebase/server';
import { Match, MatchPlayer, MatchStatus } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

const { db } = initializeFirebase();

export const createMatch = async (values: any) => {
  try {
    const matchRef = db.collection('matches').doc();
    const match: Match = {
      id: matchRef.id,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: values.user.id,
      status: MatchStatus.PENDING,
      players: {
        [values.user.id]: {
          id: values.user.id,
          name: values.user.name,
          avatar: values.user.avatar,
          isCreator: true,
        },
      },
      betAmount: values.betAmount,
    };
    await matchRef.set(match);
    revalidatePath('/lobby');
    return {
      success: true,
      message: 'Match created successfully',
      matchId: matchRef.id,
    };
  } catch (error: any) {
    console.error('Error creating match:', error);
    return {
      success: false,
      message: error.message || 'Failed to create match. Please try again.',
    };
  }
};
