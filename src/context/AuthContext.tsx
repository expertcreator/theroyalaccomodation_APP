import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, sendEmailVerification } from '@react-native-firebase/auth';
import { useNetInfo } from '@react-native-community/netinfo';
import { auth } from '../firebase/config';
import {
    signUp as authSignUp,
    signIn as authSignIn,
    signOut as authSignOut,
    resetPassword as authResetPassword,
    deleteAccount as authDeleteAccount,
    SignUpParams,
} from '../firebase/auth';
import { getUserProfile, updateUserProfile } from '../firebase/users';
import { IUserProfile, EditableProfile } from '../interfaces/user';
import { AppState } from 'react-native';

// A small, display-friendly view of the user — kept so screens that already
// read user.name / user.email / user.avatarUri / user.phone keep working.
export type AuthUser =
    | { name: string; email?: string; avatarUri?: string; phone?: string }
    | null;

interface IAuthContextType {
    initializing: boolean;        // true until we know if someone is signed in
    isLoggedIn: boolean;
    emailVerified: boolean;

    profile: IUserProfile | null; // the real Firestore profile
    user: AuthUser;               // derived, read-only convenience view

    signUp: (params: SignUpParams) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;

    updateProfile: (changes: EditableProfile) => Promise<void>;
    refreshProfile: () => Promise<void>;
    reloadEmailVerified: () => Promise<void>;
    resendVerification: () => Promise<void>;
    deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<IAuthContextType>({
    initializing: true,
    isLoggedIn: false,
    emailVerified: false,
    profile: null,
    user: null,
    signUp: async () => { },
    signIn: async () => { },
    signOut: async () => { },
    resetPassword: async () => { },
    updateProfile: async () => { },
    refreshProfile: async () => { },
    reloadEmailVerified: async () => { },
    resendVerification: async () => { },
    deleteAccount: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [initializing, setInitializing] = useState(true);
    const [uid, setUid] = useState<string | null>(null);
    const [emailVerified, setEmailVerified] = useState(false);
    const [profile, setProfile] = useState<IUserProfile | null>(null);

    // Load (or clear) the Firestore profile for a given user id.
    const loadProfile = async (userId: string | null) => {
        if (!userId) { setProfile(null); return; }
        const p = await getUserProfile(userId);
        setProfile(p);
    };

    // Re-read the current user's profile into state.
    const refreshProfile = async () => {
        const current = auth.currentUser;
        await loadProfile(current ? current.uid : null);
    };

    // Firebase tells us who is signed in — now, on every change, and once on
    // app start (it restores a saved session for us, so no AsyncStorage needed).
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            console.log("[AuthContext] fbUser: ", fbUser)
            try {
                if (fbUser) {
                    setUid(fbUser.uid);
                    setEmailVerified(fbUser.emailVerified);
                    await loadProfile(fbUser.uid);
                } else {
                    setUid(null);
                    setEmailVerified(false);
                    setProfile(null);
                }
            } catch (error) {
                // Couldn't load the profile (e.g. offline with nothing cached, or
                // Firestore refused). Stay signed in without a profile for now —
                // screens cope with that, and we retry when the app is reopened.
                console.warn('[AuthContext] Could not load the profile:', error);
            } finally {
                // Always finish start-up, so the splash screen can never get stuck.
                setInitializing(false);
            }
        });
        return unsubscribe; // stop listening when the provider unmounts
    }, []);

    // Re-check email verification whenever the app returns to the foreground —
    // the user may have just tapped the verification link in their browser.
    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state !== 'active') return;
            const current = auth.currentUser;
            if (current && !current.emailVerified) {
                current.reload()
                    .then(() => setEmailVerified(auth.currentUser?.emailVerified ?? false))
                    .catch(() => { });
            }
        });
        return () => sub.remove();
    }, []);

    // Load the profile again after an earlier failure. Only use the result if
    // the same person is still signed in (they may have signed out meanwhile).
    const retryProfile = (userId: string) => {
        getUserProfile(userId)
            .then((p) => {
                if (auth.currentUser?.uid === userId) setProfile(p);
            })
            .catch(() => { }); // still failing — the next trigger will try again
    };

    // Signed in but the profile didn't load (e.g. we were offline at start-up)?
    // Try again each time the app comes back to the foreground, until it works.
    useEffect(() => {
        if (!uid || profile) return; // signed out, or already loaded — nothing to do
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') retryProfile(uid);
        });
        return () => sub.remove();
    }, [uid, profile]);

    // Also try again the moment the internet comes back.
    // "Offline" = no network, or a network that can't reach the internet.
    // NetInfo starts as "unknown" (null) — that doesn't count as offline, so
    // app start-up is never mistaken for "just came back online".
    const net = useNetInfo();
    const isOffline = net.isConnected === false || net.isInternetReachable === false;
    const wasOffline = useRef(isOffline);
    useEffect(() => {
        const cameBackOnline = wasOffline.current && !isOffline;
        wasOffline.current = isOffline;
        if (cameBackOnline && uid && !profile) retryProfile(uid);
    }, [isOffline, uid, profile]);

    // --- actions ---

    const signUp = async (params: SignUpParams) => {
        await authSignUp(params); // creates the Auth user + Firestore profile
        // onAuthStateChanged fires on the new user, but it can run before the
        // profile doc is written — so load it again to be sure we have it.
        await refreshProfile();
    };

    const signIn = async (email: string, password: string) => {
        await authSignIn(email, password);
        // onAuthStateChanged sets uid + loads the profile automatically.
    };

    const signOut = async () => {
        await authSignOut();
        // onAuthStateChanged clears everything.
    };

    const resetPassword = async (email: string) => {
        await authResetPassword(email);
    };

    const updateProfile = async (changes: EditableProfile) => {
        const current = auth.currentUser;
        if (!current) return;
        await updateUserProfile(current.uid, changes);
        await refreshProfile(); // pull the merged result back into state
    };

    // Call after the user taps the verification link to refresh the flag.
    const reloadEmailVerified = async () => {
        const current = auth.currentUser;
        if (!current) return;
        await current.reload();
        setEmailVerified(auth.currentUser?.emailVerified ?? false);
    };

    const resendVerification = async () => {
        const current = auth.currentUser;
        if (current) await sendEmailVerification(current);
    };

    const deleteAccount = async (password: string) => {
        await authDeleteAccount(password);
        // onAuthStateChanged fires with null and clears uid/profile.
    };

    // Derived convenience view for existing screens.
    const user: AuthUser = profile
        ? {
            name: `${profile.firstName} ${profile.lastName}`.trim(),
            email: profile.email,
            avatarUri: profile.photoURL ?? undefined,
            phone: profile.phone ?? undefined,
        }
        : null;

    return (
        <AuthContext.Provider
            value={{
                initializing,
                isLoggedIn: !!uid,
                emailVerified,
                profile,
                user,
                signUp,
                signIn,
                signOut,
                resetPassword,
                deleteAccount,
                updateProfile,
                refreshProfile,
                reloadEmailVerified,
                resendVerification,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);