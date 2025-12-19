
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
    [key: string]: any;
}

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
//  FIRESTORE TRIGGERS (Automated Actions)
// =================================================================

export const onDepositStatusChange = functions.firestore
  .document("deposit-requests/{depositId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Only proceed if the status changed to 'approved' from something else.
    if (beforeData.status === "approved" || afterData.status !== "approved") {
        return null;
    }
    
    const { userId, amount } = afterData;
    if (!userId || !amount || amount <= 0) {
        functions.logger.error("Missing or invalid userId/amount", { id: context.params.depositId });
        return null;
    }

    const userRef = db.collection("users").doc(userId);

    try {
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) {
                throw new Error(`User ${userId} not found.`);
            }
            const userData = userDoc.data() as UserData;
            
            // 1. Credit the user's wallet for the deposit amount.
            t.update(userRef, { walletBalance: FieldValue.increment(amount) });
            
            // 2. Create a transaction log for the deposit.
            const depositTxRef = db.collection(`users/${userId}/transactions`).doc();
            t.set(depositTxRef, {
                amount: amount,
                type: "deposit",
                status: "completed",
                description: `Deposit of ₹${amount} approved.`,
                createdAt: FieldValue.serverTimestamp(),
                relatedId: context.params.depositId,
            });

            // 3. Handle referral commission if the user was referred.
            if (userData.referredBy) {
                const referrerQuery = db.collection('users').where('referralCode', '==', userData.referredBy).limit(1);
                const referrerSnapshot = await t.get(referrerQuery);

                if (!referrerSnapshot.empty) {
                    const referrerDoc = referrerSnapshot.docs[0];
                    const referrerRef = referrerDoc.ref;
                    const commissionAmount = amount * 0.05; // 5% commission

                    // A. Credit the referrer's wallet and referral earnings.
                    t.update(referrerRef, {
                        walletBalance: FieldValue.increment(commissionAmount),
                        referralEarnings: FieldValue.increment(commissionAmount)
                    });

                    // B. Create a transaction log for the referral bonus.
                    const commissionTxRef = db.collection(`users/${referrerDoc.id}/transactions`).doc();
                    t.set(commissionTxRef, {
                        amount: commissionAmount,
                        type: "referral_bonus",
                        status: "completed",
                        description: `5% commission from ${userData.name || 'a referred user'}'s deposit.`,
                        createdAt: FieldValue.serverTimestamp(),
                        relatedId: context.params.depositId,
                    });
                }
            }
        });
        functions.logger.info(`Deposit of ${amount} for user ${userId} and any applicable commissions processed successfully.`);
    } catch (error) {
        functions.logger.error(`Transaction failed for deposit ${context.params.depositId}:`, error);
        await change.after.ref.update({ status: "failed", error: (error as Error).message });
    }
    return null;
});


export const onWithdrawalStatusChange = functions.firestore
  .document("withdrawal-requests/{withdrawalId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const { withdrawalId } = context.params;

    if (beforeData.status !== "rejected" && afterData.status === "rejected") {
        const { userId, amount } = afterData;
        if (!userId || !amount) return null;

        const userRef = db.collection("users").doc(userId);
        const transactionRef = db.collection(`users/${userId}/transactions`).doc(withdrawalId);

        try {
            await db.runTransaction(async (t) => {
                const userDoc = await t.get(userRef);
                 if (!userDoc.exists) {
                    throw new Error(`User ${userId} not found.`);
                }
                
                // Refund the amount to the user's wallet
                t.update(userRef, { walletBalance: FieldValue.increment(amount) });
                // Mark the original transaction as failed
                t.update(transactionRef, { status: 'failed', description: 'Withdrawal request rejected by admin' });
            });
            functions.logger.info(`Withdrawal ${withdrawalId} for user ${userId} was rejected and funds were refunded.`);
        } catch (error) {
            functions.logger.error(`Failed to refund user ${userId} for rejected withdrawal ${withdrawalId}:`, error);
        }
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
        const { winnerId, prizePool, players } = afterData;

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
        } catch (error) {
            functions.logger.error(`Failed to process results for match ${matchId}:`, error);
            await change.after.ref.update({ status: "error", error: (error as Error).message });
        }
    }
    return null;
});


// =================================================================
//  MATCH CREATION & MANAGEMENT
// =================================================================

export const createMatch = functions.https.onCall(async (data, context) => {
    // 1. Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to create a match.");
    }

    // 2. Data Validation
    const { title, entryFee, prizePool, maxPlayers, privacy } = data;
    
    if (!title || typeof title !== "string" || title.length === 0 || title.length > 50) {
        throw new functions.https.HttpsError("invalid-argument", "Match title is required and must be 50 characters or less.");
    }
    if (typeof entryFee !== "number" || entryFee < 0) {
        throw new functions.https.HttpsError("invalid-argument", "A valid, non-negative entry fee is required.");
    }
    if (typeof prizePool !== "number" || prizePool < 0) {
        throw new functions.https.HttpsError("invalid-argument", "A valid prize pool is required.");
    }
    if (maxPlayers !== 2 && maxPlayers !== 4) {
        throw new functions.https.HttpsError("invalid-argument", "Max players must be either 2 or 4.");
    }
    if (privacy && privacy !== 'public' && privacy !== 'private') {
        throw new functions.https.HttpsError("invalid-argument", "Privacy must be either 'public' or 'private'.");
    }

    const userId = context.auth.uid;
    const userRef = db.collection("users").doc(userId);
    const matchRef = db.collection("matches").doc();
    const transactionRef = db.collection(`users/${userId}/transactions`).doc();

    try {
        const newMatchId = await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) {
                throw new functions.https.HttpsError("not-found", "Your user profile does not exist.");
            }

            // A. Check user's balance
            const userData = userDoc.data() as UserData;
            const currentBalance = userData.walletBalance || 0;
            if (currentBalance < entryFee) {
                throw new functions.https.HttpsError("failed-precondition", "Insufficient funds to create this match.");
            }

            // B. Deduct entry fee from creator's wallet (if any)
            if (entryFee > 0) {
                const newBalance = currentBalance - entryFee;
                t.update(userRef, { walletBalance: newBalance });

                // C. Create a transaction for the entry fee
                t.set(transactionRef, {
                    amount: -entryFee,
                    type: "entry-fee",
                    status: "completed",
                    description: `Entry fee for new match: ${title}`,
                    createdAt: FieldValue.serverTimestamp(),
                    relatedId: matchRef.id,
                });
            }

            // D. Create the new match document
            t.set(matchRef, {
                title,
                entryFee,
                prizePool,
                ludoKingCode: null, // Ludo King code is set later
                maxPlayers,
                privacy: privacy || 'public',
                creatorId: userId,
                players: [userId], // Creator is the first player
                status: 'open',
                winnerId: null,
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
        if (error instanceof functions.https.HttpsError) {
            throw error;
        } else {
            throw new functions.https.HttpsError("internal", "An unexpected error occurred.");
        }
    }
});
