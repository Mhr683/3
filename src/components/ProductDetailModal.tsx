import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Star, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Banknote, 
  Check, 
  ShoppingBag, 
  TrendingUp, 
  Package, 
  ChevronRight,
  Info,
  Bell,
  BellRing,
  AlertCircle,
  Zap,
  Trash2,
  Edit3,
  Mail,
  MessageSquare,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  Heart,
  Share2,
  Activity,
  Calendar,
  Target,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine
} from 'recharts';
import { Product, CurrencyCode, ProductVariant, ProductReview, PriceAlert } from '../types/dropship';
import { formatPrice, usdToPkr, formatPKR, pkrToUsd, convertAmount, toUsd, CURRENCIES } from '../utils/currency';
import { ProductReviewsSection } from './ProductReviewsSection';

export interface WholesalePriceHistoryPoint {
  day: number;
  date: string;
  fullDate: string;
  costUSD: number;
  costInCurrency: number;
  costFormatted: string;
}

interface ProductDetailModalProps {
  product: Product | null;
  currency: CurrencyCode;
  onClose: () => void;
  onAddToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  onBuyNow: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  onAddReview: (productId: string, review: Omit<ProductReview, 'id' | 'date'>) => void;
  isResellerMode?: boolean;
  onShareProduct?: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  priceAlert?: PriceAlert | null;
  onSetPriceAlert?: (alertData: {
    productId: string;
    productTitle: string;
    productImage: string;
    currentWholesaleCost: number;
    targetWholesaleCost: number;
    channel: 'in_app' | 'email' | 'whatsapp';
    email?: string;
    phone?: string;
  }) => void;
  onRemovePriceAlert?: (productId: string) => void;
  onSimulatePriceDrop?: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  currency,
  onClose,
  onAddToCart,
  onBuyNow,
  onAddReview,
  isResellerMode = false,
  onShareProduct,
  onToggleWishlist,
  priceAlert,
  onSetPriceAlert,
  onRemovePriceAlert,
  onSimulatePriceDrop,
}) => {
  if (!product) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants.options[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [showMarginBreakdown, setShowMarginBreakdown] = useState(false);

  // Price alert state
  const [showPriceAlertSection, setShowPriceAlertSection] = useState(false);
  const [targetCostInput, setTargetCostInput] = useState<string>('');
  const [alertChannel, setAlertChannel] = useState<'in_app' | 'email' | 'whatsapp'>('in_app');
  const [alertEmail, setAlertEmail] = useState('specialforme683@gmail.com');
  const [alertPhone, setAlertPhone] = useState('+92 300 1234567');
  const [alertSuccessBanner, setAlertSuccessBanner] = useState<string | null>(null);
  const priceAlertSectionRef = useRef<HTMLDivElement>(null);

  // Calculate current wholesale in active currency
  const currentWholesaleConverted = convertAmount(product.supplierCost, currency);

  // Initialize target threshold (default to 10% below current wholesale)
  useEffect(() => {
    if (priceAlert) {
      const existingInCurr = convertAmount(priceAlert.targetWholesaleCost, currency);
      setTargetCostInput(currency === 'PKR' || currency === 'INR' ? Math.round(existingInCurr).toString() : existingInCurr.toFixed(2));
      setAlertChannel(priceAlert.channel);
      if (priceAlert.email) setAlertEmail(priceAlert.email);
      if (priceAlert.phone) setAlertPhone(priceAlert.phone);
    } else {
      const defaultTarget = currentWholesaleConverted * 0.9;
      setTargetCostInput(currency === 'PKR' || currency === 'INR' ? Math.round(defaultTarget).toString() : defaultTarget.toFixed(2));
    }
  }, [product.id, currency, priceAlert, currentWholesaleConverted]);

  const extraPrice = selectedVariant?.extraPrice || 0;
  const currentRetailPrice = product.retailPrice + extraPrice;
  const grossProfit = currentRetailPrice - product.supplierCost;
  const marginPercent = Math.round((grossProfit / currentRetailPrice) * 100);

  // Target threshold in USD
  const parsedTargetNumber = parseFloat(targetCostInput) || 0;
  const targetThresholdUSD = toUsd(parsedTargetNumber, currency);
  const savingsPerUnit = Math.max(0, currentWholesaleConverted - parsedTargetNumber);
  const newGrossProfitUSD = currentRetailPrice - targetThresholdUSD;
  const newGrossProfitConverted = convertAmount(newGrossProfitUSD, currency);

  // Generate deterministic 30-day wholesale price fluctuations ending at current cost
  const costHistory = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < product.id.length; i++) {
      seed = (seed * 37 + product.id.charCodeAt(i)) % 100000;
    }
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const today = new Date();
    const points: WholesalePriceHistoryPoint[] = [];
    const currentCostUSD = product.supplierCost;

    // Generate random walk backward from day 30 (today)
    const factors: number[] = new Array(30);
    factors[29] = 1.0;
    let curr = 1.0;
    for (let d = 28; d >= 0; d--) {
      const delta = (pseudoRandom() - 0.49) * 0.05;
      curr = Math.max(0.84, Math.min(1.22, curr + delta));
      factors[d] = curr;
    }

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      const factor = factors[i];
      const costUSD = i === 29 ? currentCostUSD : Number((currentCostUSD * factor).toFixed(2));
      const costInCurrency = convertAmount(costUSD, currency);
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const day = d.getDate();

      points.push({
        day: i + 1,
        date: i === 29 ? 'Today' : `${month} ${day}`,
        fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        costUSD,
        costInCurrency,
        costFormatted: formatPrice(costUSD, currency),
      });
    }

    return points;
  }, [product.id, product.supplierCost, currency]);

  const historyStats = useMemo(() => {
    if (!costHistory.length) {
      return { minUSD: 0, maxUSD: 0, avgUSD: 0, minInCurr: 0, maxInCurr: 0, avgInCurr: 0, volatilityPct: 0 };
    }
    const costsUSD: number[] = costHistory.map((p: WholesalePriceHistoryPoint) => p.costUSD);
    const minUSD = Math.min(...costsUSD);
    const maxUSD = Math.max(...costsUSD);
    const avgUSD = Number((costsUSD.reduce((a: number, b: number) => a + b, 0) / costsUSD.length).toFixed(2));

    const minInCurr = convertAmount(minUSD, currency);
    const maxInCurr = convertAmount(maxUSD, currency);
    const avgInCurr = convertAmount(avgUSD, currency);
    const volatilityPct = Math.round(((maxUSD - minUSD) / avgUSD) * 100);

    return { minUSD, maxUSD, avgUSD, minInCurr, maxInCurr, avgInCurr, volatilityPct };
  }, [costHistory, currency]);

  const setTargetFromHistorical = (amountInCurr: number) => {
    setTargetCostInput(
      currency === 'PKR' || currency === 'INR' ? Math.round(amountInCurr).toString() : amountInCurr.toFixed(2)
    );
  };

  const handleApplyPreset = (percentDiscount: number) => {
    const discounted = currentWholesaleConverted * (1 - percentDiscount / 100);
    setTargetCostInput(
      currency === 'PKR' || currency === 'INR' ? Math.round(discounted).toString() : discounted.toFixed(2)
    );
  };

  const handleSaveAlert = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!parsedTargetNumber || parsedTargetNumber <= 0) return;

    if (onSetPriceAlert) {
      onSetPriceAlert({
        productId: product.id,
        productTitle: product.title,
        productImage: product.images[0],
        currentWholesaleCost: product.supplierCost,
        targetWholesaleCost: targetThresholdUSD,
        channel: alertChannel,
        email: alertChannel === 'email' ? alertEmail : undefined,
        phone: alertChannel === 'whatsapp' ? alertPhone : undefined,
      });

      setAlertSuccessBanner(`Price alert successfully activated! You'll be notified when wholesale cost drops below ${formatPrice(targetThresholdUSD, currency)}.`);
      setTimeout(() => {
        setAlertSuccessBanner(null);
      }, 4000);
    }
  };

  const scrollToPriceAlert = () => {
    setShowPriceAlertSection(true);
    setTimeout(() => {
      priceAlertSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Store</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-amber-700">{product.category}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="truncate max-w-[180px] sm:max-w-xs">{product.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Set Price Alert Button */}
            <button
              type="button"
              onClick={scrollToPriceAlert}
              className={`p-1.5 px-2.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                priceAlert
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-xs ring-2 ring-amber-300'
                  : 'text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              }`}
              title={priceAlert ? `Active Alert: < ${formatPrice(priceAlert.targetWholesaleCost, currency)}` : "Set Wholesale Price Alert"}
            >
              <BellRing className={`w-3.5 h-3.5 ${priceAlert ? 'fill-current animate-bounce text-slate-950' : 'text-amber-600'}`} />
              <span className="hidden sm:inline">
                {priceAlert ? `Alert: < ${formatPrice(priceAlert.targetWholesaleCost, currency)}` : 'Set Price Alert'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onToggleWishlist && onToggleWishlist(product.id)}
              className={`p-1.5 px-2.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                product.isWishlisted 
                  ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                  : 'text-slate-600 hover:text-rose-600 hover:bg-slate-200/60'
              }`}
              title={product.isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
            >
              <Heart className={`w-3.5 h-3.5 ${product.isWishlisted ? 'fill-current text-rose-600' : ''}`} />
              <span className="hidden sm:inline">{product.isWishlisted ? 'Wishlisted' : 'Save to Wishlist'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column: Image Gallery */}
          <div className="md:col-span-6 space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-md uppercase">
                Dropship Verified
              </div>

              {/* Heart Wishlist Overlay Button */}
              <button
                type="button"
                onClick={() => onToggleWishlist && onToggleWishlist(product.id)}
                className={`absolute top-3 right-3 p-2.5 rounded-full shadow-lg transition-all duration-200 cursor-pointer ${
                  product.isWishlisted 
                    ? 'bg-rose-600 text-white hover:bg-rose-700 scale-105 ring-2 ring-rose-300' 
                    : 'bg-white/90 backdrop-blur-md text-slate-700 hover:text-rose-600 hover:bg-white'
                }`}
                title={product.isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`w-4 h-4 ${product.isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIndex === idx ? 'border-amber-600 scale-102' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Sourcing & Logistics Guarantee Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2.5">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-600" />
                  Sourced Direct from Factory
                </span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {product.supplier.location}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[11px]">Inventory SKU</span>
                  <span className="font-mono font-bold text-slate-900 text-xs bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                    {product.sku || product.id.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Supplier Partner</span>
                  <span className="font-semibold text-slate-800">{product.supplier.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Dispatch Speed</span>
                  <span className="font-semibold text-emerald-600">{product.supplier.dispatchTime}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Estimated Delivery</span>
                  <span className="font-semibold text-slate-800">{product.supplier.avgDeliveryDays}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Warranty & Return</span>
                  <span className="font-semibold text-slate-800">{product.supplier.returnPolicy}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Options & Actions */}
          <div className="md:col-span-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    {product.category}
                  </span>

                  {/* Prominent SKU Badge */}
                  <div className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-2.5 py-0.5 rounded-lg font-mono text-xs font-black tracking-wider shadow-xs border border-slate-800">
                    <span className="text-[10px] text-amber-400 font-sans font-bold uppercase tracking-normal">SKU:</span>
                    <span className="text-amber-300 font-bold">{selectedVariant?.sku || product.sku || product.id.toUpperCase()}</span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-700 text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{product.rating.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('reviews-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-slate-500 hover:text-amber-700 underline transition-colors cursor-pointer"
                    >
                      ({product.reviewsCount} customer reviews)
                    </button>
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  {product.title}
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  {product.tagline}
                </p>
              </div>

              {/* Price Banner */}
              {isResellerMode ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Reseller Wholesale Tier (Direct Factory)
                    </span>
                    <span className="text-xs font-black text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                      Guaranteed Profit: +Rs. 200
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-white p-2 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-500 block">Wholesale Rate</span>
                      <span className="font-black text-slate-900 text-sm">
                        {formatPKR(usdToPkr(product.supplierCost))}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-500 block">Customer Price</span>
                      <span className="font-black text-slate-900 text-sm">
                        {formatPKR(usdToPkr(product.supplierCost) + 200)}
                      </span>
                    </div>

                    <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-xs">
                      <span className="text-[10px] text-emerald-100 block">Your Profit</span>
                      <span className="font-black text-white text-sm">
                        +Rs. 200
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-800">
                    When you place this order for your customer, Apna Store collects the COD amount and transfers your +Rs. 200 profit directly to your JazzCash / EasyPaisa wallet.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      {currency === 'PKR' ? formatPKR(usdToPkr(product.supplierCost) + 200) : formatPrice(pkrToUsd(usdToPkr(product.supplierCost) + 200), currency)}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 line-through">
                        {currency === 'PKR' ? formatPKR(usdToPkr(product.supplierCost) + 1000) : formatPrice(product.originalPrice, currency)}
                      </span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        Wholesale + Rs. 200 Markup
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100/80 font-bold text-xs px-2.5 py-1 rounded-md">
                      <Banknote className="w-3.5 h-3.5" />
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Pay cash upon doorstep inspection
                    </span>
                  </div>
                </div>
              )}

              {/* Dropship Margin Inspector (Toggle) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setShowMarginBreakdown(!showMarginBreakdown)}
                  className="w-full px-3.5 py-2 bg-slate-100/80 hover:bg-slate-200/60 flex items-center justify-between font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    Dropship Economics & Margin Breakdown
                  </span>
                  <span className="text-[11px] text-amber-700 underline">
                    {showMarginBreakdown ? 'Hide details' : 'Show breakdown'}
                  </span>
                </button>

                {showMarginBreakdown && (
                  <div className="p-3 bg-white space-y-2 border-t border-slate-200 animate-in fade-in duration-150">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Supplier Cost</span>
                        <span className="font-bold text-slate-800">{formatPrice(product.supplierCost, currency)}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Retail Price</span>
                        <span className="font-bold text-slate-800">{formatPrice(currentRetailPrice, currency)}</span>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                        <span className="text-[10px] text-emerald-700 block">Gross Profit</span>
                        <span className="font-black text-emerald-800">{formatPrice(grossProfit, currency)} ({marginPercent}%)</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      When a customer buys this item, our system automatically routes the order to {product.supplier.name} for fulfillment while retaining {formatPrice(grossProfit, currency)} net profit margin.
                    </p>
                  </div>
                )}
              </div>

              {/* Set Wholesale Price Alert Interactive Section */}
              <div 
                ref={priceAlertSectionRef} 
                className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                  priceAlert?.isTriggered
                    ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                    : priceAlert
                    ? 'border-amber-300 bg-amber-50/40 shadow-xs'
                    : 'border-slate-200 bg-gradient-to-b from-slate-50/60 to-white'
                }`}
              >
                {/* Section Header / Summary Bar */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      priceAlert?.isTriggered
                        ? 'bg-emerald-600 text-white'
                        : priceAlert
                        ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      <BellRing className={`w-4 h-4 ${priceAlert ? 'animate-bounce' : ''}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                          Wholesale Price Drop Alert
                        </span>
                        {priceAlert?.isTriggered ? (
                          <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                            <Sparkles className="w-3 h-3" />
                            DROPPED BELOW TARGET!
                          </span>
                        ) : priceAlert ? (
                          <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-600/30">
                            Active: Below {formatPrice(priceAlert.targetWholesaleCost, currency)}
                          </span>
                        ) : (
                          <span className="bg-slate-200/80 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Supplier Sourcing
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {priceAlert?.isTriggered
                          ? 'Supplier wholesale cost fell below your target! Order now to maximize profit.'
                          : priceAlert
                          ? `Monitoring factory cost. We will notify you when it drops below ${formatPrice(priceAlert.targetWholesaleCost, currency)}.`
                          : 'Get notified immediately when factory suppliers reduce wholesale costs.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPriceAlertSection(!showPriceAlertSection)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-2xs transition-colors shrink-0 cursor-pointer"
                  >
                    {showPriceAlertSection ? 'Close' : priceAlert ? 'Manage Alert' : 'Set Alert'}
                  </button>
                </div>

                {/* Success Banner if just set */}
                {alertSuccessBanner && (
                  <div className="mx-3.5 mb-3 p-2.5 bg-emerald-100/90 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-semibold">{alertSuccessBanner}</span>
                  </div>
                )}

                {/* Expanded Alert Configuration Form */}
                {showPriceAlertSection && (
                  <div className="p-3.5 pt-1 border-t border-slate-200/80 space-y-3.5 bg-white/90">
                    {/* Triggered Alert Congratulatory Card */}
                    {priceAlert?.isTriggered && (
                      <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-black text-emerald-900">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Supplier Price Reduction Detected!</span>
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          Factory cost dropped to <strong>{formatPrice(product.supplierCost, currency)}</strong>, beating your target of <strong>{formatPrice(priceAlert.targetWholesaleCost, currency)}</strong>!
                        </p>
                      </div>
                    )}

                    {/* 30-Day Wholesale Cost Fluctuations Recharts Line Chart */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/90 space-y-2.5">
                      {/* Chart Header & Trend Pill */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
                            <Activity className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <span>30-Day Wholesale Cost Fluctuations</span>
                              <span className="text-[10px] text-slate-400 font-normal">({product.supplier.name})</span>
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              Factory price trend to help you identify the best alert threshold
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] font-bold">
                          <span className="bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            Last 30 Days
                          </span>
                          <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                            ±{historyStats.volatilityPct}% Volatility
                          </span>
                        </div>
                      </div>

                      {/* Metric Summary Stat Pills */}
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                          <span className="text-[10px] text-slate-400 block font-medium">30-Day Low</span>
                          <span className="text-xs font-black text-emerald-600 block">
                            {formatPrice(historyStats.minUSD, currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setTargetFromHistorical(historyStats.minInCurr)}
                            className="text-[9px] text-emerald-700 hover:text-emerald-900 underline font-bold mt-0.5 cursor-pointer block mx-auto"
                          >
                            Set as Target
                          </button>
                        </div>

                        <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                          <span className="text-[10px] text-slate-400 block font-medium">30-Day Average</span>
                          <span className="text-xs font-black text-slate-800 block">
                            {formatPrice(historyStats.avgUSD, currency)}
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            Baseline rate
                          </span>
                        </div>

                        <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                          <span className="text-[10px] text-slate-400 block font-medium">30-Day Peak</span>
                          <span className="text-xs font-black text-rose-600 block">
                            {formatPrice(historyStats.maxUSD, currency)}
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            Highest factory cost
                          </span>
                        </div>
                      </div>

                      {/* Recharts Area / Line Chart with Target Alert Reference Line */}
                      <div className="h-44 w-full pt-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={costHistory} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                            <defs>
                              <linearGradient id="wholesaleCostGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.7} />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 9, fill: '#64748b' }} 
                              tickLine={false} 
                              axisLine={{ stroke: '#cbd5e1' }}
                              interval={5}
                            />
                            <YAxis 
                              tick={{ fontSize: 9, fill: '#64748b' }} 
                              tickLine={false} 
                              axisLine={false}
                              domain={['dataMin - 1', 'dataMax + 1']}
                              tickFormatter={(val) => {
                                if (currency === 'PKR') {
                                  return `${Math.round(val)}`;
                                }
                                return `${val}`;
                              }}
                            />
                            <RechartsTooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const dataPoint = payload[0].payload as any;
                                  const diffFromToday = dataPoint.costInCurrency - currentWholesaleConverted;
                                  const diffPercent = Math.round((diffFromToday / currentWholesaleConverted) * 100);

                                  return (
                                    <div className="bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-800 space-y-1">
                                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        {dataPoint.fullDate}
                                      </div>
                                      <div className="text-sm font-black text-amber-400">
                                        {dataPoint.costFormatted}
                                      </div>
                                      <div className="text-[10px] flex items-center gap-1.5 pt-0.5 border-t border-slate-800">
                                        <span className="text-slate-400">vs Today:</span>
                                        {diffFromToday === 0 ? (
                                          <span className="text-slate-300 font-semibold">Current Price</span>
                                        ) : diffFromToday < 0 ? (
                                          <span className="text-emerald-400 font-bold">{diffPercent}% cheaper</span>
                                        ) : (
                                          <span className="text-rose-400 font-bold">+{diffPercent}% higher</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }} 
                            />
                            <Area 
                              type="monotone" 
                              dataKey="costInCurrency" 
                              stroke="#f59e0b" 
                              strokeWidth={2.5} 
                              fill="url(#wholesaleCostGrad)" 
                              dot={false}
                              activeDot={{ r: 5, fill: '#d97706', stroke: '#fff', strokeWidth: 2 }}
                            />
                            {/* Dynamic Reference Line for Target Alert Threshold */}
                            {parsedTargetNumber > 0 && (
                              <ReferenceLine 
                                y={parsedTargetNumber} 
                                stroke="#059669" 
                                strokeDasharray="4 4" 
                                strokeWidth={1.5}
                                label={{ 
                                  value: `Alert Target: ${formatPrice(targetThresholdUSD, currency)}`, 
                                  position: 'insideTopRight', 
                                  fill: '#059669', 
                                  fontSize: 10, 
                                  fontWeight: 700 
                                }} 
                              />
                            )}
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Fast Alert Suggestions based on History */}
                      <div className="pt-1.5 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-amber-600" />
                          Historical Target Shortcuts:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setTargetFromHistorical(historyStats.minInCurr)}
                            className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md font-bold text-[10px] transition-colors cursor-pointer"
                            title="Set alert to 30-day historical low"
                          >
                            Match 30D Low ({formatPrice(historyStats.minUSD, currency)})
                          </button>
                          <button
                            type="button"
                            onClick={() => setTargetFromHistorical(historyStats.avgInCurr * 0.95)}
                            className="px-2 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-md font-bold text-[10px] transition-colors cursor-pointer"
                            title="Set alert to 5% below 30-day average"
                          >
                            -5% Below Avg ({formatPrice(historyStats.avgUSD * 0.95, currency)})
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Current Cost vs Target Threshold */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Current Wholesale Rate
                        </span>
                        <div className="text-base font-black text-slate-900 mt-0.5">
                          {formatPrice(product.supplierCost, currency)}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Factory cost from {product.supplier.name}
                        </span>
                      </div>

                      <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-300/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                            Target Alert Threshold
                          </span>
                          <span className="text-[10px] font-bold text-amber-700">
                            Notify below this cost
                          </span>
                        </div>
                        <div className="relative mt-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                            {CURRENCIES[currency]?.symbol || '$'}
                          </span>
                          <input
                            type="number"
                            step="any"
                            value={targetCostInput}
                            onChange={(e) => setTargetCostInput(e.target.value)}
                            placeholder="Enter target wholesale price"
                            className="w-full pl-8 pr-3 py-1.5 bg-white text-sm font-black text-slate-900 rounded-lg border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Percentage Presets */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span>Quick Discount Presets:</span>
                        <span className="text-amber-700">Target below current wholesale</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 15, 20].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleApplyPreset(pct)}
                            className="py-1.5 px-2 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 hover:border-amber-300 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all text-center cursor-pointer"
                          >
                            -{pct}% Drop
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Projected Margin & Savings Preview */}
                    {parsedTargetNumber > 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-slate-700">
                          <span className="flex items-center gap-1 text-slate-600">
                            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                            Projected Profit Boost at Target Price:
                          </span>
                          <span className="text-emerald-700 font-black">
                            +{formatPrice(Math.max(0, savingsPerUnit / (CURRENCIES[currency]?.rate || 1)), currency)} per unit
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                          <div>
                            <span className="text-slate-400 block">New Gross Margin</span>
                            <span className="font-extrabold text-slate-900">
                              {formatPrice(Math.max(0, newGrossProfitUSD), currency)} per order
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Wholesale Sourcing Discount</span>
                            <span className="font-extrabold text-emerald-700">
                              {parsedTargetNumber < currentWholesaleConverted 
                                ? `${Math.round(((currentWholesaleConverted - parsedTargetNumber) / currentWholesaleConverted) * 100)}% cheaper` 
                                : 'Same rate'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notification Channel Selection */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-800 block">
                        Notification Delivery Channel:
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setAlertChannel('in_app')}
                          className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            alertChannel === 'in_app'
                              ? 'border-amber-500 bg-amber-50 text-amber-950 ring-1 ring-amber-400'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Bell className="w-3.5 h-3.5 text-amber-600" />
                          <span>In-App Badge</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAlertChannel('email')}
                          className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            alertChannel === 'email'
                              ? 'border-amber-500 bg-amber-50 text-amber-950 ring-1 ring-amber-400'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Mail className="w-3.5 h-3.5 text-amber-600" />
                          <span>Email Alert</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAlertChannel('whatsapp')}
                          className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            alertChannel === 'whatsapp'
                              ? 'border-amber-500 bg-amber-50 text-amber-950 ring-1 ring-amber-400'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                      </div>

                      {/* Channel input field */}
                      {alertChannel === 'email' && (
                        <div className="pt-1">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Your Email Address for Alerts:
                          </label>
                          <input
                            type="email"
                            value={alertEmail}
                            onChange={(e) => setAlertEmail(e.target.value)}
                            placeholder="Enter notification email"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden focus:border-amber-500"
                          />
                        </div>
                      )}

                      {alertChannel === 'whatsapp' && (
                        <div className="pt-1">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            WhatsApp / Mobile Number:
                          </label>
                          <input
                            type="tel"
                            value={alertPhone}
                            onChange={(e) => setAlertPhone(e.target.value)}
                            placeholder="+92 300 1234567"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden focus:border-amber-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveAlert()}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <BellRing className="w-3.5 h-3.5 text-amber-400" />
                          <span>{priceAlert ? 'Update Alert' : 'Activate Price Alert'}</span>
                        </button>

                        {/* Direct Simulation button so users can test price drops right away! */}
                        {priceAlert && onSimulatePriceDrop && (
                          <button
                            type="button"
                            onClick={() => onSimulatePriceDrop(product.id)}
                            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                            title="Simulate supplier price drop to test notification"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                            <span>Simulate Factory Drop</span>
                          </button>
                        )}
                      </div>

                      {priceAlert && onRemovePriceAlert && (
                        <button
                          type="button"
                          onClick={() => {
                            onRemovePriceAlert(product.id);
                            setShowPriceAlertSection(false);
                          }}
                          className="px-3 py-2 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Alert</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Variant Selector */}
              {product.variants.options.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-800">
                      Select {product.variants.type}: <span className="text-amber-700 font-normal">{selectedVariant.name}</span>
                    </label>
                    <span className="text-emerald-600 font-medium">In Stock</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.options.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                          selectedVariant.id === variant.id
                            ? 'border-amber-600 bg-amber-50 text-amber-950 shadow-xs ring-1 ring-amber-600'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {variant.name}
                        {variant.extraPrice ? ` (+${formatPrice(variant.extraPrice, currency)})` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs font-bold text-slate-800">Quantity:</span>
                <div className="inline-flex items-center border border-slate-200 rounded-xl bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-slate-900 font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-slate-400">
                  {product.stock} items remaining in warehouse
                </span>
              </div>

              {/* Product Key Features */}
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-slate-800 block">Key Highlights:</span>
                <ul className="text-xs text-slate-600 space-y-1">
                  {product.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 space-y-2.5">
              {isResellerMode && (
                <button
                  onClick={() => onShareProduct && onShareProduct(product)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share on WhatsApp (+Rs. 200 Profit)</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onAddToCart(product, selectedVariant, quantity)}
                  className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isResellerMode ? 'Add Wholesale' : 'Add to Bag'}</span>
                </button>
                <button
                  onClick={() => onBuyNow(product, selectedVariant, quantity)}
                  className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Order with COD</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Direct Buyer Protection
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                  Doorstep Check Before Pay
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Interactive Product Reviews & Ratings Section */}
        <div id="reviews-section">
          <ProductReviewsSection
            productId={product.id}
            reviews={product.reviews}
            overallRating={product.rating}
            reviewsCount={product.reviewsCount}
            onAddReview={(newReview) => onAddReview(product.id, newReview)}
          />
        </div>
      </div>
    </div>
  );
};
