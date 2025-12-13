
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

const VALID_ROLES = ['superadmin', 'deposit_admin', 'match_admin', 'user'];

/**
 * API route to set a custom claim for a user.
 * Only accessible by superadmins.
 *
 * @param {NextRequest} request The incoming request object.
 * @returns {NextResponse} The response object.
 */
export async function POST(request: NextRequest) {
  try {
    const app = initializeFirebaseAdmin();
    const auth = getAuth(app);

    // 1. Verify the authorization token of the caller (the superadmin).
    const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    if (decodedToken.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: You must be a superadmin to perform this action' }, { status: 403 });
    }

    // 2. Get the target user ID and the new role from the request body.
    const { uid, newRole } = await request.json();

    if (!uid || !newRole) {
      return NextResponse.json({ error: 'Missing uid or newRole in request body' }, { status: 400 });
    }

    // 3. Validate the new role to ensure it's a permitted value.
    if (!VALID_ROLES.includes(newRole)) {
        return NextResponse.json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 });
    }

    // 4. Set the custom claim for the target user.
    await auth.setCustomUserClaims(uid, { role: newRole });

    // 5. Return a success response.
    return NextResponse.json({ message: `Custom claim '${newRole}' set for user ${uid}` }, { status: 200 });

  } catch (error: any) {
    console.error('Error setting custom claim:', error);
    // Distinguish between auth errors and other errors
    if (error.code && error.code.startsWith('auth/')) {
        return NextResponse.json({ error: `Firebase Auth Error: ${error.message}` }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
