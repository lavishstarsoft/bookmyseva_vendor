"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
    ArrowLeft, 
    Calendar, 
    Clock, 
    MapPin, 
    Package, 
    Phone, 
    User, 
    Truck, 
    CreditCard,
    IndianRupee,
    Printer,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Mail,
    ClipboardList,
    Circle
} from "lucide-react";
import { toast } from "sonner";
import ShippingLabel from "../ShippingLabel";

interface OrderDetails {
    _id: string;
    orderId: string;
    kit: {
        kitId: string;
        title: string;
        image: string;
        category: string;
        price: number;
    };
    user: {
        name: string;
        email: string;
        phone: string;
    };
    quantity: number;
    totalAmount: number;
    status: string;
    vendorStatus: string;
    paymentStatus: string;
    paymentId: string;
    deliveryDate?: string;
    deliverySlot?: string;
    deliveryAddress: {
        line1: string;
        city: string;
        state: string;
        pincode: string;
    };
    notes?: string;
    createdAt: string;
    updatedAt: string;
    trackingId?: string;
    courierName?: string;
    commission?: {
        type: string;
        value: number;
        amount: number;
    };
    vendorPayout?: number;
}

export default function OrderDetailsPage({ params }: { params: Promise<{ orderId: string }> }) {
    const { orderId } = use(params);
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showLabel, setShowLabel] = useState(false);
    const [vendorProfile, setVendorProfile] = useState<{name: string, address: string, phone: string} | null>(null);

    // Fetch vendor profile for shipping label
    useEffect(() => {
        api.get("/vendor-auth/profile").then(res => {
            const v = res.data.vendor;
            setVendorProfile({
                name: `${v.firstName} ${v.surname}`,
                address: `${v.fullAddress}, ${v.state} - ${v.pincode}`,
                phone: v.phone
            });
        }).catch(() => console.error("Failed to load vendor profile"));
    }, []);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/vendor/orders/${orderId}`);
            setOrder(res.data.order);
        } catch (error) {
            toast.error("Failed to fetch order details");
            router.push("/dashboard/orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    const handleAction = async (action: string, body?: any) => {
        try {
            setActionLoading(true);
            await api.patch(`/vendor/orders/${orderId}/${action}`, body);
            toast.success(`Order ${action === 'pack' ? 'packed' : action} successfully`);
            fetchOrder();
        } catch (error) {
            toast.error(`Failed to ${action} order`);
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
            accepted: "bg-blue-100 text-blue-800 border-blue-200",
            packed: "bg-indigo-100 text-indigo-800 border-indigo-200",
            shipped: "bg-purple-100 text-purple-800 border-purple-200",
            delivered: "bg-green-100 text-green-800 border-green-200",
            rejected: "bg-red-100 text-red-800 border-red-200",
            cancelled: "bg-red-100 text-red-800 border-red-200",
        };
        return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-pulse text-[#8D0303] font-medium">Loading order details...</div>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border -mx-6 px-6 py-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/orders")}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <span>Orders</span>
                        <span>/</span>
                        <span className="text-[#8D0303] font-medium">{order.orderId}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold">Order Details</h1>
                        <Badge variant="outline" className={getStatusColor(order.vendorStatus)}>
                            {order.vendorStatus.toUpperCase()}
                        </Badge>
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                    {order.vendorStatus !== 'rejected' && order.vendorStatus !== 'cancelled' && (
                        <Button variant="outline" size="sm" onClick={() => setShowLabel(true)}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print Label
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="md:col-span-2 space-y-6">
                    {/* Order Items */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Package className="w-4 h-4 text-[#8D0303]" />
                                Order Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4">
                                <div className="h-24 w-24 bg-muted rounded-md overflow-hidden shrink-0">
                                    {order.kit.image ? (
                                        <img src={order.kit.image} alt={order.kit.title} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                                            <Package className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{order.kit.title}</h3>
                                    <p className="text-sm text-muted-foreground mb-2">{order.kit.category}</p>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="bg-muted px-2 py-1 rounded">
                                            Qty: <span className="font-bold">{order.quantity}</span>
                                        </div>
                                        <div className="font-bold text-lg">
                                            ₹{order.totalAmount.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery Details */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Truck className="w-4 h-4 text-[#8D0303]" />
                                Delivery Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Delivery Address</div>
                                    <div className="font-medium">{order.deliveryAddress.line1}</div>
                                    <div>{order.deliveryAddress.city}, {order.deliveryAddress.state}</div>
                                    <div className="font-bold">{order.deliveryAddress.pincode}</div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Scheduled Date</div>
                                        <div className="flex items-center gap-2 font-medium">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString(undefined, {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : 'Not Scheduled'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Time Slot</div>
                                        <div className="flex items-center gap-2 font-medium">
                                            <Clock className="w-4 h-4 text-gray-500" />
                                            {order.deliverySlot || 'Standard Delivery'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tracking Info */}
                            {order.vendorStatus === 'shipped' || order.vendorStatus === 'delivered' ? (
                                <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-dashed">
                                    <h4 className="text-sm font-semibold mb-2">Tracking Details</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Courier:</span>
                                            <span className="ml-2 font-medium">{order.courierName || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Tracking ID:</span>
                                            <span className="ml-2 font-medium font-mono">{order.trackingId || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    {/* Customer Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <User className="w-4 h-4 text-[#8D0303]" />
                                Customer Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 shrink-0">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Name</div>
                                        <div className="font-medium">{order.user.name}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Phone</div>
                                        <div className="font-medium">{order.user.phone}</div>
                                    </div>
                                </div>
                                {order.user.email && (
                                    <div className="flex items-start gap-3 sm:col-span-2">
                                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 shrink-0">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground">Email</div>
                                            <div className="font-medium">{order.user.email}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {order.notes && (
                                <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm border border-yellow-100">
                                    <span className="font-bold block mb-1">Customer Notes:</span>
                                    {order.notes}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Status & Payment */}
                <div className="space-y-6">
                    {/* Order Visual Timeline */}
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-[#8D0303]" />
                                Order Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="relative pl-2">
                                {['pending', 'accepted', 'packed', 'shipped', 'delivered'].map((step, index, arr) => {
                                    const stepsOrder = ['pending', 'accepted', 'packed', 'shipped', 'delivered'];
                                    const currentStatus = order.vendorStatus;
                                    const isRejectedOrCancelled = ['rejected', 'cancelled'].includes(currentStatus);
                                    
                                    // If rejected/cancelled, we consider the process stopped at pending (index 0)
                                    // or wherever it was. But usually it stops. 
                                    // For simplicity: if rejected, show only 'pending' as completed.
                                    let statusIndex = stepsOrder.indexOf(currentStatus);
                                    if (statusIndex === -1 && isRejectedOrCancelled) {
                                        statusIndex = 0; 
                                    }

                                    const isCompleted = index <= statusIndex;
                                    const isCurrent = index === statusIndex;
                                    const isLast = index === arr.length - 1;
                                    
                                    return (
                                        <div key={step} className={`relative pl-8 pb-8 ${isLast ? '' : 'border-l-2'} ${isCompleted && !isLast ? 'border-[#8D0303]' : 'border-gray-100'}`}>
                                            <span className={`absolute -left-[9px] top-0 p-1.5 rounded-full border-2 bg-white ${isCompleted ? 'border-[#8D0303] text-[#8D0303]' : 'border-gray-200 text-gray-300'}`}>
                                                <CheckCircle2 className="w-3 h-3" />
                                            </span>
                                            <div className={`text-sm font-semibold capitalize ${isCompleted ? 'text-gray-900' : 'text-muted-foreground'}`}>
                                                {step === 'pending' ? 'Order Placed' : step}
                                            </div>
                                            {isCurrent && !isRejectedOrCancelled && (
                                                <div className="text-xs text-[#8D0303] font-medium mt-0.5">
                                                    Current Stage
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Actions */}
                    <Card className="border-l-4 border-l-[#8D0303]">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Order Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {order.vendorStatus === 'pending' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <Button 
                                        className="bg-green-600 hover:bg-green-700 text-white w-full" 
                                        onClick={() => handleAction('accept')}
                                        disabled={actionLoading}
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Accept
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="text-red-600 border-red-200 hover:bg-red-50 w-full"
                                        onClick={() => {
                                            const reason = prompt("Please provide a reason for rejection:");
                                            if (reason) handleAction('reject', { reason });
                                        }}
                                        disabled={actionLoading}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" /> Reject
                                    </Button>
                                </div>
                            )}

                            {order.vendorStatus === 'accepted' && (
                                <Button 
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={() => handleAction('pack')}
                                    disabled={actionLoading}
                                >
                                    <Package className="w-4 h-4 mr-2" /> Mark as Packed
                                </Button>
                            )}

                            {order.vendorStatus === 'packed' && (
                                <div className="space-y-3">
                                    <Button 
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                        onClick={() => {
                                            const courier = prompt("Enter Courier Name:");
                                            const tracking = prompt("Enter Tracking ID:");
                                            if (courier && tracking) {
                                                handleAction('ship', { courierName: courier, trackingId: tracking });
                                            }
                                        }}
                                        disabled={actionLoading}
                                    >
                                        <Truck className="w-4 h-4 mr-2" /> Mark as Shipped
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center">
                                        You'll need to provide courier details to update status to shipped.
                                    </p>
                                </div>
                            )}

                            {(order.vendorStatus === 'shipped' || order.vendorStatus === 'delivered') && (
                                <div className="p-3 bg-green-50 text-center rounded-lg border border-green-100">
                                    <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                    <div className="font-medium text-green-800">
                                        {order.vendorStatus === 'delivered' ? 'Order Completed' : 'Order Shipped'}
                                    </div>
                                    <div className="text-xs text-green-600 mt-1">
                                        No further actions required currently.
                                    </div>
                                </div>
                            )}

                            {order.vendorStatus === 'rejected' && (
                                <div className="p-3 bg-red-50 text-center rounded-lg border border-red-100">
                                    <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                                    <div className="font-medium text-red-800">Order Rejected</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-[#8D0303]" />
                                Payment & Earnings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'} className={order.paymentStatus === 'paid' ? "bg-green-600" : ""}>
                                    {order.paymentStatus.toUpperCase()}
                                </Badge>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Total Order Value</span>
                                    <span className="font-bold">₹{order.totalAmount.toLocaleString()}</span>
                                </div>
                                {order.commission && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Platform Fee ({order.commission.type === 'percentage' ? `${order.commission.value}%` : 'Fixed'})</span>
                                        <span className="text-red-600 font-medium">- ₹{order.commission.amount.toLocaleString()}</span>
                                    </div>
                                )}
                                <Separator className="my-2" />
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-700">Your Earnings</span>
                                    <span className="font-black text-xl text-green-600">
                                        ₹{order.vendorPayout?.toLocaleString() || (order.totalAmount - (order.commission?.amount || 0)).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Print Label Modal */}
            {showLabel && vendorProfile && (
                <ShippingLabel 
                    order={order} 
                    vendor={vendorProfile} 
                    onClose={() => setShowLabel(false)} 
                />
            )}
        </div>
    );
}
