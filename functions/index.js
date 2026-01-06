

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { CloudTasksClient } = require('@google-cloud/tasks');

admin.initializeApp();

const db = admin.firestore();
const tasksClient = new CloudTasksClient();

// Function to set admin claims and also update the user's document in Firestore.
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // Ensure the caller is an admin.
  if (!context.auth.token.admin) {
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


// Function triggered on result submission
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
      const totalPlayers = matchData.players.length;

      const resultsSnapshot = await matchRef.collection('results').get();
      const resultsCount = resultsSnapshot.size;

      if (resultsCount >= totalPlayers) {
        const tenMinutesFromNow = new Date();
        tenMinutesFromNow.setMinutes(tenMinutesFromNow.getMinutes() + 10);

        const queue = 'distribute-winnings-queue';
        const project = JSON.parse(process.env.FIREBASE_CONFIG).projectId;
        const location = 'us-central1'; 
        const queuePath = tasksClient.queuePath(project, location, queue);

        const url = `https://us-central1-${project}.cloudfunctions.net/distributeWinnings`;

        const task = {
          httpRequest: {
            httpMethod: 'POST',
            url,
            body: Buffer.from(JSON.stringify({ matchId })).toString('base64'),
            headers: {
              'Content-Type': 'application/json',
            },
          },
          scheduleTime: {
            seconds: Math.floor(tenMinutesFromNow.getTime() / 1000),
          },
        };
        
        await tasksClient.createTask({ parent: queuePath, task });
        console.log(`Scheduled winning distribution for match ${matchId}`);
      }

      return null;
    } catch (error) {
      console.error('Error in onResultSubmit:', error);
       if (error.code === 7) { 
          console.error("PERMISSION DENIED: Ensure the service account has 'Cloud Tasks Enqueuer' role and Cloud Tasks API is enabled.");
          await matchRef.update({ status: 'error', errorReason: 'Failed to schedule winnings distribution.' });
      }
      return null;
    }
  });

// HTTP-triggered function to distribute winnings
exports.distributeWinnings = functions.https.onRequest(async (req, res) => {
  const { matchId } = req.body;

  if (!matchId) {
    return res.status(400).send('Missing matchId in request body');
  }

  const matchRef = db.collection('matches').doc(matchId);

  try {
    const matchDoc = await matchRef.get();
    if (!matchDoc.exists) {
      return res.status(404).send('Match not found');
    }

    const matchData = matchDoc.data();
    if (['completed', 'failed', 'review'].includes(matchData.status)) {
        console.log(`Match ${matchId} already processed. Status: ${matchData.status}`);
        return res.status(200).send(`Match already processed.`);
    }

    const resultsSnapshot = await matchRef.collection('results').get();
    const results = resultsSnapshot.docs.map(doc => doc.data());

    const winningResults = results.filter(r => r.result === 'win');
    const screenshotUrls = results.map(r => r.screenshotUrl).filter(url => !!url); 
    const uniqueUrls = new Set(screenshotUrls);

    if ((matchData.maxPlayers === 2 && winningResults.length > 1) || screenshotUrls.length !== uniqueUrls.size) {
      await matchRef.update({ status: 'review', reviewReason: 'Fraud or conflict detected.' });
      return res.status(200).send('Fraud detected. Match flagged for review.');
    }

    if (winningResults.length === 1) {
      const winnerId = winningResults[0].userId;
      const winningAmount = matchData.prize;
      const winnerRef = db.collection('users').doc(winnerId);
      
      const batch = db.batch();
      batch.update(winnerRef, { balance: admin.firestore.FieldValue.increment(winningAmount) });
      batch.update(matchRef, { status: 'completed', winner: winnerId });

      await batch.commit();
      return res.status(200).send('Winnings distributed successfully');
    }

    await matchRef.update({ status: 'completed', winner: null, reviewReason: 'No clear winner.' });
    return res.status(200).send('Match completed with no winner.');

  } catch (error) {
    console.error('Error in distributeWinnings:', error);
    await matchRef.update({ status: 'failed', error: error.message });
    return res.status(500).send('Internal Server Error');
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

          const configRef = db.doc('referralConfiguration/settings');
          const configDoc = await transaction.get(configRef);
          const commissionPercentage = configDoc.exists() ? configDoc.data().commissionPercentage : 5; // Default 5%
          
          const commission = (amount * commissionPercentage) / 100;
          
          // Create a transaction document for the commission.
          // The onTransactionCreate function will handle updating the referrer's balance.
          const commissionTransRef = db.collection('transactions').doc();
          transaction.set(commissionTransRef, {
            userId: referredBy,
            type: 'referral-bonus',
            amount: commission,
            status: 'completed',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            description: `Referral commission from ${userData.displayName || userId}'s deposit.`
          });

           console.log(`Created referral transaction of ${commission} for ${referredBy}.`);
        });
      } catch (error) {
        console.error("Error processing referral commission: ", error);
      }
    }
  }
  return null;
});
