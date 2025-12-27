import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

/**
 * A callable Cloud Function to manage a deposit request.
 * Admins call this function to either approve or reject a deposit.
 *
 * @param {object} data - The data passed to the function.
 * @param {string} data.requestId - The ID of the deposit_requests document.
 * @param {string} data.action - The action to perform: 'approve' or 'reject'.
 * @param {string} [data.rejectionReason] - The reason for rejection (required if action is 'reject').
 *
 * @param {functions.https.CallableContext} context - The context of the function call.
 * @returns {Promise<{success: boolean, message: string}>} - The result of the operation.
 */
export const manageDeposit = functions.https.onCall(async (data, context) => {
  // 1. Authentication & Authorization Check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to manage deposits.');
  }

  const adminRole = context.auth.token.role;
  if (!['superadmin', 'deposit_admin'].includes(adminRole)) {
     throw new functions.https.HttpsError('permission-denied', 'You do not have permission to perform this action.');
  }

  const { requestId, action, rejectionReason } = data;
  const adminId = context.auth.uid;

  if (!requestId || !action) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "requestId" and "action".');
  }

  const depositRef = db.collection('deposit_requests').doc(requestId);

  try {
    // 2. Run as a transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      const depositDoc = await transaction.get(depositRef);

      if (!depositDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Deposit request not found.');
      }

      const depositData = depositDoc.data()!;

      // 3. Ensure the deposit is in 'pending' state to prevent double-processing
      if (depositData.status !== 'pending') {
        throw new functions.https.HttpsError('failed-precondition', `This deposit is already in the "${depositData.status}" state.`);
      }

      const userRef = db.collection('users').doc(depositData.userId);
      const now = admin.firestore.FieldValue.serverTimestamp();

      // 4. Perform the requested action
      if (action === 'approve') {
        // Update the deposit request
        transaction.update(depositRef, {
          status: 'approved',
          approvedAt: now,
          processedBy: adminId,
        });

        // Increment the user's wallet balance
        transaction.update(userRef, {
          walletBalance: admin.firestore.FieldValue.increment(depositData.amount),
        });

        // Create a record in the wallet transactions for auditing
        const walletTxRef = db.collection(`users/${depositData.userId}/transactions`).doc();
        transaction.set(walletTxRef, {
          userId: depositData.userId,
          type: 'deposit',
          amount: depositData.amount,
          description: 'Deposit approved',
          status: 'completed',
          referenceId: requestId,
          createdAt: now,
        });

      } else if (action === 'reject') {
        if (!rejectionReason) {
          // You can make this optional if you want
          // throw new functions.https.HttpsError('invalid-argument', 'A rejection reason is required.');
        }
        // Update the deposit request with the rejection reason
        transaction.update(depositRef, {
          status: 'rejected',
          adminNote: rejectionReason || 'Rejected by admin',
          processedBy: adminId,
          rejectedAt: now,
        });
        
      } else {
        throw new functions.https.HttpsError('invalid-argument', 'Action must be either "approve" or "reject".');
      }
    });

    return { success: true, message: `Deposit successfully ${action}ed.` };

  } catch (error) {
    console.error("Transaction failed: ", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'An unexpected error occurred.', error);
  }
});
