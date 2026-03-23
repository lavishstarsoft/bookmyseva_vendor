"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider, useSidebar } from "@/components/dashboard/sidebar-context";
import { NotificationProvider } from "@/providers/notification-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <NotificationProvider>
            <SidebarProvider>
                <DashboardLayoutContent>{children}</DashboardLayoutContent>
            </SidebarProvider>
        </NotificationProvider>
    );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();
    const router = useRouter();
    const [statusChecked, setStatusChecked] = useState(false);

    useEffect(() => {
        const checkVendorStatus = async () => {
            try {
                const res = await api.get("/vendor-auth/me");
                const vendor = res.data?.vendor;

                if (!vendor || vendor.status !== "approved") {
                    router.replace("/pending");
                    return;
                }

                setStatusChecked(true);
            } catch {
                // If the API call fails (401/403), the axios interceptor
                // will handle redirect to login for 401.
                // For 403 (suspended), redirect to pending.
                router.replace("/pending");
            }
        };

        checkVendorStatus();
    }, [router]);

    if (!statusChecked) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="h-full relative">
            <div
                className={cn(
                    "hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-[80] transition-all duration-300",
                    isCollapsed ? "md:w-[80px]" : "md:w-64"
                )}
            >
                <Suspense
                    fallback={
                        <div className="h-full w-full bg-sidebar animate-pulse" />
                    }
                >
                    <Sidebar />
                </Suspense>
            </div>
            <main
                className={cn(
                    "h-full transition-all duration-300",
                    isCollapsed ? "md:pl-[80px]" : "md:pl-64"
                )}
            >
                <Suspense
                    fallback={
                        <div className="h-16 w-full bg-white border-b animate-pulse" />
                    }
                >
                    <Header />
                </Suspense>
                <div className="p-4 md:p-6 lg:p-8">{children}</div>
                <Toaster />
            </main>
        </div>
    );
}
