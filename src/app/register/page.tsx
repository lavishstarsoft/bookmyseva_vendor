"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Phone, ShieldCheck, UserPlus, Upload, X, FileText } from "lucide-react";
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

interface FormField {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string;
    width?: string;
}

type Step = 1 | 2;

export default function VendorRegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [mobile, setMobile] = useState("");
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Dynamic form config
    const [formFields, setFormFields] = useState<FormField[]>([]);
    const [formLoading, setFormLoading] = useState(true);
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
    const [uploadingField, setUploadingField] = useState<string | null>(null);

    // Fallback fields if no config set by admin
    const defaultFields: FormField[] = [
        { id: "firstName", type: "text", label: "First Name", placeholder: "Enter your first name", required: true, width: "half" },
        { id: "surname", type: "text", label: "Surname", placeholder: "Enter your surname", required: true, width: "half" },
        { id: "email", type: "email", label: "Email", placeholder: "Enter your email address", required: true, width: "full" },
    ];

    // Fetch form config on mount
    useEffect(() => {
        const fetchFormConfig = async () => {
            try {
                const res = await api.get("/vendor-auth/registration-form");
                const fields = res.data?.formFields;
                if (fields && fields.length > 0) {
                    setFormFields(fields);
                } else {
                    setFormFields(defaultFields);
                }
            } catch {
                setFormFields(defaultFields);
            } finally {
                setFormLoading(false);
            }
        };
        fetchFormConfig();
    }, []);

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
                isSignup: true,
            });
            setOtpSent(true);
            setResendTimer(30);
            toast.success("OTP sent successfully");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(-1);
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 3) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
        if (pasted.length === 4) {
            setOtp(pasted.split(""));
            otpRefs.current[3]?.focus();
        }
    };

    const handleVerifyAndContinue = () => {
        const otpValue = otp.join("");
        if (otpValue.length !== 4) {
            toast.error("Please enter the complete 4-digit OTP");
            return;
        }
        setStep(2);
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        try {
            await api.post("/vendor-auth/send-otp", {
                mobile: mobile.replace(/\D/g, ""),
                isSignup: true,
            });
            setResendTimer(30);
            setOtp(["", "", "", ""]);
            toast.success("OTP resent successfully");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to resend OTP");
        } finally {
            setLoading(false);
        }
    };

    const setFieldValue = (fieldId: string, value: string) => {
        setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
    };

    const handleFileUpload = async (fieldId: string, file: File) => {
        setUploadingField(fieldId);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
            const res = await fetch(`${baseUrl}/api/v1/vendor-auth/registration-upload`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            setFieldValue(fieldId, data.url);
            toast.success("File uploaded successfully");
        } catch {
            toast.error("Failed to upload file");
        } finally {
            setUploadingField(null);
        }
    };

    const handleRegister = async () => {
        // Validate required fields
        const activeFields = formFields;
        for (const field of activeFields) {
            if (field.required && !fieldValues[field.id]?.trim()) {
                toast.error(`${field.label} is required`);
                return;
            }
        }

        // Extract core fields, everything else goes to customFields
        const firstName = fieldValues["firstName"] ||
            findFieldValue("First Name") ||
            findFieldValue("first name") || "";
        const surname = fieldValues["surname"] ||
            findFieldValue("Surname") ||
            findFieldValue("surname") ||
            findFieldValue("Last Name") || "";
        const email = fieldValues["email"] ||
            findFieldValue("Email") ||
            findFieldValue("email") ||
            findFieldValue("Email Address") || "";

        if (!firstName && !email) {
            // At minimum we need either a name or email from the dynamic fields
            const firstTextField = activeFields.find(f => f.type === "text" && f.required);
            if (firstTextField && !fieldValues[firstTextField.id]) {
                toast.error(`${firstTextField.label} is required`);
                return;
            }
        }

        // Build customFields - all field values keyed by field label for readability
        const customFields: Record<string, string> = {};
        for (const field of activeFields) {
            if (fieldValues[field.id]) {
                customFields[field.label] = fieldValues[field.id];
            }
        }

        setLoading(true);
        try {
            const res = await api.post("/vendor-auth/verify-otp", {
                mobile: mobile.replace(/\D/g, ""),
                otp: otp.join(""),
                isSignup: true,
                firstName: firstName || "Vendor",
                surname: surname || "",
                email: email || `${mobile.replace(/\D/g, "")}@vendor.bookmyseva.com`,
                customFields,
            });

            const { token } = res.data;
            document.cookie = `vendor_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
            toast.success("Registration successful!");
            router.push("/pending");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    // Helper: find field value by label (case-insensitive partial match)
    const findFieldValue = (labelMatch: string) => {
        const field = formFields.find(
            (f) => f.label.toLowerCase().includes(labelMatch.toLowerCase())
        );
        return field ? fieldValues[field.id] || "" : "";
    };

    const getColSpan = (width?: string) => {
        switch (width) {
            case "half": return "col-span-6";
            case "third": return "col-span-4";
            default: return "col-span-12";
        }
    };

    const hasRequiredEmpty = formFields
        .filter((f) => f.required)
        .some((f) => !fieldValues[f.id]?.trim());

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader className="text-center">
                    {/* Step indicator */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                        {[1, 2].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                                        step >= s
                                            ? "bg-secondary text-secondary-foreground"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                                >
                                    {s}
                                </div>
                                {s < 2 && (
                                    <div
                                        className={`h-0.5 w-12 transition-colors ${
                                            step > s ? "bg-secondary" : "bg-muted"
                                        }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                        {step === 1 ? (
                            otpSent ? (
                                <ShieldCheck className="h-6 w-6 text-secondary" />
                            ) : (
                                <Phone className="h-6 w-6 text-secondary" />
                            )
                        ) : (
                            <UserPlus className="h-6 w-6 text-secondary" />
                        )}
                    </div>

                    <CardTitle className="text-2xl font-bold">
                        {step === 1
                            ? otpSent
                                ? "Verify OTP"
                                : "Create Account"
                            : "Complete Registration"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1
                            ? otpSent
                                ? `Enter the 4-digit OTP sent to +91 ${mobile}`
                                : "Register as a vendor on BookMySeva"
                            : "Fill in the details to complete your registration"}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {step === 1 && !otpSent ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-4">
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
                                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
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
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...</>
                                ) : (
                                    "Send OTP"
                                )}
                            </Button>
                        </form>
                    ) : step === 1 && otpSent ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleVerifyAndContinue(); }} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Enter OTP</Label>
                                <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                                    {otp.map((digit, index) => (
                                        <Input
                                            key={index}
                                            ref={(el) => { otpRefs.current[index] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            className="h-12 w-12 text-center text-lg font-semibold"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                            </div>
                            <Button type="submit" variant="secondary" className="w-full" size="lg" disabled={otp.join("").length !== 4}>
                                Continue
                            </Button>
                            <div className="flex items-center justify-between text-sm">
                                <button type="button" onClick={() => { setOtpSent(false); setOtp(["", "", "", ""]); }} className="text-muted-foreground hover:text-foreground transition-colors">
                                    Change number
                                </button>
                                <button type="button" onClick={handleResendOtp} disabled={resendTimer > 0 || loading} className="text-secondary hover:text-secondary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors">
                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        // Step 2: Dynamic form fields
                        <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }} className="space-y-4">
                            {formLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-12 gap-3">
                                    {formFields.map((field) => (
                                        <div key={field.id} className={getColSpan(field.width)}>
                                            <DynamicField
                                                field={field}
                                                value={fieldValues[field.id] || ""}
                                                onChange={(val) => setFieldValue(field.id, val)}
                                                onFileUpload={(file) => handleFileUpload(field.id, file)}
                                                uploading={uploadingField === field.id}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" size="lg" onClick={() => setStep(1)}>
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    variant="secondary"
                                    className="flex-1"
                                    size="lg"
                                    disabled={loading || hasRequiredEmpty}
                                >
                                    {loading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</>
                                    ) : (
                                        "Register"
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>

                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium text-secondary hover:text-secondary/80 transition-colors">
                            Login here
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

// ─── Dynamic Field Renderer ─────────────────────────────────────────────────

function DynamicField({
    field,
    value,
    onChange,
    onFileUpload,
    uploading,
}: {
    field: FormField;
    value: string;
    onChange: (val: string) => void;
    onFileUpload: (file: File) => void;
    uploading: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-sm">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
                {!field.required && <span className="text-muted-foreground text-xs ml-1">(optional)</span>}
            </Label>

            {/* Text / Number / Email / Phone */}
            {["text", "number", "email", "phone"].includes(field.type) && (
                <Input
                    type={field.type === "phone" ? "tel" : field.type}
                    placeholder={field.placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}

            {/* Textarea */}
            {field.type === "textarea" && (
                <textarea
                    placeholder={field.placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
            )}

            {/* Select / Dropdown */}
            {field.type === "select" && (
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    <option value="">{field.placeholder || "Select..."}</option>
                    {field.options?.split(",").map((opt, i) => (
                        <option key={i} value={opt.trim()}>{opt.trim()}</option>
                    ))}
                </select>
            )}

            {/* Radio */}
            {field.type === "radio" && (
                <div className="flex flex-wrap gap-3 pt-1">
                    {field.options?.split(",").map((opt, i) => (
                        <label key={i} className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <input
                                type="radio"
                                name={field.id}
                                value={opt.trim()}
                                checked={value === opt.trim()}
                                onChange={(e) => onChange(e.target.value)}
                                className="accent-[#8D0303]"
                            />
                            {opt.trim()}
                        </label>
                    ))}
                </div>
            )}

            {/* Checkbox */}
            {field.type === "checkbox" && (
                <label className="flex items-center gap-2 text-sm cursor-pointer pt-1">
                    <input
                        type="checkbox"
                        checked={value === "true"}
                        onChange={(e) => onChange(e.target.checked ? "true" : "")}
                        className="accent-[#8D0303] h-4 w-4"
                    />
                    {field.placeholder || field.label}
                </label>
            )}

            {/* Image Upload */}
            {field.type === "image" && (
                <div>
                    {value ? (
                        <div className="relative rounded-lg overflow-hidden border h-32 w-32">
                            <img src={value} alt={field.label} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => onChange("")}
                                className="absolute top-1 right-1 h-6 w-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center h-32 w-full border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                            {uploading ? (
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            ) : (
                                <>
                                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                    <span className="text-xs text-muted-foreground">Click to upload image</span>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploading}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) onFileUpload(file);
                                    e.target.value = "";
                                }}
                            />
                        </label>
                    )}
                </div>
            )}

            {/* File / PDF Upload */}
            {field.type === "file" && (
                <div>
                    {value ? (
                        <div className="flex items-center gap-2 border rounded-lg p-3">
                            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground truncate flex-1">{value.split("/").pop()}</span>
                            <button
                                type="button"
                                onClick={() => onChange("")}
                                className="h-6 w-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90 shrink-0"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center h-24 w-full border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                            {uploading ? (
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            ) : (
                                <>
                                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                    <span className="text-xs text-muted-foreground">Click to upload file / PDF</span>
                                </>
                            )}
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                className="hidden"
                                disabled={uploading}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) onFileUpload(file);
                                    e.target.value = "";
                                }}
                            />
                        </label>
                    )}
                </div>
            )}
        </div>
    );
}
