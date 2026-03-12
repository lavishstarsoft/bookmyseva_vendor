"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle2, Mail, Bell, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function VendorPendingPage() {
    const router = useRouter();
    const [checking, setChecking] = useState(false);

    const handleCheckStatus = async () => {
        setChecking(true);
        try {
            const res = await api.get("/vendor-auth/me");
            const vendor = res.data?.vendor || res.data;

            if (vendor?.status === "approved") {
                toast.success("Your account has been approved!");
                router.push("/dashboard");
            } else if (vendor?.status === "rejected") {
                toast.error(
                    vendor?.rejectionReason ||
                        "Your application has been rejected. Please contact support."
                );
            } else {
                toast.info("Your application is still under review.");
            }
        } catch (error: any) {
            const message =
                error.response?.data?.message ||
                "Failed to check status. Please try again.";
            toast.error(message);
        } finally {
            setChecking(false);
        }
    };

    const handleLogout = () => {
        document.cookie = "vendor_token=; Max-Age=0; path=/;";
        router.push("/login");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                        <Clock className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        Registration Under Review
                    </CardTitle>
                    <CardDescription>
                        Thank you for registering! Your application is being
                        reviewed by our team.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* What happens next */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground">
                            What happens next?
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    Our team will verify your details within 24-48 hours
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                                    <Bell className="h-3.5 w-3.5 text-secondary" />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    You will receive a notification once your account is approved
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                                    <Mail className="h-3.5 w-3.5 text-secondary" />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    If additional information is needed, we will reach out to you
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Status check info */}
                    <div className="rounded-lg border border-border bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground text-center">
                            You can check your application status at any time by
                            clicking the button below.
                        </p>
                    </div>

                    {/* Check status button */}
                    <Button
                        variant="secondary"
                        className="w-full"
                        size="lg"
                        onClick={handleCheckStatus}
                        disabled={checking}
                    >
                        {checking ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Checking Status...
                            </>
                        ) : (
                            "Check Application Status"
                        )}
                    </Button>
                </CardContent>

                <CardFooter className="justify-center">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </CardFooter>
            </Card>
        </div>
    );
}
