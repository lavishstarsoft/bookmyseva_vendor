"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import Link from "next/link";
import { Search, Loader2, ShoppingCart, Check, X, Package, Truck } from "lucide-react";
import { toast } from "sonner";

interface Order {
    _id: string;
    orderId: string;
    kit: { kitId: string; title: string; image: string; category: string };
    user: { name: string; phone: string };
    totalAmount: number;
    vendorStatus: string;
    status: string;
    createdAt: string;
}

const STATUS_TABS = ["all", "pending", "accepted", "packed", "shipped"] as const;

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState<string>("all");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (search) params.search = search;
            if (tab !== "all") params.vendorStatus = tab;
            const res = await api.get("/vendor/orders", { params });
            setOrders(res.data.orders || []);
        } catch {
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, [tab]);
    useEffect(() => {
        const timer = setTimeout(() => fetchOrders(), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleAction = async (orderId: string, action: string, body?: Record<string, string>) => {
        try {
            setActionLoading(orderId);
            await api.patch(`/vendor/orders/${orderId}/${action}`, body);
            toast.success(`Order ${action}ed`);
            fetchOrders();
        } catch {
            toast.error(`Failed to ${action} order`);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-800",
            accepted: "bg-blue-100 text-blue-800",
            packed: "bg-indigo-100 text-indigo-800",
            shipped: "bg-purple-100 text-purple-800",
            delivered: "bg-green-100 text-green-800",
            rejected: "bg-red-100 text-red-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    return (
        <div className="space-y-6 pb-8">
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border -mx-6 px-6 py-4 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                            <span>Dashboard</span><span>/</span>
                            <span className="text-[#8D0303] font-medium">Orders</span>
                        </div>
                        <h1 className="text-xl font-bold">Orders</h1>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search by order ID or product..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
                </div>
            </div>

            <div className="flex gap-1 bg-muted rounded-lg p-1">
                {STATUS_TABS.map((s) => (
                    <button key={s} onClick={() => setTab(s)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${tab === s ? "bg-white shadow-sm text-gray-900" : "text-muted-foreground hover:text-gray-700"}`}>
                        {s}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" /></div>
            ) : orders.length === 0 ? (
                <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed border-border">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <h3 className="font-bold text-lg mb-1">No orders found</h3>
                    <p className="text-muted-foreground text-sm">Orders will appear here when customers order your products.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((order) => (
                        <Card key={order._id} className="border shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <Link href={`/dashboard/orders/${order._id}`} className="font-bold text-sm hover:text-[#8D0303]">{order.orderId}</Link>
                                        <p className="text-xs text-muted-foreground">{order.kit?.title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{order.user?.name} &bull; {new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">₹{order.totalAmount}</div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${getStatusColor(order.vendorStatus)}`}>
                                            {order.vendorStatus}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {order.vendorStatus === "pending" && (
                                        <>
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction(order._id, "accept")} disabled={actionLoading === order._id}>
                                                <Check className="w-3 h-3 mr-1" /> Accept
                                            </Button>
                                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => { const r = prompt("Reason for rejection?"); if (r) handleAction(order._id, "reject", { reason: r }); }} disabled={actionLoading === order._id}>
                                                <X className="w-3 h-3 mr-1" /> Reject
                                            </Button>
                                        </>
                                    )}
                                    {order.vendorStatus === "accepted" && (
                                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => handleAction(order._id, "pack")} disabled={actionLoading === order._id}>
                                            <Package className="w-3 h-3 mr-1" /> Mark Packed
                                        </Button>
                                    )}
                                    {order.vendorStatus === "packed" && (
                                        <Link href={`/dashboard/orders/${order._id}`}>
                                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                                                <Truck className="w-3 h-3 mr-1" /> Add Tracking
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
