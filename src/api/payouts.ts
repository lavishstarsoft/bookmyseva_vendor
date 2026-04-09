import api from "@/lib/axios";

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid';

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

export interface WithdrawalRequest {
    _id: string;
    amount: number;
    status: WithdrawalStatus;
    bankDetails: {
        accountHolderName: string;
        accountNumber: string;
        bankName: string;
        ifscCode: string;
    };
    requestedAt: string;
    processedAt?: string;
    transactionRef?: string;
    remarks?: string;
    taxBreakdown?: {
        tdsRate: number;
        tdsAmount: number;
        gstRate: number;
        gstAmount: number;
        grossAmount: number;
        netPayableAmount: number;
    };
    statement?: {
        statementId: string;
        generatedAt?: string;
        sentAt?: string;
    };
    auditTrail?: Array<{
        action: string;
        actorRole?: string;
        actorName?: string;
        createdAt: string;
    }>;
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

export interface WithdrawalsResponse {
    withdrawals: WithdrawalRequest[];
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

    // Withdrawal functions
    requestWithdrawal: async (amount: number) => {
        const response = await api.post<{ status: string; withdrawal: WithdrawalRequest; message: string }>('vendor/payouts/withdraw', { amount });
        return response.data;
    },

    getWithdrawals: async (params?: { status?: string; page?: number; limit?: number }) => {
        const response = await api.get<WithdrawalsResponse>('vendor/payouts/withdrawals', { params });
        return response.data;
    },

    cancelWithdrawal: async (id: string) => {
        const response = await api.delete<{ status: string; message: string }>(`vendor/payouts/withdrawals/${id}`);
        return response.data;
    },

    getWithdrawalStatement: async (id: string) => {
        const response = await api.get<{ status: string; statement: any }>(`vendor/payouts/withdrawals/${id}/statement`);
        return response.data;
    },
};
