"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, X, Save, Loader2, Trash2, ImagePlus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { vendorKitsApi, Kit, KitDeliveryConfig } from "@/api/kits";
import { toast } from "sonner";
import { MultiImageUpload } from "@/components/ui/image-upload";
import { Star, Package, Clock, CalendarDays, IndianRupee, TrendingUp, ArrowRight } from "lucide-react";
import api from "@/lib/axios";

const SLOT_SUGGESTIONS = [
    { id: "morning", label: "8 AM – 11 AM" },
    { id: "midday", label: "11 AM – 2 PM" },
    { id: "afternoon", label: "2 PM – 5 PM" },
    { id: "evening", label: "5 PM – 8 PM" },
];

const PLAN_SUGGESTIONS = [
    { id: "one-time", label: "One-Time Purchase", badge: "" },
    { id: "weekly", label: "Weekly", badge: "" },
    { id: "monthly", label: "Monthly", badge: "Popular" },
    { id: "quarterly", label: "Quarterly", badge: "Save 10%" },
    { id: "half-yearly", label: "Half-Yearly", badge: "Save 15%" },
    { id: "yearly", label: "Yearly", badge: "Best Value" },
    { id: "offer", label: "Special Offer", badge: "Limited" },
];

export default function EditKitPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [title, setTitle] = useState("");
    const [shortDescription, setShortDescription] = useState("");
    const [category, setCategory] = useState("daily");
    const [images, setImages] = useState<string[]>([]);
    const [marketPrice, setMarketPrice] = useState("");
    const [offerPrice, setOfferPrice] = useState("");
    const [items, setItems] = useState<{ id: number; text: string }[]>([]);
    const [newItem, setNewItem] = useState("");
    const [wasApproved, setWasApproved] = useState(false);
    const [commissionType, setCommissionType] = useState("percentage");
    const [commissionValue, setCommissionValue] = useState(0);

    const [pricingPlans, setPricingPlans] = useState<
        { id: string; label: string; price: string; active: boolean; badge: string }[]
    >([]);
    const [showAddPlan, setShowAddPlan] = useState(false);
    const [newPlanLabel, setNewPlanLabel] = useState("");
    const [newPlanBadge, setNewPlanBadge] = useState("");

    const [deliveryConfig, setDeliveryConfig] = useState<KitDeliveryConfig>({
        timeSlots: [], leadDays: 0, maxAdvanceDays: 30,
    });

    // Load kit data
    useEffect(() => {
        const loadKit = async () => {
            try {
                const kit = await vendorKitsApi.getById(id);
                setTitle(kit.title || "");
                setShortDescription(kit.shortDescription || "");
                setCategory(kit.category || "daily");
                setImages(kit.images || (kit.image ? [kit.image] : []));
                setMarketPrice(kit.marketPrice ? String(kit.marketPrice) : "");
                setOfferPrice(kit.offerPrice ? String(kit.offerPrice) : "");
                setItems(kit.itemsIncluded || []);
                setWasApproved(!!kit.vendorApproved);
                if (kit.pricingPlans) {
                    setPricingPlans(kit.pricingPlans.map(p => ({ ...p, price: String(p.price) })));
                }
                if (kit.deliveryConfig) setDeliveryConfig(kit.deliveryConfig);
            } catch {
                toast.error("Failed to load kit");
                router.push("/dashboard/kits");
            } finally {
                setFetching(false);
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
        loadKit();
        fetchCommission();
    }, [id, router]);

    const addTimeSlot = (slotId: string, label: string) => {
        if (deliveryConfig.timeSlots.some(s => s.label === label)) { toast.error(`"${label}" slot already exists`); return; }
        setDeliveryConfig(prev => ({ ...prev, timeSlots: [...prev.timeSlots, { id: slotId + '-' + Date.now(), label, active: true }] }));
    };
    const removeTimeSlot = (slotId: string) => setDeliveryConfig(prev => ({ ...prev, timeSlots: prev.timeSlots.filter(s => s.id !== slotId) }));
    const toggleTimeSlot = (slotId: string) => setDeliveryConfig(prev => ({ ...prev, timeSlots: prev.timeSlots.map(s => s.id === slotId ? { ...s, active: !s.active } : s) }));
    const updateSlotLabel = (slotId: string, label: string) => setDeliveryConfig(prev => ({ ...prev, timeSlots: prev.timeSlots.map(s => s.id === slotId ? { ...s, label } : s) }));

    const handleAddItem = () => { if (newItem.trim()) { setItems([...items, { id: Date.now(), text: newItem.trim() }]); setNewItem(""); } };
    const removeItem = (itemId: number) => setItems(items.filter(item => item.id !== itemId));

    const addPlan = (label: string, badge: string) => { setPricingPlans([...pricingPlans, { id: label.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(), label, price: "", active: true, badge }]); setNewPlanLabel(""); setNewPlanBadge(""); setShowAddPlan(false); };
    const addSuggestedPlan = (suggestion: typeof PLAN_SUGGESTIONS[0]) => { if (pricingPlans.some(p => p.label === suggestion.label)) { toast.error(`"${suggestion.label}" plan already exists`); return; } setPricingPlans([...pricingPlans, { id: suggestion.id + '-' + Date.now(), label: suggestion.label, price: "", active: true, badge: suggestion.badge }]); };
    const removePlan = (planId: string) => setPricingPlans(pricingPlans.filter(p => p.id !== planId));
    const togglePlan = (planId: string) => setPricingPlans(pricingPlans.map(p => p.id === planId ? { ...p, active: !p.active } : p));
    const updatePlanPrice = (planId: string, price: string) => setPricingPlans(pricingPlans.map(p => p.id === planId ? { ...p, price } : p));
    const updatePlanLabel = (planId: string, label: string) => setPricingPlans(pricingPlans.map(p => p.id === planId ? { ...p, label } : p));
    const updatePlanBadge = (planId: string, badge: string) => setPricingPlans(pricingPlans.map(p => p.id === planId ? { ...p, badge } : p));

    const handleSave = async () => {
        if (!title.trim()) { toast.error("Please enter a kit title"); return; }
        if (!category) { toast.error("Please select a category"); return; }
        if (images.length === 0) { toast.error("Please upload at least one kit image"); return; }

        try {
            setLoading(true);
            const kitData: Partial<Kit> = {
                title: title.trim(), shortDescription: shortDescription.trim(), category,
                itemsIncluded: items.filter(item => item.text.trim() !== ""),
                image: images[0], images: images,
                deliveryConfig,
            };
            if (pricingPlans.length > 0) {
                kitData.pricingPlans = pricingPlans.map(p => ({ id: p.id, label: p.label, price: Number(p.price) || 0, active: p.active, badge: p.badge }));
            }
            if (marketPrice) kitData.marketPrice = Number(marketPrice) || 0;
            if (offerPrice) kitData.offerPrice = Number(offerPrice) || 0;

            await vendorKitsApi.update(id, kitData);
            toast.success(wasApproved ? "Kit updated! Re-submitted for approval." : "Kit updated successfully!");
            router.push("/dashboard/kits");
        } catch (error: unknown) {
            let errorMessage = "Failed to update kit";
            if (error && typeof error === "object" && "response" in error) {
                const axiosError = error as { response?: { data?: { message?: string } } };
                if (axiosError.response?.data?.message) errorMessage = axiosError.response.data.message;
            }
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const savings = marketPrice && offerPrice ? Number(marketPrice) - Number(offerPrice) : 0;

    const calcEarnings = (price: number) => {
        if (!price || commissionValue <= 0) return { commission: 0, earnings: price, percent: 0 };
        let commission = 0;
        if (commissionType === "percentage") {
            commission = Math.round((price * commissionValue) / 100);
        } else {
            commission = commissionValue;
        }
        if (commission > price) commission = price;
        return { commission, earnings: price - commission, percent: commissionType === "percentage" ? commissionValue : Math.round((commission / price) * 100) };
    };

    const sellingPrice = Number(offerPrice) || Number(marketPrice) || 0;
    const earningsData = calcEarnings(sellingPrice);

    const EarningsCalculator = ({ price, label }: { price: number; label: string }) => {
        const data = calcEarnings(price);
        if (!price || price <= 0 || commissionValue <= 0) return null;
        const earningsPercent = price > 0 ? Math.round((data.earnings / price) * 100) : 0;
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-bold text-gray-900">₹{price}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-red-600">BookMySeva Commission ({commissionType === "percentage" ? `${commissionValue}%` : `₹${commissionValue} fixed`})</span>
                    <span className="font-bold text-red-600">- ₹{data.commission}</span>
                </div>
                <hr className="border-dashed" />
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-green-700 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" /> Aapko Milega (Your Earnings)
                    </span>
                    <span className="text-lg font-black text-green-700">₹{data.earnings}</span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500" style={{ width: `${earningsPercent}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-green-600">{earningsPercent}% Aapka</span>
                    <span className="text-red-500">{100 - earningsPercent}% Commission</span>
                </div>
            </div>
        );
    };

    if (fetching) {
        return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-0 pb-24 w-full">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border mb-6 -mx-6 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/kits"><Button variant="ghost" size="icon" className="rounded-full hover:bg-muted"><ChevronLeft className="w-5 h-5" /></Button></Link>
                        <div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                                <span>Dashboard</span><span>/</span><span>Pooja Kits</span><span>/</span>
                                <span className="text-[#8D0303] font-medium">Edit</span>
                            </div>
                            <h1 className="text-xl font-bold tracking-tight leading-none">Edit Pooja Kit</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.back()}>Cancel</Button>
                        <Button onClick={handleSave} size="sm" className="bg-[#8D0303] hover:bg-[#700202] text-white" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>

            {/* Re-approval warning */}
            {wasApproved && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800">Changes will require re-approval</p>
                        <p className="text-xs text-amber-600">This kit was previously approved. Saving changes will reset approval status and the kit will be re-submitted for review.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                    <Card className="border-border shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="bg-linear-to-r from-[#8D0303] to-[#B01212] py-4 px-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                                <div><h3 className="font-bold text-base leading-tight">Kit Identity</h3><p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">Title & Classification</p></div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold flex items-center gap-1.5 text-gray-700">Kit Title <span className="text-[#8D0303]">*</span></label>
                                <Input placeholder="e.g., Satyanarayana Swamy Vratham Kit" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 border-gray-200" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Category <span className="text-[#8D0303]">*</span></label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="h-11 border-gray-200"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily Pooja Kit</SelectItem>
                                        <SelectItem value="festival">Festival Pooja Kit</SelectItem>
                                        <SelectItem value="vratham">Vratham Kit</SelectItem>
                                        <SelectItem value="homam">Homam Kit</SelectItem>
                                        <SelectItem value="special">Special Occasion Kit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-700">Short Description</label>
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{shortDescription.length} / 300</span>
                                </div>
                                <Textarea placeholder="Briefly describe what this kit is for..." rows={4} maxLength={300} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="resize-none border-gray-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="bg-linear-to-r from-amber-500 to-amber-600 py-4 px-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                                <div><h3 className="font-bold text-base leading-tight">Visual Gallery</h3><p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">Up to 5 High-Quality images</p></div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                                <MultiImageUpload values={images} onChange={setImages} maxImages={5} aspectRatio={1} />
                                <div className="mt-4 flex items-start gap-2 text-[11px] text-amber-700 font-medium">
                                    <ImagePlus className="w-3.5 h-3.5 mt-0.5" /><p>First image will be the primary cover photo.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="bg-linear-to-r from-purple-500 to-purple-600 py-4 px-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0"><Clock className="w-4 h-4" /></div>
                                <div><h3 className="font-bold text-base leading-tight">Delivery Schedule</h3><p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">Time slots & booking dates</p></div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Quick Add Slots</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {SLOT_SUGGESTIONS.map(slot => (
                                        <button key={slot.id} type="button" onClick={() => addTimeSlot(slot.id, slot.label)} className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-border hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 transition-all cursor-pointer">+ {slot.label}</button>
                                    ))}
                                </div>
                            </div>
                            {deliveryConfig.timeSlots.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Active Slots</label>
                                    {deliveryConfig.timeSlots.map((slot) => (
                                        <div key={slot.id} className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${slot.active ? 'border-l-[3px] border-l-purple-500 border-purple-200 bg-purple-50/50' : 'border-border bg-muted/20 opacity-50'}`}>
                                            <Switch checked={slot.active} onCheckedChange={() => toggleTimeSlot(slot.id)} className="data-[state=checked]:bg-purple-600 shrink-0 scale-90" />
                                            <Input value={slot.label} onChange={(e) => updateSlotLabel(slot.id, e.target.value)} className="h-7 text-sm font-medium border-0 bg-transparent px-1 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1" />
                                            <button type="button" onClick={() => removeTimeSlot(slot.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Input placeholder="Custom slot (e.g., 6 AM – 9 AM)" id="newSlotLabelEdit" className="h-9 flex-1" onKeyPress={(e) => { if (e.key === 'Enter') { const input = e.target as HTMLInputElement; if (input.value.trim()) { addTimeSlot('custom-' + Date.now(), input.value.trim()); input.value = ''; } } }} />
                                <button type="button" className="h-9 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-semibold flex items-center gap-1 transition-colors shrink-0" onClick={() => { const input = document.getElementById('newSlotLabelEdit') as HTMLInputElement; if (input?.value.trim()) { addTimeSlot('custom-' + Date.now(), input.value.trim()); input.value = ''; } }}><Plus className="w-3.5 h-3.5" /> Add</button>
                            </div>
                            <hr className="border-border" />
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5 block"><CalendarDays className="w-3.5 h-3.5" /> Booking Date Control</label>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                                            <Input type="date" value={deliveryConfig.bookingStartDate || ''} onChange={(e) => setDeliveryConfig(prev => ({ ...prev, bookingStartDate: e.target.value || undefined }))} className="h-9" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">End Date</label>
                                            <Input type="date" value={deliveryConfig.bookingEndDate || ''} onChange={(e) => setDeliveryConfig(prev => ({ ...prev, bookingEndDate: e.target.value || undefined }))} className="h-9" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Lead Days</label>
                                            <Input type="number" min={0} value={deliveryConfig.leadDays} onChange={(e) => setDeliveryConfig(prev => ({ ...prev, leadDays: Number(e.target.value) || 0 }))} className="h-9" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Max Advance Days</label>
                                            <Input type="number" min={1} value={deliveryConfig.maxAdvanceDays} onChange={(e) => setDeliveryConfig(prev => ({ ...prev, maxAdvanceDays: Number(e.target.value) || 30 }))} className="h-9" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {category === "daily" && (
                        <Card className="border-border shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="bg-linear-to-r from-[#8D0303] to-[#B01212] py-4 px-6 text-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0">₹</div>
                                    <div><h3 className="font-bold text-base leading-tight">Subscription Plans</h3><p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">Weekly, Monthly, & Custom options</p></div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Quick Add Suggestions</label>
                                    <div className="flex flex-wrap gap-2">
                                        {PLAN_SUGGESTIONS.map(s => (
                                            <button key={s.id} type="button" onClick={() => addSuggestedPlan(s)} className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-gray-200 hover:border-[#8D0303] hover:bg-[#8D0303]/5 hover:text-[#8D0303] transition-all cursor-pointer flex items-center gap-1.5"><Plus className="w-3 h-3" /> {s.label}</button>
                                        ))}
                                    </div>
                                </div>
                                {pricingPlans.length > 0 && (
                                    <div className="space-y-3">
                                        {pricingPlans.map((plan) => (
                                            <div key={plan.id} className={`p-4 rounded-xl border transition-all duration-300 ${plan.active ? 'border-[#8D0303]/30 bg-[#8D0303]/[0.02] shadow-sm' : 'border-gray-100 bg-gray-50/50 opacity-60 grayscale'}`}>
                                                <div className="flex items-center justify-between gap-4 mb-3">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <Switch checked={plan.active} onCheckedChange={() => togglePlan(plan.id)} className="data-[state=checked]:bg-[#8D0303]" />
                                                        <Input value={plan.label} onChange={(e) => updatePlanLabel(plan.id, e.target.value)} className="h-8 text-sm font-bold border-0 bg-transparent px-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-800" />
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg shrink-0" onClick={() => removePlan(plan.id)}><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span><Input type="number" placeholder="Price" className="pl-7 h-9 text-sm font-bold border-gray-200" value={plan.price} onChange={(e) => updatePlanPrice(plan.id, e.target.value)} /></div>
                                                    <div className="relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" /><Input placeholder="Badge" className="pl-8 h-9 text-[11px] font-medium border-gray-200" value={plan.badge} onChange={(e) => updatePlanBadge(plan.id, e.target.value)} /></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {showAddPlan ? (
                                    <div className="p-4 border-2 border-dashed border-[#8D0303]/20 rounded-xl space-y-3 bg-[#8D0303]/[0.02]">
                                        <h4 className="text-xs font-bold text-[#8D0303] uppercase tracking-wider">New Custom Plan</h4>
                                        <Input placeholder="Plan name" value={newPlanLabel} onChange={(e) => setNewPlanLabel(e.target.value)} className="h-9 border-gray-200" onKeyPress={(e) => { if (e.key === 'Enter' && newPlanLabel.trim()) addPlan(newPlanLabel.trim(), newPlanBadge.trim()); }} />
                                        <Input placeholder="Badge text (optional)" value={newPlanBadge} onChange={(e) => setNewPlanBadge(e.target.value)} className="h-9 border-gray-200" />
                                        <div className="flex gap-2 pt-1">
                                            <Button type="button" className="bg-[#8D0303] hover:bg-[#700202] text-white h-9 flex-1" disabled={!newPlanLabel.trim()} onClick={() => addPlan(newPlanLabel.trim(), newPlanBadge.trim())}><Plus className="w-4 h-4 mr-1.5" /> Create Plan</Button>
                                            <Button type="button" variant="outline" className="h-9 px-4" onClick={() => { setShowAddPlan(false); setNewPlanLabel(""); setNewPlanBadge(""); }}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button type="button" variant="outline" className="w-full border-dashed border-2 h-11 text-sm font-semibold hover:bg-gray-50 text-gray-600 rounded-xl" onClick={() => setShowAddPlan(true)}><Plus className="w-4 h-4 mr-2 text-[#8D0303]" /> Add Custom Plan</Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-border shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="bg-linear-to-r from-emerald-600 to-emerald-700 py-4 px-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0">₹</div>
                                <div><h3 className="font-bold text-base leading-tight">One-Time Pricing</h3><p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">MRP and Discounted pricing</p></div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">MRP (Market Price)</label>
                                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span><Input type="number" placeholder="1200" className="pl-8 h-11 border-gray-200 font-bold" value={marketPrice} onChange={(e) => setMarketPrice(e.target.value)} /></div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Offer Price</label>
                                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">₹</span><Input type="number" placeholder="999" className="pl-8 h-11 border-emerald-100 bg-emerald-50/30 text-emerald-700 font-bold" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} /></div>
                                </div>
                            </div>
                            {savings > 0 && (
                                <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl border border-emerald-100">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0"><Star className="w-4 h-4 fill-current" /></div>
                                    <div><p className="text-[11px] font-bold uppercase tracking-wider opacity-80">Total Savings</p><span className="text-sm font-black">₹{savings} saved · {Math.round((savings / Number(marketPrice)) * 100)}% off</span></div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Earnings Calculator */}
                    {commissionValue > 0 && (
                        <Card className="border-border shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 py-4 px-6 text-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0">
                                        <IndianRupee className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base leading-tight">Your Earnings Calculator</h3>
                                        <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">See exactly what you earn per order</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-5">
                                {sellingPrice > 0 ? (
                                    <>
                                        <div className="rounded-xl border-2 border-blue-100 bg-blue-50/30 p-5">
                                            <EarningsCalculator price={sellingPrice} label="Selling Price (Customer Pays)" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="text-center p-3 rounded-lg bg-gray-50 border">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Customer Price</p>
                                                <p className="text-lg font-black text-gray-900 mt-1">₹{sellingPrice}</p>
                                            </div>
                                            <div className="text-center p-3 rounded-lg bg-red-50 border border-red-100 relative">
                                                <ArrowRight className="w-4 h-4 text-gray-400 absolute -left-2.5 top-1/2 -translate-y-1/2 bg-white rounded-full" />
                                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Commission</p>
                                                <p className="text-lg font-black text-red-600 mt-1">- ₹{earningsData.commission}</p>
                                            </div>
                                            <div className="text-center p-3 rounded-lg bg-green-50 border border-green-100 relative">
                                                <ArrowRight className="w-4 h-4 text-gray-400 absolute -left-2.5 top-1/2 -translate-y-1/2 bg-white rounded-full" />
                                                <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">You Receive</p>
                                                <p className="text-lg font-black text-green-700 mt-1">₹{earningsData.earnings}</p>
                                            </div>
                                        </div>
                                        {pricingPlans.length > 0 && pricingPlans.some(p => p.active && Number(p.price) > 0) && (
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Plan-wise Earnings</p>
                                                <div className="space-y-2">
                                                    {pricingPlans.filter(p => p.active && Number(p.price) > 0).map(plan => {
                                                        const planData = calcEarnings(Number(plan.price));
                                                        return (
                                                            <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg border bg-white text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-gray-800">{plan.label}</span>
                                                                    <span className="text-gray-400">₹{plan.price}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-red-500 text-xs">-₹{planData.commission}</span>
                                                                    <span className="font-bold text-green-700">= ₹{planData.earnings}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-6">
                                        <IndianRupee className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-sm font-semibold text-gray-400">Price enter karo</p>
                                        <p className="text-xs text-gray-400 mt-1">Price daalte hi aapka earnings yahan dikhega</p>
                                    </div>
                                )}
                                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                                    <span className="text-amber-500 text-base leading-none mt-0.5">ℹ️</span>
                                    <div>
                                        <p className="font-semibold">Commission: {commissionType === "percentage" ? `${commissionValue}%` : `₹${commissionValue} per order`}</p>
                                        <p className="mt-0.5 text-amber-700">Har order se commission katke baaki amount aapke bank account mein aayega.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-border shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="bg-linear-to-r from-[#8D0303] to-[#B01212] py-4 px-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-sm font-bold shrink-0"><Package className="w-4 h-4" /></div>
                                <div><h3 className="font-bold text-base leading-tight">Kit Contents</h3><p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">{items.length} items listed</p></div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="flex gap-2">
                                <Input placeholder="Add item (e.g., Kumkum, Agarbatti)" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddItem()} className="h-11 border-gray-200" />
                                <Button type="button" onClick={handleAddItem} className="h-11 bg-[#8D0303] hover:bg-[#700202] text-white shrink-0 px-6 font-bold rounded-lg"><Plus className="w-4 h-4 mr-1.5" /> Add</Button>
                            </div>
                            <div className="min-h-[100px] border-2 border-dashed border-gray-100 rounded-xl p-4 bg-gray-50/30">
                                {items.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#8D0303]/10 text-sm font-medium text-gray-700 shadow-xs hover:shadow-sm hover:border-[#8D0303]/30 transition-all">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                <span>{item.text}</span>
                                                <button onClick={() => removeItem(item.id)} className="ml-1 p-0.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-4 text-center">
                                        <Package className="w-8 h-8 text-gray-300 mb-2" />
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">No Items Added</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
