import api from "@/lib/axios";

export interface VendorPrasadam {
    _id?: string;
    title: string;
    shortDescription?: string;
    fullDescription?: string;
    category: string;
    image?: string;
    images?: string[];
    basePrice: number;
    marketPrice?: number;
    pricingTiers?: {
        minQuantity: number;
        maxQuantity?: number;
        pricePerUnit: number;
        label?: string;
    }[];
    templeSource?: {
        templeName?: string;
        templeLocation?: string;
        templeImage?: string;
    };
    ingredients?: string[];
    dietary?: {
        isVegetarian?: boolean;
        isVegan?: boolean;
        containsNuts?: boolean;
        containsDairy?: boolean;
    };
    unit?: "pieces" | "kg" | "grams" | "packets";
    weightPerUnit?: number;
    inStock?: boolean;
    stockQuantity?: number;
    minOrderQuantity?: number;
    maxOrderQuantity?: number;
    shelfLife?: number;
    shipping?: {
        freeShipping?: boolean;
        freeShippingAbove?: number;
        shippingCharge?: number;
        deliveryText?: string;
        showShipping?: boolean;
    };
    deliveryConfig?: {
        timeSlots?: { id: string; label: string; active: boolean }[];
        bookingStartDate?: string;
        bookingEndDate?: string;
        leadDays?: number;
        maxAdvanceDays?: number;
        availableDays?: string[];
    };
    taxes?: {
        id?: string;
        name: string;
        percentage: number;
        registrationNumber?: string;
    }[];
    vendorApproved?: boolean;
    rejectionReason?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface PrasadamCategory {
    value: string;
    label: string;
    count: number;
}

export const vendorPrasadamsApi = {
    getAll: async () => {
        const response = await api.get("/vendor/prasadams");
        return response.data.prasadams as VendorPrasadam[];
    },
    getById: async (id: string) => {
        const response = await api.get(`/vendor/prasadams/${id}`);
        return response.data.prasadam as VendorPrasadam;
    },
    create: async (data: VendorPrasadam) => {
        const response = await api.post("/vendor/prasadams", data);
        return response.data.prasadam as VendorPrasadam;
    },
    update: async (id: string, data: Partial<VendorPrasadam>) => {
        const response = await api.put(`/vendor/prasadams/${id}`, data);
        return response.data.prasadam as VendorPrasadam;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/vendor/prasadams/${id}`);
        return response.data;
    },
    getCategories: async () => {
        const response = await api.get("/prasadams/categories");
        return response.data as PrasadamCategory[];
    }
};
