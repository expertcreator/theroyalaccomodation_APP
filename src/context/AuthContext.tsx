import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, sendEmailVerification } from '@react-native-firebase/auth';
import { auth } from '../firebase/config';
import {
    signUp as authSignUp,
    signIn as authSignIn,
    signOut as authSignOut,
    resetPassword as authResetPassword,
    SignUpParams,
} from '../firebase/auth';
import { getUserProfile, updateUserProfile } from '../firebase/users';
import { IUserProfile, EditableProfile } from '../interfaces/user';

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
            if (fbUser) {
                setUid(fbUser.uid);
                setEmailVerified(fbUser.emailVerified);
                await loadProfile(fbUser.uid);
            } else {
                setUid(null);
                setEmailVerified(false);
                setProfile(null);
            }
            setInitializing(false);
        });
        return unsubscribe; // stop listening when the provider unmounts
    }, []);

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