"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { Loader2, ArrowLeft, Check, X, Package, Truck, MapPin } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Order {
    _id: string;
    orderId: string;
    kit: { kitId: string; title: string; image: string; category: string };
    user: { userId: string; name: string; email: string; phone: string };
    plan: { label: string; price: number };
    quantity: number;
    totalAmount: number;
    deliveryDate: string;
    deliverySlot: string;
    deliveryAddress: { line1: string; city: string; state: string; pincode: string };
    vendorStatus: string;
    status: string;
    trackingId: string;
    courierName: string;
    cancellationReason: string;
    createdAt: string;
}

const STEPS = ["pending", "accepted", "packed", "shipped", "delivered"];

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [trackingId, setTrackingId] = useState("");
    const [courierName, setCourierName] = useState("");

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await api.get(`/vendor/orders/${id}`);
                setOrder(res.data.order);
            } catch {
                toast.error("Failed to load order");
                router.push("/dashboard/orders");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    const handleAction = async (action: string, body?: Record<string, string>) => {
        try {
            setActionLoading(true);
            await api.patch(`/vendor/orders/${id}/${action}`, body);
            toast.success(`Order ${action}ed`);
            const res = await api.get(`/vendor/orders/${id}`);
            setOrder(res.data.order);
        } catch {
            toast.error(`Failed to ${action} order`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleShip = async () => {
        if (!trackingId.trim() || !courierName.trim()) { toast.error("Tracking ID and courier name are required"); return; }
        await handleAction("ship", { trackingId, courierName });
    };

    const getStepStatus = (step: string) => {
        if (!order) return "pending";
        const currentIdx = STEPS.indexOf(order.vendorStatus === "rejected" ? "pending" : order.vendorStatus);
        const stepIdx = STEPS.indexOf(step);
        if (stepIdx < currentIdx) return "completed";
        if (stepIdx === currentIdx) return "current";
        return "upcoming";
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" /></div>;
    if (!order) return null;

    return (
        <div className="space-y-6 pb-8 max-w-3xl">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/orders"><Button size="sm" variant="ghost"><ArrowLeft className="w-4 h-4" /></Button></Link>
                <div>
                    <div className="text-xs text-muted-foreground">Orders / <span className="text-[#8D0303] font-medium">{order.orderId}</span></div>
                    <h1 className="text-xl font-bold">Order Details</h1>
                </div>
            </div>

            {/* Status Timeline */}
            <Card className="border shadow-sm">
                <CardContent className="p-4">
                    <h3 className="font-bold mb-4">Order Progress</h3>
                    {order.vendorStatus === "rejected" ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800 font-semibold">Order Rejected</p>
                            {order.cancellationReason && <p className="text-red-600 text-sm mt-1">Reason: {order.cancellationReason}</p>}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {STEPS.map((step, i) => {
                                const s = getStepStatus(step);
                                return (
                                    <div key={step} className="flex items-center flex-1">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${s === "completed" ? "bg-green-500 text-white" : s === "current" ? "bg-[#8D0303] text-white" : "bg-gray-200 text-gray-500"}`}>
                                            {s === "completed" ? <Check className="w-4 h-4" /> : i + 1}
                                        </div>
                                        {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-1 ${s === "completed" ? "bg-green-500" : "bg-gray-200"}`} />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="flex justify-between mt-2">
                        {STEPS.map(step => <span key={step} className="text-[10px] text-muted-foreground capitalize">{step}</span>)}
                    </div>
                </CardContent>
            </Card>

            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border shadow-sm">
                    <CardContent className="p-4">
                        <h3 className="font-bold mb-3">Product</h3>
                        <p className="font-semibold">{order.kit?.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{order.kit?.category}</p>
                        <p className="text-sm mt-2">Plan: {order.plan?.label} &bull; Qty: {order.quantity}</p>
                        <p className="text-lg font-black mt-1">₹{order.totalAmount}</p>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="p-4">
                        <h3 className="font-bold mb-3">Customer</h3>
                        <p className="font-semibold">{order.user?.name}</p>
                        <p className="text-sm text-muted-foreground">{order.user?.email}</p>
                        <p className="text-sm text-muted-foreground">{order.user?.phone}</p>
                        {order.deliveryAddress && (
                            <div className="mt-3 flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                <p className="text-sm text-muted-foreground">
                                    {order.deliveryAddress.line1}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            {order.vendorStatus === "pending" && (
                <div className="flex gap-3">
                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction("accept")} disabled={actionLoading}>
                        <Check className="w-4 h-4 mr-2" /> Accept Order
                    </Button>
                    <Button variant="outline" className="text-red-600" onClick={() => { const r = prompt("Reason?"); if (r) handleAction("reject", { reason: r }); }} disabled={actionLoading}>
                        <X className="w-4 h-4 mr-2" /> Reject Order
                    </Button>
                </div>
            )}
            {order.vendorStatus === "accepted" && (
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => handleAction("pack")} disabled={actionLoading}>
                    <Package className="w-4 h-4 mr-2" /> Mark as Packed
                </Button>
            )}
            {order.vendorStatus === "packed" && (
                <Card className="border shadow-sm">
                    <CardContent className="p-4 space-y-3">
                        <h3 className="font-bold">Ship Order</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label>Tracking ID *</Label><Input value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder="e.g. DTDC123456" className="mt-1" /></div>
                            <div><Label>Courier Name *</Label><Input value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="e.g. DTDC" className="mt-1" /></div>
                        </div>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleShip} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <Truck className="w-4 h-4 mr-2" /> Ship Order
                        </Button>
                    </CardContent>
                </Card>
            )}
            {order.vendorStatus === "shipped" && order.trackingId && (
                <Card className="border shadow-sm bg-purple-50">
                    <CardContent className="p-4">
                        <h3 className="font-bold mb-2">Shipping Info</h3>
                        <p className="text-sm"><strong>Courier:</strong> {order.courierName}</p>
                        <p className="text-sm"><strong>Tracking ID:</strong> {order.trackingId}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
