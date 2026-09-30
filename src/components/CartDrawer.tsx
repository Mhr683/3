import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Tag, 
  CheckCircle2, 
  Banknote, 
  CreditCard, 
  Smartphone, 
  ShieldCheck, 
  Truck,
  Sparkles,
  Store,
  Wallet,
  DollarSign
} from 'lucide-react';
import { CartItem, CurrencyCode, Order, DiscountCoupon } from '../types/dropship';
import { formatPrice, usdToPkr, formatPKR, pkrToUsd } from '../utils/currency';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currency: CurrencyCode;
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onOrderPlaced: (order: Order) => void;
  isResellerMode?: boolean;
  resellerBrandName?: string;
  onOpenResellerPortal?: () => void;
  coupons?: DiscountCoupon[];
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
  isResellerMode = false,
  resellerBrandName = 'Apna Reseller Store',
  onOpenResellerPortal,
  coupons = [],
}) => {
  if (!isOpen) return null;

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscountRate, setAppliedDiscountRate] = useState(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  // Reseller Order Customization
  const [isResellerOrder, setIsResellerOrder] = useState(isResellerMode);
  const [resellerFlyerBrand, setResellerFlyerBrand] = useState(resellerBrandName || 'Apna Reseller Store');
  const [resellerProfitPerUnit, setResellerProfitPerUnit] = useState<number>(200);
  const [resellerPayoutMethod, setResellerPayoutMethod] = useState<'JazzCash' | 'EasyPaisa' | 'Bank Transfer'>('JazzCash');
  const [resellerPayoutAccount, setResellerPayoutAccount] = useState('0300-1234567');

  // Customer Form Fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lahore');
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery (COD)' | 'Card Payment' | 'JazzCash / EasyPaisa' | 'Direct Bank Transfer'>('Cash on Delivery (COD)');
  const [orderNote, setOrderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Calculations
  const totalUnits = items.reduce((acc, item) => acc + item.quantity, 0);

  // Wholesale cost in PKR
  const totalWholesalePKR = items.reduce((acc, item) => {
    return acc + (usdToPkr(item.product.supplierCost) + (item.selectedVariant?.extraPrice ? Math.round(item.selectedVariant.extraPrice * 280) : 0)) * item.quantity;
  }, 0);

  // Profit earned by reseller (+Rs. 200 default)
  const totalResellerProfitPKR = isResellerOrder ? (resellerProfitPerUnit * totalUnits) : 0;

  // Direct customer price (Wholesale + Rs. 200 per item)
  const directCustomerSubtotalPKR = items.reduce((acc, item) => {
    return acc + (usdToPkr(item.product.supplierCost) + 200 + (item.selectedVariant?.extraPrice ? Math.round(item.selectedVariant.extraPrice * 280) : 0)) * item.quantity;
  }, 0);

  // Customer subtotal
  const subtotalPKR = isResellerOrder ? (totalWholesalePKR + totalResellerProfitPKR) : directCustomerSubtotalPKR;
  const discountPKR = subtotalPKR * appliedDiscountRate;
  const shippingFeePKR = subtotalPKR > 14000 || items.length === 0 ? 0 : 250; // Rs. 250 delivery fee
  const totalPKR = Math.max(0, subtotalPKR - discountPKR + shippingFeePKR);

  // Display helper according to selected currency
  const formatAmount = (pkrAmount: number) => {
    if (currency === 'PKR') {
      return formatPKR(pkrAmount);
    }
    return formatPrice(pkrToUsd(pkrAmount), currency);
  };

  const handleApplyPromo = () => {
    const clean = promoCode.trim().toUpperCase();
    const matched = coupons.find((c) => c.code.toUpperCase() === clean && c.isActive);

    if (matched) {
      if (subtotalPKR < matched.minSpendPKR) {
        setPromoMessage(`Minimum spend of ${formatPKR(matched.minSpendPKR)} required for code ${matched.code}`);
        return;
      }
      if (matched.discountType === 'percentage') {
        setAppliedDiscountRate(matched.discountValue / 100);
        setPromoMessage(`${matched.discountValue}% discount applied successfully!`);
      } else {
        const rate = Math.min(0.9, matched.discountValue / (subtotalPKR || 1));
        setAppliedDiscountRate(rate);
        setPromoMessage(`${formatPKR(matched.discountValue)} discount applied successfully!`);
      }
    } else if (clean === 'APNA20') {
      setAppliedDiscountRate(0.20);
      setPromoMessage('20% Flash discount applied successfully!');
    } else if (clean === 'FREESHIP') {
      setAppliedDiscountRate(0.05);
      setPromoMessage('Free Shipping + 5% voucher applied!');
    } else {
      setPromoMessage('Invalid voucher code. Try APNA20');
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !address) {
      alert('Please fill in your name, phone number, and delivery address.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const generatedOrderId = `APNA-${Math.floor(10000 + Math.random() * 90000)}`;
      const generatedTracking = `TCS-${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      const newOrder: Order = {
        id: generatedOrderId,
        createdAt: new Date().toISOString(),
        customerName,
        phone,
        email: email || `${customerName.toLowerCase().replace(/\s+/g, '')}@example.com`,
        address,
        city,
        paymentMethod,
        items: [...items],
        subtotal: pkrToUsd(subtotalPKR),
        discount: pkrToUsd(discountPKR),
        shippingFee: pkrToUsd(shippingFeePKR),
        total: pkrToUsd(totalPKR),
        currency,
        status: 'sourcing',
        supplierName: isResellerOrder ? resellerFlyerBrand : (items[0]?.product.supplier.name || 'Direct Factory Sourcing'),
        supplierCostTotal: pkrToUsd(totalWholesalePKR),
        profitEarned: pkrToUsd(isResellerOrder ? totalResellerProfitPKR : (totalPKR - totalWholesalePKR)),
        trackingNumber: generatedTracking,
        carrier: 'TCS Express Pakistan',
        orderNote: orderNote.trim() || undefined,
        notes: orderNote.trim() || undefined,
        isResellerOrder,
        resellerBrandName: isResellerOrder ? resellerFlyerBrand : undefined,
        resellerProfitTotalPKR: isResellerOrder ? totalResellerProfitPKR : undefined,
        resellerPayoutMethod: isResellerOrder ? resellerPayoutMethod : undefined,
        resellerPayoutAccount: isResellerOrder ? resellerPayoutAccount : undefined,
        trackingTimeline: [
          {
            status: 'placed',
            title: 'Order Confirmed',
            description: `Order successfully booked under ${customerName}. Dispatch via ${isResellerOrder ? resellerFlyerBrand : 'Apna Store'}.`,
            timestamp: 'Just now',
            completed: true,
          },
          {
            status: 'sourcing',
            title: isResellerOrder ? 'White-Label Courier Flyer Printed' : 'Supplier Hub Processing',
            description: isResellerOrder 
              ? `TCS COD slip generated with sender brand "${resellerFlyerBrand}". COD to collect: ${formatPKR(totalPKR)}.`
              : `Dispatched to ${items[0]?.product.supplier.name || 'Factory Hub'}. Barcode label generated.`,
            timestamp: 'In progress',
            completed: true,
            current: true,
          },
          {
            status: 'shipped',
            title: 'Handover to Courier',
            description: `Assigned tracking number #${generatedTracking}. Ready for air cargo dispatch.`,
            timestamp: 'Estimated within 24 hours',
            completed: false,
          },
          {
            status: 'out_for_delivery',
            title: 'Out for Delivery',
            description: 'Courier rider will call customer before doorstep arrival.',
            timestamp: 'Upcoming',
            completed: false,
          },
          {
            status: 'delivered',
            title: isResellerOrder ? 'Delivered & Reseller Profit Cleared' : 'Delivered & COD Collected',
            description: isResellerOrder 
              ? `COD collected! Profit of ${formatPKR(totalResellerProfitPKR)} transferred to your ${resellerPayoutMethod}.`
              : 'Doorstep inspection & payment completion.',
            timestamp: 'Upcoming',
            completed: false,
          }
        ],
      };

      setLastPlacedOrder(newOrder);
      onOrderPlaced(newOrder);
      setIsSubmitting(false);
      setCheckoutStep('success');
      onClearCart();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <span>
                  {checkoutStep === 'cart' && `Shopping Bag (${totalUnits})`}
                  {checkoutStep === 'checkout' && (isResellerOrder ? 'Reseller Customer Dispatch' : 'Doorstep Checkout')}
                  {checkoutStep === 'success' && 'Order Confirmed!'}
                </span>
                {isResellerOrder && (
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Reseller COD
                  </span>
                )}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {checkoutStep === 'cart' && (
            <>
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Your bag is empty</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Discover our trending dropshipping winners and direct factory deals.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Start Exploring
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Reseller Order Mode Banner */}
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-emerald-950">Reseller Order Mode</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-[11px] text-emerald-800 font-medium">Deliver to Customer</span>
                        <input
                          type="checkbox"
                          checked={isResellerOrder}
                          onChange={(e) => setIsResellerOrder(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </label>
                    </div>
                    {isResellerOrder ? (
                      <div className="space-y-2 pt-1 border-t border-emerald-200/80 text-[11px] text-emerald-800">
                        <div className="flex items-center justify-between">
                          <span>Your Profit Margin per unit:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-emerald-900">Rs.</span>
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={resellerProfitPerUnit}
                              onChange={(e) => setResellerProfitPerUnit(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-20 px-2 py-0.5 bg-white border border-emerald-300 rounded font-black text-emerald-900 text-xs text-right"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between font-bold text-emerald-950">
                          <span>Total Reseller Profit to Earn:</span>
                          <span className="text-emerald-700 font-black text-xs">+{formatPKR(totalResellerProfitPKR)}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Parcel will be shipped white-label using your brand name. Apna Store collects full COD and transfers your profit.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-600">
                        Direct Customer Pricing: Products include standard +Rs. 200 retail delivery pricing.
                      </p>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="space-y-3">
                    {items.map((item, idx) => {
                      const wholesaleItemPKR = usdToPkr(item.product.supplierCost) + (item.selectedVariant?.extraPrice ? Math.round(item.selectedVariant.extraPrice * 280) : 0);
                      const customerItemPKR = isResellerOrder ? (wholesaleItemPKR + resellerProfitPerUnit) : (wholesaleItemPKR + 200);

                      return (
                        <div
                          key={`${item.product.id}-${idx}`}
                          className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
                        >
                          <img
                            src={item.product.images[0]}
                            alt={item.product.title}
                            className="w-16 h-16 rounded-lg object-cover bg-white shrink-0 border border-slate-200"
                          />
                          <div className="flex-1 flex flex-col justify-between">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                                  {item.product.title}
                                </h4>
                                {item.selectedVariant && (
                                  <span className="text-[11px] text-slate-500 block">
                                    Option: {item.selectedVariant.name}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => onRemoveItem(idx)}
                                className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Price breakdown for Reseller vs Customer */}
                            <div className="flex items-center justify-between pt-1">
                              <div>
                                <div className="font-extrabold text-xs text-slate-900">
                                  {formatAmount(customerItemPKR * item.quantity)}
                                </div>
                                {isResellerOrder && (
                                  <span className="text-[10px] text-emerald-700 font-semibold block">
                                    Wholesale: {formatAmount(wholesaleItemPKR * item.quantity)}
                                  </span>
                                )}
                              </div>

                              <div className="inline-flex items-center border border-slate-200 rounded-lg bg-white">
                                <button
                                  onClick={() => onUpdateQuantity(idx, Math.max(1, item.quantity - 1))}
                                  className="px-2 py-0.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2 text-xs font-bold text-slate-800">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                                  className="px-2 py-0.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Promo Voucher */}
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                    <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-600" />
                      Discount Voucher
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Try APNA20"
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg uppercase font-mono tracking-wider outline-hidden"
                      />
                      <button
                        onClick={handleApplyPromo}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                    {promoMessage && (
                      <p className={`text-[11px] font-medium ${appliedDiscountRate > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {promoMessage}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {checkoutStep === 'checkout' && (
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              {/* Reseller Dispatch Alert */}
              {isResellerOrder ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>White-Label Reseller Order Active</span>
                  </div>
                  <p className="text-[11px]">
                    The parcel flyer will display your store name. Customer pays COD of <strong>{formatAmount(totalPKR)}</strong>. Your net profit of <strong>+{formatPKR(totalResellerProfitPKR)}</strong> will be credited directly to your mobile wallet.
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Express Doorstep Delivery with inspection before payment.</span>
                </div>
              )}

              {/* Step 1: Customer Details */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                  1. Customer Delivery Details
                </h3>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {isResellerOrder ? 'Customer Name *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone Number (For COD Rider) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      City *
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden bg-white"
                    >
                      <option value="Lahore">Lahore</option>
                      <option value="Karachi">Karachi</option>
                      <option value="Islamabad">Islamabad</option>
                      <option value="Rawalpindi">Rawalpindi</option>
                      <option value="Faisalabad">Faisalabad</option>
                      <option value="Multan">Multan</option>
                      <option value="Peshawar">Peshawar</option>
                      <option value="Quetta">Quetta</option>
                      <option value="Sialkot">Sialkot</option>
                      <option value="Gujranwala">Gujranwala</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Complete Delivery Address *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Shop #, Street name, Area/Sector, Near landmark..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Order Note / Delivery Instructions (Optional)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">For courier rider</span>
                  </div>
                  <textarea
                    rows={2}
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="e.g. Call before arrival, deliver after 2 PM, leave parcel at gate security, near landmark..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden resize-none bg-white transition-all shadow-2xs"
                  />
                  {/* Quick Preset Delivery Instruction Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {[
                      'Call before arrival',
                      'Deliver after 2 PM',
                      'Leave with security / neighbor',
                      'Fragile: Handle with care'
                    ].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => {
                          setOrderNote((prev) => {
                            if (!prev.trim()) return preset;
                            if (prev.includes(preset)) return prev;
                            return `${prev.trim()}, ${preset}`;
                          });
                        }}
                        className="text-[10px] bg-slate-100 hover:bg-amber-100 hover:text-amber-900 border border-slate-200 hover:border-amber-300 text-slate-600 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                        title={`Add "${preset}" to instructions`}
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2: Reseller White-Label Branding (Only when Reseller Order) */}
              {isResellerOrder && (
                <div className="space-y-3 pt-3 border-t border-slate-200 bg-slate-50 p-3 rounded-2xl border">
                  <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <Store className="w-3.5 h-3.5 text-amber-600" />
                    <span>2. White-Label Courier Label & Payout</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Your Business Name on Parcel Flyer *
                    </label>
                    <input
                      type="text"
                      required
                      value={resellerFlyerBrand}
                      onChange={(e) => setResellerFlyerBrand(e.target.value)}
                      placeholder="e.g. Modern Deals Store"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:border-amber-500 outline-hidden"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      This name will be printed as the Sender on the TCS/Trax COD label.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Payout Wallet
                      </label>
                      <select
                        value={resellerPayoutMethod}
                        onChange={(e) => setResellerPayoutMethod(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="JazzCash">JazzCash</option>
                        <option value="EasyPaisa">EasyPaisa</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Account / Mobile #
                      </label>
                      <input
                        type="text"
                        value={resellerPayoutAccount}
                        onChange={(e) => setResellerPayoutAccount(e.target.value)}
                        placeholder="0300-1234567"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Payment Method Selector */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                  {isResellerOrder ? '3. Customer Collection Method' : '2. Payment Method'}
                </h3>

                <div className="space-y-2">
                  <label
                    onClick={() => setPaymentMethod('Cash on Delivery (COD)')}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      paymentMethod === 'Cash on Delivery (COD)'
                        ? 'border-amber-600 bg-amber-50/80 ring-1 ring-amber-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-bold text-slate-900 block">Cash on Delivery (COD)</span>
                        <span className="text-[11px] text-slate-500">
                          {isResellerOrder ? 'Rider collects COD and deposits into your wallet' : 'Pay cash directly to courier rider at your door'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      RECOMMENDED
                    </span>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('JazzCash / EasyPaisa')}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      paymentMethod === 'JazzCash / EasyPaisa'
                        ? 'border-amber-600 bg-amber-50/80 ring-1 ring-amber-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="font-bold text-slate-900 block">JazzCash / EasyPaisa Wallet</span>
                        <span className="text-[11px] text-slate-500">Direct mobile payment checkout</span>
                      </div>
                    </div>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('Card Payment')}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      paymentMethod === 'Card Payment'
                        ? 'border-amber-600 bg-amber-50/80 ring-1 ring-amber-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="font-bold text-slate-900 block">Credit / Debit Card</span>
                        <span className="text-[11px] text-slate-500">Visa, Mastercard, PayPak</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </form>
          )}

          {checkoutStep === 'success' && lastPlacedOrder && (
            <div className="space-y-5 text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-black text-xl text-slate-900">
                  {lastPlacedOrder.isResellerOrder ? 'Reseller Order Booked Successfully!' : 'Order Placed Successfully!'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Thank you, <strong>{lastPlacedOrder.customerName}</strong>! Order dispatched via TCS Express.
                </p>
              </div>

              {/* Order Info Badge */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-mono font-bold text-slate-900">{lastPlacedOrder.id}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Tracking Number:</span>
                  <span className="font-mono font-bold text-amber-700">{lastPlacedOrder.trackingNumber}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Courier Partner:</span>
                  <span className="font-bold text-slate-800">{lastPlacedOrder.carrier}</span>
                </div>

                {lastPlacedOrder.isResellerOrder && (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500">Sender on Courier Flyer:</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {lastPlacedOrder.resellerBrandName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500">Your Reseller Profit:</span>
                      <span className="font-black text-emerald-700 text-sm">
                        +{formatPKR(lastPlacedOrder.resellerProfitTotalPKR || 0)}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Customer COD to Collect:</span>
                  <span className="font-black text-slate-900 text-sm">
                    {formatAmount(totalPKR)}
                  </span>
                </div>

                {(lastPlacedOrder.orderNote || lastPlacedOrder.notes) && (
                  <div className="flex items-start justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-500 shrink-0">Special Delivery Instructions:</span>
                    <span className="font-medium text-slate-800 italic max-w-[240px] text-right pl-2">
                      "{lastPlacedOrder.orderNote || lastPlacedOrder.notes}"
                    </span>
                  </div>
                )}
              </div>

              {lastPlacedOrder.isResellerOrder ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 text-left flex items-start gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Your profit of <strong>+{formatPKR(lastPlacedOrder.resellerProfitTotalPKR || 0)}</strong> has been registered in your Reseller Wallet. It will clear automatically upon parcel delivery.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 text-left flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Our rider will contact <strong>{lastPlacedOrder.phone}</strong> before arrival. Please keep the exact amount ready upon delivery.
                  </span>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                {lastPlacedOrder.isResellerOrder && onOpenResellerPortal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenResellerPortal();
                    }}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    View Munafa Wallet
                  </button>
                )}
                <button
                  onClick={() => {
                    setCheckoutStep('cart');
                    onClose();
                  }}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer (Only on cart or checkout steps) */}
        {checkoutStep !== 'success' && items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3">
            {/* Price Breakdown */}
            <div className="space-y-1.5 text-xs">
              {isResellerOrder ? (
                <>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Wholesale Cost (Your Base Cost):</span>
                    <span>{formatAmount(totalWholesalePKR)}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-700 font-bold">
                    <span>Your Reseller Profit (+Rs. {resellerProfitPerUnit}/item):</span>
                    <span>+{formatPKR(totalResellerProfitPKR)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Doorstep Courier Fee:</span>
                    <span>{shippingFeePKR === 0 ? <strong className="text-emerald-600">FREE</strong> : formatAmount(shippingFeePKR)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-900 font-black text-sm pt-1.5 border-t border-slate-200">
                    <span>Customer COD to Collect:</span>
                    <span>{formatAmount(totalPKR)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatAmount(subtotalPKR)}</span>
                  </div>
                  {appliedDiscountRate > 0 && (
                    <div className="flex items-center justify-between text-emerald-700 font-medium">
                      <span>Voucher Discount:</span>
                      <span>-{formatAmount(discountPKR)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Doorstep Courier Delivery:</span>
                    <span>{shippingFeePKR === 0 ? <strong className="text-emerald-600">FREE</strong> : formatAmount(shippingFeePKR)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-900 font-black text-sm pt-1.5 border-t border-slate-200">
                    <span>Total Order Amount:</span>
                    <span>{formatAmount(totalPKR)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Step Action Buttons */}
            {checkoutStep === 'cart' ? (
              <button
                onClick={() => setCheckoutStep('checkout')}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
              >
                <span>{isResellerOrder ? 'Proceed to Reseller Dispatch' : 'Proceed to Checkout'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <span>Routing Order to Courier...</span>
                  ) : (
                    <span>Confirm Order ({paymentMethod.includes('COD') ? 'Cash on Delivery' : 'Pay Now'})</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
