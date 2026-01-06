
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

// Function to set admin claims and also update the user's document in Firestore.
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // Ensure the caller is an admin.
  if (context.auth?.token?.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set admin claims.');
  }

  const { uid, isAdmin } = data;
  try {
    // Set the custom claim on the user's auth token.
    await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });
    // Also update the `isAdmin` field in the user's Firestore document.
    await db.collection('users').doc(uid).update({ isAdmin: isAdmin });

    return { message: `Success! User ${uid} has been ${isAdmin ? 'made an admin' : 'removed as an admin'}.` };
  } catch (error) {
    console.error("Error setting admin claim:", error);
    throw new functions.https.HttpsError('internal', 'An error occurred while setting the admin claim.');
  }
});


// Securely handles wallet balance updates when a transaction is created.
exports.onTransactionCreate = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    const transaction = snap.data();
    const { userId, type, amount, status } = transaction;

    // Only process completed transactions that affect balance.
    if (status !== 'completed') {
        console.log(`Transaction ${context.params.transactionId} is not completed. Skipping balance update.`);
        return null;
    }

    const validTypes = ['deposit', 'withdrawal', 'entry-fee', 'winnings', 'refund', 'admin-credit', 'admin-debit', 'referral-bonus'];
    if (!validTypes.includes(type)) {
        console.log(`Invalid transaction type: ${type}. Skipping balance update.`);
        return null;
    }
    
    const userRef = db.collection('users').doc(userId);

    try {
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) {
                throw new Error(`User ${userId} not found`);
            }

            const currentBalance = userDoc.data().walletBalance || 0;
            const newBalance = currentBalance + amount; // Amount is positive for credits, negative for debits.

            if (newBalance < 0) {
                // This should ideally be prevented by client-side checks, but it's a server-side safeguard.
                throw new Error(`Insufficient balance for user ${userId}. Transaction would result in negative balance.`);
            }

            t.update(userRef, { walletBalance: newBalance });
        });

        console.log(`Transaction ${context.params.transactionId} for user ${userId} handled successfully. New balance updated.`);
        return null;

    } catch (error) {
        console.error('Error handling transaction:', error);
        // Mark the transaction as failed to prevent re-processing and for auditing.
        return snap.ref.update({ status: 'failed', error: error.message });
    }
  });


  // This function triggers when a deposit request is approved to handle referral commissions.
exports.onDepositApproved = functions.firestore
.document('depositRequests/{depositId}') 
.onUpdate(async (change, context) => {
  const after = change.after.data();
  const before = change.before.data();

  // Check if the transaction is a deposit and just got approved
  if (after.status === 'approved' && before.status === 'pending') {
    const { userId, amount } = after;

    const userRef = db.doc(`users/${userId}`);
    const userDoc = await userRef.get();

    if (!userDoc.exists()) {
      console.log(`User ${userId} not found.`);
      return null;
    }
    const userData = userDoc.data();
    const referredBy = userData.referredBy;

    // If the user was referred by someone and bonus not paid, calculate and give commission
    if (referredBy && !userData.referralBonusPaid) {
      try {
        await db.runTransaction(async (transaction) => {
          const referrerRef = db.doc(`users/${referredBy}`);
          const referrerDoc = await transaction.get(referrerRef);

          if (!referrerDoc.exists()) {
            console.log(`Referrer ${referredBy} not found.`);
            return;
          }

          const configRef = db.doc('referralConfiguration/settings');
          const configDoc = await transaction.get(configRef);
          const commissionPercentage = configDoc.exists() ? configDoc.data().commissionPercentage : 5; // Default 5%
          
          const commission = (amount * commissionPercentage) / 100;
          
          // Create a transaction document for the commission.
          const commissionTransRef = db.collection('transactions').doc();
          transaction.set(commissionTransRef, {
            userId: referredBy,
            type: 'referral-bonus',
            amount: commission,
            status: 'completed',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            description: `Referral commission from ${userData.displayName || userId}'s deposit.`
          });
          
          // Mark the new user so they don't trigger this again on future deposits
           transaction.update(userRef, { referralBonusPaid: true });

           console.log(`Created referral transaction of ${commission} for ${referredBy}.`);
        });
      } catch (error) {
        console.error("Error processing referral commission: ", error);
      }
    }
  }
  return null;
});

exports.onMatchmakingQueueWrite = functions.firestore
  .document('matchmakingQueue/{userId}')
  .onWrite(async (change, context) => {
    // If a user cancels their search, the document is deleted.
    if (!change.after.exists) {
      console.log(`User ${context.params.userId} left the queue.`);
      return null;
    }

    const newUserInQueue = change.after.data();
    const entryFee = newUserInQueue.entryFee;
    const userId = newUserInQueue.userId;

    const queueRef = db.collection('matchmakingQueue');
    // Find another user in the queue with the same entry fee who is not the current user.
    const q = queueRef
      .where('entryFee', '==', entryFee)
      .where('status', '==', 'waiting')
      .where('userId', '!=', userId)
      .limit(1);

    const snapshot = await q.get();

    if (snapshot.empty) {
      console.log(`No opponent found for ${userId} with fee ${entryFee}. Waiting...`);
      return null;
    }

    // --- Opponent Found! ---
    const opponent = snapshot.docs[0].data();
    const opponentId = opponent.userId;
    console.log(`Opponent found for ${userId}! Matched with ${opponentId}`);

    const batch = db.batch();

    // 1. Lock both players in the queue to prevent them from being matched with others.
    const player1QueueRef = db.doc(`matchmakingQueue/${userId}`);
    const player2QueueRef = db.doc(`matchmakingQueue/${opponentId}`);
    batch.update(player1QueueRef, { status: 'matched', matchedWith: opponentId });
    batch.update(player2QueueRef, { status: 'matched', matchedWith: userId });

    // 2. Create the new match document.
    const newMatchRef = db.collection('matches').doc();
    const prizePool = entryFee * 1.8; // 10% commission
    batch.set(newMatchRef, {
      id: newMatchRef.id,
      creatorId: userId, // Arbitrarily assign one player as creator
      status: 'waiting', // Starts as 'waiting' until room code is added
      entryFee: entryFee,
      prizePool: prizePool,
      maxPlayers: 2,
      playerIds: [userId, opponentId],
      players: [
        { id: userId, name: newUserInQueue.userName, avatarUrl: newUserInQueue.userAvatar },
        { id: opponentId, name: opponent.userName, avatarUrl: opponent.userAvatar },
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 3. Create entry-fee transactions for both players.
    const player1TransRef = db.collection('transactions').doc();
    const player2TransRef = db.collection('transactions').doc();
    const transactionData = {
      type: 'entry-fee',
      amount: -entryFee,
      status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      relatedMatchId: newMatchRef.id,
    };
    batch.set(player1TransRef, { ...transactionData, userId: userId, description: `Entry fee for match ${newMatchRef.id}` });
    batch.set(player2TransRef, { ...transactionData, userId: opponentId, description: `Entry fee for match ${newMatchRef.id}` });

    // 4. Update both users' profiles with the active match ID.
    const player1UserRef = db.doc(`users/${userId}`);
    const player2UserRef = db.doc(`users/${opponentId}`);
    batch.update(player1UserRef, { activeMatchId: newMatchRef.id });
    batch.update(player2UserRef, { activeMatchId: newMatchRef.id });

    // 5. Delete players from the matchmaking queue.
    batch.delete(player1QueueRef);
    batch.delete(player2QueueRef);

    // Commit all operations as a single batch.
    try {
      await batch.commit();
      console.log(`Successfully created match ${newMatchRef.id} for players ${userId} and ${opponentId}.`);
    } catch (error) {
      console.error("Error committing matchmaking batch: ", error);
      // Optional: Clean up or revert status if commit fails
      await player1QueueRef.update({ status: 'waiting', matchedWith: null }).catch();
      await player2QueueRef.update({ status: 'waiting', matchedWith: null }).catch();
    }
    
    return null;
});


// New, advanced onResultSubmit function
exports.onResultSubmit = functions.firestore
  .document('matches/{matchId}/results/{userId}')
  .onCreate(async (snap, context) => {
    const matchId = context.params.matchId;
    const matchRef = db.collection('matches').doc(matchId);

    try {
      const matchDoc = await matchRef.get();
      if (!matchDoc.exists) {
        console.log(`Match with ID: ${matchId} does not exist.`);
        return null;
      }

      const matchData = matchDoc.data();

      // Don't process if match is already concluded
      if (['completed', 'disputed', 'cancelled'].includes(matchData.status)) {
        console.log(`Match ${matchId} already concluded. Skipping fraud check.`);
        return null;
      }
      
      const resultsCollectionRef = matchRef.collection('results');
      const resultsSnapshot = await resultsCollectionRef.get();
      
      // If not all players have submitted, do nothing yet.
      if (resultsSnapshot.size < matchData.playerIds.length) {
        console.log(`Waiting for all players to submit results for match ${matchId}.`);
        return null;
      }
      
      // All players have submitted, now run fraud detection
      const results = resultsSnapshot.docs.map(doc => doc.data());
      
      // 1. Check for multiple win claims
      const winClaims = results.filter(r => r.status === 'win');
      if (winClaims.length > 1) {
        await matchRef.update({ status: 'disputed', reviewReason: 'Multiple players claimed victory.' });
        console.log(`Match ${matchId} flagged for dispute: Multiple winners.`);
        return null;
      }
      
      // 2. Check for duplicate screenshots
      const screenshotUrls = results.map(r => r.screenshotUrl);
      const uniqueUrls = new Set(screenshotUrls);
      if (screenshotUrls.length !== uniqueUrls.size) {
        await matchRef.update({ status: 'disputed', reviewReason: 'Duplicate screenshots submitted.' });
        console.log(`Match ${matchId} flagged for dispute: Duplicate screenshots.`);
        return null;
      }

      // If no fraud detected, complete the match
      if (winClaims.length === 1) {
        // Clear winner, complete the match
        await matchRef.update({ status: 'completed', winnerId: winClaims[0].userId });
        console.log(`Match ${matchId} completed. Winner: ${winClaims[0].userId}`);
      } else {
        // No one claimed win, or some other edge case
        await matchRef.update({ status: 'disputed', reviewReason: 'No clear winner claimed.' });
        console.log(`Match ${matchId} flagged for dispute: No clear winner.`);
      }

      return null;
    } catch (error) {
      console.error(`Error in onResultSubmit for match ${matchId}:`, error);
      await matchRef.update({ status: 'disputed', reviewReason: `System error: ${error.message}` }).catch(e => console.error("Failed to update match status to disputed on error:", e));
      return null;
    }
  });
