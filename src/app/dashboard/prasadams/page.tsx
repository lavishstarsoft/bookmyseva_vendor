"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Loader2, Cookie, Pencil, Trash2, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
import { vendorPrasadamsApi, VendorPrasadam } from "@/api/prasadams";
import { toast } from "sonner";

type TabType = "all" | "approved" | "pending" | "rejected";

function getStatus(prasadam: VendorPrasadam): TabType {
    if (prasadam.vendorApproved) return "approved";
    if (prasadam.rejectionReason) return "rejected";
    return "pending";
}

const statusConfig = {
    approved: { label: "Approved", icon: CheckCircle, classes: "bg-green-100 text-green-800" },
    pending: { label: "Pending", icon: Clock, classes: "bg-amber-100 text-amber-800" },
    rejected: { label: "Rejected", icon: XCircle, classes: "bg-red-100 text-red-800" },
};

export default function VendorPrasadamsPage() {
    const [prasadams, setPrasadams] = useState<VendorPrasadam[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<TabType>("all");
    const [deleteItem, setDeleteItem] = useState<VendorPrasadam | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchPrasadams = async () => {
        try {
            const data = await vendorPrasadamsApi.getAll();
            setPrasadams(data);
        } catch {
            toast.error("Failed to fetch prasadams");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrasadams();
    }, []);

    const handleDelete = async () => {
        if (!deleteItem?._id) return;
        setDeleting(true);
        try {
            await vendorPrasadamsApi.delete(deleteItem._id);
            toast.success("Prasadam deleted successfully");
            setPrasadams((prev) => prev.filter((p) => p._id !== deleteItem._id));
        } catch {
            toast.error("Failed to delete prasadam");
        } finally {
            setDeleting(false);
            setDeleteItem(null);
        }
    };

    const filtered = prasadams.filter((p) => {
        const term = search.toLowerCase();
        const matchSearch =
            p.title?.toLowerCase().includes(term) ||
            p.category?.toLowerCase().includes(term);
        if (!matchSearch) return false;
        if (activeTab === "all") return true;
        return getStatus(p) === activeTab;
    });

    const stats = {
        all: prasadams.length,
        approved: prasadams.filter((p) => p.vendorApproved).length,
        pending: prasadams.filter((p) => !p.vendorApproved && !p.rejectionReason).length,
        rejected: prasadams.filter((p) => !p.vendorApproved && !!p.rejectionReason).length,
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Prasadams</h1>
                    <p className="text-sm text-muted-foreground">Create and manage your prasadams</p>
                </div>
                <Link href="/dashboard/prasadams/new">
                    <Button className="bg-[#8D0303] hover:bg-[#700202] text-white">
                        <Plus className="w-4 h-4 mr-2" /> Add New Prasadam
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.all}</p><p className="text-xs text-muted-foreground font-medium">Total</p></CardContent></Card>
                <Card className="border-green-200"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats.approved}</p><p className="text-xs text-muted-foreground font-medium">Approved</p></CardContent></Card>
                <Card className="border-amber-200"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{stats.pending}</p><p className="text-xs text-muted-foreground font-medium">Pending</p></CardContent></Card>
                <Card className="border-red-200"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{stats.rejected}</p><p className="text-xs text-muted-foreground font-medium">Rejected</p></CardContent></Card>
            </div>

            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.key ? "bg-white shadow-sm text-gray-900" : "text-muted-foreground hover:text-gray-700"}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center gap-4 mb-6 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search prasadams..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead>Prasadam</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                                        No prasadams found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((item) => {
                                    const status = getStatus(item);
                                    const conf = statusConfig[status];
                                    return (
                                        <TableRow key={item._id}>
                                            <TableCell>
                                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 shadow-xs bg-muted flex items-center justify-center">
                                                    {item.image || item.images?.[0] ? (
                                                        <img
                                                            src={item.image || item.images?.[0]}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
                                                        />
                                                    ) : (
                                                        <Cookie className="w-5 h-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-bold text-gray-900 line-clamp-1">{item.title}</p>
                                                <p className="text-[11px] text-gray-500 uppercase font-medium">{item.category}</p>
                                                {status === "rejected" && item.rejectionReason && (
                                                    <p className="text-xs text-red-600 mt-1">Reason: {item.rejectionReason}</p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-semibold text-[#8D0303]">Rs {Number(item.basePrice || 0)}</p>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${conf.classes}`}>
                                                    <conf.icon className="w-3 h-3 mr-1" />
                                                    {conf.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Link href={`/dashboard/prasadams/edit/${item._id}`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                        onClick={() => setDeleteItem(item)}
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
            </div>

            <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Prasadam</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteItem?.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
                            {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
