"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import api from "@/lib/axios";
import { Loader2, Shield, User, FileText, CreditCard, Globe, MapPin, Phone, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";

interface FormField {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string;
    width?: "full" | "half" | "third";
}

interface VendorProfile {
    id: string;
    firstName: string;
    surname: string;
    email: string;
    phone: string;
    profilePhoto: string;
    fullAddress: string;
    licenseNumber: string;
    panCard: string;
    pincode: string;
    state: string;
    knownLanguages: string[];
    documents: { type: string; url: string; uploadedAt: string }[];
    bankDetails: {
        accountHolderName: string;
        accountNumber: string;
        bankName: string;
        ifscCode: string;
        mmicCode: string;
    };
    customFields: Record<string, string>;
    status: string;
    rejectionReason: string;
    commissionType: 'percentage' | 'fixed';
    commissionValue: number;
    createdAt: string;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<VendorProfile | null>(null);
    const [formFields, setFormFields] = useState<FormField[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, formRes] = await Promise.all([
                    api.get("/vendor-auth/profile"),
                    api.get("/vendor-auth/registration-form"),
                ]);
                setProfile(profileRes.data.vendor);
                setFormFields(formRes.data.formFields || []);
            } catch {
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getStatusBadge = (status: string) => {
        const config: Record<string, { color: string; bg: string }> = {
            approved: { color: "text-green-800", bg: "bg-green-100" },
            pending: { color: "text-amber-800", bg: "bg-amber-100" },
            rejected: { color: "text-red-800", bg: "bg-red-100" },
            suspended: { color: "text-gray-800", bg: "bg-gray-100" },
        };
        return config[status] || { color: "text-gray-800", bg: "bg-gray-100" };
    };

    const getFieldValue = (field: FormField): string => {
        if (!profile) return "";
        const custom = profile.customFields || {};

        // Check customFields by label
        if (custom[field.label]) return custom[field.label];

        // Map known labels to profile fields
        const labelMap: Record<string, string> = {
            "First Name": profile.firstName,
            "Surname": profile.surname,
            "Email": profile.email,
            "Phone": profile.phone,
            "Mobile": profile.phone,
            "Full Address": profile.fullAddress,
            "Address": profile.fullAddress,
            "License Number": profile.licenseNumber,
            "PAN Card": profile.panCard,
            "Pincode": profile.pincode,
            "State": profile.state,
            "Known Languages": profile.knownLanguages?.join(", ") || "",
            "Profile Photo": profile.profilePhoto,
        };

        return labelMap[field.label] || "";
    };

    const isImageUrl = (value: string) => {
        if (!value) return false;
        return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value) || value.includes("r2.dev") || value.includes("cloudinary");
    };

    const isFileUrl = (value: string) => {
        if (!value) return false;
        return value.startsWith("http") || value.startsWith("/");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" />
            </div>
        );
    }

    if (!profile) return null;

    const statusBadge = getStatusBadge(profile.status);

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                        <span>Dashboard</span><span>/</span>
                        <span className="text-[#8D0303] font-medium">Profile</span>
                    </div>
                    <h1 className="text-2xl font-bold">My Profile</h1>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize ${statusBadge.bg} ${statusBadge.color}`}>
                    <Shield className="w-3 h-3 inline mr-1" />{profile.status}
                </span>
            </div>

            {/* Rejection Reason */}
            {profile.status === "rejected" && profile.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-red-800 mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-700">{profile.rejectionReason}</p>
                </div>
            )}

            {/* Profile Overview Card */}
            <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#8D0303] to-[#b91c1c] py-6 px-6">
                    <div className="flex items-center gap-4">
                        {profile.profilePhoto ? (
                            <img src={profile.profilePhoto} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-white/30" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                                <User className="w-8 h-8 text-white" />
                            </div>
                        )}
                        <div className="text-white">
                            <h2 className="text-xl font-bold">{profile.firstName} {profile.surname}</h2>
                            <div className="flex items-center gap-4 mt-1 text-white/80 text-sm">
                                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{profile.phone}</span>
                                {profile.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{profile.email}</span>}
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-white/60 text-xs">
                                <Calendar className="w-3 h-3" /> Joined {new Date(profile.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Registration Form Details */}
            {formFields.length > 0 && (
                <Card className="border shadow-sm">
                    <CardHeader className="pb-2 px-6 pt-5">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#8D0303]" />
                            <h2 className="font-bold text-lg">Registration Details</h2>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {formFields.map(field => {
                                const value = getFieldValue(field);
                                const colSpan = field.width === "full" ? "md:col-span-2" : "";

                                return (
                                    <div key={field.id} className={`${colSpan}`}>
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                            {field.label}
                                        </label>
                                        {field.type === "image" && isImageUrl(value) ? (
                                            <div className="w-24 h-24 rounded-lg overflow-hidden border bg-gray-50">
                                                <img src={value} alt={field.label} className="w-full h-full object-cover" />
                                            </div>
                                        ) : field.type === "file" && isFileUrl(value) ? (
                                            <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-[#8D0303] font-medium hover:underline flex items-center gap-1">
                                                <FileText className="w-3.5 h-3.5" /> View Document
                                            </a>
                                        ) : field.type === "checkbox" ? (
                                            <p className="text-sm font-medium text-gray-900">
                                                {value === "true" || value === "on" ? "Yes" : "No"}
                                            </p>
                                        ) : (
                                            <p className="text-sm font-medium text-gray-900 bg-gray-50 rounded-md px-3 py-2 border border-gray-100 min-h-[36px]">
                                                {value || <span className="text-gray-400 italic">Not provided</span>}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Address */}
                {(profile.fullAddress || profile.pincode || profile.state) && (
                    <Card className="border shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin className="w-4 h-4 text-[#8D0303]" />
                                <h3 className="font-bold text-sm">Address</h3>
                            </div>
                            <div className="space-y-2">
                                {profile.fullAddress && (
                                    <div>
                                        <label className="text-xs text-muted-foreground font-medium">Full Address</label>
                                        <p className="text-sm font-medium">{profile.fullAddress}</p>
                                    </div>
                                )}
                                <div className="flex gap-6">
                                    {profile.pincode && (
                                        <div>
                                            <label className="text-xs text-muted-foreground font-medium">Pincode</label>
                                            <p className="text-sm font-medium">{profile.pincode}</p>
                                        </div>
                                    )}
                                    {profile.state && (
                                        <div>
                                            <label className="text-xs text-muted-foreground font-medium">State</label>
                                            <p className="text-sm font-medium">{profile.state}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Languages */}
                {profile.knownLanguages && profile.knownLanguages.length > 0 && (
                    <Card className="border shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Globe className="w-4 h-4 text-[#8D0303]" />
                                <h3 className="font-bold text-sm">Known Languages</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {profile.knownLanguages.map((lang, i) => (
                                    <span key={i} className="text-xs font-medium bg-[#8D0303]/10 text-[#8D0303] px-2.5 py-1 rounded-full">{lang}</span>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Commission Details */}
            <Card className="border shadow-sm">
                <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="w-4 h-4 text-[#8D0303]" />
                        <h3 className="font-bold text-sm">Commission Details</h3>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Rate</p>
                        <p className="text-xl font-bold text-[#8D0303]">
                            {profile.commissionType === "percentage"
                                ? `${profile.commissionValue}%`
                                : `₹${profile.commissionValue}`
                            }
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                                ({profile.commissionType === "percentage" ? "Percentage based" : "Fixed amount per order"})
                            </span>
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Bank Details */}
            {profile.bankDetails && (profile.bankDetails.accountNumber || profile.bankDetails.bankName) && (
                <Card className="border shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <CreditCard className="w-4 h-4 text-[#8D0303]" />
                            <h3 className="font-bold text-sm">Bank Details</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                            {[
                                { label: "Account Holder", value: profile.bankDetails.accountHolderName },
                                { label: "Account Number", value: profile.bankDetails.accountNumber },
                                { label: "Bank Name", value: profile.bankDetails.bankName },
                                { label: "IFSC Code", value: profile.bankDetails.ifscCode },
                                { label: "MMIC Code", value: profile.bankDetails.mmicCode },
                            ].filter(f => f.value).map(f => (
                                <div key={f.label}>
                                    <label className="text-xs text-muted-foreground font-medium">{f.label}</label>
                                    <p className="text-sm font-medium">{f.value}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Documents */}
            {profile.documents && profile.documents.length > 0 && (
                <Card className="border shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-4 h-4 text-[#8D0303]" />
                            <h3 className="font-bold text-sm">Documents</h3>
                        </div>
                        <div className="space-y-2">
                            {profile.documents.map((doc, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold capitalize bg-[#8D0303]/10 text-[#8D0303] px-2 py-0.5 rounded">{doc.type.replace("_", " ")}</span>
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8D0303] hover:underline font-medium">View</a>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
