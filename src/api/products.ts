import api from "@/lib/axios";

export interface ProductImage {
    url: string;
    alt?: string;
}

export interface ProductVariant {
    id: string;
    label: string;
    price: number;
    mrp?: number;
    stock: number;
    active: boolean;
}

export interface Product {
    _id?: string;
    title: string;
    shortDescription: string;
    description?: string;
    category: string;
    image?: string;
    images?: ProductImage[];
    variants?: ProductVariant[];
    marketPrice?: number;
    offerPrice?: number;
    stock?: number;
    sku?: string;
    weight?: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };
    isActive: boolean;
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface ProductsResponse {
    products: Product[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export const productsApi = {
    getAll: async (params?: { page?: number; limit?: number; search?: string; category?: string; status?: string }) => {
        const response = await api.get<ProductsResponse>('vendor/products', { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Product>(`vendor/products/${id}`);
        return response.data;
    },

    create: async (data: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>) => {
        const response = await api.post<Product>('vendor/products', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Product>) => {
        const response = await api.put<Product>(`vendor/products/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`vendor/products/${id}`);
        return response.data;
    },

    uploadImage: async (id: string, formData: FormData) => {
        const response = await api.post(`vendor/products/${id}/images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    deleteImage: async (id: string, imageUrl: string) => {
        const response = await api.delete(`vendor/products/${id}/images`, {
            data: { imageUrl },
        });
        return response.data;
    },
};
