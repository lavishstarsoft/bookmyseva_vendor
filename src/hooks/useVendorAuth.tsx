'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

interface Vendor {
    _id: string;
    name: string;
    email: string;
    phone: string;
    businessName?: string;
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    avatar?: string;
}

interface VendorAuthContextType {
    vendor: Vendor | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    sendOtp: (phone: string) => Promise<void>;
    verifyOtp: (phone: string, otp: string) => Promise<void>;
    logout: () => void;
    fetchProfile: () => Promise<void>;
}

const VendorAuthContext = createContext<VendorAuthContextType | undefined>(undefined);

// Cookie helpers
const setAuthCookie = (token: string, expiresInSeconds: number = 86400) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const secure = isProduction ? '; Secure' : '';
    document.cookie = `vendor_token=${token}; path=/; max-age=${expiresInSeconds}; SameSite=Strict${secure}`;
};

const clearAuthCookie = () => {
    document.cookie = 'vendor_token=; Max-Age=0; path=/;';
};

const getTokenFromCookie = (): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )vendor_token=([^;]+)'));
    return match ? match[2] : null;
};

export function VendorAuthProvider({ children }: { children: ReactNode }) {
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchProfile = useCallback(async () => {
        const token = getTokenFromCookie();
        if (!token) {
            setVendor(null);
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.get('/vendor-auth/me');
            setVendor(response.data.data || response.data.vendor);
        } catch {
            clearAuthCookie();
            setVendor(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const sendOtp = async (phone: string) => {
        await api.post('/vendor-auth/send-otp', { phone });
    };

    const verifyOtp = async (phone: string, otp: string) => {
        const response = await api.post('/vendor-auth/verify-otp', { phone, otp });
        const { token, vendor: vendorData } = response.data;

        setAuthCookie(token, 86400); // 24 hours
        setVendor(vendorData);

        // Redirect based on vendor status
        if (vendorData.status === 'approved') {
            router.push('/dashboard');
        } else {
            router.push('/pending');
        }
    };

    const logout = useCallback(() => {
        clearAuthCookie();
        setVendor(null);
        router.push('/login');
    }, [router]);

    const value: VendorAuthContextType = {
        vendor,
        isLoading,
        isAuthenticated: !!vendor,
        sendOtp,
        verifyOtp,
        logout,
        fetchProfile,
    };

    return (
        <VendorAuthContext.Provider value={value}>
            {children}
        </VendorAuthContext.Provider>
    );
}

export function useVendorAuth() {
    const context = useContext(VendorAuthContext);
    if (context === undefined) {
        throw new Error('useVendorAuth must be used within a VendorAuthProvider');
    }
    return context;
}

// Hook for checking auth on protected pages
export function useRequireVendorAuth(redirectTo: string = '/login') {
    const { isAuthenticated, isLoading } = useVendorAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push(redirectTo);
        }
    }, [isAuthenticated, isLoading, router, redirectTo]);

    return { isAuthenticated, isLoading };
}
