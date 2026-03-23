"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io as ClientIO, Socket } from "socket.io-client";
import { toast } from "sonner";
import { getBaseUrl } from "@/lib/axios";
import { notificationsApi, type VendorNotification } from "@/api/notifications";

type NotificationContextType = {
    socket: Socket | null;
    isConnected: boolean;
    unreadCount: number;
    notifications: VendorNotification[];
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearNotifications: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType>({
    socket: null,
    isConnected: false,
    unreadCount: 0,
    notifications: [],
    markAsRead: async () => {},
    markAllAsRead: async () => {},
    clearNotifications: async () => {},
    refreshNotifications: async () => {}
});

export const useNotifications = () => useContext(NotificationContext);

const getTokenFromCookie = (): string | null => {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp("(^| )vendor_token=([^;]+)"));
    return match ? match[2] : null;
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<VendorNotification[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioUnlockedRef = useRef(false);

    const refreshNotifications = useCallback(async () => {
        try {
            const res = await notificationsApi.getAll({ page: 1, limit: 10 });
            setNotifications(res.notifications || []);
            setUnreadCount(res.unreadCount || 0);
        } catch {
            // no-op
        }
    }, []);

    useEffect(() => {
        audioRef.current = new Audio("/sounds/notification.mp3");
        audioRef.current.preload = "auto";

        const unlockAudio = () => {
            if (audioRef.current && !audioUnlockedRef.current) {
                audioRef.current.play().then(() => {
                    audioRef.current?.pause();
                    if (audioRef.current) audioRef.current.currentTime = 0;
                    audioUnlockedRef.current = true;
                }).catch(() => {
                    // no-op
                });
            }
        };

        const events = ["click", "keydown", "touchstart"];
        events.forEach((event) => document.addEventListener(event, unlockAudio, { once: true }));

        return () => {
            events.forEach((event) => document.removeEventListener(event, unlockAudio));
        };
    }, []);

    const playNotificationSound = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((err) => {
                console.error("Error playing notification sound:", err);
            });
        }
    }, []);

    useEffect(() => {
        const token = getTokenFromCookie();
        if (!token) return;

        const socketInstance = ClientIO(getBaseUrl(), {
            path: "/socket.io",
            transports: ["websocket", "polling"],
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socketInstance.on("connect", () => {
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            setIsConnected(false);
        });

        socketInstance.on("notification:new", (data: VendorNotification) => {
            playNotificationSound();
            toast(data.title, { description: data.message });
            setNotifications((prev) => [data, ...prev].slice(0, 10));
            setUnreadCount((prev) => prev + 1);
        });

        socketInstance.on("notification:unread_count", (data: { unreadCount: number }) => {
            setUnreadCount(data.unreadCount || 0);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [playNotificationSound]);

    useEffect(() => {
        refreshNotifications();
    }, [refreshNotifications]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await notificationsApi.markAsRead(id);
            setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch {
            // no-op
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await notificationsApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {
            // no-op
        }
    }, []);

    const clearNotifications = useCallback(async () => {
        try {
            await notificationsApi.clear();
            setNotifications([]);
            setUnreadCount(0);
        } catch {
            // no-op
        }
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                socket,
                isConnected,
                unreadCount,
                notifications,
                markAsRead,
                markAllAsRead,
                clearNotifications,
                refreshNotifications
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};
