
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * Handles the logic when a deposit's status is updated.
 *
 * This function is triggered when any document in the 'deposits' collection is updated.
 * It specifically checks if the 'status' field has been changed to 'approved'.
 * If it has, it securely updates the user's balance and creates a transaction record.
 */
export const onDepositStatusChange = functions.firestore
  .document("deposits/{depositId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Log the function execution for debugging
    functions.logger.info(`Deposit ${context.params.depositId} updated`, {
      before: beforeData,
      after: afterData,
    });

    // Check if the status was changed from something else to "approved"
    if (beforeData.status !== "approved" && afterData.status === "approved") {
      const userId = afterData.userId;
      const amount = afterData.amount;
      const depositId = context.params.depositId;

      if (!userId || !amount) {
        functions.logger.error("Missing userId or amount in deposit document.", {
          depositId,
        });
        return;
      }
      
      const userRef = db.collection("users").doc(userId);
      const transactionRef = db.collection("transactions").doc(); // Auto-generate ID

      try {
        // Use a Firestore transaction to ensure atomicity (all or nothing)
        await db.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) {
            throw new Error(`User with ID ${userId} not found.`);
          }

          const currentBalance = userDoc.data()?.balance || 0;
          const newBalance = currentBalance + amount;

          // Update user's balance
          transaction.update(userRef, { balance: newBalance });

          // Create a new transaction record
          transaction.set(transactionRef, {
            userId: userId,
            amount: amount,
            type: "deposit",
            description: "Deposit approved",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            relatedId: depositId, // Link to the original deposit document
            balanceAfter: newBalance,
          });
        });

        functions.logger.info(
          `Successfully processed deposit for user ${userId}. New balance: ${await (await userRef.get()).data()?.balance}`,
        );
      } catch (error) {
        functions.logger.error(
          `Error processing deposit for user ${userId}:`,
          error
        );
        // Optional: Revert the status back to "pending" or "failed"
        await change.after.ref.update({ status: "failed", error: (error as Error).message });
      }
    }
  });

