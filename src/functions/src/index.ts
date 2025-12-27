
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

admin.initializeApp();
const db = admin.firestore();
const BUCKET_NAME = process.env.GCLOUD_PROJECT ? `${process.env.GCLOUD_PROJECT}.appspot.com` : undefined;


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
    displayName?: string;
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
        t.update(userRef, { walletBalance: FieldValue.increment(-amount) });

        // B. Create a transaction log for the user
        const userTxRef = db.collection(`users/${userId}/transactions`).doc();
        t.set(userTxRef, {
            amount: -amount,
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
    const isAdmin = context.auth?.token.role && ['superadmin', 'match_admin', 'deposit_admin', 'withdrawal_admin'].includes(context.auth.token.role);
    if (!isAdmin) {
        throw new functions.https.HttpsError("permission-denied", "You must be an admin to list files.");
    }
    const { prefix } = data;
    if (!prefix || typeof prefix !== 'string' || !BUCKET_NAME) {
        throw new functions.https.HttpsError("invalid-argument", "A valid folder prefix and bucket name are required.");
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
    const isAdmin = context.auth?.token.role && ['superadmin', 'match_admin', 'deposit_admin', 'withdrawal_admin'].includes(context.auth.token.role);
    if (!isAdmin) {
        throw new functions.https.HttpsError("permission-denied", "You must be an admin to delete files.");
    }
    
    const { filePath } = data;
    if (!filePath || typeof filePath !== 'string' || !BUCKET_NAME) {
        throw new functions.https.HttpsError("invalid-argument", "A valid file path and bucket name are required.");
    }
    
    try {
        const bucket = getStorage().bucket(BUCKET_NAME);
        const file = bucket.file(filePath);
        
        const [exists] = await file.exists();
        if (!exists) {
            throw new functions.https.HttpsError("not-found", "The specified file does not exist.");
        }
        
        await file.delete();
        
        functions.logger.info(`File ${filePath} deleted by admin ${context.auth?.uid}.`);
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
    if (!context.auth || !['withdrawal_admin', 'superadmin'].includes(context.auth.token.role)) {
        throw new functions.https.HttpsError('permission-denied', 'Only withdrawal admins can approve requests.');
    }
    
    const { withdrawalId } = data;
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

        const { amount, userId } = requestData;
        const userTxQuery = db.collection(`users/${userId}/transactions`).where('referenceId', '==', withdrawalId).limit(1);
        const userTxSnapshot = await t.get(userTxQuery);
        const userTxRef = userTxSnapshot.docs[0]?.ref;
        
        t.update(requestRef, {
            status: 'approved',
            processedAt: FieldValue.serverTimestamp(),
            processedBy: adminUid,
        });

        if (userTxRef) {
            t.update(userTxRef, { status: 'completed' });
        }

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
    if (!context.auth || !['withdrawal_admin', 'superadmin'].includes(context.auth.token.role)) {
        throw new functions.https.HttpsError('permission-denied', 'Only withdrawal admins can reject requests.');
    }
    
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
        const userTxQuery = db.collection(`users/${userId}/transactions`).where('referenceId', '==', withdrawalId).limit(1);
        const userTxSnapshot = await t.get(userTxQuery);
        const userTxRef = userTxSnapshot.docs[0]?.ref;
    
        t.update(requestRef, {
            status: 'rejected',
            processedAt: FieldValue.serverTimestamp(),
            processedBy: adminUid,
            rejectionReason: reason || "Rejected by admin",
        });

        t.update(userRef, { walletBalance: FieldValue.increment(amount) });

        if (userTxRef) {
            t.update(userTxRef, { 
                status: 'failed', 
                description: `Withdrawal rejected. Reason: ${reason || 'Admin rejection'}` 
            });
        } else {
             const refundTxRef = db.collection(`users/${userId}/transactions`).doc();
             t.set(refundTxRef, {
                amount: amount,
                type: 'withdrawal_refund',
                status: 'completed',
                description: `Refund for rejected withdrawal. Reason: ${reason || 'Admin rejection'}`,
                referenceId: withdrawalId,
                createdAt: FieldValue.serverTimestamp(),
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

export const onMatchResultUpdate = functions.firestore
    .document("matches/{matchId}")
    .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const { matchId } = context.params;
    
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

                t.update(winnerRef, { 
                    walletBalance: FieldValue.increment(prizePool),
                    totalWinnings: FieldValue.increment(prizePool),
                    rating: FieldValue.increment(10),
                    xp: FieldValue.increment(25),
                    matchesPlayed: FieldValue.increment(1),
                    matchesWon: FieldValue.increment(1)
                });
                
                const transactionRef = db.collection(`users/${winnerId}/transactions`).doc();
                t.set(transactionRef, {
                    amount: prizePool,
                    type: "prize_win",
                    status: "completed",
                    description: `Prize for winning match: ${afterData.title}`,
                    referenceId: matchId,
                    createdAt: FieldValue.serverTimestamp(),
                });

                const loserIds = players.filter((pId: string) => pId !== winnerId);
                for (const loserId of loserIds) {
                    const loserRef = db.collection("users").doc(loserId);
                    t.update(loserRef, {
                         rating: FieldValue.increment(-5),
                         matchesPlayed: FieldValue.increment(1)
                    });
                }

                t.update(change.after.ref, { status: 'PAID', completedAt: FieldValue.serverTimestamp() });
            });

            functions.logger.info(`Payout processed for match ${matchId}. Winner: ${winnerId}`);
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
        
        const isAdmin = ['superadmin', 'match_admin'].includes(context.auth?.token.role);

        if (matchData.status !== 'waiting' && !isAdmin) {
            throw new functions.https.HttpsError("failed-precondition", "This match has already started and cannot be cancelled.");
        }
        
        for (const playerId of matchData.players) {
            const playerRef = db.collection("users").doc(playerId);
            t.update(playerRef, { walletBalance: FieldValue.increment(matchData.entryFee) });
            const refundTxRef = db.collection(`users/${playerId}/transactions`).doc();
            t.set(refundTxRef, {
                amount: matchData.entryFee,
                type: "entry_fee_refund",
                status: "completed",
                description: `Refund for cancelled match: ${matchData.title}`,
                referenceId: matchId,
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
    if (!context.auth || !['superadmin', 'match_admin'].includes(context.auth?.token.role)) {
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

    await matchRef.update({
        status: 'COMPLETED',
        winnerId: winnerId,
        completedAt: FieldValue.serverTimestamp(),
        resolvedBy: adminUid,
    });

    return { success: true, message: `Match resolved. Payout for ${winnerId} has been triggered.` };
});

export const createWithdrawalRequest = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to make a withdrawal.");
    }
    const userId = context.auth.uid;
    const { amount, method, details } = data;

    if (typeof amount !== 'number' || amount <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "A valid, positive amount is required.");
    }
    if (!method || !details) {
        throw new functions.https.HttpsError("invalid-argument", "Withdrawal method and details are required.");
    }

    const userRef = db.collection("users").doc(userId);
    const withdrawalRef = db.collection("withdrawal-requests").doc();

    try {
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new functions.https.HttpsError("not-found", "User profile not found.");
            
            const userData = userDoc.data() as UserData;
            const currentBalance = userData.walletBalance || 0;
            if (currentBalance < amount) {
                throw new functions.https.HttpsError("failed-precondition", "Insufficient funds.");
            }

            t.update(userRef, { walletBalance: FieldValue.increment(-amount) });
            
            t.set(withdrawalRef, {
                userId,
                amount,
                method,
                details,
                status: 'pending',
                createdAt: FieldValue.serverTimestamp(),
            });

            const transactionRef = db.collection(`users/${userId}/transactions`).doc();
            t.set(transactionRef, {
                amount: -amount,
                type: "withdrawal",
                status: "pending",
                description: `Withdrawal request for ₹${amount}`,
                referenceId: withdrawalRef.id,
                createdAt: FieldValue.serverTimestamp(),
            });
        });
        return { success: true, message: "Withdrawal request submitted successfully." };
    } catch (error) {
        functions.logger.error(`Withdrawal request failed for user ${userId}:`, error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        } else {
            throw new functions.https.HttpsError("internal", "An unexpected error occurred.");
        }
    }
});


export const createMatch = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to create a match.");
    }
    const userId = context.auth.uid;

    const activeStatuses = ['waiting', 'room_code_pending', 'room_code_shared', 'game_started', 'result_submitted', 'verification', 'disputed'];
    const matchesQuery = db.collection('matches')
        .where('players', 'array-contains', userId)
        .where('status', 'in', activeStatuses);
        
    const activeMatchesSnapshot = await matchesQuery.get();
    if (activeMatchesSnapshot.size >= 3) {
        throw new functions.https.HttpsError("failed-precondition", "You can only have 3 active matches at a time. Please complete your existing matches first.");
    }

    const maintenanceDoc = await db.collection('settings').doc('maintenance').get();
    const maintenanceSettings = maintenanceDoc.data() as MaintenanceSettings;
    if (maintenanceSettings?.areMatchesDisabled) {
        throw new functions.https.HttpsError("unavailable", "Match creation is temporarily disabled by the admin.");
    }
     
    const { title, entryFee, maxPlayers } = data;
    if (!title || typeof title !== "string" || title.length === 0 || title.length > 50) {
        throw new functions.https.HttpsError("invalid-argument", "Match title is required and must be 50 characters or less.");
    }
    if (typeof entryFee !== "number" || entryFee < 50) {
        throw new functions.https.HttpsError("invalid-argument", "Minimum entry fee is ₹50.");
    }
    if (maxPlayers !== 2) {
        throw new functions.https.HttpsError("invalid-argument", "Max players must be 2.");
    }

    const prizePool = (entryFee * maxPlayers) * 0.95;

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
            
            t.update(userRef, { walletBalance: FieldValue.increment(-entryFee) });
            
            const transactionRef = db.collection(`users/${userId}/transactions`).doc();
            t.set(transactionRef, {
                amount: -entryFee,
                type: "entry_fee",
                status: "completed",
                description: `Entry fee for: ${title}`,
                referenceId: matchRef.id,
                createdAt: FieldValue.serverTimestamp(),
            });
            
            t.set(matchRef, {
                title,
                entryFee,
                prizePool,
                maxPlayers,
                creatorId: userId,
                players: [userId],
                status: 'waiting',
                createdAt: FieldValue.serverTimestamp(),
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
    if (!context.auth || !['superadmin', 'match_admin'].includes(context.auth.token.role)) {
        throw new functions.https.HttpsError("permission-denied", "You must be an admin to create a tournament.");
    }
    const adminUid = context.auth.uid;

    const { name, description, entryFee, maxPlayers, commissionRate, prizeDistribution, startDate, endDate, bannerUrl } = data;
    if (!name || typeof entryFee !== 'number' || typeof maxPlayers !== 'number' || typeof commissionRate !== 'number' || !prizeDistribution || !startDate) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required tournament information.");
    }
    
    const totalCollection = entryFee * maxPlayers;
    const finalPrizePool = totalCollection - (totalCollection * commissionRate);
    
    try {
        const tournamentRef = await db.collection("tournaments").add({
            name,
            description: description || null,
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
            
            const userData = userDoc.data()!;
            if ((userData.walletBalance || 0) < matchData.entryFee) throw new functions.https.HttpsError("failed-precondition", "Insufficient funds to join this match.");

            if (matchData.entryFee > 0) {
                t.update(userRef, { walletBalance: FieldValue.increment(-matchData.entryFee) });
                 const transactionRef = db.collection(`users/${userId}/transactions`).doc();
                 t.set(transactionRef, {
                    amount: -matchData.entryFee,
                    type: "entry_fee",
                    status: "completed",
                    description: `Entry fee for: ${matchData.title}`,
                    referenceId: matchId,
                    createdAt: FieldValue.serverTimestamp(),
                });
            }

            const newPlayers = [...matchData.players, userId];
            const isNowFull = newPlayers.length === matchData.maxPlayers;
            
            t.update(matchRef, {
                players: newPlayers,
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

export const updateTournament = functions.https.onCall(async (data, context) => {
  if (!context.auth || !['superadmin', 'match_admin'].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError('permission-denied', 'You do not have permission to update tournaments.');
  }

  const { tournamentId, name, description } = data;
  if (!tournamentId) {
    throw new functions.https.HttpsError('invalid-argument', 'A tournament ID is required.');
  }

  const updateData: { [key: string]: any } = {};
  if (name) updateData.name = name;
  if (description) updateData.description = description;

  try {
    await db.collection('tournaments').doc(tournamentId).update(updateData);
    return { success: true, message: 'Tournament updated successfully.' };
  } catch (error: any) {
    functions.logger.error(`Error updating tournament ${tournamentId}:`, error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});


export const cancelTournament = functions.https.onCall(async (data, context) => {
    if (!context.auth || !['superadmin', 'match_admin'].includes(context.auth.token.role)) {
        throw new functions.https.HttpsError("permission-denied", "You must be an admin to cancel a tournament.");
    }
    const { tournamentId } = data;
    if (!tournamentId) {
        throw new functions.https.HttpsError("invalid-argument", "Tournament ID is required.");
    }

    const tournamentRef = db.collection("tournaments").doc(tournamentId);

    return db.runTransaction(async (t) => {
        const tournamentDoc = await t.get(tournamentRef);
        if (!tournamentDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Tournament not found.");
        }
        const tournamentData = tournamentDoc.data()!;

        if (tournamentData.status === 'cancelled') {
             throw new functions.https.HttpsError("failed-precondition", "This tournament has already been cancelled.");
        }

        const playersCollectionRef = tournamentRef.collection('players');
        const playersSnapshot = await t.get(playersCollectionRef);
        
        for (const playerDoc of playersSnapshot.docs) {
            const playerId = playerDoc.id;
            const playerRef = db.collection("users").doc(playerId);
            t.update(playerRef, { walletBalance: FieldValue.increment(tournamentData.entryFee) });
            
            const refundTxRef = db.collection(`users/${playerId}/transactions`).doc();
            t.set(refundTxRef, {
                amount: tournamentData.entryFee,
                type: "entry_fee_refund",
                status: "completed",
                description: `Refund for cancelled tournament: ${tournamentData.name}`,
                referenceId: tournamentId,
                createdAt: FieldValue.serverTimestamp(),
            });
        }
        
        t.update(tournamentRef, { status: 'cancelled' });

        return { success: true, message: "Tournament cancelled and all players have been refunded." };
    }).catch(error => {
        functions.logger.error(`Failed to cancel tournament ${tournamentId}:`, error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred during tournament cancellation.');
    });
});

export const removePlayerFromTournament = functions.https.onCall(async (data, context) => {
    if (!context.auth || !['superadmin', 'match_admin'].includes(context.auth.token.role)) {
        throw new functions.https.HttpsError("permission-denied", "You must be an admin to remove a player.");
    }
    const { tournamentId, playerId } = data;
    if (!tournamentId || !playerId) {
        throw new functions.https.HttpsError("invalid-argument", "Tournament ID and Player ID are required.");
    }

    const tournamentRef = db.collection("tournaments").doc(tournamentId);
    const playerInTournamentRef = tournamentRef.collection('players').doc(playerId);
    
    return db.runTransaction(async (t) => {
        const tournamentDoc = await t.get(tournamentRef);
        const playerInTournamentDoc = await t.get(playerInTournamentRef);

        if (!tournamentDoc.exists) throw new functions.https.HttpsError("not-found", "Tournament not found.");
        if (!playerInTournamentDoc.exists) throw new functions.https.HttpsError("not-found", "Player is not registered in this tournament.");

        const tournamentData = tournamentDoc.data()!;
        if (tournamentData.status !== 'upcoming') {
            throw new functions.https.HttpsError("failed-precondition", "Players can only be removed from upcoming tournaments.");
        }
        
        const playerRef = db.collection("users").doc(playerId);
        t.update(playerRef, { walletBalance: FieldValue.increment(tournamentData.entryFee) });
        
        const refundTxRef = db.collection(`users/${playerId}/transactions`).doc();
        t.set(refundTxRef, {
            amount: tournamentData.entryFee,
            type: "entry_fee_refund",
            status: "completed",
            description: `Refund for removal from tournament: ${tournamentData.name}`,
            referenceId: tournamentId,
            createdAt: FieldValue.serverTimestamp(),
        });
        
        t.delete(playerInTournamentRef);
        
        return { success: true, message: "Player removed and refunded successfully." };
    }).catch(error => {
        functions.logger.error(`Failed to remove player ${playerId} from tournament ${tournamentId}:`, error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred.');
    });
});
