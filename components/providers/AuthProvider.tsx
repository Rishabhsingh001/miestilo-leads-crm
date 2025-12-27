"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { getStoredUser, setStoredUser, clearStoredUser } from '@/utils/auth';
import { loginUserMock } from '@/services/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<{ error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => ({}),
    logout: () => { },
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const stored = getStoredUser();
        if (stored) {
            setUser(stored);
        }
        setLoading(false);
    }, []);

    const login = async (email: string, pass: string) => {
        try {
            const { data, error } = await loginUserMock(email, pass);

            if (error || !data) {
                return { error: 'Invalid email or password' };
            }

            const validUser = data as User;
            setUser(validUser);
            setStoredUser(validUser);

            // Redirect to dashboard or home
            router.push('/');

            return {};
        } catch (err) {
            return { error: 'Login failed. Please try again.' };
        }
    };

    const logout = () => {
        setUser(null);
        clearStoredUser();
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
