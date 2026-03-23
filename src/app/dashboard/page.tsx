"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import Link from "next/link";
import {
    ShoppingBag,
    ShoppingCart,
    IndianRupee,
    Wallet,
    Loader2,
    Plus,
    Eye,
    ArrowRight,
    Percent,
    TrendingUp,
} from "lucide-react";

interface Stats {
    totalOrders: number;
    pendingOrders: number;
    acceptedOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    totalRevenue: number;
    totalCommission: number;
    netEarnings: number;
    monthlyRevenue: number;
    monthlyCommission: number;
    monthlyEarnings: number;
}

interface Order {
    _id: string;
    orderId: string;
    kit: { title: string; image: string };
    user: { name: string };
    totalAmount: number;
    vendorStatus: string;
    status: string;
    createdAt: string;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [productCount, setProductCount] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, ordersRes, productsRes] = await Promise.all([
                    api.get("/vendor/orders/stats"),
                    api.get("/vendor/orders?limit=5"),
                    api.get("/vendor/products?limit=1"),
                ]);
                setStats(statsRes.data.stats);
                setRecentOrders(ordersRes.data.orders || []);
                setProductCount(productsRes.data.pagination?.total || 0);
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" />
            </div>
        );
    }

    const statCards = [
        { label: "Total Products", value: productCount, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Active Orders", value: stats?.pendingOrders || 0, icon: ShoppingCart, color: "text-orange-600", bg: "bg-orange-50" },
        { label: "This Month Earnings", value: `₹${(stats?.monthlyEarnings || 0).toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Total Net Earnings", value: `₹${(stats?.netEarnings || 0).toLocaleString()}`, icon: Wallet, color: "text-purple-600", bg: "bg-purple-50" },
    ];

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Welcome back! Here&apos;s your overview.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <Card key={card.label} className="border shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg ${card.bg} ${card.color}`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-black">{card.value}</div>
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{card.label}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Earnings Breakdown Card */}
            <Card className="border shadow-sm">
                <CardContent className="p-4">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-[#8D0303]" /> Earnings Summary
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* This Month */}
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
                            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">This Month</div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Total Sales</span>
                                    <span className="font-bold">₹{(stats?.monthlyRevenue || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Percent className="w-3 h-3" /> Platform Fee
                                    </span>
                                    <span className="font-semibold text-red-600">- ₹{(stats?.monthlyCommission || 0).toLocaleString()}</span>
                                </div>
                                <div className="border-t border-emerald-200 pt-2 flex justify-between items-center">
                                    <span className="text-sm font-semibold">Your Earnings</span>
                                    <span className="font-black text-xl text-emerald-600">₹{(stats?.monthlyEarnings || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* All Time */}
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                            <div className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-3">All Time</div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Total Sales</span>
                                    <span className="font-bold">₹{(stats?.totalRevenue || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Percent className="w-3 h-3" /> Platform Fee
                                    </span>
                                    <span className="font-semibold text-red-600">- ₹{(stats?.totalCommission || 0).toLocaleString()}</span>
                                </div>
                                <div className="border-t border-purple-200 pt-2 flex justify-between items-center">
                                    <span className="text-sm font-semibold">Net Earnings</span>
                                    <span className="font-black text-xl text-purple-600">₹{(stats?.netEarnings || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-3">
                <Link href="/dashboard/products/new">
                    <Button size="sm" className="bg-[#8D0303] hover:bg-[#700202] text-white">
                        <Plus className="w-4 h-4 mr-1.5" /> Add Product
                    </Button>
                </Link>
                <Link href="/dashboard/orders">
                    <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1.5" /> View Orders
                    </Button>
                </Link>
            </div>

            <Card className="border shadow-sm">
                <CardContent className="p-0">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h2 className="font-bold text-lg">Recent Orders</h2>
                        <Link href="/dashboard/orders" className="text-sm text-[#8D0303] font-medium flex items-center gap-1 hover:underline">
                            View All <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    {recentOrders.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No orders yet</div>
                    ) : (
                        <div className="divide-y">
                            {recentOrders.map((order) => (
                                <Link key={order._id} href={`/dashboard/orders/${order._id}`} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <div className="font-semibold text-sm">{order.orderId}</div>
                                            <div className="text-xs text-muted-foreground">{order.kit?.title}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-sm">₹{order.totalAmount}</div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${getStatusColor(order.vendorStatus)}`}>
                                            {order.vendorStatus}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
