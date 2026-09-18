import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    ASYNC_KEYS, getItemFromAsyncStorage, setItemInAsyncStorage, removeItemFromAsyncStorage,
} from '../utils/storage';

export type AuthUser = { name: string; email?: string; avatarUri?: string; phone?: string } | null;

interface AuthContextType {
    user: AuthUser;
    isLoggedIn: boolean;
    signIn: (user: NonNullable<AuthUser>) => Promise<void>;
    signOut: () => Promise<void>;
    updateUser: (patch: Partial<NonNullable<AuthUser>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null, isLoggedIn: false, signIn: async () => { }, signOut: async () => { }, updateUser: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser>({ name: 'Alexander Windsor' });

    useEffect(() => {
        (async () => {
            const saved = await getItemFromAsyncStorage<AuthUser>(ASYNC_KEYS.USER);
            if (saved) setUser(saved);
        })();
    }, []);

    const signIn = async (u: NonNullable<AuthUser>) => {
        setUser(u);
        await setItemInAsyncStorage(ASYNC_KEYS.USER, u);
    };

    const signOut = async () => {
        setUser(null);
        await removeItemFromAsyncStorage(ASYNC_KEYS.USER);
    };

    const updateUser = async (patch: Partial<NonNullable<AuthUser>>) => {
        setUser((current) => {
            const next = { ...(current ?? { name: '' }), ...patch };
            setItemInAsyncStorage(ASYNC_KEYS.USER, next);
            return next;
        });
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: !!user, signIn, signOut, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);