"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/axios";
import { Loader2, Wallet, IndianRupee, Clock, ArrowUpRight, X, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Summary {
    totalEarnings: number;
    totalCount: number;
    pendingAmount: number;
    pendingCount: number;
    paidAmount: number;
    paidCount: number;
    withdrawnAmount: number;
    pendingWithdrawalAmount: number;
    availableForWithdrawal: number;
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

interface WithdrawalRequest {
    _id: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    bankDetails: {
        accountHolderName: string;
        accountNumber: string;
        bankName: string;
        ifscCode: string;
    };
    requestedAt: string;
    processedAt?: string;
    transactionRef?: string;
    remarks?: string;
}

export default function PayoutsPage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("earnings");
    const router = useRouter();

    const fetchData = useCallback(async () => {
        try {
            const [summaryRes, payoutsRes, withdrawalsRes] = await Promise.all([
                api.get("/vendor/payouts/summary"),
                api.get("/vendor/payouts"),
                api.get("/vendor/payouts/withdrawals"),
            ]);
            setSummary(summaryRes.data.summary);
            setPayouts(payoutsRes.data.payouts || []);
            setWithdrawals(withdrawalsRes.data.withdrawals || []);
        } catch {
            toast.error("Failed to load payouts");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);
        if (!amount || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        if (summary && amount > summary.availableForWithdrawal) {
            toast.error("Amount exceeds available balance");
            return;
        }
        if (amount < 100) {
            toast.error("Minimum withdrawal amount is ₹100");
            return;
        }

        setWithdrawing(true);
        try {
            await api.post("/vendor/payouts/withdraw", { amount });
            toast.success("Withdrawal request submitted successfully!");
            setWithdrawModalOpen(false);
            setWithdrawAmount("");
            fetchData();
        } catch (error: any) {
            const err = error as { response?: { data?: { message?: string } } };
            const errorMsg = err.response?.data?.message || "Failed to submit withdrawal request";
            
            if (errorMsg.includes("bank details")) {
                toast.error(errorMsg, {
                    action: {
                        label: "Add Bank Details",
                        onClick: () => router.push("/dashboard/profile")
                    }
                });
            } else {
                toast.error(errorMsg);
            }
        } finally {
            setWithdrawing(false);
        }
    };

    const handleCancelWithdrawal = async (id: string) => {
        setCancellingId(id);
        try {
            await api.delete(`/vendor/payouts/withdrawals/${id}`);
            toast.success("Withdrawal request cancelled");
            fetchData();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Failed to cancel withdrawal");
        } finally {
            setCancellingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-800",
            processing: "bg-blue-100 text-blue-800",
            paid: "bg-green-100 text-green-800",
            failed: "bg-red-100 text-red-800",
            approved: "bg-blue-100 text-blue-800",
            rejected: "bg-red-100 text-red-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid':
            case 'approved':
                return <CheckCircle className="w-3.5 h-3.5" />;
            case 'rejected':
            case 'failed':
                return <XCircle className="w-3.5 h-3.5" />;
            default:
                return <AlertCircle className="w-3.5 h-3.5" />;
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#8D0303]" /></div>;

    return (
        <div className="space-y-6 pb-8">
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border -mx-6 px-6 py-4 mb-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                    <span>Dashboard</span><span>/</span>
                    <span className="text-[#8D0303] font-medium">Payouts</span>
                </div>
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">Payouts & Earnings</h1>
                    <Button
                        onClick={() => setWithdrawModalOpen(true)}
                        className="bg-[#8D0303] hover:bg-[#6D0202] text-white"
                        disabled={!summary || summary.availableForWithdrawal < 100}
                    >
                        <ArrowUpRight className="w-4 h-4 mr-1.5" />
                        Request Withdrawal
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Card className="border shadow-sm bg-green-50/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-green-100 text-green-600">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-green-700">₹{summary?.availableForWithdrawal || 0}</div>
                            <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Available to Withdraw</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-yellow-50 text-yellow-600">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black">₹{summary?.pendingWithdrawalAmount || 0}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pending Withdrawal</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black">₹{summary?.withdrawnAmount || 0}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Withdrawn</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="earnings" className="data-[state=active]:bg-white">
                        Earnings Ledger
                    </TabsTrigger>
                    <TabsTrigger value="withdrawals" className="data-[state=active]:bg-white">
                        Withdrawal Requests
                        {withdrawals.filter(w => w.status === 'pending').length > 0 && (
                            <span className="ml-1.5 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {withdrawals.filter(w => w.status === 'pending').length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="earnings" className="mt-4">
                    <Card className="border shadow-sm">
                        <CardContent className="p-0">
                            <div className="p-4 border-b">
                                <h2 className="font-bold text-lg">Earnings Ledger</h2>
                                <p className="text-xs text-muted-foreground mt-1">These are order-level earnings entries. Actual bank transfer happens only through approved withdrawal requests.</p>
                            </div>
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
                </TabsContent>

                <TabsContent value="withdrawals" className="mt-4">
                    <Card className="border shadow-sm">
                        <CardContent className="p-0">
                            <div className="p-4 border-b">
                                <h2 className="font-bold text-lg">Withdrawal Requests</h2>
                                <p className="text-xs text-muted-foreground mt-1">Your payout reaches bank account only when request status becomes paid.</p>
                            </div>
                            {withdrawals.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">No withdrawal requests yet.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/30">
                                                <th className="text-left p-3 font-semibold">Amount</th>
                                                <th className="text-left p-3 font-semibold">Bank Details</th>
                                                <th className="text-left p-3 font-semibold">Status</th>
                                                <th className="text-left p-3 font-semibold">Requested On</th>
                                                <th className="text-left p-3 font-semibold">Processed On</th>
                                                <th className="text-left p-3 font-semibold">Remarks</th>
                                                <th className="text-left p-3 font-semibold">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {withdrawals.map((withdrawal) => (
                                                <tr key={withdrawal._id} className="border-b hover:bg-muted/20">
                                                    <td className="p-3 font-bold text-lg">₹{withdrawal.amount}</td>
                                                    <td className="p-3">
                                                        <div className="text-xs">
                                                            <div className="font-medium">{withdrawal.bankDetails?.accountHolderName}</div>
                                                            <div className="text-muted-foreground">{withdrawal.bankDetails?.bankName}</div>
                                                            <div className="text-muted-foreground">A/C: ****{withdrawal.bankDetails?.accountNumber?.slice(-4)}</div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${getStatusColor(withdrawal.status)}`}>
                                                            {getStatusIcon(withdrawal.status)}
                                                            {withdrawal.status}
                                                        </span>
                                                        {withdrawal.transactionRef && (
                                                            <div className="text-[10px] text-muted-foreground mt-1">
                                                                Ref: {withdrawal.transactionRef}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">{new Date(withdrawal.requestedAt).toLocaleDateString()}</td>
                                                    <td className="p-3 text-muted-foreground">
                                                        {withdrawal.processedAt ? new Date(withdrawal.processedAt).toLocaleDateString() : "—"}
                                                    </td>
                                                    <td className="p-3 text-xs text-muted-foreground max-w-[150px] truncate">
                                                        {withdrawal.remarks || "—"}
                                                    </td>
                                                    <td className="p-3">
                                                        {withdrawal.status === 'pending' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleCancelWithdrawal(withdrawal._id)}
                                                                disabled={cancellingId === withdrawal._id}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                {cancellingId === withdrawal._id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <X className="w-4 h-4 mr-1" />
                                                                        Cancel
                                                                    </>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Withdrawal Modal */}
            {withdrawModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setWithdrawModalOpen(false)} />
                    <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4 z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Request Withdrawal</h2>
                            <button onClick={() => setWithdrawModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <div className="text-sm text-green-600 font-medium">Available Balance</div>
                            <div className="text-2xl font-black text-green-700">₹{summary?.availableForWithdrawal || 0}</div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Withdrawal Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                    <Input
                                        type="number"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        className="pl-7"
                                        min={100}
                                        max={summary?.availableForWithdrawal || 0}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Minimum withdrawal: ₹100</p>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setWithdrawModalOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleWithdraw}
                                    disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) < 100}
                                    className="flex-1 bg-[#8D0303] hover:bg-[#6D0202] text-white"
                                >
                                    {withdrawing ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                                    {withdrawing ? "Processing..." : "Submit Request"}
                                </Button>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground mt-4 text-center">
                            Withdrawal will be processed to your registered bank account within 2-3 business days.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
