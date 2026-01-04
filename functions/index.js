
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { CloudTasksClient } = require('@google-cloud/tasks');

admin.initializeApp();

const db = admin.firestore();
const tasksClient = new CloudTasksClient();

exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // ... (existing code)
});

exports.onResultSubmit = functions.firestore
  .document('matches/{matchId}/results/{userId}')
  .onCreate(async (snap, context) => {
    // ... (existing code)
  });

exports.distributeWinnings = functions.https.onRequest(async (req, res) => {
  // ... (existing code)
});

// Handles deposit and withdrawal requests.
exports.handleTransaction = functions.firestore
  .document('transactions/{transactionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if the transaction has been approved.
    if (before.status === 'pending' && after.status === 'approved') {
      const { userId, amount, type } = after;
      const userRef = db.collection('users').doc(userId);

      try {
        await db.runTransaction(async (t) => {
          const userDoc = await t.get(userRef);
          if (!userDoc.exists) {
            throw new Error('User not found');
          }

          const newBalance = userDoc.data().balance + (type === 'deposit' ? amount : -amount);
          if (newBalance < 0) {
            throw new Error('Insufficient balance');
          }

          t.update(userRef, { balance: newBalance });
        });

        console.log(`Transaction ${context.params.transactionId} handled successfully.`);
        return null;

      } catch (error) {
        console.error('Error handling transaction:', error);
        // Revert the status to pending to allow for a retry or manual intervention.
        return change.after.ref.update({ status: 'pending', error: error.message });
      }
    }

    return null;
  });
