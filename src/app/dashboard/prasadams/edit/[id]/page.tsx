"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Save, Loader2, Clock, CalendarDays, Trash2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MultiImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import { PrasadamCategory, VendorPrasadam, vendorPrasadamsApi } from "@/api/prasadams";
import api from "@/lib/axios";
import { IndianRupee, TrendingUp, ArrowRight } from "lucide-react";

const units = [
    { value: "pieces", label: "Pieces" },
    { value: "kg", label: "Kilograms (kg)" },
    { value: "grams", label: "Grams" },
    { value: "packets", label: "Packets" },
];

const SLOT_SUGGESTIONS = [
    { id: "morning", label: "8 AM - 11 AM" },
    { id: "midday", label: "11 AM - 2 PM" },
    { id: "afternoon", label: "2 PM - 5 PM" },
    { id: "evening", label: "5 PM - 8 PM" },
];

export default function EditVendorPrasadamPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [categories, setCategories] = useState<PrasadamCategory[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [wasApproved, setWasApproved] = useState(false);

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [shortDescription, setShortDescription] = useState("");
    const [fullDescription, setFullDescription] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [basePrice, setBasePrice] = useState("");
    const [marketPrice, setMarketPrice] = useState("");
    const [unit, setUnit] = useState("pieces");
    const [weightPerUnit, setWeightPerUnit] = useState("");
    const [inStock, setInStock] = useState(true);
    const [stockQuantity, setStockQuantity] = useState("100");
    const [minOrderQuantity, setMinOrderQuantity] = useState("1");
    const [maxOrderQuantity, setMaxOrderQuantity] = useState("50");
    const [freeShipping, setFreeShipping] = useState(false);
    const [freeShippingAbove, setFreeShippingAbove] = useState("500");
    const [shippingCharge, setShippingCharge] = useState("50");
    const [deliveryText, setDeliveryText] = useState("Delivery in 2-3 days");
    const [shelfLife, setShelfLife] = useState("3");
    const [templeName, setTempleName] = useState("");
    const [templeLocation, setTempleLocation] = useState("");
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [newIngredient, setNewIngredient] = useState("");
    const [isVegetarian, setIsVegetarian] = useState(true);
    const [isVegan, setIsVegan] = useState(false);
    const [containsNuts, setContainsNuts] = useState(false);
    const [containsDairy, setContainsDairy] = useState(true);
    const [pricingTiers, setPricingTiers] = useState<VendorPrasadam["pricingTiers"]>([]);
    const [newTierMin, setNewTierMin] = useState("");
    const [newTierMax, setNewTierMax] = useState("");
    const [newTierPrice, setNewTierPrice] = useState("");
    const [newTierLabel, setNewTierLabel] = useState("");
    const [deliveryConfig, setDeliveryConfig] = useState({
        timeSlots: [
            { id: "morning", label: "8 AM - 11 AM", active: true },
            { id: "midday", label: "11 AM - 2 PM", active: true },
        ],
        bookingStartDate: "",
        bookingEndDate: "",
        leadDays: 1,
        maxAdvanceDays: 7,
    });
    const [commissionType, setCommissionType] = useState("percentage");
    const [commissionValue, setCommissionValue] = useState(0);
    const [taxes, setTaxes] = useState<{ id?: string; name: string; percentage: number; registrationNumber?: string }[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await vendorPrasadamsApi.getCategories();
                setCategories(data);
            } catch {
                setCategories([]);
                toast.error("Failed to load categories from superadmin");
            } finally {
                setCategoriesLoading(false);
            }
        };

        const loadPrasadam = async () => {
            try {
                const item = await vendorPrasadamsApi.getById(id);
                setTitle(item.title || "");
                setCategory(item.category || "");
                setShortDescription(item.shortDescription || "");
                setFullDescription(item.fullDescription || "");
                setImages(item.images || (item.image ? [item.image] : []));
                setBasePrice(String(item.basePrice || ""));
                setMarketPrice(item.marketPrice ? String(item.marketPrice) : "");
                setUnit(item.unit || "pieces");
                setWeightPerUnit(item.weightPerUnit ? String(item.weightPerUnit) : "");
                setInStock(item.inStock ?? true);
                setStockQuantity(String(item.stockQuantity ?? 100));
                setMinOrderQuantity(String(item.minOrderQuantity ?? 1));
                setMaxOrderQuantity(String(item.maxOrderQuantity ?? 50));
                setFreeShipping(item.shipping?.freeShipping ?? false);
                setFreeShippingAbove(String(item.shipping?.freeShippingAbove ?? 500));
                setShippingCharge(String(item.shipping?.shippingCharge ?? 50));
                setDeliveryText(item.shipping?.deliveryText || "Delivery in 2-3 days");
                setShelfLife(String(item.shelfLife ?? 3));
                setTempleName(item.templeSource?.templeName || "");
                setTempleLocation(item.templeSource?.templeLocation || "");
                setIngredients(item.ingredients || []);
                setIsVegetarian(item.dietary?.isVegetarian ?? true);
                setIsVegan(item.dietary?.isVegan ?? false);
                setContainsNuts(item.dietary?.containsNuts ?? false);
                setContainsDairy(item.dietary?.containsDairy ?? true);
                setPricingTiers(item.pricingTiers || []);
                setDeliveryConfig({
                    timeSlots: item.deliveryConfig?.timeSlots?.length
                        ? item.deliveryConfig.timeSlots
                        : [
                            { id: "morning", label: "8 AM - 11 AM", active: true },
                            { id: "midday", label: "11 AM - 2 PM", active: true },
                        ],
                    bookingStartDate: item.deliveryConfig?.bookingStartDate || "",
                    bookingEndDate: item.deliveryConfig?.bookingEndDate || "",
                    leadDays: item.deliveryConfig?.leadDays ?? 1,
                    maxAdvanceDays: item.deliveryConfig?.maxAdvanceDays ?? 7,
                });
                setTaxes(item.taxes || []);
                setWasApproved(!!item.vendorApproved);
            } catch {
                toast.error("Failed to load prasadam");
                router.push("/dashboard/prasadams");
            } finally {
                setFetching(false);
            }
        };

        fetchCategories();
        loadPrasadam();

        const fetchCommission = async () => {
            try {
                const { data } = await api.get("/vendor-auth/profile");
                if (data?.vendor) {
                    setCommissionType(data.vendor.commissionType || "percentage");
                    setCommissionValue(data.vendor.commissionValue || 0);
                }
            } catch {
                // ignore
            }
        };
        fetchCommission();
    }, [id, router]);

    const calcEarnings = (price: number) => {
        if (!price || commissionValue <= 0) return { commission: 0, earnings: price };
        let commission = 0;
        if (commissionType === "percentage") {
            commission = Math.round((price * commissionValue) / 100);
        } else {
            commission = commissionValue;
        }
        if (commission > price) commission = price;
        return { commission, earnings: price - commission };
    };

    const sellingPrice = Number(basePrice) || Number(marketPrice) || 0;
    const earningsData = calcEarnings(sellingPrice);

    const addIngredient = () => {
        if (!newIngredient.trim()) return;
        setIngredients((prev) => [...prev, newIngredient.trim()]);
        setNewIngredient("");
    };

    const removeIngredient = (index: number) => {
        setIngredients((prev) => prev.filter((_, i) => i !== index));
    };

    const addPricingTier = () => {
        if (!newTierMin || !newTierPrice) return toast.error("Tier min quantity and price are required");
        const tier = {
            minQuantity: Number(newTierMin),
            maxQuantity: newTierMax ? Number(newTierMax) : undefined,
            pricePerUnit: Number(newTierPrice),
            label: newTierLabel || undefined,
        };
        setPricingTiers((prev) => [...(prev || []), tier]);
        setNewTierMin("");
        setNewTierMax("");
        setNewTierPrice("");
        setNewTierLabel("");
    };

    const removePricingTier = (index: number) => {
        setPricingTiers((prev) => (prev || []).filter((_, i) => i !== index));
    };

    const addTimeSlot = (id: string, label: string) => {
        if (deliveryConfig.timeSlots.some(s => s.label === label)) {
            toast.error(`"${label}" slot already exists`);
            return;
        }
        setDeliveryConfig(prev => ({
            ...prev,
            timeSlots: [...prev.timeSlots, { id: `${id}-${Date.now()}`, label, active: true }],
        }));
    };

    const removeTimeSlot = (id: string) => {
        setDeliveryConfig(prev => ({
            ...prev,
            timeSlots: prev.timeSlots.filter(s => s.id !== id),
        }));
    };

    const toggleTimeSlot = (id: string) => {
        setDeliveryConfig(prev => ({
            ...prev,
            timeSlots: prev.timeSlots.map(s => s.id === id ? { ...s, active: !s.active } : s),
        }));
    };

    const updateSlotLabel = (id: string, label: string) => {
        setDeliveryConfig(prev => ({
            ...prev,
            timeSlots: prev.timeSlots.map(s => s.id === id ? { ...s, label } : s),
        }));
    };

    const addTax = () => {
        setTaxes([...taxes, { id: Date.now().toString(), name: '', percentage: 0, registrationNumber: '' }]);
    };

    const updateTax = (index: number, field: string, value: any) => {
        const updated = [...taxes];
        (updated[index] as any)[field] = value;
        setTaxes(updated);
    };

    const removeTax = (index: number) => {
        const updated = [...taxes];
        updated.splice(index, 1);
        setTaxes(updated);
    };

    const handleSave = async () => {
        if (!title.trim()) return toast.error("Please enter prasadam title");
        if (!category) return toast.error("Please select a category");
        if (!basePrice || Number(basePrice) <= 0) return toast.error("Please enter valid base price");
        if (images.length === 0) return toast.error("Please upload at least one image");

        const payload: Partial<VendorPrasadam> = {
            title: title.trim(),
            category,
            shortDescription: shortDescription.trim(),
            fullDescription: fullDescription.trim(),
            image: images[0],
            images,
            basePrice: Number(basePrice),
            marketPrice: marketPrice ? Number(marketPrice) : undefined,
            pricingTiers: pricingTiers && pricingTiers.length > 0 ? pricingTiers : undefined,
            unit: unit as VendorPrasadam["unit"],
            weightPerUnit: weightPerUnit ? Number(weightPerUnit) : undefined,
            templeSource: templeName || templeLocation ? { templeName, templeLocation } : undefined,
            ingredients: ingredients.length > 0 ? ingredients : undefined,
            shelfLife: Number(shelfLife) || 3,
            dietary: {
                isVegetarian,
                isVegan,
                containsNuts,
                containsDairy,
            },
            inStock,
            stockQuantity: Number(stockQuantity) || 100,
            minOrderQuantity: Number(minOrderQuantity) || 1,
            maxOrderQuantity: Number(maxOrderQuantity) || 50,
            shipping: {
                freeShipping,
                freeShippingAbove: Number(freeShippingAbove) || 500,
                shippingCharge: Number(shippingCharge) || 50,
                deliveryText,
                showShipping: true,
            },
            deliveryConfig: {
                timeSlots: deliveryConfig.timeSlots,
                bookingStartDate: deliveryConfig.bookingStartDate || undefined,
                bookingEndDate: deliveryConfig.bookingEndDate || undefined,
                leadDays: Number(deliveryConfig.leadDays) || 1,
                maxAdvanceDays: Number(deliveryConfig.maxAdvanceDays) || 7,
                availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
            },
            taxes: taxes,
        };

        try {
            setLoading(true);
            await vendorPrasadamsApi.update(id, payload);
            toast.success(wasApproved ? "Prasadam updated and sent for re-approval." : "Prasadam updated successfully.");
            router.push("/dashboard/prasadams");
        } catch (error: any) {
            const message = error?.response?.data?.message || "Failed to update prasadam";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur py-4 border-b -mx-4 px-4 lg:-mx-6 lg:px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/prasadams">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="text-xs text-muted-foreground">Dashboard / Prasadams / Edit</div>
                            <h1 className="text-xl font-bold">Edit Prasadam</h1>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                        <Button onClick={handleSave} disabled={loading} className="bg-[#8D0303] hover:bg-[#700202] text-white">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save
                        </Button>
                    </div>
                </div>
            </div>

            {wasApproved && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800">Changes will require re-approval</p>
                        <p className="text-xs text-amber-600">After update, admin needs to approve this prasadam again.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <Card>
                    <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                        <div>
                            <Label>Category *</Label>
                            <Select value={category} onValueChange={setCategory} disabled={categoriesLoading}>
                                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div><Label>Short Description</Label><Textarea rows={2} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} /></div>
                        <div><Label>Full Description</Label><Textarea rows={4} value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} /></div>
                        <div><Label>Images *</Label><MultiImageUpload values={images} onChange={setImages} maxImages={5} aspectRatio={1} /></div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label>Base Price *</Label><Input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} /></div>
                            <div><Label>Market Price</Label><Input type="number" value={marketPrice} onChange={(e) => setMarketPrice(e.target.value)} /></div>
                        </div>
                        <div><Label>Unit</Label>
                            <Select value={unit} onValueChange={setUnit}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{units.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div><Label>Weight per Unit (grams)</Label><Input type="number" value={weightPerUnit} onChange={(e) => setWeightPerUnit(e.target.value)} /></div>
                        <div><Label>Shelf Life (days)</Label><Input type="number" value={shelfLife} onChange={(e) => setShelfLife(e.target.value)} /></div>
                        <div>
                            <Label>Bulk Pricing Tiers</Label>
                            <div className="flex gap-2 flex-wrap mt-2">
                                <Input type="number" placeholder="Min" className="w-20" value={newTierMin} onChange={(e) => setNewTierMin(e.target.value)} />
                                <Input type="number" placeholder="Max" className="w-20" value={newTierMax} onChange={(e) => setNewTierMax(e.target.value)} />
                                <Input type="number" placeholder="Price" className="w-24" value={newTierPrice} onChange={(e) => setNewTierPrice(e.target.value)} />
                                <Input placeholder="Label" className="w-28" value={newTierLabel} onChange={(e) => setNewTierLabel(e.target.value)} />
                                <Button type="button" variant="outline" onClick={addPricingTier}>Add</Button>
                            </div>
                            {(pricingTiers || []).length > 0 && (
                                <div className="space-y-2 mt-3">
                                    {(pricingTiers || []).map((tier, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                                            <span>{tier.minQuantity}{tier.maxQuantity ? `-${tier.maxQuantity}` : "+"} qty - Rs {tier.pricePerUnit} {tier.label ? `(${tier.label})` : ""}</span>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removePricingTier(index)}>Remove</Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div><Label>Stock</Label><Input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} /></div>
                            <div><Label>Min Qty</Label><Input type="number" value={minOrderQuantity} onChange={(e) => setMinOrderQuantity(e.target.value)} /></div>
                            <div><Label>Max Qty</Label><Input type="number" value={maxOrderQuantity} onChange={(e) => setMaxOrderQuantity(e.target.value)} /></div>
                        </div>
                        <div className="flex items-center justify-between"><Label>In Stock</Label><Switch checked={inStock} onCheckedChange={setInStock} /></div>
                        <div className="flex items-center justify-between"><Label>Free Shipping</Label><Switch checked={freeShipping} onCheckedChange={setFreeShipping} /></div>
                                {!freeShipping && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><Label>Free Above</Label><Input type="number" value={freeShippingAbove} onChange={(e) => setFreeShippingAbove(e.target.value)} /></div>
                                        <div><Label>Shipping Charge</Label><Input type="number" value={shippingCharge} onChange={(e) => setShippingCharge(e.target.value)} /></div>
                                    </div>
                                )}
                                <div><Label>Delivery Text</Label><Input value={deliveryText} onChange={(e) => setDeliveryText(e.target.value)} /></div>
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between mb-1">
                                    <Label>Taxes & Fees Configuration</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addTax} className="h-8">
                                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Tax/Fee
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {taxes.length === 0 ? (
                                        <div className="text-sm text-gray-500 italic p-4 border rounded-xl bg-gray-50 text-center">No taxes configured. (0% will be applied)</div>
                                    ) : (
                                        taxes.map((tax, idx) => (
                                            <div key={idx} className="flex gap-4 items-start p-4 border rounded-xl bg-white relative group">
                                                <div className="flex-1 space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tax Name</label>
                                                            <Input placeholder="e.g., GST, VAT" value={tax.name} onChange={(e) => updateTax(idx, "name", e.target.value)} className="h-9" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Percentage (%)</label>
                                                            <Input type="number" value={tax.percentage} onChange={(e) => updateTax(idx, "percentage", Number(e.target.value))} className="h-9" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reg. Number (Optional)</label>
                                                            <Input placeholder="e.g., GSTIN..." value={tax.registrationNumber} onChange={(e) => updateTax(idx, "registrationNumber", e.target.value)} className="h-9 uppercase" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeTax(idx)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" type="button">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="w-5 h-5" /> Delivery Schedule
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div>
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Quick Add Slots</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {SLOT_SUGGESTIONS.map(slot => (
                                    <button
                                        key={slot.id}
                                        type="button"
                                        onClick={() => addTimeSlot(slot.id, slot.label)}
                                        className="text-xs font-semibold px-2.5 py-1 rounded-full border border-border hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all"
                                    >
                                        + {slot.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {deliveryConfig.timeSlots.length > 0 && (
                            <div className="space-y-2">
                                {deliveryConfig.timeSlots.map((slot) => (
                                    <div key={slot.id} className={`flex items-center gap-2 p-2.5 rounded-lg border ${slot.active ? "border-l-[3px] border-l-blue-500 border-blue-200 bg-blue-50/50" : "border-border bg-muted/20 opacity-50"}`}>
                                        <Switch checked={slot.active} onCheckedChange={() => toggleTimeSlot(slot.id)} className="data-[state=checked]:bg-blue-600 shrink-0 scale-90" />
                                        <Input value={slot.label} onChange={(e) => updateSlotLabel(slot.id, e.target.value)} className="h-7 text-sm border-0 bg-transparent px-1 focus-visible:ring-0 flex-1" />
                                        <button type="button" onClick={() => removeTimeSlot(slot.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-1">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Booking Start Date</Label>
                                <Input
                                    type="date"
                                    value={deliveryConfig.bookingStartDate}
                                    onChange={(e) => setDeliveryConfig(prev => ({ ...prev, bookingStartDate: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>Booking End Date</Label>
                                <Input
                                    type="date"
                                    value={deliveryConfig.bookingEndDate}
                                    onChange={(e) => setDeliveryConfig(prev => ({ ...prev, bookingEndDate: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Lead Days</Label>
                                <Input type="number" value={deliveryConfig.leadDays} onChange={(e) => setDeliveryConfig(prev => ({ ...prev, leadDays: Number(e.target.value) || 1 }))} />
                            </div>
                            <div>
                                <Label>Max Advance Days</Label>
                                <Input type="number" value={deliveryConfig.maxAdvanceDays} onChange={(e) => setDeliveryConfig(prev => ({ ...prev, maxAdvanceDays: Number(e.target.value) || 7 }))} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {commissionValue > 0 && (
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><IndianRupee className="w-5 h-5" />Your Earnings Calculator</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 rounded-lg bg-gray-50 border">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Selling Price</p>
                                    <p className="text-lg font-black text-gray-900 mt-1">Rs {sellingPrice}</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-red-50 border border-red-100 relative">
                                    <ArrowRight className="w-4 h-4 text-gray-400 absolute -left-2.5 top-1/2 -translate-y-1/2 bg-white rounded-full" />
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Commission</p>
                                    <p className="text-lg font-black text-red-600 mt-1">- Rs {earningsData.commission}</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-green-50 border border-green-100 relative">
                                    <ArrowRight className="w-4 h-4 text-gray-400 absolute -left-2.5 top-1/2 -translate-y-1/2 bg-white rounded-full" />
                                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">You Receive</p>
                                    <p className="text-lg font-black text-green-700 mt-1">Rs {earningsData.earnings}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                                <TrendingUp className="w-4 h-4 mt-0.5 text-amber-600" />
                                <div>
                                    <p className="font-semibold">
                                        Commission: {commissionType === "percentage" ? `${commissionValue}%` : `Rs ${commissionValue} per order`}
                                    </p>
                                </div>
                            </div>
                            {pricingTiers && pricingTiers.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tier-wise Earnings</p>
                                    <div className="space-y-2">
                                        {pricingTiers.map((tier, index) => {
                                            const tierCalc = calcEarnings(Number(tier.pricePerUnit) || 0);
                                            return (
                                                <div key={index} className="flex items-center justify-between p-2.5 rounded-lg border bg-white text-sm">
                                                    <span className="font-medium text-gray-700">
                                                        {tier.minQuantity}{tier.maxQuantity ? `-${tier.maxQuantity}` : "+"} qty @ Rs {tier.pricePerUnit}
                                                    </span>
                                                    <span className="font-bold text-green-700">You get Rs {tierCalc.earnings}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader><CardTitle>Temple Source & Dietary</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div><Label>Temple Name</Label><Input value={templeName} onChange={(e) => setTempleName(e.target.value)} /></div>
                        <div><Label>Temple Location</Label><Input value={templeLocation} onChange={(e) => setTempleLocation(e.target.value)} /></div>
                        <div className="flex items-center justify-between"><Label>Vegetarian</Label><Switch checked={isVegetarian} onCheckedChange={setIsVegetarian} /></div>
                        <div className="flex items-center justify-between"><Label>Vegan</Label><Switch checked={isVegan} onCheckedChange={setIsVegan} /></div>
                        <div className="flex items-center justify-between"><Label>Contains Nuts</Label><Switch checked={containsNuts} onCheckedChange={setContainsNuts} /></div>
                        <div className="flex items-center justify-between"><Label>Contains Dairy</Label><Switch checked={containsDairy} onCheckedChange={setContainsDairy} /></div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Ingredients</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex gap-2">
                            <Input value={newIngredient} onChange={(e) => setNewIngredient(e.target.value)} placeholder="Add ingredient" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient())} />
                            <Button type="button" variant="outline" onClick={addIngredient}>Add</Button>
                        </div>
                        {ingredients.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {ingredients.map((ing, index) => (
                                    <div key={index} className="flex items-center justify-between p-2.5 rounded-lg border bg-white shadow-xs">
                                        <span className="text-sm font-medium text-gray-700">{ing}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeIngredient(index)}
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-1"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
