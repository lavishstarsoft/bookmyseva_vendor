"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Loader2, Package, MoreVertical, Pencil, Trash2, Clock, CheckCircle, XCircle, TrendingUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { vendorKitsApi, Kit } from "@/api/kits";
import { toast } from "sonner";
import api from "@/lib/axios";

const statusConfig = {
    approved: { label: "Approved", icon: CheckCircle, classes: "bg-green-100 text-green-800" },
    pending: { label: "Pending", icon: Clock, classes: "bg-amber-100 text-amber-800" },
    rejected: { label: "Rejected", icon: XCircle, classes: "bg-red-100 text-red-800" },
};

function getKitStatus(kit: Kit): "approved" | "pending" | "rejected" {
    if (kit.vendorApproved) return "approved";
    if (kit.rejectionReason) return "rejected";
    return "pending";
}

const categoryLabels: Record<string, string> = {
    daily: "Daily Pooja",
    festival: "Festival",
    vratham: "Vratham",
    homam: "Homam",
    special: "Special",
};

type TabType = "all" | "approved" | "pending" | "rejected";

export default function VendorKitsPage() {
    const router = useRouter();
    const [kits, setKits] = useState<Kit[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [deleteKit, setDeleteKit] = useState<Kit | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("all");
    const [commissionType, setCommissionType] = useState("percentage");
    const [commissionValue, setCommissionValue] = useState(0);

    const fetchKits = async () => {
        try {
            const data = await vendorKitsApi.getAll();
            setKits(data);
        } catch {
            toast.error("Failed to fetch kits");
        } finally {
            setLoading(false);
        }
    };

    const fetchCommission = async () => {
        try {
            const { data } = await api.get("/vendor-auth/profile");
            if (data?.vendor) {
                setCommissionType(data.vendor.commissionType || "percentage");
                setCommissionValue(data.vendor.commissionValue || 0);
            }
        } catch { /* ignore */ }
    };

    useEffect(() => {
        fetchKits();
        fetchCommission();
    }, []);

    const handleDelete = async () => {
        if (!deleteKit?._id) return;
        setDeleting(true);
        try {
            await vendorKitsApi.delete(deleteKit._id);
            toast.success("Kit deleted successfully");
            setKits(kits.filter(k => k._id !== deleteKit._id));
        } catch {
            toast.error("Failed to delete kit");
        } finally {
            setDeleting(false);
            setDeleteKit(null);
        }
    };

    const filtered = kits.filter(kit => {
        const matchSearch = kit.title.toLowerCase().includes(search.toLowerCase()) ||
            kit.category.toLowerCase().includes(search.toLowerCase());
        if (!matchSearch) return false;
        if (activeTab === "all") return true;
        return getKitStatus(kit) === activeTab;
    });

    const stats = {
        all: kits.length,
        approved: kits.filter(k => k.vendorApproved).length,
        pending: kits.filter(k => !k.vendorApproved && !k.rejectionReason).length,
        rejected: kits.filter(k => !k.vendorApproved && !!k.rejectionReason).length,
    };

    const tabs: { key: TabType; label: string }[] = [
        { key: "all", label: "All" },
        { key: "approved", label: "Approved" },
        { key: "pending", label: "Pending" },
        { key: "rejected", label: "Rejected" },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Pooja Kits</h1>
                    <p className="text-sm text-muted-foreground">Create and manage your pooja kits</p>
                </div>
                <Link href="/dashboard/kits/new">
                    <Button className="bg-[#8D0303] hover:bg-[#700202] text-white">
                        <Plus className="w-4 h-4 mr-2" /> Add New Kit
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{stats.all}</p>
                    <p className="text-xs text-muted-foreground font-medium">Total Kits</p>
                </CardContent></Card>
                <Card className="border-green-200"><CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                    <p className="text-xs text-muted-foreground font-medium">Approved</p>
                </CardContent></Card>
                <Card className="border-amber-200"><CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                    <p className="text-xs text-muted-foreground font-medium">Pending</p>
                </CardContent></Card>
                <Card className="border-red-200"><CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                    <p className="text-xs text-muted-foreground font-medium">Rejected</p>
                </CardContent></Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-white shadow-sm text-gray-900' : 'text-muted-foreground hover:text-gray-700'}`}
                    >
                        {tab.label}
                        {stats[tab.key] > 0 && (
                            <span className={`ml-1.5 text-xs font-bold ${tab.key === "pending" && stats.pending > 0 ? "text-amber-600" : ""}`}>
                                ({stats[tab.key]})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center gap-4 mb-6 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search kits by name, category..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <TooltipProvider>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Kit Details</TableHead>
                                    <TableHead>Price (Hover details)</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-40 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Package className="h-10 w-10 text-muted-foreground/40" />
                                                <p className="text-muted-foreground">
                                                    {search ? "No kits matching your search." : "No kits found. Create your first kit!"}
                                                </p>
                                                {!search && (
                                                    <Link href="/dashboard/kits/new">
                                                        <Button size="sm" className="bg-[#8D0303] hover:bg-[#700202] text-white mt-2">
                                                            <Plus className="w-4 h-4 mr-2" /> Add New Kit
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((kit) => {
                                        const status = getKitStatus(kit);
                                        const config = statusConfig[status];
                                        return (
                                            <TableRow key={kit._id} className="hover:bg-gray-50/50 transition-colors">
                                                <TableCell>
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 shadow-xs">
                                                        <img
                                                            src={kit.image || (kit.images && kit.images.length > 0 ? kit.images[0] : "/placeholder.png")}
                                                            alt={kit.title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png" }}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-bold text-gray-900 line-clamp-1">{kit.title}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-medium tracking-wider">{categoryLabels[kit.category] || kit.category}</p>
                                                    {status === 'rejected' && kit.rejectionReason && (
                                                        <p className="text-xs text-red-600 mt-1">Reason: {kit.rejectionReason}</p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {(() => {
                                                        const price = kit.category === 'daily'
                                                            ? (kit.pricingPlans?.find(p => p.active)?.price || kit.offerPrice || kit.marketPrice || 0)
                                                            : (kit.offerPrice || kit.marketPrice || 0);

                                                        const priceNum = Number(price);
                                                        if (!priceNum || priceNum <= 0) return <span className="text-gray-400 font-medium">Price N/A</span>;

                                                        let commission = 0;
                                                        if (commissionValue > 0) {
                                                            if (commissionType === "percentage") {
                                                                commission = Math.round((priceNum * commissionValue) / 100);
                                                            } else {
                                                                commission = commissionValue;
                                                            }
                                                        }
                                                        if (commission > priceNum) commission = priceNum;
                                                        const earnings = priceNum - commission;

                                                        return (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="inline-flex items-center gap-1.5 cursor-help group">
                                                                        <span className="font-black text-[#8D0303] text-base group-hover:underline">₹{priceNum}</span>
                                                                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#8D0303]/10 group-hover:text-[#8D0303] transition-all">
                                                                            <Info className="w-3 h-3" />
                                                                        </div>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="right" className="p-4 w-64 bg-white border-2 border-gray-100 shadow-xl rounded-xl z-50">
                                                                    <div className="space-y-3">
                                                                        <div className="flex items-center font-bold text-gray-900 pb-2 border-b border-gray-100">
                                                                            <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                                                                            Earnings Breakdown
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <div className="flex items-center justify-between text-sm">
                                                                                <span className="text-gray-500">Selling Price:</span>
                                                                                <span className="font-bold text-gray-900">₹{priceNum}</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between text-sm text-red-600">
                                                                                <span className="flex items-center gap-1">
                                                                                    Commission
                                                                                    <span className="text-[10px] bg-red-50 px-1 rounded">
                                                                                        {commissionType === 'percentage' ? `${commissionValue}%` : `₹${commissionValue}`}
                                                                                    </span>
                                                                                </span>
                                                                                <span className="font-bold">- ₹{commission}</span>
                                                                            </div>
                                                                            <div className="pt-2 mt-2 border-t-2 border-[#8D0303]/10 flex items-center justify-between">
                                                                                <span className="font-bold text-green-700">Your Earnings:</span>
                                                                                <span className="text-xl font-black text-green-700">₹{earnings}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        );
                                                    })()}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes}`}>
                                                        <config.icon className="w-3 h-3 mr-1" />
                                                        {config.label}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Link href={`/dashboard/kits/edit/${kit._id}`}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                            onClick={() => setDeleteKit(kit)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TooltipProvider>
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteKit} onOpenChange={() => setDeleteKit(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Kit</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deleteKit?.title}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
