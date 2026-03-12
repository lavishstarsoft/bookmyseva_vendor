import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const getApiUrl = (): string => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1`;
    }
    const baseUrl = process.env.NODE_ENV === 'production'
        ? "http://46.225.29.165"
        : "http://localhost:5001";
    return `${baseUrl}/api/v1`;
};

const getTokenFromCookie = (): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )vendor_token=([^;]+)'));
    return match ? match[2] : null;
};

const api = axios.create({
    baseURL: getApiUrl(),
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 15000,
    withCredentials: true,
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getTokenFromCookie();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            if (typeof document !== 'undefined') {
                document.cookie = 'vendor_token=; Max-Age=0; path=/;';
            }
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
