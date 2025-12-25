

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

admin.initializeApp();
const db = admin.firestore();
const BUCKET_NAME = "studio-4431476254-c1156.appspot.com";

// Type definitions for robust data handling
interface UserData {
    wallet?: { balance: number };
    stats?: {
        totalWinnings?: number;
        rating?: number;
        xp?: number;
        matchesPlayed?: number;
        matchesWon?: number;
    }
    referralEarnings?: number;
    referredBy?: string;
    referralCode?: string;
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

// Helper function to send a personal notification
const sendNotification = (userId: string, title: string, body: string, link?: string): Promise<any> => {
    if (!userId) return Promise.resolve();
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

export const setSuperAdminRole = functions.https.onCall(async (data: any, context) => {
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

export const setUserBlockedStatus = functions.https.onCall(async (data, context) => {
    if (context.auth?.token.role !== 'superadmin') {
        throw new functions.https.HttpsError('permission-denied', 'Only superadmins can block users.');
    }
    const { userId, blocked } = data;
    if (typeof userId !== 'string' || typeof blocked !== 'boolean') {
        throw new functions.https.HttpsError('invalid-argument', 'userId (string) and blocked (boolean) are required.');
    }
    try {
        await admin.auth().updateUser(userId, { disabled: blocked });
        await db.collection('users').doc(userId).update({ isBlocked: blocked });
        return { success: true, message: `User ${userId} has been ${blocked ? 'blocked' : 'unblocked'}.` };
    } catch (error: any) {
        functions.logger.error(`Failed to update blocked status for user ${userId}:`, error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

export const deleteUserAccount = functions.https.onCall(async (_, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to delete your account.");
    }
    const uid = context.auth.uid;
    try {
        await admin.auth().deleteUser(uid);
        await db.collection('users').doc(uid).delete();
        functions.logger.info(`User ${uid} successfully deleted their account.`);
        return { success: true };
    } catch (error) {
        functions.logger.error(`Failed to delete user account for ${uid}:`, error);
        throw new functions.https.HttpsError('internal', "An error occurred while deleting your account.");
    }
});


// =================================================================
//  PENALTY & MODERATION FUNCTIONS
// =================================================================

export const applyPenalty = functions.https.onCall(async (data, context) => {
    // 1. Authentication & Authorization Check
    if (context.auth?.token.role !== 'superadmin') {
        throw new functions.https.HttpsError("permission-denied", "Only superadmins can apply penalties.");
    }
    const adminId = context.auth.uid;

    // 2. Data Validation
    const { userId, reason, amount, description, relatedMatchId } = data;
    if (!userId || !reason || typeof amount !== 'number' || amount <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "userId, reason, and a positive amount are required.");
    }

    const userRef = db.collection("users").doc(userId);

    // 3. Transaction to ensure atomicity
    return db.runTransaction(async (t) => {
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) {
            throw new functions.https.HttpsError("not-found", `User with ID ${userId} not found.`);
        }
        
        // A. Deduct amount from user's wallet
        t.update(userRef, { 'wallet.balance': FieldValue.increment(-amount) });

        // B. Create a transaction log for the user
        const userTxRef = db.collection(`users/${userId}/transactions`).doc();
        t.set(userTxRef, {
            amount: -amount, // Negative amount for deduction
            type: 'penalty',
            status: 'completed',
            description: `Penalty for: ${reason.replace(/_/g, ' ')}. ${description || ''}`,
            relatedId: relatedMatchId || null,
            createdAt: FieldValue.serverTimestamp(),
        });

        // C. Create a record in the penalties subcollection for auditing
        const penaltyRef = db.collection(`users/${userId}/penalties`).doc();
        t.set(penaltyRef, {
            userId,
            adminId,
            amount,
            reason,
            description: description || null,
            relatedMatchId: relatedMatchId || null,
            createdAt: FieldValue.serverTimestamp()
        });
        
        await sendNotification(userId, 'Penalty Applied', `A penalty of ₹${amount} has been deducted from your wallet for: ${reason.replace(/_/g, ' ')}.`);
        
        return { success: true, message: `Penalty of ₹${amount} applied to user ${userId}.` };
    }).catch(error => {
        functions.logger.error(`Failed to apply penalty to user ${userId} by admin ${adminId}:`, error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred while applying the penalty.');
    });
});


// =================================================================
//  STORAGE MANAGEMENT FUNCTIONS
// =================================================================
export const listStorageFiles = functions.https.onCall(async (data, context) => {
    if (context.auth?.token.role !== 'superadmin') {
        throw new functions.https.HttpsError("permission-denied", "You must be a superadmin to list files.");
    }
    const { prefix } = data;
    if (!prefix || typeof prefix !== 'string') {
        throw new functions.https.HttpsError("invalid-argument", "A valid folder prefix is required.");
    }

    try {
        const bucket = getStorage().bucket(BUCKET_NAME);
        const [files] = await bucket.getFiles({ prefix: prefix });

        const fileDetails = files.map(file => {
            const metadata = file.metadata;
            return {
                name: metadata.name,
                size: metadata.size,
                contentType: metadata.contentType,
                createdAt: metadata.timeCreated,
            };
        });

        return { files: fileDetails };
    } catch (error) {
        functions.logger.error(`Failed to list files for prefix ${prefix}:`, error);
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while listing files.");
    }
});


export const deleteStorageFile = functions.https.onCall(async (data, context) => {
    // 1. Authentication & Authorization Check
    if (context.auth?.token.role !== 'superadmin') {
        throw new functions.https.HttpsError("permission-denied", "You must be a superadmin to delete files.");
    }
    
    // 2. Data Validation
    const { filePath } = data;
    if (!filePath || typeof filePath !== 'string') {
        throw new functions.https.HttpsError("invalid-argument", "A valid file path is required.");
    }
    
    try {
        const bucket = getStorage().bucket(BUCKET_NAME);
        const file = bucket.file(filePath);
        
        const [exists] = await file.exists();
        if (!exists) {
            throw new functions.https.HttpsError("not-found", "The specified file does not exist.");
        }
        
        await file.delete();
        
        functions.logger.info(`File ${filePath} deleted by admin ${context.auth.uid}.`);
        return { success: true, message: "File deleted successfully." };

    } catch (error) {
        functions.logger.error(`Failed to delete file ${filePath}:`, error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        } else {
            throw new functions.https.HttpsError("internal", "An unexpected error occurred while deleting the file.");
        }
    }
});


// =================================================================
//  WITHDRAWAL MANAGEMENT FUNCTIONS
// =================================================================

export const approveWithdrawal = functions.https.onCall(async (data, context) => {
    // 1. Check permissions
    if (!context.auth || !['withdrawal_admin', 'superadmin'].includes(context.auth.token.role)) {
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
    return db.runTransaction(async (t) => {
        const requestDoc = await t.get(requestRef);
        if (!requestDoc.exists) throw new functions.https.HttpsError('not-found', 'Withdrawal request not found.');
        
        const requestData = requestDoc.data();
        if (requestData?.status !== 'pending') throw new functions.https.HttpsError('failed-precondition', 'This request has already been processed.');

        const { amount, userId } = requestData;
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

        // C. Create an admin wallet transaction for accounting
        const adminTxRef = db.collection('admin-wallet-transactions').doc();
        t.set(adminTxRef, {
            adminId: adminUid,
            type: 'debit',
            amount: amount,
            reason: 'withdrawal_approval',
            relatedUserId: userId,
            relatedRequestId: withdrawalId,
            createdAt: FieldValue.serverTimestamp(),
        });

        await sendNotification(userId, 'Withdrawal Approved', `Your withdrawal request for ₹${amount} has been approved and processed.`);
        return { success: true, message: 'Withdrawal approved successfully.' };
    }).catch(error => {
        functions.logger.error(`Error approving withdrawal ${withdrawalId}:`, error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError('internal', (error as Error).message || 'An unexpected error occurred.');
    });
});


export const rejectWithdrawal = functions.https.onCall(async (data, context) => {
    // 1. Check permissions
    if (!context.auth || !['withdrawal_admin', 'superadmin'].includes(context.auth.token.role)) {
        throw new functions.https.HttpsError('permission-denied', 'Only withdrawal admins can reject requests.');
    }
    
    // 2. Validate data
    const { withdrawalId, reason } = data;
    if (!withdrawalId || typeof withdrawalId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "withdrawalId" argument.');
    }

    const adminUid = context.auth.uid;
    const requestRef = db.collection('withdrawal-requests').doc(withdrawalId);
    
    return db.runTransaction(async (t) => {
        const requestDoc = await t.get(requestRef);
        if (!requestDoc.exists) throw new functions.https.HttpsError('not-found', 'Withdrawal request not found.');
        
        const requestData = requestDoc.data();
        if (requestData?.status !== 'pending') throw new functions.https.HttpsError('failed-precondition', 'This request has already been processed.');
        
        const { userId, amount } = requestData;
        const userRef = db.collection('users').doc(userId);
        const userTxQuery = db.collection(`users/${userId}/transactions`).where('relatedId', '==', withdrawalId).limit(1);
        const userTxSnapshot = await t.get(userTxQuery);
        const userTxRef = userTxSnapshot.docs[0]?.ref;
    
        // A. Update withdrawal request
        t.update(requestRef, {
            status: 'rejected',
            processedAt: FieldValue.serverTimestamp(),
            processedBy: adminUid,
            rejectionReason: reason || "Rejected by admin",
        });

        // B. Refund the user
        t.update(userRef, { 'wallet.balance': FieldValue.increment(amount) });

        // C. Mark user's transaction as failed
        if (userTxRef) {
            t.update(userTxRef, { 
                status: 'failed', 
                description: reason || 'Withdrawal request rejected by admin' 
            });
        }
        
        await sendNotification(userId, 'Withdrawal Rejected', `Your withdrawal request for ₹${amount} was rejected. The amount has been refunded to your wallet.`);
        return { success: true, message: 'Withdrawal rejected and funds refunded.' };

    }).catch(error => {
        functions.logger.error(`Failed to refund user for rejected withdrawal ${withdrawalId}:`, error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred while rejecting the withdrawal.');
    });
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
    
    const { userId, amount, upiAccountId, processedBy } = afterData;
    if (!userId || !amount || amount <= 0 || !upiAccountId || !processedBy) {
        functions.logger.error("Missing or invalid userId, amount, upiAccountId, or processedBy", { id: context.params.depositId });
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
            t.update(userRef, { 'wallet.balance': FieldValue.increment(amount) });
            
            // 2. Update the UPI account's daily stats on the main document
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
            
            // 4. Create an admin wallet transaction for accountability
            const adminTxRef = db.collection('admin-wallet-transactions').doc();
            t.set(adminTxRef, {
                adminId: processedBy,
                type: 'credit',
                amount: amount,
                reason: 'deposit_approval',
                relatedUserId: userId,
                relatedRequestId: context.params.depositId,
                createdAt: FieldValue.serverTimestamp(),
            });

            // 5. Handle referral commission if the user was referred and commission is enabled.
            if (userData.referredBy && commissionSettings?.isEnabled && typeof commissionSettings.rate === 'number' && commissionSettings.rate > 0) {
                const referrerQuery = db.collection('users').where('referralCode', '==', userData.referredBy).limit(1);
                const referrerSnapshot = await t.get(referrerQuery);
                if (!referrerSnapshot.empty) {
                    const referrerDoc = referrerSnapshot.docs[0];
                    const referrerRef = referrerDoc.ref;
                    const commissionAmount = amount * commissionSettings.rate; // Dynamic commission rate

                    t.update(referrerRef, {
                        'wallet.balance': FieldValue.increment(commissionAmount),
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
    .onWrite(async (change, context) => { // Using onWrite to capture creates and updates
        const { matchId } = context.params;
        const matchRef = db.collection('matches').doc(matchId);

        try {
            await db.runTransaction(async (transaction) => {
                const matchDoc = await transaction.get(matchRef);
                if (!matchDoc.exists) return;

                const matchData = matchDoc.data();
                if (!matchData || ['AUTO_VERIFIED', 'FLAGGED', 'COMPLETED', 'PAID'].includes(matchData.status)) {
                    return; // Already processed, no need to re-verify
                }

                const resultsCollectionRef = matchRef.collection('results');
                const resultsSnapshot = await transaction.get(resultsCollectionRef);

                // Wait until all players have submitted their results
                if (resultsSnapshot.size < matchData.maxPlayers) {
                    return;
                }

                // --- ADVANCED AUTO-VERIFICATION LOGIC ---
                const results = resultsSnapshot.docs.map(doc => doc.data());
                let fraudReasons: string[] = [];

                // RULE 1: Position Uniqueness
                const positions = results.map(r => r.creatorPosition || r.joinerPosition);
                const uniquePositions = new Set(positions);
                if (uniquePositions.size !== matchData.maxPlayers) {
                    fraudReasons.push('DUPLICATE_OR_MISSING_POSITIONS');
                }

                if (matchData.maxPlayers === 2) {
                    // RULE 2 (2P): Positions must be 1 and 2
                    if (!uniquePositions.has(1) || !uniquePositions.has(2)) {
                        fraudReasons.push('INVALID_POSITIONS_FOR_2P');
                    }
                    // RULE 3 (2P): Position vs State Consistency
                    const winnerResult = results.find(r => (r.creatorPosition || r.joinerPosition) === 1);
                    const loserResult = results.find(r => (r.creatorPosition || r.joinerPosition) === 2);
                    if (!winnerResult || winnerResult.confirmedWinStatus !== 'win' || !loserResult || loserResult.confirmedWinStatus !== 'loss') {
                        fraudReasons.push('WIN_LOSS_STATE_MISMATCH_2P');
                    }
                }

                // RULE 4: Cross-Player Validation (Winner ID consistency)
                const declaredWinners = results.filter(r => r.confirmedWinStatus === 'win');
                if (declaredWinners.length > 1) {
                    fraudReasons.push('MULTIPLE_WINNERS_DECLARED');
                }
                
                // Add more rules here (device ID, IP, etc.) if needed in future

                // FINAL DECISION
                if (fraudReasons.length > 0) {
                    transaction.update(matchRef, { 
                        status: 'FLAGGED',
                        fraudReasons: fraudReasons,
                    });
                    functions.logger.warn(`Match ${matchId} flagged for fraud. Reasons:`, fraudReasons);
                } else {
                    // All checks passed, mark for automatic payout
                    const winner = results.find(r => (r.creatorPosition || r.joinerPosition) === 1);
                    transaction.update(matchRef, { 
                        status: 'AUTO_VERIFIED',
                        winnerId: winner?.userId, // Set the winnerId for the payout function
                    });
                    functions.logger.info(`Match ${matchId} auto-verified successfully.`);
                }
            });
        } catch (error) {
            functions.logger.error(`Error during auto-verification for match ${matchId}:`, error);
            await matchRef.update({ status: 'FLAGGED', fraudReasons: ['INTERNAL_ERROR'] });
        }
        
        return null;
    });


export const onMatchResultUpdate = functions.firestore
    .document("matches/{matchId}")
    .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const { matchId } = context.params;
    
    // Trigger payout only when a match is verified (auto or manual) and not yet paid
    if (beforeData.status !== 'PAID' && (afterData.status === 'AUTO_VERIFIED' || (beforeData.status !== 'COMPLETED' && afterData.status === 'COMPLETED')) && afterData.winnerId) {
        const { winnerId, prizePool, players, title } = afterData;

        if (!winnerId || !prizePool || prizePool <= 0) {
            functions.logger.error("Payout failed: Missing or invalid winnerId/prizePool", { id: matchId });
            return change.after.ref.update({ status: 'FLAGGED', fraudReasons: ['PAYOUT_ERROR_INVALID_DATA'] });
        }
        
        try {
            await db.runTransaction(async (t) => {
                const winnerRef = db.collection("users").doc(winnerId);
                const winnerDoc = await t.get(winnerRef);
                if (!winnerDoc.exists) {
                    throw new Error(`Winner user ${winnerId} not found.`);
                }

                // 1. Update winner's balance, total winnings, and other stats
                t.update(winnerRef, { 
                    'wallet.balance': FieldValue.increment(prizePool),
                    'stats.totalWinnings': FieldValue.increment(prizePool),
                    'stats.rating': FieldValue.increment(10),
                    'stats.xp': FieldValue.increment(25),
                    'stats.matchesPlayed': FieldValue.increment(1),
                    'stats.matchesWon': FieldValue.increment(1)
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
                    t.update(loserRef, {
                         'stats.rating': FieldValue.increment(-5),
                         'stats.matchesPlayed': FieldValue.increment(1)
                    });
                }

                // 4. Finalize the match status to PAID
                t.update(change.after.ref, { status: 'PAID', completedAt: FieldValue.serverTimestamp() });
            });

            functions.logger.info(`Payout processed for match ${matchId}. Winner: ${winnerId}`);
            // Send notifications
            await sendNotification(winnerId, 'You Won!', `Congratulations! You won ₹${prizePool} in the match "${title}".`, `/match/${matchId}`);
            const loserIds = players.filter((pId: string) => pId !== winnerId);
            for (const loserId of loserIds) {
                 await sendNotification(loserId, 'Match Result', `The match "${title}" has ended. Better luck next time!`, `/match/${matchId}`);
            }

        } catch (error) {
            functions.logger.error(`Payout transaction failed for match ${matchId}:`, error);
            await change.after.ref.update({ status: "FLAGGED", fraudReasons: ['PAYOUT_TRANSACTION_FAILED'] });
        }
        return null
    }
    return null;
});

// =================================================================
//  MATCH & TOURNAMENT MANAGEMENT
// =================================================================
export const cancelMatch = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }
    const { matchId } = data;
    if (!matchId) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'matchId'.");
    }

    const userId = context.auth.uid;
    const matchRef = db.collection("matches").doc(matchId);

    return db.runTransaction(async (t) => {
        const matchDoc = await t.get(matchRef);
        if (!matchDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Match not found.");
        }
        const matchData = matchDoc.data()!;

        // Allow cancellation if match is waiting or if an admin is calling
        const isAdmin = ['superadmin', 'match_admin'].includes(context.auth?.token.role);
        if (matchData.status !== 'waiting' && !isAdmin) {
            throw new functions.https.HttpsError("failed-precondition", "This match has already started and cannot be cancelled.");
        }

        // Refund entry fee to all players involved
        for (const playerId of matchData.players) {
            const playerRef = db.collection("users").doc(playerId);
            t.update(playerRef, { 'wallet.balance': FieldValue.increment(matchData.entryFee) });
            const refundTxRef = db.collection(`users/${playerId}/transactions`).doc();
            t.set(refundTxRef, {
                amount: matchData.entryFee,
                type: "entry_fee_refund",
                status: "completed",
                description: `Refund for cancelled match: ${matchData.title}`,
                relatedId: matchId,
                createdAt: FieldValue.serverTimestamp(),
            });
        }
        
        t.update(matchRef, { 
            status: 'cancelled',
            completedAt: FieldValue.serverTimestamp(),
            resolvedBy: isAdmin ? userId : 'creator_cancellation'
        });
        
        return { success: true };
    }).catch(error => {
        functions.logger.error(`Failed to cancel match ${matchId}:`, error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred during match cancellation.');
    });
});

export const resolveMatch = functions.https.onCall(async (data, context) => {
    if (!context.auth || !['superadmin', 'match_admin'].includes(context.auth.token.role)) {
        throw new functions.https.HttpsError('permission-denied', 'Only match admins can resolve matches.');
    }
    const adminUid = context.auth.uid;
    const { matchId, winnerId } = data;
    if (!matchId || !winnerId) {
        throw new functions.https.HttpsError("invalid-argument", "matchId and winnerId are required.");
    }

    const matchRef = db.collection('matches').doc(matchId);
    const matchDoc = await matchRef.get();
    if (!matchDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Match not found.");
    }
    const matchData = matchDoc.data()!;

    if (!matchData.players.includes(winnerId)) {
        throw new functions.https.HttpsError("invalid-argument", "The declared winner is not a player in this match.");
    }
    if (['COMPLETED', 'PAID', 'cancelled'].includes(matchData.status)) {
        throw new functions.https.HttpsError('failed-precondition', `Match is already ${matchData.status}.`);
    }

    // This update will trigger the onMatchResultUpdate function for payout
    await matchRef.update({
        status: 'COMPLETED',
        winnerId: winnerId,
        completedAt: FieldValue.serverTimestamp(),
        resolvedBy: adminUid,
    });

    return { success: true, message: `Match resolved. Payout for ${winnerId} has been triggered.` };
});


export const createMatch = functions.https.onCall(async (data, context) => {
    // 1. Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to create a match.");
    }
    const userId = context.auth.uid;

    // 2. Active Match Limit Check
    const activeStatuses = ['waiting', 'room_code_pending', 'room_code_shared', 'game_started', 'result_submitted', 'verification', 'disputed'];
    const matchesQuery = db.collection('matches')
        .where('players', 'array-contains', userId)
        .where('status', 'in', activeStatuses);
        
    const activeMatchesSnapshot = await matchesQuery.get();
    if (activeMatchesSnapshot.size >= 3) {
        throw new functions.https.HttpsError("failed-precondition", "You can only have 3 active matches at a time. Please complete your existing matches first.");
    }

    // 3. Maintenance Check
    const maintenanceDoc = await db.collection('settings').doc('maintenance').get();
    const maintenanceSettings = maintenanceDoc.data() as MaintenanceSettings;
    if (maintenanceSettings?.areMatchesDisabled) {
        throw new functions.https.HttpsError("unavailable", "Match creation is temporarily disabled by the admin.");
    }
     
    // 4. Data Validation
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

    // 5. Calculate Prize Pool (e.g., 95% of total entry fees for a 5% commission)
    const prizePool = (entryFee * maxPlayers) * 0.95;

    const userRef = db.collection("users").doc(userId);
    const matchRef = db.collection("matches").doc();

    try {
        const newMatchId = await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) {
                throw new functions.https.HttpsError("not-found", "Your user profile does not exist.");
            }
            const userData = userDoc.data() as UserData;
            const currentBalance = userData.wallet?.balance || 0;
            if (currentBalance < entryFee) {
                throw new functions.https.HttpsError("failed-precondition", "Insufficient funds to create this match.");
            }
            
            if (entryFee > 0) {
                t.update(userRef, { 'wallet.balance': FieldValue.increment(-entryFee) });
                
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
                players: [userId], // Creator is the first player
                status: 'waiting',
                roomCode: null,
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
        
        const errorMessage = (error instanceof Error) ? error.message : "An unexpected error occurred.";
        if (errorMessage.includes("permission-denied") || errorMessage.includes("PERMISSION_DENIED")) {
            const context = {
                userId,
                operation: 'createMatchTransaction',
                userRefPath: userRef.path,
                matchRefPath: matchRef.path,
            };
            throw new functions.https.HttpsError(
                'permission-denied',
                `Firestore Security Rules denied the operation. Context: ${JSON.stringify(context)}`,
                { error, context }
            );
        }
        
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

export const joinMatch = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to join a match.");
    }
    const userId = context.auth.uid;
    const { matchId } = data;

    if (!matchId) {
        throw new functions.https.HttpsError("invalid-argument", "Match ID is required.");
    }

    const matchRef = db.collection("matches").doc(matchId);
    const userRef = db.collection("users").doc(userId);

    try {
        await db.runTransaction(async (t) => {
            const matchDoc = await t.get(matchRef);
            if (!matchDoc.exists) throw new functions.https.HttpsError("not-found", "Match not found.");
            
            const matchData = matchDoc.data()!;
            if (matchData.status !== 'waiting') throw new functions.https.HttpsError("failed-precondition", "This match is no longer open to join.");
            if (matchData.players.includes(userId)) throw new functions.https.HttpsError("failed-precondition", "You have already joined this match.");
            if (matchData.players.length >= matchData.maxPlayers) throw new functions.https.HttpsError("failed-precondition", "This match is already full.");

            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new functions.https.HttpsError("not-found", "Your user profile does not exist.");
            
            const userData = userDoc.data() as UserData;
            if ((userData.wallet?.balance || 0) < matchData.entryFee) throw new functions.https.HttpsError("failed-precondition", "Insufficient funds to join this match.");

            // Deduct entry fee
            if (matchData.entryFee > 0) {
                t.update(userRef, { 'wallet.balance': FieldValue.increment(-matchData.entryFee) });
                 const transactionRef = db.collection(`users/${userId}/transactions`).doc();
                 t.set(transactionRef, {
                    amount: -matchData.entryFee,
                    type: "entry_fee",
                    status: "completed",
                    description: `Entry fee for: ${matchData.title}`,
                    createdAt: FieldValue.serverTimestamp(),
                    relatedId: matchId,
                });
            }

            // Add user to match and update status
            const newPlayers = [...matchData.players, userId];
            const isNowFull = newPlayers.length === matchData.maxPlayers;
            
            t.update(matchRef, {
                players: newPlayers,
                joinerId: userId,
                status: isNowFull ? 'room_code_pending' : 'waiting',
            });
             await sendNotification(matchData.creatorId, 'Player Joined!', `${userData.displayName || 'A new player'} has joined your match. Get ready!`, `/match/${matchId}`);
        });

        return { success: true, message: "Successfully joined the match!" };

    } catch (error) {
        functions.logger.error(`User ${userId} failed to join match ${matchId}:`, error);
        
        const errorMessage = (error instanceof Error) ? error.message : "An unexpected error occurred.";
        if (errorMessage.includes("permission-denied") || errorMessage.includes("PERMISSION_DENIED")) {
            const contextData = {
                userId,
                operation: 'joinMatchTransaction',
                matchRefPath: matchRef.path,
                userRefPath: userRef.path,
            };
            throw new functions.https.HttpsError(
                'permission-denied',
                `Firestore Security Rules denied the operation. Context: ${JSON.stringify(contextData)}`,
                { error, context: contextData }
            );
        }

        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while joining the match.");
    }
});


export const submitResult = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }
    const userId = context.auth.uid;
    const { matchId, position, screenshotUrl } = data;

    if (!matchId || !position || !screenshotUrl) {
        throw new functions.https.HttpsError("invalid-argument", "matchId, position, and screenshotUrl are required.");
    }

    const matchRef = db.collection('matches').doc(matchId);
    const resultRef = matchRef.collection('results').doc(userId);

    try {
        await db.runTransaction(async (t) => {
            const matchDoc = await t.get(matchRef);
            if (!matchDoc.exists) throw new functions.https.HttpsError("not-found", "Match not found.");
            
            const matchData = matchDoc.data()!;
            if (matchData.status !== 'game_started') throw new functions.https.HttpsError("failed-precondition", "Results can only be submitted for started games.");
            if (!matchData.players.includes(userId)) throw new functions.https.HttpsError("permission-denied", "You are not a player in this match.");
            
            const existingResultDoc = await t.get(resultRef);
            if (existingResultDoc.exists) throw new functions.https.HttpsError("already-exists", "You have already submitted a result for this match.");
            
            const resultData: any = {
                userId: userId,
                confirmedWinStatus: position === 1 ? 'win' : 'loss',
                screenshotUrl: screenshotUrl,
                submittedAt: FieldValue.serverTimestamp(),
            };

            if (userId === matchData.creatorId) {
                resultData.creatorPosition = position;
            } else {
                resultData.joinerPosition = position;
            }

            t.set(resultRef, resultData);
            t.update(matchRef, { status: 'result_submitted' });
        });

        return { success: true, message: "Result submitted successfully." };
    } catch (error) {
        functions.logger.error(`Error submitting result for match ${matchId} by user ${userId}:`, error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", "An unexpected error occurred.");
    }
});
