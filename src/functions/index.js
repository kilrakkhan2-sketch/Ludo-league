
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Function to set admin claims and also update the user's document in Firestore.
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // Check if the caller is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  // Ensure the caller is an admin.
  if (context.auth.token.admin !== true) {
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


// New, advanced onResultSubmit function that detects fraud and decides match outcome.
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
        // Clear winner, complete the match. The `distributeWinnings` trigger will handle the payout.
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


// Securely handles wallet balance updates when a transaction is created.
exports.onTransactionCreate = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    const transaction = snap.data();
    const { userId, type, amount, status } = transaction;

    if (status !== 'completed') {
        console.log(`Transaction ${context.params.transactionId} not completed. Skipping.`);
        return null;
    }

    const userRef = db.collection('users').doc(userId);

    try {
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new Error(`User ${userId} not found`);

            const currentBalance = userDoc.data().walletBalance || 0;
            const newBalance = currentBalance + amount;

            if (newBalance < 0) {
                throw new Error(`Insufficient balance for user ${userId}.`);
            }

            t.update(userRef, { walletBalance: newBalance });
        });

        // If this was a deposit, check for referral commission
        if (type === 'deposit') {
            await handleReferralCommission(userId, amount);
        }

        console.log(`Transaction ${context.params.transactionId} handled for ${userId}.`);
    } catch (error) {
        console.error('Error in onTransactionCreate:', error);
        return snap.ref.update({ status: 'failed', error: error.message });
    }
  });


async function handleReferralCommission(userId, depositAmount) {
    const userRef = db.doc(`users/${userId}`);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists()) {
        console.log(`User ${userId} not found for referral check.`);
        return;
    }
    
    const userData = userDoc.data();
    const referredBy = userData.referredBy;
    
    // Check if user was referred and doesn't have referralBonusPaid flag
    if (referredBy && !userData.referralBonusPaid) {
        const referrerRef = db.doc(`users/${referredBy}`);
        const configRef = db.doc('referralConfiguration/settings');
        
        const [referrerDoc, configDoc] = await Promise.all([
            referrerRef.get(),
            configRef.get()
        ]);
        
        if (!referrerDoc.exists()) {
            console.log(`Referrer ${referredBy} not found.`);
            return;
        }
        
        const commissionPercentage = configDoc.exists() ? configDoc.data().commissionPercentage : 5; // Default 5%
        const commission = (depositAmount * commissionPercentage) / 100;
        
        const commissionTransRef = db.collection('transactions').doc();
        
        // Create batch to ensure atomicity
        const batch = db.batch();
        
        // 1. Create the commission transaction for the referrer. `onTransactionCreate` will update the balance.
        batch.set(commissionTransRef, {
            userId: referredBy,
            type: 'referral-bonus',
            amount: commission,
            status: 'completed',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            description: `Referral bonus from ${userData.displayName || userId}'s deposit`
        });
        
        // 2. Mark the new user so they don't trigger this again on future deposits
        batch.update(userRef, { referralBonusPaid: true });
        
        await batch.commit();
        console.log(`Referral commission of ${commission} paid to ${referredBy}.`);
    }
}


// Automated prize distribution on match completion. This is the only function that distributes prizes.
exports.distributeWinnings = functions.firestore
  .document('matches/{matchId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if match just got marked as 'completed', has a winner, and prize hasn't been distributed.
    if (after.status === 'completed' && before.status !== 'completed' && after.winnerId && !after.prizeDistributed) {
        const { matchId } = context.params;
        const { winnerId, prizePool } = after;

        const commission = prizePool * 0.10; // 10% commission
        const amountToCredit = prizePool - commission;

        const batch = db.batch();
        
        const matchRef = db.doc(`matches/${matchId}`);
        const transactionRef = db.collection('transactions').doc();

        // 1. Create a winnings transaction. The onTransactionCreate function will handle the balance update.
        batch.set(transactionRef, {
            userId: winnerId,
            type: 'winnings',
            amount: amountToCredit,
            status: 'completed',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            relatedMatchId: matchId,
            description: `Winnings for match ${matchId}`,
        });

        // 2. Mark prize as distributed in the match document to prevent this from running again.
        batch.update(matchRef, { prizeDistributed: true });
        
        try {
            await batch.commit();
            console.log(`Winnings transaction created for match ${matchId}, winner ${winnerId}. Balance will be updated by onTransactionCreate.`);
        } catch(error) {
            console.error(`Failed to create winnings transaction for match ${matchId}:`, error);
        }
    }
  });


exports.onMatchCreate = functions.firestore
  .document('matches/{matchId}')
  .onCreate(async (snap, context) => {
    const match = snap.data();
    const creatorId = match.creatorId;

    // Get all users' FCM tokens except the creator
    const usersSnapshot = await db.collection('users').get();
    const tokens = [];
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      if (doc.id !== creatorId && user.fcmToken) {
        tokens.push(user.fcmToken);
      }
    });

    if (tokens.length === 0) {
      console.log('No tokens to send notifications to.');
      return null;
    }

    const payload = {
      notification: {
        title: 'New Match Available!',
        body: `A new match for ₹${match.prizePool} has been created. Tap to join now!`,
        clickAction: `/lobby`,
      },
    };

    try {
      // Send notifications to all tokens.
      const response = await admin.messaging().sendEachForMulticast({ tokens, ...payload });
      console.log('Notifications sent successfully:', response.successCount);
      // You can also handle failures, e.g., by removing invalid tokens from the database.
      if (response.failureCount > 0) {
        console.log('Failed to send notifications to some devices:', response.failureCount);
      }
      return response;
    } catch (error) {
      console.error('Error sending notifications:', error);
      return null;
    }
  });
