
import { doc, updateDoc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
// import { db } from "@/firebase/config"; 
import { Match } from "@/types";

/**
 * 1️⃣ MATCH CREATE SYSTEM (USER A – Creator)
 * @param creatorId - The ID of the user creating the match.
 * @param amount - The entry fee for the match.
 */
export const createMatch = async (creatorId: string, amount: number): Promise<string> => {
    // Note: Wallet balance check & locking amount should be handled securely via a Cloud Function before calling this.
    
    const matchRef = doc(db, "matches", `M${Date.now()}`);

    const newMatch: Match = {
        id: matchRef.id,
        title: `Ludo Match`,
        entryFee: amount,
        prizePool: amount * 2, // Assuming 2 players for now
        maxPlayers: 2,
        creatorId: creatorId,
        players: [creatorId],
        status: 'waiting',
        createdAt: serverTimestamp(),
        roomCode: null,
        joinerId: null,
        creatorPosition: null,
        joinerPosition: null,
        startedAt: null,
        completedAt: null,
    };

    await setDoc(matchRef, newMatch);
    
    console.log(`Match created with ID: ${matchRef.id}`);
    return matchRef.id;
};

/**
 * 2️⃣ CANCEL / DELETE MATCH (BEFORE JOIN)
 * @param matchId - The ID of the match to cancel.
 * @param userId - The ID of the user attempting to cancel.
 */
export const cancelMatch = async (matchId: string, userId: string): Promise<boolean> => {
    const matchRef = doc(db, "matches", matchId);
    const matchSnap = await getDoc(matchRef);

    if (!matchSnap.exists()) {
        throw new Error("Match not found!");
    }

    const match = matchSnap.data() as Match;

    // IMPORTANT RULE: Only creator can cancel, and only before a joiner is present.
    if (match.creatorId !== userId) {
        throw new Error("Only the creator can cancel the match.");
    }
    if (match.status !== 'waiting' || match.joinerId !== null) {
        throw new Error("Match can only be cancelled while waiting for players.");
    }

    // Action: Refund locked money (handled by a Cloud Function) & update status.
    await updateDoc(matchRef, {
        status: 'cancelled',
        completedAt: serverTimestamp(),
    });

    console.log(`Match ${matchId} has been cancelled.`);
    return true;
};
