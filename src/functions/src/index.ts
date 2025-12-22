

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

admin.initializeApp();
const db = admin.firestore();

// Type definitions for robust data handling
interface UserData {
    walletBalance?: number;
    referralEarnings?: number;
    referredBy?: string;
    referralCode?: string;
    rating?: number;
    xp?: number;
    matchesPlayed?: number;
    matchesWon?: number;
    name?: string;
    [key: string]: any;
}

interface MaintenanceSettings {
  areMatchesDisabled?: boolean;
  matchesTimeScheduled?: boolean;
  matchesStartTime?: string;
  matchesEndTime?: string;
  [key: string]: any;
}

interface CommissionSettings {
    isEnabled?: boolean;
    rate?: number;
}

interface MatchResult {
    userId: string;
    confirmedPosition: number;
    confirmedWinStatus: 'win' | 'loss';
    screenshotUrl: string;
    submittedAt: any;
    confirmedAt: any;
    status: 'submitted' | 'confirmed' | 'mismatch' | 'locked';
}

// Helper function to send a personal notification
const sendNotification = (userId: string, title: string, body: string, link?: string) => {
    if (!userId) return;
    const notification = {
        title,
        body,
        isRead: false,
        createdAt: FieldValue.serverTimestamp(),
        link: link || null,
    };
    return db.collection(`users/${userId}/personal_notifications`).add(notification);
};


// =================================================================
//  USER & ROLE MANAGEMENT FUNCTIONS
// =================================================================

export const setSuperAdminRole = functions.https.onCall(async (data, context) => {
  const email = data.email;
  if (typeof email !== "string" || email.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with one argument "email" containing the user email address.');
  }
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { role: 'superadmin' });
    return {
      message: `Success! ${email} has been made a superadmin.`
    };
  } catch (error) {
    console.error("Failed to set superadmin role:", error);
    throw new functions.https.HttpsError('internal', 'An error occurred while trying to set the user role.');
  }
});

export const setUserRole = functions.https.onCall(async (data, context) => {
  if (context.auth?.token.role !== 'superadmin') {
    throw new functions.https.HttpsError('permission-denied', 'Only superadmins can set user roles.');
  }

  const { userId, role } = data;

  if (typeof userId !== 'string' || userId.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "userId" argument.');
  }

  if (typeof role !== 'string' || role.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "role" argument.');
  }

  try {
    await admin.auth().setCustomUserClaims(userId, { role: role });
    await db.collection('users').doc(userId).set({ role: role }, { merge: true });

    return {
      message: `Success! User ${userId} has been assigned the role of ${role}.`
    };
  } catch (error) {
    console.error("Failed to set user role:", error);
    throw new functions.https.HttpsError('internal', 'An error occurred while trying to set the user role.');
  }
});

// =================================================================
//  WITHDRAWAL MANAGEMENT FUNCTIONS
// =================================================================

export const approveWithdrawal = functions.https.onCall(async (data, context) => {
    // 1. Check permissions
    if (context.auth?.token.role !== 'withdrawal_admin' && context.auth?.token.role !== 'superadmin') {
        throw new functions.https.HttpsError('permission-denied', 'Only withdrawal admins can approve requests.');
    }
    
    // 2. Validate data
    const { withdrawalId } = data;
    if (!withdrawalId || typeof withdrawalId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "withdrawalId" argument.');
    }

    const adminUid = context.auth.uid;
    const requestRef = db.collection('withdrawal-requests').doc(withdrawalId);
    
    // 3. Perform transaction
    try {
        const requestDoc = await requestRef.get();
        if (!requestDoc.exists) throw new Error('Withdrawal request not found.');
        const requestData = requestDoc.data();
        if (requestData?.status !== 'pending') throw new Error('This request has already been processed.');

        const { amount, userId } = requestData;
        
        await db.runTransaction(async (t) => {
            const adminRef = db.collection('users').doc(adminUid);
            const userTxQuery = db.collection(`users/${userId}/transactions`).where('relatedId', '==', withdrawalId).limit(1);
            const userTxSnapshot = await t.get(userTxQuery);
            const userTxRef = userTxSnapshot.docs[0]?.ref;

            // A. Update withdrawal request status
            t.update(requestRef, {
                status: 'approved',
                processedAt: FieldValue.serverTimestamp(),
                processedBy: adminUid,
            });

            // B. Update the user's transaction status to completed
            if (userTxRef) {
                t.update(userTxRef, { status: 'completed' });
            }

            // C. Deduct the amount from the admin's wallet as a ledger
            t.update(adminRef, { walletBalance: FieldValue.increment(-amount) });
        });

        functions.logger.info(`Withdrawal ${withdrawalId} approved by admin ${adminUid}.`);
        await sendNotification(userId, 'Withdrawal Approved', `Your withdrawal request for ₹${amount} has been approved and processed.`);
        return { success: true, message: 'Withdrawal approved successfully.' };
        
    } catch (error) {
        functions.logger.error(`Error approving withdrawal ${withdrawalId}:`, error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError('internal', (error as Error).message);
    }
});


export const rejectWithdrawal = functions.https.onCall(async (data, context) => {
    // 1. Check permissions
    if (context.auth?.token.role !== 'withdrawal_admin' && context.auth?.token.role !== 'superadmin') {
        throw new functions.https.HttpsError('permission-denied', 'Only withdrawal admins can reject requests.');
    }
    
    // 2. Validate data
    const { withdrawalId } = data;
    if (!withdrawalId || typeof withdrawalId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "withdrawalId" argument.');
    }

    const adminUid = context.auth.uid;
    const requestRef = db.collection('withdrawal-requests').doc(withdrawalId);
    
    try {
        const requestDoc = await requestRef.get();
        if (!requestDoc.exists) throw new functions.https.HttpsError('not-found', 'Withdrawal request not found.');
        const requestData = requestDoc.data();
        if (requestData?.status !== 'pending') throw new functions.https.HttpsError('failed-precondition', 'This request has already been processed.');
        
        const { userId, amount } = requestData;
        const userRef = db.collection('users').doc(userId);
        const userTxQuery = db.collection(`users/${userId}/transactions`).where('relatedId', '==', withdrawalId).limit(1);
        
        await db.runTransaction(async (t) => {
            const userTxSnapshot = await t.get(userTxQuery);
            const userTxRef = userTxSnapshot.docs[0]?.ref;
        
            // A. Update withdrawal request
            t.update(requestRef, {
                status: 'rejected',
                processedAt: FieldValue.serverTimestamp(),
                processedBy: adminUid,
            });

            // B. Refund the user
            t.update(userRef, { walletBalance: FieldValue.increment(amount) });

            // C. Mark user's transaction as failed
            if (userTxRef) {
                t.update(userTxRef, { status: 'failed', description: 'Withdrawal request rejected by admin' });
            }
        });

        functions.logger.info(`Withdrawal ${withdrawalId} for user ${userId} was rejected and funds were refunded.`);
        await sendNotification(userId, 'Withdrawal Rejected', `Your withdrawal request for ₹${amount} was rejected. The amount has been refunded to your wallet.`);
        
        return { success: true, message: 'Withdrawal rejected and funds refunded.' };

    } catch (error) {
        functions.logger.error(`Failed to refund user for rejected withdrawal ${withdrawalId}:`, error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred while rejecting the withdrawal.');
    }
});


// =================================================================
//  FIRESTORE TRIGGERS (Automated Actions)
// =================================================================

export const onDepositStatusChange = functions.firestore
  .document("deposit-requests/{depositId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (beforeData.status === "approved" || afterData.status !== "approved") {
        return null;
    }
    
    const { userId, amount, upiAccountId } = afterData;
    if (!userId || !amount || amount <= 0 || !upiAccountId) {
        functions.logger.error("Missing or invalid userId, amount, or upiAccountId", { id: context.params.depositId });
        return null;
    }

    const userRef = db.collection("users").doc(userId);
    const upiAccountRef = db.collection('upi-accounts').doc(upiAccountId);
    const commissionSettingsRef = db.collection('settings').doc('commission');


    try {
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new Error(`User ${userId} not found.`);
            const userData = userDoc.data() as UserData;
            
            const commissionSettingsDoc = await t.get(commissionSettingsRef);
            const commissionSettings = commissionSettingsDoc.data() as CommissionSettings | undefined;

            // 1. Credit the user's wallet.
            t.update(userRef, { walletBalance: FieldValue.increment(amount) });
            
            // 2. Update the UPI account's daily stats
            t.update(upiAccountRef, {
                dailyAmountReceived: FieldValue.increment(amount),
                dailyTransactionCount: FieldValue.increment(1)
            });

            // 3. Create a transaction log for the deposit.
            const depositTxRef = db.collection(`users/${userId}/transactions`).doc();
            t.set(depositTxRef, {
                amount: amount,
                type: "deposit",
                status: "completed",
                description: `Deposit of ₹${amount} approved.`,
                createdAt: FieldValue.serverTimestamp(),
                relatedId: context.params.depositId,
            });

            // 4. Handle referral commission if the user was referred and commission is enabled.
            if (userData.referredBy && commissionSettings?.isEnabled && typeof commissionSettings.rate === 'number' && commissionSettings.rate > 0) {
                const referrerQuery = db.collection('users').where('referralCode', '==', userData.referredBy).limit(1);
                const referrerSnapshot = await t.get(referrerQuery);
                if (!referrerSnapshot.empty) {
                    const referrerDoc = referrerSnapshot.docs[0];
                    const referrerRef = referrerDoc.ref;
                    const commissionAmount = amount * commissionSettings.rate; // Dynamic commission rate

                    t.update(referrerRef, {
                        walletBalance: FieldValue.increment(commissionAmount),
                        referralEarnings: FieldValue.increment(commissionAmount)
                    });
                    const commissionTxRef = db.collection(`users/${referrerDoc.id}/transactions`).doc();
                    const commissionPercentage = (commissionSettings.rate * 100).toFixed(0);
                    t.set(commissionTxRef, {
                        amount: commissionAmount,
                        type: "referral_bonus",
                        status: "completed",
                        description: `${commissionPercentage}% commission from ${userData.name || 'a referred user'}'s deposit.`,
                        createdAt: FieldValue.serverTimestamp(),
                        relatedId: context.params.depositId,
                    });
                }
            }
        });
        functions.logger.info(`Deposit processed for ${userId}.`);
        // Send notification to the user
        await sendNotification(userId, 'Deposit Approved', `Your deposit of ₹${amount} has been successfully added to your wallet.`);

    } catch (error) {
        functions.logger.error(`Transaction failed for deposit ${context.params.depositId}:`, error);
        await change.after.ref.update({ status: "failed", error: (error as Error).message });
    }
    return null;
});


export const autoVerifyResults = functions.firestore
    .document('matches/{matchId}/results/{userId}')
    .onCreate(async (snap, context) => {
        const { matchId } = context.params;
        const matchRef = db.collection('matches').doc(matchId);

        try {
            await db.runTransaction(async (transaction) => {
                const matchDoc = await transaction.get(matchRef);
                if (!matchDoc.exists) return null;
                const matchData = matchDoc.data();
                if (!matchData) return null;

                // If match is already processed, do nothing.
                if (['completed', 'disputed', 'verification'].includes(matchData.status)) {
                    return null;
                }
                
                // Set match status to processing as soon as the first result is in
                if (matchData.status === 'ongoing') {
                    transaction.update(matchRef, { status: 'processing' });
                }

                const resultsSnapshot = await matchRef.collection('results').get();
                const submittedResults = resultsSnapshot.docs.map(doc => doc.data() as MatchResult);

                // Check if all players have submitted their results.
                if (submittedResults.length !== matchData.maxPlayers) {
                    return null; // Wait for all results
                }

                // --- AUTO-VERIFICATION LOGIC ---
                const positions = new Set<number>();
                const winners = new Set<string>();

                for (const result of submittedResults) {
                    if (result.confirmedPosition) {
                        positions.add(result.confirmedPosition);
                    }
                    if (result.confirmedWinStatus === 'win') {
                        winners.add(result.userId);
                    }
                }

                // CHECK 1: Duplicate positions submitted (e.g., two 1st places)
                const hasDuplicatePositions = positions.size !== submittedResults.length;
                
                // CHECK 2: More than one winner claimed
                const hasMultipleWinners = winners.size > 1;

                if (hasDuplicatePositions || hasMultipleWinners) {
                    // If any check fails, mark as disputed for admin review.
                    transaction.update(matchRef, { status: 'disputed' });
                    functions.logger.info(`Match ${matchId} marked as disputed due to result conflict.`);
                } else {
                    // If all checks pass, mark for admin verification.
                    transaction.update(matchRef, { status: 'verification' });
                    functions.logger.info(`Match ${matchId} pending verification.`);
                }
            });
        } catch (error) {
            functions.logger.error(`Error processing results for match ${matchId}:`, error);
            await matchRef.update({ status: 'disputed', error: (error as Error).message });
        }
        
        return null;
    });

export const onMatchResultUpdate = functions.firestore
    .document("matches/{matchId}")
    .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const { matchId } = context.params;

    if (beforeData.status !== 'completed' && afterData.status === 'completed' && afterData.winnerId) {
        const { winnerId, prizePool, players, title } = afterData;

        if (!winnerId || !prizePool || prizePool <= 0) {
            functions.logger.error("Missing or invalid winnerId/prizePool", { id: matchId });
            return null;
        }
        
        try {
            await db.runTransaction(async (t) => {
                const winnerRef = db.collection("users").doc(winnerId);
                const winnerDoc = await t.get(winnerRef);
                if (!winnerDoc.exists) {
                    throw new Error(`Winner user ${winnerId} not found.`);
                }

                // 1. Update winner's balance, rating, xp, and stats
                t.update(winnerRef, { 
                    walletBalance: FieldValue.increment(prizePool),
                    rating: FieldValue.increment(10),
                    xp: FieldValue.increment(25),
                    matchesPlayed: FieldValue.increment(1),
                    matchesWon: FieldValue.increment(1)
                });
                
                // 2. Create prize transaction for winner
                const transactionRef = db.collection(`users/${winnerId}/transactions`).doc();
                t.set(transactionRef, {
                    amount: prizePool,
                    type: "prize",
                    status: "completed",
                    description: `Prize money from match: ${afterData.title}`,
                    relatedId: matchId,
                    createdAt: FieldValue.serverTimestamp(),
                });

                // 3. Update stats and ratings for all other players (losers)
                const loserIds = players.filter((pId: string) => pId !== winnerId);
                for (const loserId of loserIds) {
                    const loserRef = db.collection("users").doc(loserId);
                    // We can update loser stats without fetching them first using FieldValue
                    t.update(loserRef, {
                         rating: FieldValue.increment(-5),
                         matchesPlayed: FieldValue.increment(1)
                    });
                }
            });
            functions.logger.info(`Prize money, rating, and XP updated for match ${matchId}.`);
            // Send notifications
            await sendNotification(winnerId, 'You Won!', `Congratulations! You won ₹${prizePool} in the match "${title}".`, `/match/${matchId}`);
            const loserIds = players.filter((pId: string) => pId !== winnerId);
            for (const loserId of loserIds) {
                 await sendNotification(loserId, 'Match Result', `The match "${title}" has ended. Better luck next time!`, `/match/${matchId}`);
            }

        } catch (error) {
            functions.logger.error(`Failed to process results for match ${matchId}:`, error);
            await change.after.ref.update({ status: "error", error: (error as Error).message });
        }
        return null
    }
    return null;
});

// =================================================================
//  MATCH & TOURNAMENT CREATION
// =================================================================
export const createMatch = functions.https.onCall(async (data, context) => {
    // 1. Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to create a match.");
    }
    const userId = context.auth.uid;

    // 2. Maintenance Check
    const maintenanceDoc = await db.collection('settings').doc('maintenance').get();
    const maintenanceSettings = maintenanceDoc.data() as MaintenanceSettings;
    if (maintenanceSettings?.areMatchesDisabled) {
        throw new functions.https.HttpsError("unavailable", "Match creation is temporarily disabled by the admin.");
    }
     
    // 3. Data Validation
    const { title, entryFee, maxPlayers } = data;
    if (!title || typeof title !== "string" || title.length === 0 || title.length > 50) {
        throw new functions.https.HttpsError("invalid-argument", "Match title is required and must be 50 characters or less.");
    }
    if (typeof entryFee !== "number" || entryFee < 0) {
        throw new functions.https.HttpsError("invalid-argument", "A valid, non-negative entry fee is required.");
    }
    if (maxPlayers !== 2 && maxPlayers !== 4) {
        throw new functions.https.HttpsError("invalid-argument", "Max players must be either 2 or 4.");
    }

    // 4. Calculate Prize Pool (e.g., 90% of total entry fees)
    const prizePool = (entryFee * maxPlayers) * 0.90;

    const userRef = db.collection("users").doc(userId);
    const matchRef = db.collection("matches").doc();

    try {
        const newMatchId = await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) {
                throw new functions.https.HttpsError("not-found", "Your user profile does not exist.");
            }
            const userData = userDoc.data()!;
            const currentBalance = userData.walletBalance || 0;
            if (currentBalance < entryFee) {
                throw new functions.https.HttpsError("failed-precondition", "Insufficient funds to create this match.");
            }
            
            if (entryFee > 0) {
                t.update(userRef, { walletBalance: FieldValue.increment(-entryFee) });
                
                const transactionRef = db.collection(`users/${userId}/transactions`).doc();
                t.set(transactionRef, {
                    amount: -entryFee,
                    type: "entry_fee",
                    status: "completed",
                    description: `Entry fee for new match: ${title}`,
                    createdAt: FieldValue.serverTimestamp(),
                    relatedId: matchRef.id,
                });
            }
            
            t.set(matchRef, {
                title,
                entryFee,
                prizePool,
                maxPlayers,
                creatorId: userId,
                players: [userId],
                status: 'open',
                roomCode: null,
                resultStage: 'none',
                autoPayoutAllowed: true,
                createdAt: FieldValue.serverTimestamp(),
                startedAt: null,
                completedAt: null,
                winnerId: null,
            });
            
            return matchRef.id;
        });

        return {
            status: "success",
            message: "Match created successfully!",
            matchId: newMatchId,
        };

    } catch (error) {
        functions.logger.error(`Failed to create match for user ${userId}:`, error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        } else {
            throw new functions.https.HttpsError("internal", "An unexpected error occurred while creating the match.");
        }
    }
});


export const createTournament = functions.https.onCall(async (data, context) => {
    // 1. Authentication & Authorization Check
    if (!context.auth || !['superadmin', 'match_admin'].includes(context.auth.token.role)) {
        throw new functions.https.HttpsError("permission-denied", "You must be an admin to create a tournament.");
    }
    const adminUid = context.auth.uid;

    // 2. Data Validation
    const { name, description, entryFee, maxPlayers, commissionRate, prizeDistribution, startDate, endDate, bannerUrl } = data;
    if (!name || !description || typeof entryFee !== 'number' || typeof maxPlayers !== 'number' || typeof commissionRate !== 'number' || !prizeDistribution || !startDate) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required tournament information.");
    }
    
    // 3. Calculate final prize pool after commission
    const totalCollection = entryFee * maxPlayers;
    const adminCommission = totalCollection * commissionRate;
    const finalPrizePool = totalCollection - adminCommission;
    
    try {
        const tournamentRef = await db.collection("tournaments").add({
            name,
            description,
            entryFee,
            maxPlayers,
            commissionRate,
            prizePool: finalPrizePool,
            prizeDistribution,
            startDate: admin.firestore.Timestamp.fromDate(new Date(startDate)),
            endDate: endDate ? admin.firestore.Timestamp.fromDate(new Date(endDate)) : null,
            bannerUrl: bannerUrl || null,
            status: 'upcoming',
            players: [],
            creatorId: adminUid,
            createdAt: FieldValue.serverTimestamp()
        });

        return {
            status: "success",
            message: "Tournament created successfully!",
            tournamentId: tournamentRef.id,
        };

    } catch (error) {
        functions.logger.error(`Failed to create tournament by admin ${adminUid}:`, error);
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while creating the tournament.");
    }
});

    