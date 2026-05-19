"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type Step = "mobile" | "otp";

export default function VendorLoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("mobile");
    const [mobile, setMobile] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Resend timer countdown
    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => {
            setResendTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleSendOtp = async () => {
        const cleaned = mobile.replace(/\D/g, "");
        if (cleaned.length !== 10) {
            toast.error("Please enter a valid 10-digit mobile number");
            return;
        }

        setLoading(true);
        try {
            await api.post("/vendor-auth/send-otp", {
                mobile: cleaned,
                isSignup: false,
            });
            setStep("otp");
            setResendTimer(30);
            toast.success("OTP sent successfully");
        } catch (error: any) {
            const message =
                error.response?.data?.message || "Failed to send OTP";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            value = value.slice(-1);
        }
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 6) {
            const newOtp = pasted.split("");
            setOtp(newOtp);
            otpRefs.current[5]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otpValue = otp.join("");
        if (otpValue.length !== 6) {
            toast.error("Please enter the complete 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post("/vendor-auth/verify-otp", {
                mobile: mobile.replace(/\D/g, ""),
                otp: otpValue,
            });

            const { token, vendor } = res.data;

            // Set cookie
            document.cookie = `vendor_token=${token}; path=/; max-age=2592000; SameSite=Lax`;

            toast.success("Login successful");

            // Redirect based on vendor status
            if (vendor?.status === "approved") {
                router.push("/dashboard");
            } else if (vendor?.status === "pending") {
                router.push("/pending");
            } else if (vendor?.status === "rejected") {
                toast.error(
                    vendor?.rejectionReason ||
                        "Your application has been rejected. Please contact support."
                );
            } else {
                router.push("/dashboard");
            }
        } catch (error: any) {
            const message =
                error.response?.data?.message || "OTP verification failed";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        try {
            await api.post("/vendor-auth/send-otp", {
                mobile: mobile.replace(/\D/g, ""),
                isSignup: false,
            });
            setResendTimer(30);
            setOtp(["", "", "", "", "", ""]);
            toast.success("OTP resent successfully");
        } catch (error: any) {
            const message =
                error.response?.data?.message || "Failed to resend OTP";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                        {step === "mobile" ? (
                            <Phone className="h-6 w-6 text-secondary" />
                        ) : (
                            <ShieldCheck className="h-6 w-6 text-secondary" />
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {step === "mobile"
                            ? "Vendor Login"
                            : "Verify OTP"}
                    </CardTitle>
                    <CardDescription>
                        {step === "mobile"
                            ? "Enter your registered mobile number to receive an OTP"
                            : `Enter the 6-digit OTP sent to +91 ${mobile}`}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {step === "mobile" ? (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendOtp();
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="mobile">Mobile Number</Label>
                                <div className="flex gap-2">
                                    <div className="flex h-9 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                                        +91
                                    </div>
                                    <Input
                                        id="mobile"
                                        type="tel"
                                        placeholder="Enter 10-digit number"
                                        value={mobile}
                                        onChange={(e) =>
                                            setMobile(
                                                e.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 10)
                                            )
                                        }
                                        maxLength={10}
                                        className="flex-1"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                variant="secondary"
                                className="w-full"
                                size="lg"
                                disabled={loading || mobile.replace(/\D/g, "").length !== 10}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    "Send OTP"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleVerifyOtp();
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label>Enter OTP</Label>
                                <div
                                    className="flex justify-center gap-3"
                                    onPaste={handleOtpPaste}
                                >
                                    {otp.map((digit, index) => (
                                        <Input
                                            key={index}
                                            ref={(el) => {
                                                otpRefs.current[index] = el;
                                            }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) =>
                                                handleOtpChange(
                                                    index,
                                                    e.target.value
                                                )
                                            }
                                            onKeyDown={(e) =>
                                                handleOtpKeyDown(index, e)
                                            }
                                            className="h-12 w-12 text-center text-lg font-semibold"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                variant="secondary"
                                className="w-full"
                                size="lg"
                                disabled={loading || otp.join("").length !== 6}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify & Login"
                                )}
                            </Button>

                            <div className="flex items-center justify-between text-sm">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep("mobile");
                                        setOtp(["", "", "", "", "", ""]);
                                    }}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Change number
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendTimer > 0 || loading}
                                    className="text-secondary hover:text-secondary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                                >
                                    {resendTimer > 0
                                        ? `Resend in ${resendTimer}s`
                                        : "Resend OTP"}
                                </button>
                            </div>
                        </form>
                    )}
                </CardContent>

                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/register"
                            className="font-medium text-secondary hover:text-secondary/80 transition-colors"
                        >
                            Register here
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
