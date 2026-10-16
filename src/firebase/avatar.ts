// The guest's profile photo in Firebase Storage: users/{uid}/avatar.jpg
// One file per user, overwritten on every change, so old photos never pile up.
// Storage rules: only the owner can read/write it; image/* under 5 MB.

import { ref, putFile, getDownloadURL, deleteObject } from '@react-native-firebase/storage';
import { storage } from './config';

const avatarRef = (uid: string) => ref(storage, `users/${uid}/avatar.jpg`);

/**
 * Upload a local JPEG (from pickAvatar) and return its download URL, to save as
 * the profile's photoURL. Throws Firebase errors (network, permission).
 */
export async function uploadAvatar(uid: string, localPath: string): Promise<string> {
    const fileRef = avatarRef(uid);
    await putFile(fileRef, localPath, { contentType: 'image/jpeg' });
    const url = await getDownloadURL(fileRef);
    // Same file name every time, so add a version: otherwise the phone may keep
    // showing the old photo from its image cache.
    return `${url}&v=${Date.now()}`;
}

/**
 * Delete the photo file. Already gone counts as done.
 */
export async function deleteAvatar(uid: string): Promise<void> {
    try {
        await deleteObject(avatarRef(uid));
    } catch (e: any) {
        if (e?.code === 'storage/object-not-found') return;
        throw e;
    }
}
