import api from "@/lib/axios";

export interface OrderCustomer {
    userId: string;
    name: string;
    email: string;
    phone: string;
}

export interface OrderProduct {
    productId: string;
    title: string;
    image: string;
    variant?: string;
    quantity: number;
    price: number;
}

export interface OrderAddress {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
}

export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
    _id: string;
    orderId: string;
    customer: OrderCustomer;
    products: OrderProduct[];
    totalAmount: number;
    deliveryAddress: OrderAddress;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentId?: string;
    trackingNumber?: string;
    notes?: string;
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
}

export interface OrderStats {
    total: number;
    pending: number;
    accepted: number;
    packed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
}

export interface OrdersResponse {
    orders: Order[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
    stats: OrderStats;
}

export const ordersApi = {
    getAll: async (params?: { status?: string; search?: string; page?: number; limit?: number; startDate?: string; endDate?: string }) => {
        const response = await api.get<OrdersResponse>('vendor/orders', { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Order>(`vendor/orders/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await api.get<OrderStats>('vendor/orders/stats');
        return response.data;
    },

    accept: async (id: string, notes?: string) => {
        const response = await api.patch<{ success: boolean; order: Order }>(`vendor/orders/${id}/accept`, { notes });
        return response.data;
    },

    reject: async (id: string, reason: string) => {
        const response = await api.patch<{ success: boolean; order: Order }>(`vendor/orders/${id}/reject`, { reason });
        return response.data;
    },

    pack: async (id: string, notes?: string) => {
        const response = await api.patch<{ success: boolean; order: Order }>(`vendor/orders/${id}/pack`, { notes });
        return response.data;
    },

    ship: async (id: string, trackingNumber: string) => {
        const response = await api.patch<{ success: boolean; order: Order }>(`vendor/orders/${id}/ship`, { trackingNumber });
        return response.data;
    },
};
