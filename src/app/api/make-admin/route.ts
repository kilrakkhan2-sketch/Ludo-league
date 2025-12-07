
import { NextResponse } from 'next/server';
import { auth } from 'firebase-admin';
import { initFirebaseAdmin } from '@/firebase/firebase-admin';

// Initialize Firebase Admin SDK
initFirebaseAdmin();

/**
 * @swagger
 * /api/make-admin:
 *   post:
 *     summary: Sets a user's custom claim to make them a superadmin.
 *     description: This endpoint receives a UID and email, verifies the user exists, and then sets their custom user claims in Firebase Auth to grant them the 'superadmin' role. This is a protected action that should only be accessible by authorized users.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uid:
 *                 type: string
 *                 description: The user ID (UID) of the user to be made a superadmin.
 *               email:
 *                 type: string
 *                 description: The email of the user, for verification.
 *     responses:
 *       200:
 *         description: Successfully set the superadmin role.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully set waseem982878@gmail.com as superadmin.
 *       400:
 *         description: Bad request, UID or email missing.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
export async function POST(request: Request) {
  try {
    const { uid, email } = await request.json();

    if (!uid || !email) {
      return NextResponse.json({ error: 'UID and email are required' }, { status: 400 });
    }

    // Set custom user claims
    await auth().setCustomUserClaims(uid, { role: 'superadmin' });

    // Verify the user's claims have been set
    const user = await auth().getUser(uid);
    console.log('User claims:', user.customClaims);

    return NextResponse.json({ message: `Successfully set ${email} as superadmin.` });
  } catch (error: any) {
    console.error('Error in make-admin API:', error);
     let errorMessage = 'An internal server error occurred.';

    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 });
  }
}
