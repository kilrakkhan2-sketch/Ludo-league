
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// --------- DEPOSIT FUNCTION --------- //
export const onDepositStatusChange = functions.firestore
  .document("deposits/{depositId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (beforeData.status !== "approved" && afterData.status === "approved") {
      const { userId, amount } = afterData;
      if (!userId || !amount) {
        functions.logger.error("Missing data in deposit doc", { id: context.params.depositId });
        return;
      }

      const userRef = db.collection("users").doc(userId);
      const transactionRef = db.collection("transactions").doc();

      try {
        await db.runTransaction(async (t) => {
          const userDoc = await t.get(userRef);
          if (!userDoc.exists) throw new Error(`User ${userId} not found.`);
          const currentBalance = userDoc.data()?.balance || 0;
          const newBalance = currentBalance + amount;
          t.update(userRef, { balance: newBalance });
          t.set(transactionRef, {
            userId, amount, type: "deposit", description: "Deposit approved",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            relatedId: context.params.depositId, balanceAfter: newBalance,
          });
        });
        functions.logger.info(`Deposit processed for user ${userId}.`);
      } catch (error) {
        functions.logger.error(`Error processing deposit for ${userId}:`, error);
        await change.after.ref.update({ status: "failed", error: (error as Error).message });
      }
    }
  });

// --------- WITHDRAWAL FUNCTION --------- //
export const onWithdrawalStatusChange = functions.firestore
  .document("withdrawals/{withdrawalId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (beforeData.status !== "approved" && afterData.status === "approved") {
      const { userId, amount } = afterData;
      if (!userId || !amount) {
        functions.logger.error("Missing data in withdrawal doc", { id: context.params.withdrawalId });
        return;
      }

      const userRef = db.collection("users").doc(userId);
      const transactionRef = db.collection("transactions").doc();

      try {
        await db.runTransaction(async (t) => {
          const userDoc = await t.get(userRef);
          if (!userDoc.exists) throw new Error(`User ${userId} not found.`);
          const currentBalance = userDoc.data()?.balance || 0;
          if (currentBalance < amount) throw new Error("Insufficient balance.");
          const newBalance = currentBalance - amount;
          t.update(userRef, { balance: newBalance });
          t.set(transactionRef, {
            userId, amount, type: "withdrawal", description: "Withdrawal approved",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            relatedId: context.params.withdrawalId, balanceAfter: newBalance,
          });
        });
        functions.logger.info(`Withdrawal processed for user ${userId}.`);
      } catch (error) {
        functions.logger.error(`Error processing withdrawal for ${userId}:`, error);
        await change.after.ref.update({ status: "failed", error: (error as Error).message });
      }
    }
  });

// --------- MATCH RESULT FUNCTION --------- //
export const onMatchResultUpdate = functions.firestore
  .document("matches/{matchId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Check if a winner has been declared for the first time
    if (!beforeData.winnerId && afterData.winnerId) {
      const { winnerId, prizeAmount } = afterData;
      const matchId = context.params.matchId;

      if (!winnerId || !prizeAmount || prizeAmount <= 0) {
        functions.logger.error("Missing or invalid winnerId/prizeAmount", { id: matchId });
        return;
      }

      const winnerRef = db.collection("users").doc(winnerId);
      const transactionRef = db.collection("transactions").doc();

      try {
        await db.runTransaction(async (t) => {
          const winnerDoc = await t.get(winnerRef);
          if (!winnerDoc.exists) throw new Error(`Winner user ${winnerId} not found.`);
          const currentBalance = winnerDoc.data()?.balance || 0;
          const newBalance = currentBalance + prizeAmount;
          t.update(winnerRef, { balance: newBalance });
          t.set(transactionRef, {
            userId: winnerId, amount: prizeAmount, type: "match_win",
            description: "Winnings from match",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            relatedId: matchId, balanceAfter: newBalance,
          });
        });
        // Optionally update the match status to "completed"
        await change.after.ref.update({ status: "completed" });
        functions.logger.info(`Match winnings processed for user ${winnerId}.`);
      } catch (error) {
        functions.logger.error(`Error processing match result for ${matchId}:`, error);
        // Optionally revert winnerId or set match status to "error"
        await change.after.ref.update({ status: "error", error: (error as Error).message });
      }
    }
  });
