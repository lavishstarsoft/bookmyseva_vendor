import api from "@/lib/axios";

export interface PricingPlan {
    id: string;
    label: string;
    price: number | string;
    active: boolean;
    badge: string;
}

export interface KitItem {
    id: number;
    text: string;
}

export interface KitBadges {
    verifiedQuality: boolean;
    freeDelivery: boolean;
    premiumQuality: boolean;
    doorstepDelivery: boolean;
    panditCurated: boolean;
    easyCancel: boolean;
}

export interface KitShipping {
    freeShipping: boolean;
    shippingLabel: string;
    deliveryText: string;
    showShipping: boolean;
}

export interface KitTimeSlot {
    id: string;
    label: string;
    active: boolean;
}

export interface KitDeliveryConfig {
    timeSlots: KitTimeSlot[];
    bookingStartDate?: string;
    bookingEndDate?: string;
    leadDays: number;
    maxAdvanceDays: number;
}

export interface Kit {
    _id?: string;
    title: string;
    shortDescription: string;
    category: string;
    image?: string;
    images?: string[];
    defaultRating?: number;
    reviewCount?: number;
    itemsIncluded: KitItem[];
    pricingPlans?: PricingPlan[];
    marketPrice?: number | string;
    offerPrice?: number | string;
    badges?: KitBadges;
    shipping?: KitShipping;
    deliveryConfig?: KitDeliveryConfig;
    vendorApproved?: boolean;
    source?: string;
    commissionType?: string;
    commissionValue?: number;
    rejectionReason?: string;
    createdAt?: string;
    updatedAt?: string;
}

export const vendorKitsApi = {
    getAll: async () => {
        const response = await api.get("/vendor/kits");
        return response.data.kits as Kit[];
    },
    getById: async (id: string) => {
        const response = await api.get(`/vendor/kits/${id}`);
        return response.data.kit as Kit;
    },
    create: async (data: Kit) => {
        const response = await api.post("/vendor/kits", data);
        return response.data.kit as Kit;
    },
    update: async (id: string, data: Partial<Kit>) => {
        const response = await api.put(`/vendor/kits/${id}`, data);
        return response.data.kit as Kit;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/vendor/kits/${id}`);
        return response.data;
    }
};
