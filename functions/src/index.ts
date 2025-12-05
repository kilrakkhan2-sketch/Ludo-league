
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const setSuperAdminRole = functions.https.onCall(async (data, context) => {
  const email = data.email;
  if (typeof email !== 'string' || email.length === 0) {
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

export const onDepositStatusChange = functions.firestore
  .document("deposit-requests/{depositId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (beforeData.status === "approved" || afterData.status !== "approved") {
        return null;
    }
    
    const { userId, amount } = afterData;
    if (!userId || !amount || amount <= 0) {
        functions.logger.error("Missing or invalid userId/amount", { id: context.params.depositId });
        return null;
    }

    const userRef = db.collection("users").doc(userId);
    const transactionRef = db.collection(`users/${userId}/transactions`).doc();

    try {
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) {
                throw new Error(`User ${userId} not found.`);
            }
            const currentBalance = userDoc.data()?.walletBalance || 0;
            const newBalance = currentBalance + amount;
            
            t.update(userRef, { walletBalance: newBalance });
            
            t.set(transactionRef, {
                amount: amount,
                type: "deposit",
                status: "completed",
                description: `Deposit of ₹${amount} approved.`,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                relatedId: context.params.depositId,
            });
        });
        functions.logger.info(`Deposit of ${amount} for user ${userId} completed successfully.`);
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
                const currentBalance = userDoc.data()?.walletBalance || 0;
                const newBalance = currentBalance + amount; // Refund the amount
                t.update(userRef, { walletBalance: newBalance });
                t.update(transactionRef, { status: 'failed', description: 'Withdrawal rejected by admin' });
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
        const { winnerId, prizePool } = afterData;

        if (!winnerId || !prizePool || prizePool <= 0) {
            functions.logger.error("Missing or invalid winnerId/prizePool", { id: matchId });
            return null;
        }

        const winnerRef = db.collection("users").doc(winnerId);
        const transactionRef = db.collection(`users/${winnerId}/transactions`).doc();

        try {
            await db.runTransaction(async (t) => {
                const winnerDoc = await t.get(winnerRef);
                if (!winnerDoc.exists) {
                    throw new Error(`Winner user ${winnerId} not found.`);
                }
                const currentBalance = winnerDoc.data()?.walletBalance || 0;
                const newBalance = currentBalance + prizePool;
                
                t.update(winnerRef, { walletBalance: newBalance });
                
                t.set(transactionRef, {
                    amount: prizePool,
                    type: "prize",
                    status: "completed",
                    description: `Prize money from match: ${afterData.title}`,
                    relatedId: matchId,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            });
            functions.logger.info(`Prize money of ${prizePool} credited to user ${winnerId} for match ${matchId}.`);
        } catch (error) {
            functions.logger.error(`Failed to process prize for match ${matchId}:`, error);
            await change.after.ref.update({ status: "error", error: (error as Error).message });
        }
    }
    return null;
});
