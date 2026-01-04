
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


// This function triggers when a deposit request is approved to handle referral commissions.
exports.onDepositApproved = functions.firestore
  .document('depositRequests/{depositId}')
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    const before = change.before.data();

    // Check if the deposit status changed from pending to approved
    if (before.status === 'pending' && after.status === 'approved') {
      const { userId, amount } = after;

      const userRef = db.doc(`users/${userId}`);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        console.log(`User ${userId} not found.`);
        return null;
      }
      const userData = userDoc.data();
      const referredBy = userData.referredBy;

      // If the user was referred by someone, calculate and give commission
      if (referredBy) {
        try {
          await db.runTransaction(async (transaction) => {
            const referrerRef = db.doc(`users/${referredBy}`);
            const referrerDoc = await transaction.get(referrerRef);

            if (!referrerDoc.exists()) {
              console.log(`Referrer ${referredBy} not found.`);
              return;
            }

            // Get referral commission percentage from settings
            const configRef = db.doc('referralConfiguration/settings');
            const configDoc = await transaction.get(configRef);
            const commissionPercentage = configDoc.exists() ? configDoc.data().commissionPercentage : 5; // Default 5%
            
            const commission = (amount * commissionPercentage) / 100;
            
            // Update referrer's wallet
            const referrerData = referrerDoc.data();
            const newBalance = (referrerData.walletBalance || 0) + commission;
            transaction.update(referrerRef, { walletBalance: newBalance });

            // Log the commission transaction
            const commissionTransRef = db.collection('transactions').doc();
            transaction.set(commissionTransRef, {
              userId: referredBy,
              type: 'referral-bonus',
              amount: commission,
              status: 'completed',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              description: `Referral commission from ${userData.displayName}'s deposit.`
            });

             console.log(`Credited ${commission} to ${referredBy} for referral.`);
          });
        } catch (error) {
          console.error("Error processing referral commission: ", error);
          // Don't block the main flow if referral fails
        }
      }
    }
    return null;
  });
