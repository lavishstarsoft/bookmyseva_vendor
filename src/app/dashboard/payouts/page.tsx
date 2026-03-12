"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/axios";
import { Loader2, Wallet, IndianRupee, Clock } from "lucide-react";
import { toast } from "sonner";

interface Summary {
    totalEarnings: number;
    totalCount: number;
    pendingAmount: number;
    pendingCount: number;
    paidAmount: number;
    paidCount: number;
}

interface Payout {
    _id: string;
    orderId: { orderId: string; totalAmount: number; kit: { title: string } };
    orderAmount: number;
    commissionPercent: number;
    commissionAmount: number;
    vendorAmount: number;
    status: string;
    paidAt: string;
    createdAt: string;
}

export default function PayoutsPage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, payoutsRes] = await Promise.all([
                    api.get("/vendor/payouts/summary"),
                    api.get("/vendor/payouts"),
                ]);
                setSummary(summaryRes.data.summary);
                setPayouts(payoutsRes.data.payouts || []);
            } catch {
                toast.error("Failed to load payouts");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-800",
            processing: "bg-blue-100 text-blue-800",
            paid: "bg-green-100 text-green-800",
            failed: "bg-red-100 text-red-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" /></div>;

    return (
        <div className="space-y-6 pb-8">
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border -mx-6 px-6 py-4 mb-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                    <span>Dashboard</span><span>/</span>
                    <span className="text-[#8D0303] font-medium">Payouts</span>
                </div>
                <h1 className="text-xl font-bold">Payouts & Earnings</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                            <IndianRupee className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black">₹{summary?.totalEarnings || 0}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Earnings</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-yellow-50 text-yellow-600">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black">₹{summary?.pendingAmount || 0}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pending ({summary?.pendingCount || 0})</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-green-50 text-green-600">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black">₹{summary?.paidAmount || 0}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Paid ({summary?.paidCount || 0})</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border shadow-sm">
                <CardContent className="p-0">
                    <div className="p-4 border-b"><h2 className="font-bold text-lg">Payout History</h2></div>
                    {payouts.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No payouts yet. Payouts are generated when orders are delivered.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="text-left p-3 font-semibold">Order</th>
                                        <th className="text-left p-3 font-semibold">Amount</th>
                                        <th className="text-left p-3 font-semibold">Commission</th>
                                        <th className="text-left p-3 font-semibold">Your Earnings</th>
                                        <th className="text-left p-3 font-semibold">Status</th>
                                        <th className="text-left p-3 font-semibold">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payouts.map((payout) => (
                                        <tr key={payout._id} className="border-b hover:bg-muted/20">
                                            <td className="p-3">
                                                <div className="font-medium">{payout.orderId?.orderId || "—"}</div>
                                                <div className="text-xs text-muted-foreground">{payout.orderId?.kit?.title || ""}</div>
                                            </td>
                                            <td className="p-3">₹{payout.orderAmount}</td>
                                            <td className="p-3 text-muted-foreground">{payout.commissionPercent}% (₹{payout.commissionAmount})</td>
                                            <td className="p-3 font-bold">₹{payout.vendorAmount}</td>
                                            <td className="p-3">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${getStatusColor(payout.status)}`}>
                                                    {payout.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-muted-foreground">{new Date(payout.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
