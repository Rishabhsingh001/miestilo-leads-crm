import { User } from '@/types';

const STORAGE_KEY = 'miestilo_user';

export const getStoredUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
};

export const setStoredUser = (user: User) => {
    if (typeof window === 'undefined') return;
    // Don't store password obviously, though logic might fetch it.
    // The User type has password optional. ensuring we don't store it.
    const { password, ...safeUser } = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
};

export const clearStoredUser = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
};

export const isAuthenticated = () => {
    return !!getStoredUser();
};
