// Sign up / sign in / sign out. signUp also creates the Firestore profile.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  reauthenticateWithCredential,
  deleteUser,
  EmailAuthProvider,
} from '@react-native-firebase/auth';
import { auth } from './config';
import { createUserProfile, deleteUserProfile } from './users';
import { ISignupProfileInput } from '../interfaces/user';

// What the signup form gives us: the profile fields WITHOUT uid
// (Auth creates the uid), plus the password.
export type SignUpParams = Omit<ISignupProfileInput, 'uid'> & {
  password: string;
};

/**
 * Create a new account and its profile, in order:
 *   1. Create the Firebase Auth user (email + password).
 *   2. Put the full name on the Auth user (nice for display).
 *   3. Create the users/{uid} profile document in Firestore.
 *   4. Send a verification email (we don't block signup on it).
 *
 * Returns the new user's uid.
 * Throws a Firebase error (e.g. 'auth/email-already-in-use') on failure —
 * the screen/AuthContext decides how to show that.
 */
export async function signUp(params: SignUpParams): Promise<string> {
  const { email, password, firstName, lastName, phone, country } = params;

  // 1. Create the account.
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  const user = credential.user;

  // 2. Set a display name like "Jane Doe" on the Auth profile.
  await updateProfile(user, {
    displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
  });

  // 3. Create the Firestore profile. uid comes from the new Auth user.
  //    (createUserProfile lowercases the email and trims everything.)
  await createUserProfile({
    uid: user.uid,
    firstName,
    lastName,
    email,
    phone,
    country,
  });

  // 4. Ask them to verify their email — fire-and-forget so a failure here
  //    never fails signup.
  sendEmailVerification(user).catch(() => { });

  return user.uid;
}

/**
 * Sign an existing user in. Returns the uid.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<string> {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  return credential.user.uid;
}

/**
 * Sign the current user out.
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Send a "reset your password" email.
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Permanently delete the signed-in user's account.
 *
 * Firebase requires a RECENT login to delete, so we re-authenticate with the
 * current password first (this also proves it's really them).
 *
 * Order matters: delete the Firestore profile while still authenticated, THEN
 * delete the Auth user — after that the client is signed out and can no longer
 * write to Firestore.
 *
 * Throws Firebase errors ('auth/invalid-credential' for a wrong password,
 * 'auth/requires-recent-login', network, etc.) — the screen maps them.
 */
export async function deleteAccount(password: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw { code: 'auth/no-current-user' };
  }

  // 1. Re-authenticate with the current password.
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);

  // 2. Remove the Firestore profile while we still have auth.
  //    (When profile photos land, also delete the Storage file here.)
  await deleteUserProfile(user.uid);

  // 3. Delete the Auth user. This signs them out automatically.
  await deleteUser(user);
}