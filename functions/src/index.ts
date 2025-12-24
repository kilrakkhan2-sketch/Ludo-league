
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

admin.initializeApp();
const db = admin.firestore();

// =============================================
// USER-FACING MATCH FUNCTIONS
// =============================================

export const createMatch = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    const userId = context.auth.uid;
    const { entryFee } = data;
    if (typeof entryFee !== "number" || ![50, 100].includes(entryFee)) {
        throw new functions.https.HttpsError("invalid-argument", "Entry fee must be 50 or 100.");
    }

    const userRef = db.collection("users").doc(userId);
    const matchRef = db.collection("matches").doc();

    try {
        const matchId = await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new functions.https.HttpsError("not-found", "User profile not found.");
            if ((userDoc.data()!.walletBalance || 0) < entryFee) throw new functions.https.HttpsError("failed-precondition", "Insufficient funds.");
            
            t.update(userRef, { walletBalance: FieldValue.increment(-entryFee) });
            
            const txRef = db.collection(`users/${userId}/transactions`).doc();
            t.set(txRef, { amount: -entryFee, type: "entry_fee", status: "completed", description: `Fee for match: ${matchRef.id}`, createdAt: FieldValue.serverTimestamp(), relatedId: matchRef.id });
            
            t.set(matchRef, {
                title: `Ludo Match for ₹${entryFee}`,
                entryFee, prizePool: (entryFee * 2), maxPlayers: 2,
                creatorId: userId, players: [userId], status: 'waiting',
                createdAt: FieldValue.serverTimestamp(),
                fraudReasons: [],
            });
            return matchRef.id;
        });
        return { status: "success", matchId };
    } catch (error) {
        functions.logger.error(`Match creation failed for ${userId}:`, error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", "An error occurred.");
    }
});

export const joinMatch = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    const { matchId } = data;
    if (!matchId) throw new functions.https.HttpsError("invalid-argument", "Match ID is required.");

    const userId = context.auth.uid;
    const matchRef = db.collection("matches").doc(matchId);
    const userRef = db.collection("users").doc(userId);

    return db.runTransaction(async (t) => {
        const matchDoc = await t.get(matchRef);
        if (!matchDoc.exists) throw new functions.https.HttpsError("not-found", "Match not found.");
        const matchData = matchDoc.data()!;

        if (matchData.status !== 'waiting') throw new functions.https.HttpsError("failed-precondition", "Match not open for joining.");
        if (matchData.players.includes(userId)) throw new functions.https.HttpsError("failed-precondition", "You already joined.");

        const userDoc = await t.get(userRef);
        if (!userDoc.exists) throw new functions.https.HttpsError("not-found", "User profile not found.");
        if ((userDoc.data()!.walletBalance || 0) < matchData.entryFee) throw new functions.https.HttpsError("failed-precondition", "Insufficient funds.");

        t.update(userRef, { walletBalance: FieldValue.increment(-matchData.entryFee) });
        const feeTxRef = db.collection(`users/${userId}/transactions`).doc();
        t.set(feeTxRef, { amount: -matchData.entryFee, type: "entry_fee", status: "completed", description: `Fee for match: ${matchData.title}`, createdAt: FieldValue.serverTimestamp(), relatedId: matchId });

        t.update(matchRef, { players: FieldValue.arrayUnion(userId), joinerId: userId, status: 'room_code_pending' });
        return { success: true };
    });
});

export const submitResult = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    const { matchId, position, screenshotUrl } = data;
    if (!matchId || !position || !screenshotUrl) throw new functions.https.HttpsError("invalid-argument", "Required data missing.");
    if (typeof position !== 'number' || position < 1 || position > 2) throw new functions.https.HttpsError("invalid-argument", "Invalid position.");

    const userId = context.auth.uid;
    const matchRef = db.collection("matches").doc(matchId);
    const matchDoc = await matchRef.get();
    if (!matchDoc.exists) throw new functions.https.HttpsError("not-found", "Match not found.");
    const matchData = matchDoc.data()!;

    if (!matchData.players.includes(userId)) throw new functions.https.HttpsError("permission-denied", "You are not in this match.");
    if (matchData.status !== 'game_started') throw new functions.https.HttpsError("failed-precondition", "Match not in 'game_started' state.");

    const resultRef = db.collection(`matches/${matchId}/results`).doc(userId);
    const winStatus = (position === 1) ? 'I WON' : 'I LOST';

    await resultRef.set({
        userId, position, winStatus, screenshotUrl,
        submittedAt: FieldValue.serverTimestamp(),
        deviceId: context.instanceIdToken || null,
    });
    
    return { success: true };
});


// =============================================
// AUTOMATED SYSTEM TRIGGERS
// =============================================

export const autoVerifyResults = functions.firestore.document('matches/{matchId}/results/{userId}').onCreate(async (snap, context) => {
    const { matchId } = context.params;
    const matchRef = db.collection('matches').doc(matchId);

    return db.runTransaction(async (t) => {
        const matchDoc = await t.get(matchRef);
        if (!matchDoc.exists) return;
        const matchData = matchDoc.data()!;

        if (['AUTO_VERIFIED', 'FLAGGED', 'PAID'].includes(matchData.status)) return;

        const resultsRef = matchRef.collection('results');
        const resultsSnap = await t.get(resultsRef);

        if (resultsSnap.size < matchData.maxPlayers) {
            t.update(matchRef, { status: 'result_submitted' });
            return;
        }

        const results = resultsSnap.docs.map(doc => doc.data());
        const fraudReasons: string[] = [];

        const positions = results.map(r => r.position);
        const uniquePositions = new Set(positions);
        if (uniquePositions.size !== matchData.maxPlayers) fraudReasons.push('DUPLICATE_OR_MISSING_POSITIONS');
        if (!positions.includes(1) || !positions.includes(2)) fraudReasons.push('INVALID_POSITIONS_FOR_2P');

        const winner = results.find(r => r.position === 1);
        const loser = results.find(r => r.position === 2);
        if (!winner || winner.winStatus !== 'I WON') fraudReasons.push('WINNER_STATE_MISMATCH');
        if (!loser || loser.winStatus !== 'I LOST') fraudReasons.push('LOSER_STATE_MISMATCH');

        if (fraudReasons.length > 0) {
            t.update(matchRef, { status: 'FLAGGED', fraudReasons });
        } else {
            t.update(matchRef, { status: 'AUTO_VERIFIED', winnerId: winner!.userId });
        }
    });
});

export const autoPayout = functions.firestore.document("matches/{matchId}").onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { matchId } = context.params;

    if (before.status === 'AUTO_VERIFIED' || after.status !== 'AUTO_VERIFIED') return null;
    if (!after.winnerId) return null;

    const { winnerId, prizePool, title } = after;
    const winnerRef = db.collection("users").doc(winnerId);

    return db.runTransaction(async (t) => {
        const winnerDoc = await t.get(winnerRef);
        if (!winnerDoc.exists) throw new Error(`Winner ${winnerId} not found.`);

        const commissionRate = 0.10;
        const payoutAmount = prizePool * (1 - commissionRate);

        t.update(winnerRef, { walletBalance: FieldValue.increment(payoutAmount) });

        const prizeTxRef = db.collection(`users/${winnerId}/transactions`).doc();
        t.set(prizeTxRef, { amount: payoutAmount, type: "prize_win", status: "completed", description: `Prize for: ${title}`, relatedId: matchId, createdAt: FieldValue.serverTimestamp() });

        t.update(change.after.ref, { status: 'PAID', completedAt: FieldValue.serverTimestamp() });
    }).catch(error => {
        functions.logger.error(`Payout failed for ${matchId}:`, error);
        return change.after.ref.update({ status: 'FLAGGED', fraudReasons: ['PAYOUT_FAILED'] });
    });
});

// =============================================
// ADMIN-ONLY FUNCTIONS
// =============================================

const ensureAdmin = async (uid: string) => {
    const user = await admin.auth().getUser(uid);
    if (user.customClaims?.role !== 'superadmin') { 
        throw new functions.https.HttpsError('permission-denied', 'Admin role required.');
    }
};

export const resolveFlaggedMatch = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    await ensureAdmin(context.auth.uid);

    const { matchId, winnerId } = data;
    if (!matchId || !winnerId) throw new functions.https.HttpsError("invalid-argument", "Match ID and Winner ID are required.");

    const matchRef = db.collection('matches').doc(matchId);

    return db.runTransaction(async (t) => {
        const matchDoc = await t.get(matchRef);
        if (!matchDoc.exists) throw new functions.https.HttpsError("not-found", "Match not found.");
        const matchData = matchDoc.data()!;

        if (matchData.status !== 'FLAGGED') throw new functions.https.HttpsError("failed-precondition", "Match is not flagged.");
        if (!matchData.players.includes(winnerId)) throw new functions.https.HttpsError("invalid-argument", "Winner is not a player in this match.");

        const commissionRate = 0.10; // 10%
        const payoutAmount = matchData.prizePool * (1 - commissionRate);
        const winnerRef = db.collection('users').doc(winnerId);

        t.update(winnerRef, { walletBalance: FieldValue.increment(payoutAmount) });
        const prizeTxRef = db.collection(`users/${winnerId}/transactions`).doc();
        t.set(prizeTxRef, { amount: payoutAmount, type: "prize_win", status: "completed", description: `Admin resolved prize for: ${matchData.title}`, relatedId: matchId, createdAt: FieldValue.serverTimestamp() });
        
        t.update(matchRef, { status: 'PAID', winnerId, completedAt: FieldValue.serverTimestamp(), resolvedBy: context.auth!.uid });

        return { success: true };
    });
});

export const cancelFlaggedMatch = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    await ensureAdmin(context.auth.uid);

    const { matchId } = data;
    if (!matchId) throw new functions.https.HttpsError("invalid-argument", "Match ID is required.");

    const matchRef = db.collection('matches').doc(matchId);

    return db.runTransaction(async (t) => {
        const matchDoc = await t.get(matchRef);
        if (!matchDoc.exists) throw new functions.https.HttpsError("not-found", "Match not found.");
        const matchData = matchDoc.data()!;

        if (matchData.status !== 'FLAGGED') throw new functions.https.HttpsError("failed-precondition", "Match is not flagged.");

        for (const playerId of matchData.players) {
            const playerRef = db.collection('users').doc(playerId);
            t.update(playerRef, { walletBalance: FieldValue.increment(matchData.entryFee) });

            const refundTxRef = db.collection(`users/${playerId}/transactions`).doc();
            t.set(refundTxRef, { amount: matchData.entryFee, type: "refund", status: "completed", description: `Admin cancelled match: ${matchData.title}`, relatedId: matchId, createdAt: FieldValue.serverTimestamp() });
        }

        t.update(matchRef, { status: 'cancelled', resolvedBy: context.auth!.uid, completedAt: FieldValue.serverTimestamp() });
        
        return { success: true };
    });
});
