"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStorageFile = exports.cancelMatch = exports.resolveMatch = exports.onMatchCompleted = exports.onResultSubmitted = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
// =============================================
// Security Helpers
// =============================================
const ensureAuthenticated = (context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to perform this action.");
    }
    return context.auth.uid;
};
const ensureAdmin = async (context) => {
    var _a;
    const uid = ensureAuthenticated(context);
    const user = await admin.auth().getUser(uid);
    if (((_a = user.customClaims) === null || _a === void 0 ? void 0 : _a.role) !== 'superadmin') {
        throw new functions.https.HttpsError('permission-denied', 'This action requires administrator privileges.');
    }
    return uid;
};
// =============================================
// CORE MATCH/TOURNAMENT LOGIC
// =============================================
exports.onResultSubmitted = functions.firestore.document('matches/{matchId}/results/{userId}').onCreate(async (_, context) => {
    const { matchId } = context.params;
    const matchRef = db.collection('matches').doc(matchId);
    return db.runTransaction(async (t) => {
        const matchDoc = await t.get(matchRef);
        if (!matchDoc.exists)
            return;
        const matchData = matchDoc.data();
        // Prevent processing if match is already resolved
        if (['completed', 'cancelled', 'disputed'].includes(matchData.status))
            return;
        const resultsRef = matchRef.collection('results');
        const resultsSnap = await t.get(resultsRef);
        if (resultsSnap.size >= matchData.maxPlayers) {
            const results = resultsSnap.docs.map(doc => doc.data());
            // Simple 2-player verification logic
            const winner = results.find(r => r.confirmedWinStatus === 'win');
            const loser = results.find(r => r.confirmedWinStatus === 'loss');
            const hasConflict = resultsSnap.size > 1 && (!winner || !loser);
            if (hasConflict) {
                t.update(matchRef, { status: 'disputed' });
            }
            else if (winner) {
                // Automatically mark as completed if there's a clear winner
                t.update(matchRef, { status: 'completed', winnerId: winner.userId, completedAt: admin.firestore.FieldValue.serverTimestamp() });
            }
        }
    });
});
exports.onMatchCompleted = functions.firestore.document("matches/{matchId}").onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    // Trigger only on transition to 'completed' status
    if (before.status === 'completed' || after.status !== 'completed')
        return null;
    if (!after.winnerId) {
        functions.logger.error(`Match ${context.params.matchId} completed without a winnerId.`);
        return null;
    }
    const { winnerId, prizePool, title, commissionRate } = after;
    const winnerRef = db.collection("users").doc(winnerId);
    // Use the commission rate from the match document, fallback to 10% if not present
    const finalCommission = typeof commissionRate === 'number' ? commissionRate : 0.10;
    const payoutAmount = prizePool * (1 - finalCommission);
    return db.runTransaction(async (t) => {
        const winnerDoc = await t.get(winnerRef);
        if (!winnerDoc.exists)
            throw new Error(`Winner ${winnerId} not found.`);
        t.update(winnerRef, { walletBalance: admin.firestore.FieldValue.increment(payoutAmount) });
        const prizeTxRef = db.collection(`users/${winnerId}/transactions`).doc();
        t.set(prizeTxRef, {
            amount: payoutAmount,
            type: "prize_win",
            status: "completed",
            description: `Prize for: ${title}`,
            relatedId: context.params.matchId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Optionally update the match with final payout details
        t.update(change.after.ref, { payoutStatus: 'paid', finalCommission, payoutAmount });
    }).catch(error => {
        functions.logger.error(`Payout failed for match ${context.params.matchId}:`, error);
        // Flag the match for manual review if payout fails
        return change.after.ref.update({ status: 'disputed', payoutStatus: 'failed' });
    });
});
// =============================================
// ADMIN-ONLY CALLABLE FUNCTIONS
// =============================================
exports.resolveMatch = functions.https.onCall(async (data, context) => {
    const adminUid = await ensureAdmin(context);
    const { matchId, winnerId } = data;
    if (!matchId || !winnerId) {
        throw new functions.https.HttpsError("invalid-argument", "Match ID and Winner ID are required.");
    }
    const matchRef = db.collection('matches').doc(matchId);
    const matchDoc = await matchRef.get();
    if (!matchDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Match not found.");
    }
    // Manually trigger match completion
    await matchRef.update({
        status: 'completed',
        winnerId: winnerId,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        resolvedBy: adminUid
    });
    return { success: true, message: "Match resolved. Payout triggered." };
});
exports.cancelMatch = functions.https.onCall(async (data, context) => {
    const adminUid = await ensureAdmin(context);
    const { matchId } = data;
    if (!matchId) {
        throw new functions.https.HttpsError("invalid-argument", "Match ID is required.");
    }
    const matchRef = db.collection('matches').doc(matchId);
    return db.runTransaction(async (t) => {
        const matchDoc = await t.get(matchRef);
        if (!matchDoc.exists)
            throw new functions.https.HttpsError("not-found", "Match not found.");
        const matchData = matchDoc.data();
        if (['completed', 'cancelled'].includes(matchData.status)) {
            throw new functions.https.HttpsError("failed-precondition", `Match is already ${matchData.status}.`);
        }
        // Refund entry fee to all players
        for (const playerId of matchData.players) {
            const playerRef = db.collection('users').doc(playerId);
            t.update(playerRef, { walletBalance: admin.firestore.FieldValue.increment(matchData.entryFee) });
            const refundTxRef = db.collection(`users/${playerId}/transactions`).doc();
            t.set(refundTxRef, {
                amount: matchData.entryFee,
                type: "refund",
                status: "completed",
                description: `Admin cancelled match: ${matchData.title}`,
                relatedId: matchId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        t.update(matchRef, {
            status: 'cancelled',
            resolvedBy: adminUid,
            completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    });
});
exports.deleteStorageFile = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { filePath } = data;
    if (!filePath) {
        throw new functions.https.HttpsError('invalid-argument', "File path is required.");
    }
    try {
        await storage.bucket().file(filePath).delete();
        functions.logger.log(`Admin deleted file: ${filePath}`);
        return { success: true };
    }
    catch (error) {
        functions.logger.error(`Failed to delete file: ${filePath}`, error);
        throw new functions.https.HttpsError('internal', 'Could not delete the file.');
    }
});
//# sourceMappingURL=index.js.map