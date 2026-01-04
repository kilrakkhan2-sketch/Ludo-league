
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { CloudTasksClient } = require('@google-cloud/tasks');

admin.initializeApp();

const db = admin.firestore();
const tasksClient = new CloudTasksClient();

exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // Check if the caller is an admin
  if (context.auth.token.admin !== true) {
    return { error: 'Only admins can set other admins.' };
  }
  const { uid } = data;
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    return { message: `Success! ${uid} has been made an admin.` };
  } catch (error) {
    return { error: error.message };
  }
});


// This function triggers when a result is submitted.
// It checks for conflicts (e.g., multiple winners) and updates match status.
exports.onResultSubmit = functions.firestore
  .document('matches/{matchId}/results/{userId}')
  .onCreate(async (snap, context) => {
    const { matchId } = context.params;
    const matchRef = db.doc(`matches/${matchId}`);

    return db.runTransaction(async (transaction) => {
      const matchDoc = await transaction.get(matchRef);
      if (!matchDoc.exists) {
        throw new Error('Match not found!');
      }

      const resultsRef = matchRef.collection('results');
      const resultsSnapshot = await transaction.get(resultsRef);
      const resultsData = resultsSnapshot.docs.map((doc) => doc.data());
      
      const winClaims = resultsData.filter((r) => r.status === 'win');

      if (winClaims.length > 1) {
        // If more than one person claims to be the winner, set status to 'disputed'.
        transaction.update(matchRef, { status: 'disputed' });
      } else if (resultsData.length === matchDoc.data().maxPlayers) {
        // If all players have submitted results...
        if (winClaims.length === 1) {
          // and there is exactly one winner, mark the match as 'completed'.
          transaction.update(matchRef, {
            status: 'completed',
            winnerId: winClaims[0].userId,
          });
          // You could also trigger prize distribution here.
        } else {
          // If all submitted but there's no clear winner (0 or >1 win claims), it's disputed.
          transaction.update(matchRef, { status: 'disputed' });
        }
      }
    });
  });

// This function can be called (e.g., via HTTPS or from another function) to distribute winnings.
exports.distributeWinnings = functions.https.onRequest(async (req, res) => {
    const { matchId } = req.body;
    if (!matchId) {
        res.status(400).send('Match ID is required.');
        return;
    }

    const matchRef = db.doc(`matches/${matchId}`);
    
    try {
        await db.runTransaction(async (transaction) => {
            const matchDoc = await transaction.get(matchRef);
            if (!matchDoc.exists) throw new Error('Match not found.');
            
            const matchData = matchDoc.data();
            const { winnerId, prizePool, prizeDistributed, status } = matchData;

            if (status !== 'completed') throw new Error('Match is not completed yet.');
            if (prizeDistributed) throw new Error('Prizes already distributed.');
            if (!winnerId) throw new Error('No winner declared for this match.');

            const winnerRef = db.doc(`users/${winnerId}`);
            const winnerDoc = await transaction.get(winnerRef);
            if (!winnerDoc.exists) throw new Error('Winner not found.');

            const commission = prizePool * 0.10; // 10% commission
            const amountToCredit = prizePool - commission;

            const currentBalance = winnerDoc.data().walletBalance || 0;
            const newBalance = currentBalance + amountToCredit;

            transaction.update(winnerRef, { walletBalance: newBalance });
            transaction.update(matchRef, { prizeDistributed: true });
            
            // Log the transaction
            const transRef = db.collection('transactions').doc();
            transaction.set(transRef, {
                userId: winnerId,
                type: 'winnings',
                amount: amountToCredit,
                status: 'completed',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                relatedMatchId: matchId,
                description: `Winnings from match ${matchId}`
            });
        });
        res.status(200).send({ success: true, message: 'Winnings distributed successfully.' });
    } catch (error) {
        console.error('Error distributing winnings:', error);
        res.status(500).send({ success: false, message: error.message });
    }
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
