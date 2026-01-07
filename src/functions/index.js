
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { HttpsError } = require('firebase-functions/v1/https');

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
        return null;
    }

    const validTypes = ['deposit', 'withdrawal', 'entry-fee', 'winnings', 'refund', 'admin-credit', 'admin-debit', 'referral-bonus', 'tournament-fee'];
    if (!validTypes.includes(type)) {
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

            const updateData = { walletBalance: newBalance };

            t.update(userRef, updateData);
        });

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
    if (!change.after.exists) {
      return null;
    }

    const newUserInQueue = change.after.data();
    const { entryFee, userId, status } = newUserInQueue;
    
    if (status !== 'waiting') {
        return null;
    }

    const queueRef = db.collection('matchmakingQueue');
    const q = queueRef
      .where('entryFee', '==', entryFee)
      .where('status', '==', 'waiting');

    const snapshot = await q.get();

    if (snapshot.docs.length < 2) {
      return null;
    }

    const opponentDoc = snapshot.docs.find(doc => doc.id !== userId);
    
    if (!opponentDoc) {
      return null;
    }

    const opponent = opponentDoc.data();
    const opponentId = opponent.userId;

    const player1QueueRef = db.doc(`matchmakingQueue/${userId}`);
    const player2QueueRef = opponentDoc.ref;
    
    try {
      await db.runTransaction(async (transaction) => {
        const p1Doc = await transaction.get(player1QueueRef);
        const p2Doc = await transaction.get(player2QueueRef);

        if (!p1Doc.exists || !p2Doc.exists || p1Doc.data().status !== 'waiting' || p2Doc.data().status !== 'waiting') {
            return;
        }

        transaction.update(player1QueueRef, { status: 'matched' });
        transaction.update(player2QueueRef, { status: 'matched' });

        const newMatchRef = db.collection('matches').doc();
        const prizePool = entryFee * 1.8;
        transaction.set(newMatchRef, {
            id: newMatchRef.id,
            creatorId: userId,
            status: 'waiting',
            entryFee: entryFee,
            prizePool: prizePool,
            maxPlayers: 2,
            playerIds: [userId, opponentId],
            players: [
                { id: userId, name: newUserInQueue.userName, avatarUrl: newUserInQueue.userAvatar, winRate: newUserInQueue.winRate || 0 },
                { id: opponentId, name: opponent.userName, avatarUrl: opponent.userAvatar, winRate: opponent.winRate || 0 },
            ],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const player1TransRef = db.collection('transactions').doc();
        const player2TransRef = db.collection('transactions').doc();
        const transactionData = {
            type: 'entry-fee',
            amount: -entryFee,
            status: 'completed',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            relatedMatchId: newMatchRef.id,
        };
        transaction.set(player1TransRef, { ...transactionData, userId: userId, description: `Entry fee for match ${newMatchRef.id}` });
        transaction.set(player2TransRef, { ...transactionData, userId: opponentId, description: `Entry fee for match ${newMatchRef.id}` });

        const player1UserRef = db.doc(`users/${userId}`);
        const player2UserRef = db.doc(`users/${opponentId}`);
        transaction.update(player1UserRef, { activeMatchId: newMatchRef.id });
        transaction.update(player2UserRef, { activeMatchId: newMatchRef.id });

        transaction.delete(player1QueueRef);
        transaction.delete(player2QueueRef);
      });
    } catch (error) {
      console.error("Error in matchmaking transaction: ", error);
    }
    
    return null;
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
      const response = await admin.messaging().sendEachForMulticast({ tokens, ...payload });
      if (response.failureCount > 0) {
        console.log('Failed to send notifications to some devices:', response.failureCount);
      }
      return response;
    } catch (error) {
      console.error('Error sending notifications:', error);
      return null;
    }
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
        return null;
      }

      const matchData = matchDoc.data();

      if (['completed', 'disputed', 'cancelled'].includes(matchData.status)) {
        return null;
      }
      
      const resultsCollectionRef = matchRef.collection('results');
      const resultsSnapshot = await resultsCollectionRef.get();
      
      if (resultsSnapshot.size < matchData.playerIds.length) {
        return null;
      }
      
      const results = resultsSnapshot.docs.map(doc => doc.data());
      
      const winClaims = results.filter(r => r.status === 'win');
      if (winClaims.length > 1) {
        await matchRef.update({ status: 'disputed', reviewReason: 'Multiple players claimed victory.' });
        return null;
      }
      
      const screenshotUrls = results.map(r => r.screenshotUrl);
      const uniqueUrls = new Set(screenshotUrls);
      if (screenshotUrls.length !== uniqueUrls.size) {
        await matchRef.update({ status: 'disputed', reviewReason: 'Duplicate screenshots submitted.' });
        return null;
      }

      if (winClaims.length === 1) {
        await matchRef.update({ status: 'completed', winnerId: winClaims[0].userId });
      } else {
        await matchRef.update({ status: 'disputed', reviewReason: 'No clear winner claimed.' });
      }

      return null;
    } catch (error) {
      console.error(`Error in onResultSubmit for match ${matchId}:`, error);
      await matchRef.update({ status: 'disputed', reviewReason: `System error: ${error.message}` }).catch(e => console.error("Failed to update match status to disputed on error:", e));
      return null;
    }
  });

  exports.declareWinnerAndDistribute = functions.https.onCall(async (data, context) => {
    if (context.auth?.token?.admin !== true) {
        throw new HttpsError('permission-denied', 'Only admins can call this function.');
    }

    const { matchId, winnerId } = data;
    if (!matchId || !winnerId) {
        throw new HttpsError('invalid-argument', 'The function must be called with "matchId" and "winnerId" arguments.');
    }

    const matchRef = db.collection('matches').doc(matchId);

    try {
        let winningPlayer;
        let finalMessage = 'An unknown error occurred';

        await db.runTransaction(async (transaction) => {
            const matchDoc = await transaction.get(matchRef);
            if (!matchDoc.exists) {
                throw new HttpsError('not-found', 'Match not found.');
            }
            const matchData = matchDoc.data();

            if (matchData.status === 'completed' && matchData.prizeDistributed) {
                throw new HttpsError('failed-precondition', 'Winnings have already been distributed for this match.');
            }

            if (!matchData.playerIds.includes(winnerId)) {
                throw new HttpsError('invalid-argument', 'The declared winner is not a player in this match.');
            }

            winningPlayer = matchData.players.find(p => p.id === winnerId);
            const prizePool = matchData.prizePool;
            const commission = prizePool * 0.10;
            const amountToCredit = prizePool - commission;

            // 1. Update the match document
            transaction.update(matchRef, { 
                status: 'completed', 
                winnerId: winnerId,
                prizeDistributed: true,
            });

            // 2. Create the winnings transaction
            const winningsTransactionRef = db.collection('transactions').doc();
            transaction.set(winningsTransactionRef, {
                userId: winnerId,
                type: 'winnings',
                amount: amountToCredit,
                status: 'completed',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                relatedMatchId: matchId,
                description: `Winnings for match ${matchId}`,
            });

            // 3. Update player stats
            for (const playerId of matchData.playerIds) {
                const userRef = db.collection('users').doc(playerId);
                const userDoc = await transaction.get(userRef);
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const totalMatchesPlayed = (userData.totalMatchesPlayed || 0) + 1;
                    const totalMatchesWon = (userData.totalMatchesWon || 0) + (playerId === winnerId ? 1 : 0);
                    const winRate = totalMatchesPlayed > 0 ? Math.round((totalMatchesWon / totalMatchesPlayed) * 100) : 0;
                    
                    transaction.update(userRef, {
                        totalMatchesPlayed: totalMatchesPlayed,
                        totalMatchesWon: totalMatchesWon,
                        winRate: winRate,
                    });
                }
            }

            finalMessage = `Successfully declared ${winningPlayer.name} as winner and distributed prize of ₹${amountToCredit}.`;
        });
        
        return { success: true, message: finalMessage };

    } catch (error) {
        console.error('Error in declareWinnerAndDistribute:', error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'An unexpected error occurred during prize distribution.', error);
    }
});
