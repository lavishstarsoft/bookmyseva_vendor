import api from "@/lib/axios";

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Payout {
    _id: string;
    payoutId: string;
    amount: number;
    status: PayoutStatus;
    period: {
        startDate: string;
        endDate: string;
    };
    ordersCount: number;
    deductions?: {
        commission: number;
        tds: number;
        other: number;
    };
    netAmount: number;
    bankDetails: {
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        accountHolderName: string;
    };
    transactionId?: string;
    paidAt?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PayoutSummary {
    totalEarnings: number;
    totalPaid: number;
    pendingPayout: number;
    currentMonthEarnings: number;
    totalOrders: number;
    commissionRate: number;
}

export interface PayoutsResponse {
    payouts: Payout[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export const payoutsApi = {
    getAll: async (params?: { status?: string; page?: number; limit?: number; startDate?: string; endDate?: string }) => {
        const response = await api.get<PayoutsResponse>('vendor/payouts', { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Payout>(`vendor/payouts/${id}`);
        return response.data;
    },

    getSummary: async () => {
        const response = await api.get<PayoutSummary>('vendor/payouts/summary');
        return response.data;
    },
};
