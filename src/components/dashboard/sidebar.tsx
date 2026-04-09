"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ClipboardList,
    Wallet,
    Bell,
    UserCircle,
    LogOut,
    Menu,
    ChevronLeft,
    ChevronRight,
    Package,
    Cookie,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useSidebar } from "./sidebar-context";

const routes = [
    {
        label: "Overview",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "text-sky-500",
    },
    {
        label: "Pooja Kits",
        icon: Package,
        href: "/dashboard/kits",
        color: "text-amber-500",
    },
    {
        label: "Prasadams",
        icon: Cookie,
        href: "/dashboard/prasadams",
        color: "text-orange-500",
    },
    {
        label: "Orders",
        icon: ClipboardList,
        href: "/dashboard/orders",
        color: "text-emerald-500",
    },
    {
        label: "Payouts",
        icon: Wallet,
        href: "/dashboard/payouts",
        color: "text-violet-500",
    },
    {
        label: "Notifications",
        icon: Bell,
        href: "/dashboard/notifications",
        color: "text-rose-500",
    },
    {
        label: "Profile",
        icon: UserCircle,
        href: "/dashboard/profile",
        color: "text-blue-500",
    },
];

export function Sidebar({ isMobile = false, onClose }: { isMobile?: boolean; onClose?: () => void }) {
    const pathname = usePathname();
    const { isCollapsed: contextCollapsed, toggleSidebar } = useSidebar();
    const isCollapsed = isMobile ? false : contextCollapsed;

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname === href || pathname.startsWith(href + "/");
    };

    return (
        <div
            className={cn(
                "space-y-4 py-4 flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
                isMobile ? "w-full overflow-hidden" : "overflow-visible"
            )}
        >
            {/* Header: Logo + Toggle */}
            <div className="px-3 py-2 relative shrink-0">
                <div className="flex items-center pl-3 mb-6 transition-all duration-300 min-h-[40px]">
                    <div className="relative w-8 h-8 mr-4 shrink-0">
                        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 w-full h-full rounded-lg shadow-inner border border-yellow-200" />
                    </div>
                    {!isCollapsed && (
                        <h1 className="text-2xl font-bold whitespace-nowrap overflow-hidden transition-all duration-300">
                            BookMySeva
                        </h1>
                    )}
                </div>

                {/* Toggle Button - Hide on Mobile */}
                {!isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-[-12px] top-2 z-50 rounded-full bg-sidebar border border-sidebar-border text-sidebar-foreground shadow-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-6 w-6 hidden md:flex"
                        onClick={toggleSidebar}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="h-3 w-3" />
                        ) : (
                            <ChevronLeft className="h-3 w-3" />
                        )}
                    </Button>
                )}
            </div>

            {/* Routes */}
            <div className="flex-1 overflow-y-auto px-3 space-y-1 min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#8D0303] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#700202] [&::-webkit-scrollbar-track]:bg-transparent">
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full font-medium cursor-pointer rounded-lg transition overflow-hidden",
                                isCollapsed ? "justify-center" : "justify-start",
                                isActive(route.href)
                                    ? "bg-[#8D0303] text-white shadow-md hover:bg-[#700202]"
                                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                            title={isCollapsed ? route.label : ""}
                            onClick={() => {
                                if (onClose) onClose();
                            }}
                        >
                            <div
                                className={cn(
                                    "flex items-center flex-1",
                                    isCollapsed ? "justify-center" : ""
                                )}
                            >
                                <route.icon
                                    className={cn(
                                        "h-5 w-5 shrink-0 transition-colors",
                                        isCollapsed ? "mr-0" : "mr-3",
                                        isActive(route.href) ? "text-white" : route.color
                                    )}
                                />
                                {!isCollapsed && (
                                    <span className="whitespace-nowrap transition-all duration-300 opacity-100">
                                        {route.label}
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Logout Button */}
            <div className="px-3">
                <button
                    className={cn(
                        "text-sm group flex p-3 w-full font-medium cursor-pointer bg-[#8D0303] text-white hover:bg-[#700202] rounded-lg transition shadow-md",
                        isCollapsed ? "justify-center" : "justify-start"
                    )}
                    onClick={() => {
                        document.cookie = "vendor_token=; Max-Age=0; path=/;";
                        window.location.href = "/login";
                    }}
                    title={isCollapsed ? "Logout" : ""}
                >
                    <div
                        className={cn(
                            "flex items-center flex-1",
                            isCollapsed ? "justify-center" : ""
                        )}
                    >
                        <LogOut
                            className={cn(
                                "h-5 w-5 shrink-0 text-white group-hover:text-white/90 transition-colors",
                                isCollapsed ? "mr-0" : "mr-3"
                            )}
                        />
                        {!isCollapsed && "Logout"}
                    </div>
                </button>
            </div>
        </div>
    );
}

export function MobileSidebar() {
    const [open, setOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <Button variant="ghost" size="icon" className="md:hidden">
                <Menu />
            </Button>
        );
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-[#111827]">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <Sidebar isMobile={true} onClose={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}
