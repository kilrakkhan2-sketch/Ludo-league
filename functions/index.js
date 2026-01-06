
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

const rankConfig = [
  { rank: 0, maxAmount: 100, pointsRequired: 300 },
  { rank: 1, maxAmount: 300, pointsRequired: 1500 },
  { rank: 2, maxAmount: 1000, pointsRequired: 5000 },
  { rank: 3, maxAmount: 3000, pointsRequired: 20000 },
  { rank: 4, maxAmount: 10000, pointsRequired: 50000 },
  { rank: 5, maxAmount: 50000, pointsRequired: Infinity }
];

// This function now finds an opponent OR creates a new match
exports.findOpponentAndCreateMatch = functions.https.onCall(async (data, context) => {
    const userId = context.auth.uid;
    const entryFee = data.entryFee;
  
    if (!userId) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }
  
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    const userData = userSnap.data();

    // Rank check
    if (entryFee > (userData.maxUnlockedAmount || 0)) {
        throw new functions.https.HttpsError('permission-denied', `Your rank allows matches up to ₹${userData.maxUnlockedAmount}.`);
    }
    
    // Balance check
    if (userData.walletBalance < entryFee) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient wallet balance.');
    }

    // Check if user is already in a match
    if (userData.currentMatch) {
        const existingMatchSnap = await db.collection('matches').doc(userData.currentMatch).get();
        if (existingMatchSnap.exists && ['waiting', 'in-progress'].includes(existingMatchSnap.data().status)) {
            throw new functions.https.HttpsError('already-exists', 'You are already in an active match.');
        }
    }
  
    // Transactionally find and join a match, or create a new one.
    const matchRef = await db.runTransaction(async (transaction) => {
      const waitingMatchesQuery = db.collection("matches")
        .where('status', '==', 'waiting')
        .where('entryFee', '==', entryFee)
        .where('playerIds', '!=', [userId]) // Ensure we don't join our own waiting match
        .limit(1);
  
      const waitingMatches = await transaction.get(waitingMatchesQuery);
  
      if (!waitingMatches.empty) {
        // Found a match, let's join it
        const matchToJoinRef = waitingMatches.docs[0].ref;
        
        transaction.update(matchToJoinRef, {
          playerIds: admin.firestore.FieldValue.arrayUnion(userId),
          players: admin.firestore.FieldValue.arrayUnion({
            id: userId,
            name: userData.displayName,
            avatarUrl: userData.photoURL,
          }),
          status: 'in-progress' // Match starts immediately
        });

        // Update both players' currentMatch status
        const creatorId = waitingMatches.docs[0].data().creatorId;
        const creatorRef = db.collection('users').doc(creatorId);
        transaction.update(userRef, { currentMatch: matchToJoinRef.id });
        transaction.update(creatorRef, { currentMatch: matchToJoinRef.id });

        return matchToJoinRef;

      } else {
        // No match found, create a new one
        const newMatchRef = db.collection("matches").doc();
        transaction.set(newMatchRef, {
            creatorId: userId,
            status: 'waiting',
            entryFee: entryFee,
            prizePool: entryFee * 1.8,
            maxPlayers: 2,
            playerIds: [userId],
            players: [{
                id: userId,
                name: userData.displayName,
                avatarUrl: userData.photoURL,
            }],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        transaction.update(userRef, { currentMatch: newMatchRef.id });

        return newMatchRef;
      }
    });

    // Create entry-fee transaction outside the main transaction
    await db.collection('transactions').add({
        userId: userId,
        type: 'entry-fee',
        amount: -entryFee,
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        relatedMatchId: matchRef.id,
        description: `Entry fee for match ${matchRef.id}`
    });
  
    return { matchId: matchRef.id };
});

exports.updateUserStatsAfterMatch = functions.firestore
  .document('matches/{matchId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Trigger only when a match is marked as 'completed'
    if (before.status !== 'completed' && after.status === 'completed') {
        const { winnerId, playerIds, entryFee } = after;
        
        if (!winnerId || !playerIds || playerIds.length !== 2) {
            console.log(`Match ${context.params.matchId} is not a valid 1v1 match or has no winner.`);
            return null;
        }

        const loserId = playerIds.find((id) => id !== winnerId);
        if (!loserId) {
            console.log(`Could not determine loser for match ${context.params.matchId}`);
            return null;
        }

        const prizePool = entryFee * 1.8;
        const netWinnings = prizePool - entryFee;

        try {
            const batch = db.batch();
            
            // --- Update Winner ---
            const winnerRef = db.collection('users').doc(winnerId);
            batch.update(winnerRef, {
                totalWins: admin.firestore.FieldValue.increment(1),
                totalNetWinning: admin.firestore.FieldValue.increment(netWinnings),
                currentMatch: null, // Clear current match
            });

            // --- Update Loser ---
            const loserRef = db.collection('users').doc(loserId);
            batch.update(loserRef, {
                totalLosses: admin.firestore.FieldValue.increment(1),
                totalNetWinning: admin.firestore.FieldValue.increment(-entryFee),
                currentMatch: null, // Clear current match
            });

            await batch.commit();
            console.log(`Stats updated for match ${context.params.matchId}.`);

            // --- Recalculate Ranks for both players ---
            await Promise.all([
              recalculateRank(winnerId),
              recalculateRank(loserId)
            ]);

        } catch (error) {
            console.error(`Error updating stats for match ${context.params.matchId}:`, error);
        }
    }
    return null;
});


async function recalculateRank(userId) {
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return;

    let userData = userSnap.data();
    let currentRank = userData.rank || 0;
    const totalNetWinning = userData.totalNetWinning || 0;

    // Find the highest rank the user qualifies for
    let newRank = 0;
    for (let i = rankConfig.length - 1; i >= 0; i--) {
        if (totalNetWinning >= rankConfig[i].requiredWinning) {
            newRank = rankConfig[i].rank;
            break;
        }
    }
  
    // Update user document if rank or max amount has changed
    const newMaxAmount = rankConfig[newRank].maxAmount;
    if (newRank !== currentRank || userData.maxUnlockedAmount !== newMaxAmount) {
        await userRef.update({
            rank: newRank,
            maxUnlockedAmount: newMaxAmount,
        });
        console.log(`User ${userId} rank updated to ${newRank}. Max amount: ${newMaxAmount}`);
    }
}


// Securely handles wallet balance updates when a transaction is created.
exports.onTransactionCreate = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    const transaction = snap.data();
    const { userId, type, amount, status } = transaction;

    if (status !== 'completed') return null;

    const validTypes = ['deposit', 'withdrawal', 'entry-fee', 'winnings', 'refund', 'admin-credit', 'admin-debit', 'referral-bonus'];
    if (!validTypes.includes(type)) return null;
    
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
        console.log(`Transaction ${context.params.transactionId} for user ${userId} handled successfully.`);
    } catch (error) {
        console.error('Error handling transaction:', error);
        return snap.ref.update({ status: 'failed', error: error.message });
    }
    return null;
  });


exports.onDepositApproved = functions.firestore
.document('depositRequests/{depositId}') 
.onUpdate(async (change, context) => {
  const after = change.after.data();
  const before = change.before.data();

  if (after.status === 'approved' && before.status !== 'approved') {
    const { userId, amount } = after;
    const userRef = db.doc(`users/${userId}`);
    const userDoc = await userRef.get();
    if (!userDoc.exists()) return null;
    const userData = userDoc.data();
    const referredBy = userData.referredBy;

    if (referredBy && !userData.referralBonusPaid) {
      try {
        await db.runTransaction(async (transaction) => {
          const referrerRef = db.doc(`users/${referredBy}`);
          const referrerDoc = await transaction.get(referrerRef);
          if (!referrerDoc.exists()) return;

          const configRef = db.doc('referralConfiguration/settings');
          const configDoc = await transaction.get(configRef);
          const commissionPercentage = configDoc.exists() ? configDoc.data().commissionPercentage : 5;
          
          const commission = (amount * commissionPercentage) / 100;
          
          const commissionTransRef = db.collection('transactions').doc();
          transaction.set(commissionTransRef, {
            userId: referredBy,
            type: 'referral-bonus',
            amount: commission,
            status: 'completed',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            description: `Referral commission from ${userData.displayName || userId}'s deposit.`
          });
           transaction.update(userRef, { referralBonusPaid: true });
        });
      } catch (error) {
        console.error("Error processing referral commission: ", error);
      }
    }
  }
  return null;
});


exports.onMatchCreate = functions.firestore
  .document('matches/{matchId}')
  .onCreate(async (snap, context) => {
    const match = snap.data();
    const creatorId = match.creatorId;

    const usersSnapshot = await db.collection('users').get();
    const tokens = [];
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      if (doc.id !== creatorId && user.fcmToken) {
        tokens.push(user.fcmToken);
      }
    });

    if (tokens.length === 0) return null;

    const payload = {
      notification: {
        title: 'New Match Available!',
        body: `A new match for ₹${match.prizePool} has been created. Tap to join now!`,
        clickAction: `/lobby`,
      },
    };

    try {
      await admin.messaging().sendEachForMulticast({ tokens, ...payload });
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
    return null;
  });


// Function to set admin claims and also update the user's document in Firestore.
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  if (!context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set admin claims.');
  }

  const { uid, isAdmin } = data;
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });
    await db.collection('users').doc(uid).update({ isAdmin: isAdmin });
    return { message: `Success! User ${uid} has been ${isAdmin ? 'made an admin' : 'removed as an admin'}.` };
  } catch (error) {
    console.error("Error setting admin claim:", error);
    throw new functions.https.HttpsError('internal', 'An error occurred while setting the admin claim.');
  }
});

exports.onResultSubmit = functions.firestore
  .document('matches/{matchId}/results/{userId}')
  .onCreate(async (snap, context) => {
    const matchId = context.params.matchId;
    const matchRef = db.collection('matches').doc(matchId);

    try {
      const matchDoc = await matchRef.get();
      if (!matchDoc.exists) return null;

      const matchData = matchDoc.data();
      if (['completed', 'disputed', 'cancelled'].includes(matchData.status)) return null;
      
      const resultsCollectionRef = matchRef.collection('results');
      const resultsSnapshot = await resultsCollectionRef.get();
      
      if (resultsSnapshot.size < matchData.playerIds.length) return null;
      
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
    } catch (error) {
      console.error(`Error in onResultSubmit for match ${matchId}:`, error);
      await matchRef.update({ status: 'disputed', reviewReason: `System error: ${error.message}` }).catch(e => console.error("Failed to update match status to disputed on error:", e));
    }
    return null;
  });
