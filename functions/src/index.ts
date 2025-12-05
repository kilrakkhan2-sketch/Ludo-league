
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const onDepositStatusChange = functions.firestore
  .document("deposit-requests/{depositId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Only run if status changes to 'approved'
    if (beforeData.status === "approved" || afterData.status !== "approved") {
        return null;
    }
    
    const { userId, amount } = afterData;
    if (!userId || !amount || amount <= 0) {
        functions.logger.error("Missing or invalid userId/amount", { id: context.params.depositId });
        return;
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
        // Revert status to 'failed' on the request doc
        await change.after.ref.update({ status: "failed", error: (error as Error).message });
    }
});


export const onWithdrawalStatusChange = functions.firestore
  .document("withdrawal-requests/{withdrawalId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const { withdrawalId } = context.params;

    // --- Rejection Logic ---
    if (beforeData.status !== "rejected" && afterData.status === "rejected") {
        const { userId, amount } = afterData;
        if (!userId || !amount) return;

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
});


export const onMatchResultUpdate = functions.firestore
  .document("matches/{matchId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const { matchId } = context.params;

    // Check if a winner has been declared for the first time and the status is now 'completed'
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
            // Optionally, set match status to an error state to indicate a problem
            await change.after.ref.update({ status: "error", error: (error as Error).message });
        }
    }
    return null;
});
