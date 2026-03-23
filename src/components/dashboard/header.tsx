"use client";

import { MobileSidebar } from "@/components/dashboard/sidebar";
import { Bell, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNotifications } from "@/providers/notification-provider";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const pageTitles: Record<string, string> = {
    "/dashboard": "Overview",
    "/dashboard/products": "Products",
    "/dashboard/orders": "Orders",
    "/dashboard/payouts": "Payouts",
    "/dashboard/notifications": "Notifications",
    "/dashboard/profile": "Profile",
};

function getPageTitle(pathname: string): string {
    // Check exact match first
    if (pageTitles[pathname]) return pageTitles[pathname];

    // Check if pathname starts with any known route
    for (const [route, title] of Object.entries(pageTitles)) {
        if (route !== "/dashboard" && pathname.startsWith(route)) {
            return title;
        }
    }

    return "Dashboard";
}

export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications
    } = useNotifications();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = () => {
        document.cookie = "vendor_token=; Max-Age=0; path=/;";
        window.location.href = "/login";
    };

    const getNotificationTarget = (entityType?: string) => {
        if (entityType === "order") return "/dashboard/orders";
        if (entityType === "withdrawal") return "/dashboard/payouts";
        return "/dashboard";
    };

    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr).getTime();
        const diffSec = Math.floor((Date.now() - date) / 1000);
        if (diffSec < 60) return "Just now";
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
        return `${Math.floor(diffSec / 86400)}d ago`;
    };

    const handleNotificationClick = async (notification: { _id: string; entityType?: string }) => {
        await markAsRead(notification._id);
        router.push(getNotificationTarget(notification.entityType));
    };

    return (
        <div className="flex items-center p-4 border-b h-16 bg-white">
            <MobileSidebar />

            {/* Breadcrumb / Page Title */}
            <div className="hidden md:flex items-center ml-4">
                <h2 className="text-lg font-semibold text-foreground">
                    {getPageTitle(pathname)}
                </h2>
            </div>

            <div className="ml-auto flex items-center gap-x-4">
                {mounted ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="relative rounded-full p-2 hover:bg-muted transition">
                                <Bell className="h-5 w-5 text-muted-foreground" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8D0303] px-1 text-[10px] font-bold text-white">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <div className="flex items-center justify-between px-2 py-1.5">
                                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            clearNotifications();
                                        }}
                                        className="text-[10px] text-muted-foreground hover:text-[#8D0303] font-medium"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <DropdownMenuSeparator />
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No new notifications
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <DropdownMenuItem
                                        key={notification._id}
                                        className="flex flex-col items-start gap-1 p-3 cursor-pointer focus:bg-[#8D0303] focus:text-white group"
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex w-full items-center justify-between gap-2">
                                            <span className="font-semibold text-[#8D0303] group-focus:text-white">
                                                {notification.title}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground group-focus:text-white/80">
                                                {formatRelativeTime(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground/90 group-focus:text-white/90 line-clamp-2">
                                            {notification.message}
                                        </p>
                                    </DropdownMenuItem>
                                ))
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="justify-center text-[#8D0303] font-medium cursor-pointer"
                                onClick={() => router.push("/dashboard/notifications")}
                            >
                                View All Notifications
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="justify-center text-muted-foreground cursor-pointer"
                                onClick={() => markAllAsRead()}
                            >
                                Mark All As Read
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <button className="relative rounded-full p-2 hover:bg-muted transition">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                    </button>
                )}

                {/* Vendor Avatar Dropdown */}
                {mounted ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                <Avatar className="h-8 w-8 cursor-pointer">
                                    <AvatarFallback className="bg-[#8D0303] text-white text-xs font-semibold">
                                        V
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Vendor Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                )}
            </div>
        </div>
    );
}
