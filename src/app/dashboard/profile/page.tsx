"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { Loader2, Shield, User, FileText, CreditCard, Globe, MapPin, Phone, Mail, Calendar, Edit2, Plus, Camera } from "lucide-react";
import { toast } from "sonner";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

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
    
    // Bank Details Modal
    const [openBankModal, setOpenBankModal] = useState(false);
    const [bankForm, setBankForm] = useState({
        accountHolderName: "",
        accountNumber: "",
        bankName: "",
        ifscCode: "",
        mmicCode: ""
    });
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, formRes] = await Promise.all([
                    api.get("/vendor-auth/profile"),
                    api.get("/vendor-auth/registration-form"),
                ]);
                const profileData = profileRes.data.vendor;
                setProfile(profileData);
                if (profileData.bankDetails) {
                    setBankForm({
                        accountHolderName: profileData.bankDetails.accountHolderName || "",
                        accountNumber: profileData.bankDetails.accountNumber || "",
                        bankName: profileData.bankDetails.bankName || "",
                        ifscCode: profileData.bankDetails.ifscCode || "",
                        mmicCode: profileData.bankDetails.mmicCode || "",
                    });
                }
                setFormFields(formRes.data.formFields || []);
            } catch {
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSaveBankDetails = async () => {
        if (!bankForm.accountHolderName || !bankForm.accountNumber || !bankForm.ifscCode) {
            toast.error("Please fill in required fields");
            return;
        }
        
        setSaving(true);
        try {
            const res = await api.put("/vendor-auth/profile", {
                bankDetails: bankForm
            });
            // Update profile with returned data
            const updatedProfile = res.data.vendor;
            
            // Map the response appropriately or refetch
            setProfile(prev => prev ? { 
                ...prev, 
                bankDetails: {
                    ...prev.bankDetails,
                    ...bankForm
                } 
            } : null);
            
            toast.success("Bank details updated successfully");
            setOpenBankModal(false);
        } catch {
            toast.error("Failed to update bank details");
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select a valid image file");
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setCropImageSrc(objectUrl);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCropModalOpen(true);

        if (event.target) event.target.value = "";
    };

    const onCropComplete = useCallback((_croppedArea: any, croppedPixels: any) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const closeCropModal = () => {
        if (cropImageSrc?.startsWith("blob:")) {
            URL.revokeObjectURL(cropImageSrc);
        }
        setCropModalOpen(false);
        setCropImageSrc(null);
        setCroppedAreaPixels(null);
    };

    const handleSaveCroppedPhoto = async () => {
        if (!cropImageSrc || !croppedAreaPixels) {
            toast.error("Please adjust crop area");
            return;
        }

        setUploadingPhoto(true);
        try {
            const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
            if (!croppedBlob) throw new Error("Crop failed");

            const formData = new FormData();
            const uploadFile = new File([croppedBlob], `profile-${Date.now()}.jpg`, { type: "image/jpeg" });
            formData.append("file", uploadFile);

            const uploadRes = await api.post("/vendor-auth/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const imageUrl = uploadRes.data?.url;
            if (!imageUrl) throw new Error("Image upload failed");

            await api.put("/vendor-auth/profile", { profilePhoto: imageUrl });

            setProfile((prev) => (prev ? { ...prev, profilePhoto: imageUrl } : prev));
            toast.success("Profile photo updated successfully");
            closeCropModal();
        } catch {
            toast.error("Failed to update profile photo");
        } finally {
            setUploadingPhoto(false);
        }
    };

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
    const heroPhoto = profile.profilePhoto || profile.customFields?.["Profile Photo"] || "";

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <span>Dashboard</span><span>/</span>
                        <span className="text-[#8D0303] font-medium">Profile</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Profile</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage your account details, verification data, and payout information.</p>
                </div>
                <span className={`inline-flex w-fit items-center text-xs font-bold px-3.5 py-1.5 rounded-full capitalize border ${statusBadge.bg} ${statusBadge.color}`}>
                    <Shield className="w-3 h-3 inline mr-1" />{profile.status}
                </span>
            </div>

            {/* Rejection Reason */}
            {profile.status === "rejected" && profile.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-red-800 mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-700">{profile.rejectionReason}</p>
                </div>
            )}

            {/* Profile Overview Card */}
            <Card className="border-0 shadow-md overflow-hidden rounded-2xl">
                <CardHeader className="bg-gradient-to-r from-[#7a0303] via-[#8D0303] to-[#b91c1c] py-7 px-6 md:px-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                        <div className="relative">
                        {heroPhoto ? (
                            <img src={heroPhoto} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-white/30" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                                <User className="w-8 h-8 text-white" />
                            </div>
                        )}
                            <button
                                type="button"
                                onClick={() => photoInputRef.current?.click()}
                                disabled={uploadingPhoto}
                                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white text-[#8D0303] shadow-md border border-[#8D0303]/20 flex items-center justify-center hover:bg-rose-50 disabled:opacity-60"
                                title="Change profile photo"
                            >
                                {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                            </button>
                            <input
                                ref={photoInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoUpload}
                            />
                        </div>
                        <div className="text-white">
                            <h2 className="text-xl md:text-2xl font-bold">{profile.firstName} {profile.surname}</h2>
                            <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-1 text-white/85 text-sm">
                                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{profile.phone}</span>
                                {profile.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{profile.email}</span>}
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-white/60 text-xs">
                                <Calendar className="w-3 h-3" /> Joined {new Date(profile.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                            </div>
                        </div>
                    </div>
                        <div className="grid grid-cols-2 gap-2 text-white/90 text-xs">
                            <div className="rounded-lg bg-white/15 px-3 py-2">
                                <p className="text-[10px] uppercase tracking-wide text-white/75">Commission</p>
                                <p className="font-semibold mt-0.5">{profile.commissionType === "percentage" ? `${profile.commissionValue}%` : `₹${profile.commissionValue}`}</p>
                            </div>
                            <div className="rounded-lg bg-white/15 px-3 py-2">
                                <p className="text-[10px] uppercase tracking-wide text-white/75">Languages</p>
                                <p className="font-semibold mt-0.5">{profile.knownLanguages?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Registration Form Details */}
            {formFields.length > 0 && (
                <Card className="border-0 shadow-md rounded-2xl">
                    <CardHeader className="pb-2 px-6 pt-6">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#8D0303]" />
                            <h2 className="font-bold text-lg">Registration Details</h2>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                            {formFields.filter(field => field.label !== "Profile Photo").map(field => {
                                const value = getFieldValue(field);
                                const displayValue = value || "Not provided";

                                return (
                                    <div key={field.id} className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5">
                                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                            {field.label}
                                        </label>
                                        {field.type === "image" && isImageUrl(value) ? (
                                            <div className="w-24 h-24 rounded-lg overflow-hidden border bg-gray-50">
                                                <img src={value} alt={field.label} className="w-full h-full object-cover" />
                                            </div>
                                        ) : field.type === "file" && isFileUrl(value) ? (
                                            <div className="flex items-center justify-between gap-2 rounded-md border border-[#8D0303]/20 bg-white px-2.5 py-2">
                                                <span className="text-sm font-medium text-gray-900 truncate">{field.label}</span>
                                                <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8D0303] font-semibold hover:underline whitespace-nowrap inline-flex items-center gap-1">
                                                    <FileText className="w-3.5 h-3.5" /> View Document
                                                </a>
                                            </div>
                                        ) : field.type === "checkbox" ? (
                                            <p className="text-sm font-medium text-gray-900 px-2.5 py-1.5 rounded-md bg-white border border-gray-100 inline-block">
                                                {value === "true" || value === "on" ? "Yes" : "No"}
                                            </p>
                                        ) : (
                                            <p className="text-sm font-medium text-gray-900 bg-white rounded-md px-2.5 py-1.5 border border-gray-100 min-h-[34px] leading-5">
                                                {displayValue === "Not provided" ? <span className="text-gray-400 italic">Not provided</span> : displayValue}
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
                    <Card className="border-0 shadow-md rounded-2xl">
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
                    <Card className="border-0 shadow-md rounded-2xl">
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
            <Card className="border-0 shadow-md rounded-2xl bg-gradient-to-br from-white to-rose-50">
                <CardContent className="p-6">
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
            {/* Bank Details */}
            <Card className="border-0 shadow-md rounded-2xl">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-[#8D0303]" />
                            <h3 className="font-bold text-sm">Bank Details</h3>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs border-dashed"
                            onClick={() => {
                                setBankForm({
                                    accountHolderName: profile.bankDetails?.accountHolderName || "",
                                    accountNumber: profile.bankDetails?.accountNumber || "",
                                    bankName: profile.bankDetails?.bankName || "",
                                    ifscCode: profile.bankDetails?.ifscCode || "",
                                    mmicCode: profile.bankDetails?.mmicCode || "",
                                });
                                setOpenBankModal(true);
                            }}
                        >
                            {!profile.bankDetails || (!profile.bankDetails.accountNumber && !profile.bankDetails.ifscCode) ? (
                                <>
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Bank Details
                                </>
                            ) : (
                                <>
                                    <Edit2 className="w-3 h-3 mr-1" />
                                    Edit Details
                                </>
                            )}
                        </Button>
                    </div>

                    {!profile.bankDetails || (!profile.bankDetails.accountNumber && !profile.bankDetails.ifscCode) ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                            <p className="text-sm font-medium text-amber-800 mb-1">Missing Bank Details</p>
                            <p className="text-xs text-amber-700">Please add your bank details to receive payouts and withdrawals.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
                            {[
                                { label: "Account Holder", value: profile.bankDetails.accountHolderName },
                                { label: "Account Number", value: profile.bankDetails.accountNumber },
                                { label: "Bank Name", value: profile.bankDetails.bankName },
                                { label: "IFSC Code", value: profile.bankDetails.ifscCode },
                                { label: "MMIC Code", value: profile.bankDetails.mmicCode },
                            ].filter(f => f.value).map(f => (
                                <div key={f.label} className="rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2.5">
                                    <label className="text-xs text-muted-foreground font-medium">{f.label}</label>
                                    <p className="text-sm font-semibold text-gray-900">{f.value}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Bank Details Modal */}
            <Dialog open={openBankModal} onOpenChange={setOpenBankModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Bank Details</DialogTitle>
                        <DialogDescription>
                            Enter your bank account details for receiving payouts.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Account Holder Name <span className="text-red-500">*</span></label>
                            <Input 
                                value={bankForm.accountHolderName} 
                                onChange={(e) => setBankForm({...bankForm, accountHolderName: e.target.value})}
                                placeholder="Balachander"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Account Number <span className="text-red-500">*</span></label>
                            <Input 
                                value={bankForm.accountNumber} 
                                onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})}
                                placeholder="E.g. 123456789012"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Bank Name</label>
                            <Input 
                                value={bankForm.bankName} 
                                onChange={(e) => setBankForm({...bankForm, bankName: e.target.value})}
                                placeholder="E.g. HDFC Bank"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">IFSC Code <span className="text-red-500">*</span></label>
                                <Input 
                                    value={bankForm.ifscCode} 
                                    onChange={(e) => setBankForm({...bankForm, ifscCode: e.target.value.toUpperCase()})}
                                    placeholder="E.g. HDFC0001234"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">MMIC Code (Optional)</label>
                                <Input 
                                    value={bankForm.mmicCode} 
                                    onChange={(e) => setBankForm({...bankForm, mmicCode: e.target.value})}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenBankModal(false)}>Cancel</Button>
                        <Button 
                            className="bg-[#8D0303] hover:bg-[#6d0202] text-white"
                            onClick={handleSaveBankDetails} 
                            disabled={!bankForm.accountHolderName || !bankForm.accountNumber || !bankForm.ifscCode || saving}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Details
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Crop Profile Photo Modal */}
            <Dialog open={cropModalOpen} onOpenChange={(open) => { if (!open) closeCropModal(); }}>
                <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden bg-zinc-900 border-zinc-800 text-white z-[200]">
                    <DialogHeader className="p-4 border-b border-zinc-800">
                        <DialogTitle>Crop Profile Photo</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Move and zoom the image to set your profile photo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative w-full h-[380px] bg-black">
                        {cropImageSrc && (
                            <Cropper
                                image={cropImageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        )}
                    </div>

                    <div className="p-4 bg-zinc-900 border-t border-zinc-800 space-y-4">
                        <div className="flex items-center gap-4">
                            <Label className="w-16 text-zinc-300">Zoom</Label>
                            <Slider
                                value={[zoom]}
                                min={1}
                                max={3}
                                step={0.1}
                                onValueChange={(vals: number[]) => setZoom(vals[0])}
                                className="flex-1"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeCropModal} className="border-zinc-700 bg-transparent text-white hover:bg-zinc-800 hover:text-white">
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSaveCroppedPhoto}
                                disabled={uploadingPhoto}
                                className="bg-[#8D0303] hover:bg-[#6d0202] text-white"
                            >
                                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Save Photo
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Documents */}
            {profile.documents && profile.documents.length > 0 && (
                <Card className="border-0 shadow-md rounded-2xl">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-4 h-4 text-[#8D0303]" />
                            <h3 className="font-bold text-sm">Documents</h3>
                        </div>
                        <div className="space-y-2">
                            {profile.documents.map((doc, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100">
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
