"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CalendarClock, CheckCheck, Trash2 } from "lucide-react";
import { notificationsApi, type VendorNotification } from "@/api/notifications";
import { useNotifications } from "@/providers/notification-provider";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = ["all", "unread", "read"] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr).getTime();
    const diffSec = Math.floor((Date.now() - date) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
}

export default function VendorNotificationsPage() {
    const router = useRouter();
    const { markAsRead, markAllAsRead, clearNotifications, refreshNotifications } = useNotifications();

    const [items, setItems] = useState<VendorNotification[]>([]);
    const [status, setStatus] = useState<StatusFilter>("all");
    const [loading, setLoading] = useState(true);

    const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

    const loadNotifications = async (nextStatus: StatusFilter = status) => {
        setLoading(true);
        try {
            const res = await notificationsApi.getAll({ status: nextStatus, page: 1, limit: 100 });
            setItems(res.notifications || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications("all");
    }, []);

    const getNotificationTarget = (entityType?: string) => {
        if (entityType === "order") return "/dashboard/orders";
        if (entityType === "withdrawal") return "/dashboard/payouts";
        return "/dashboard";
    };

    const handleOpenNotification = async (notification: VendorNotification) => {
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }
        await refreshNotifications();
        router.push(getNotificationTarget(notification.entityType));
    };

    const handleStatusChange = async (nextStatus: StatusFilter) => {
        setStatus(nextStatus);
        await loadNotifications(nextStatus);
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        await loadNotifications(status);
    };

    const handleClearAll = async () => {
        await clearNotifications();
        await loadNotifications(status);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                    <p className="text-sm text-muted-foreground">Track order and withdrawal updates in one place.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="bg-[#8D0303] text-white">Unread: {unreadCount}</Badge>
                    <Button variant="outline" onClick={handleMarkAllRead}>
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Mark All Read
                    </Button>
                    <Button variant="outline" onClick={handleClearAll}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {STATUS_OPTIONS.map((option) => (
                    <Button
                        key={option}
                        variant={status === option ? "default" : "outline"}
                        className={status === option ? "bg-[#8D0303] hover:bg-[#700202]" : ""}
                        onClick={() => handleStatusChange(option)}
                    >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Button>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-[#8D0303]" />
                        Recent Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-sm text-muted-foreground">Loading notifications...</div>
                    ) : items.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-8 text-center">
                            <p className="text-sm text-muted-foreground">No notifications available for this filter.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((notification) => (
                                <button
                                    key={notification._id}
                                    onClick={() => handleOpenNotification(notification)}
                                    className="w-full rounded-xl border p-4 text-left hover:border-[#8D0303] hover:bg-[#8D0303]/5 transition"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-semibold text-foreground">{notification.title}</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                                        </div>
                                        {!notification.isRead && <Badge className="bg-emerald-600 text-white">New</Badge>}
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                        <CalendarClock className="h-3.5 w-3.5" />
                                        <span>{formatRelativeTime(notification.createdAt)}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
