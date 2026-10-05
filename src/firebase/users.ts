// Read/write helpers for the guest profile stored at Firestore users/{uid}.

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from '@react-native-firebase/firestore';
import { db } from './config';
import {
    IUserProfile,
    ISignupProfileInput,
    EditableProfile,
} from '../interfaces/user';

const USERS = 'users';

// A reference to one user's profile document: users/{uid}
const userRef = (uid: string) => doc(db, USERS, uid);

/**
 * Called once, at signup. We only collect a few fields there, so this fills
 * sensible defaults for the rest (empty address, no photo) and lets the
 * server set the timestamps.
 *
 * merge:true means if the doc somehow already exists, we don't wipe it.
 */
export async function createUserProfile(
    input: ISignupProfileInput,
): Promise<void> {
    // Not typed as IUserProfile because serverTimestamp() is a write-time
    // placeholder, not a real Timestamp yet — Firestore fills it on the server.
    const profile = {
        uid: input.uid,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email.trim().toLowerCase(), // lowercase → matches OWcal's email lookup
        phone: input.phone?.trim() || null,
        photoURL: null,
        address: {
            line1: null,
            line2: null,
            city: null,
            county: null,
            postCode: null,
            country: input.country?.trim() || 'United Kingdom',
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(userRef(input.uid), profile, { merge: true });
}

/**
 * Load a profile. Returns null if this user has no profile doc yet.
 */
export async function getUserProfile(
    uid: string,
): Promise<IUserProfile | null> {
    const snap = await getDoc(userRef(uid));

    // In React Native Firebase, `exists` is a property (not a function like
    // the web SDK's exists()).
    if (!snap.exists) return null;

    return snap.data() as IUserProfile;
}

/**
 * Update only the fields you pass — used by My Profile edits and by the
 * "save address after booking" step. Anything you don't pass is left alone.
 *
 * We use setDoc(merge:true) rather than updateDoc so a partial address
 * (e.g. just { city }) merges into the existing address instead of replacing
 * the whole block. Pass null to clear a field, never undefined.
 */
export async function updateUserProfile(
    uid: string,
    changes: EditableProfile,
): Promise<void> {
    await setDoc(
        userRef(uid),
        { ...changes, updatedAt: serverTimestamp() },
        { merge: true },
    );
}