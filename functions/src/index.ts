
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

export const approveDeposit = functions.https.onCall(async (data, context) => {
  // 1. Authentication & Authorization
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  const approverUid = context.auth.uid;

  // Check if the user is an admin
  const userDoc = await db.collection("users").doc(approverUid).get();
  const userRole = userDoc.data()?.role;
  if (userRole !== 'superadmin' && userRole !== 'deposit_admin') {
     throw new functions.https.HttpsError(
      "permission-denied",
      "Only deposit admins or superadmins can approve deposits."
    );
  }

  const { depositId } = data;
  if (!depositId || typeof depositId !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a valid 'depositId'."
    );
  }

  const depositRef = db.collection("deposit-requests").doc(depositId);

  try {
    // 2. Run as a transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      const depositDoc = await transaction.get(depositRef);

      if (!depositDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Deposit request not found.");
      }

      const depositData = depositDoc.data();
      if (!depositData || depositData.status !== "pending") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Deposit is not pending or data is missing."
        );
      }

      const { userId, amount } = depositData;
      if (!userId || typeof amount !== "number" || amount <= 0) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Invalid user ID or amount in deposit request."
        );
      }

      const userRef = db.collection("users").doc(userId);

      // 3. Atomically update the user's balance
      transaction.update(userRef, {
        walletBalance: admin.firestore.FieldValue.increment(amount),
      });

      // 4. Update the deposit request status and record who approved it
      transaction.update(depositRef, {
        status: "approved",
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: approverUid, // Record the UID of the admin
      });

      // 5. Create a transaction record for the user
      const transactionRef = userRef.collection("transactions").doc();
      transaction.set(transactionRef, {
        amount,
        type: "deposit",
        description: "Deposit approved by admin",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "completed",
        relatedId: depositId,
      });
    });

    return { success: true, message: "Deposit approved successfully." };
  } catch (error) {
    console.error("Error approving deposit:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      "An internal error occurred while approving the deposit."
    );
  }
});
