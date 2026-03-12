"use client";

import { MobileSidebar } from "@/components/dashboard/sidebar";
import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = () => {
        document.cookie = "vendor_token=; Max-Age=0; path=/;";
        window.location.href = "/login";
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
