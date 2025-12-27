import { NextRequest, NextResponse } from 'next/server';
import admin from '@/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

const VALID_ROLES = ['superadmin', 'deposit_admin', 'match_admin', 'user'];

export async function POST(req: NextRequest) {
    try {
        const { uid, role } = await req.json();

        if (!uid || !role) {
            return NextResponse.json({ error: 'UID and role are required' }, { status: 400 });
        }

        if (!VALID_ROLES.includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        await getAuth(admin.app()).setCustomUserClaims(uid, { role });

        return NextResponse.json({ message: `Custom claim set successfully for UID: ${uid}` });
    } catch (error: any) {
        console.error('Error setting custom claim:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
