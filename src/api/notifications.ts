import api from "@/lib/axios";

export interface VendorNotification {
    _id: string;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface VendorNotificationsResponse {
    status: string;
    notifications: VendorNotification[];
    unreadCount: number;
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export const notificationsApi = {
    getAll: async (params?: { status?: "all" | "read" | "unread"; page?: number; limit?: number }) => {
        const response = await api.get<VendorNotificationsResponse>("/vendor/notifications", { params });
        return response.data;
    },

    markAsRead: async (id: string) => {
        const response = await api.patch(`/vendor/notifications/${id}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await api.patch("/vendor/notifications/read-all");
        return response.data;
    },

    clear: async () => {
        const response = await api.delete("/vendor/notifications/clear");
        return response.data;
    }
};
