import api from '@/lib/axios';

// Types
export interface SendOtpResponse {
    success: boolean;
    message: string;
}

export interface VerifyOtpResponse {
    success: boolean;
    token: string;
    vendor: {
        _id: string;
        name: string;
        email: string;
        phone: string;
        businessName?: string;
        status: 'pending' | 'approved' | 'rejected' | 'suspended';
        avatar?: string;
    };
}

export interface VendorProfile {
    _id: string;
    name: string;
    email: string;
    phone: string;
    businessName?: string;
    businessAddress?: string;
    gstNumber?: string;
    panNumber?: string;
    bankDetails?: {
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        accountHolderName: string;
    };
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    avatar?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Auth API endpoints
export const vendorAuthApi = {
    sendOtp: async (phone: string): Promise<SendOtpResponse> => {
        const response = await api.post<SendOtpResponse>('/vendor-auth/send-otp', { phone });
        return response.data;
    },

    verifyOtp: async (phone: string, otp: string): Promise<VerifyOtpResponse> => {
        const response = await api.post<VerifyOtpResponse>('/vendor-auth/verify-otp', { phone, otp });
        return response.data;
    },

    getProfile: async (): Promise<{ data: VendorProfile }> => {
        const response = await api.get('/vendor-auth/me');
        return response.data;
    },

    updateProfile: async (data: Partial<VendorProfile>): Promise<{ data: VendorProfile }> => {
        const response = await api.put('/vendor-auth/profile', data);
        return response.data;
    },

    register: async (data: {
        name: string;
        email: string;
        phone: string;
        businessName: string;
        businessAddress?: string;
        gstNumber?: string;
        panNumber?: string;
    }): Promise<{ success: boolean; message: string }> => {
        const response = await api.post('/vendor-auth/register', data);
        return response.data;
    },
};

export default vendorAuthApi;
