import React from 'react';
import { 
  ShieldCheck, 
  Truck, 
  Banknote, 
  RotateCcw, 
  Sparkles, 
  TrendingUp, 
  Star,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { CurrencyCode } from '../types/dropship';
import { formatPrice } from '../utils/currency';

interface HeroBannerProps {
  currency: CurrencyCode;
  onExploreClick: () => void;
  onOpenSourcing: () => void;
  isResellerMode?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  currency,
  onExploreClick,
  onOpenSourcing,
  isResellerMode = false,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white py-10 md:py-14">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Main Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isResellerMode 
                  ? 'Reseller Wholesale Mode: Base Factory Price + Rs. 200 Munafa'
                  : 'Direct Factory Dropshipping & Wholesale Hub'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              {isResellerMode ? (
                <>
                  Earn Daily from Home —{' '}
                  <span className="bg-gradient-to-r from-emerald-400 via-amber-300 to-amber-200 bg-clip-text text-transparent">
                    Wholesale Products
                  </span>{' '}
                  with White-Label Delivery.
                </>
              ) : (
                <>
                  Apna Store —{' '}
                  <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
                    Trending Viral Products
                  </span>{' '}
                  at Direct Factory Prices.
                </>
              )}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm md:text-base max-w-xl leading-relaxed">
              {isResellerMode ? (
                <>
                  Resellers get 100% factory wholesale rates. Direct customers pay <strong>+Rs. 200</strong>. Share products to WhatsApp, book COD orders with your store name, and receive your munafa via <strong>JazzCash / EasyPaisa</strong>.
                </>
              ) : (
                <>
                  Skip middlemen markups. We source viral TikTok & Instagram hits directly from certified manufacturers with reliable doorstep <strong>Cash on Delivery (COD)</strong> across Pakistan.
                </>
              )}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onExploreClick}
                className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all flex items-center gap-2 cursor-pointer text-xs sm:text-sm active:scale-95"
              >
                <span>{isResellerMode ? 'Browse Wholesale Products' : 'Shop Trending Deals'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-amber-400 shrink-0" />
                <span>100% Cash on Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Fast Express Courier</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
                <span>7-Day Return Check</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Verified Quality Sealed</span>
              </div>
            </div>
          </div>

          {/* Featured Dropship Card Spotlight */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-md uppercase tracking-wider text-[10px]">
                  #1 Viral Dropship Pick
                </span>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-white">4.9</span>
                  <span className="text-slate-400">(340+ verified buyers)</span>
                </div>
              </div>

              <div className="relative aspect-4/3 rounded-xl overflow-hidden mb-4 group bg-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80"
                  alt="AuraWave Pro ANC Earbuds"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2.5 left-2.5 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Only 8 units left in hub</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-lg text-white">AuraWave Pro ANC Wireless Earbuds</h3>
                <p className="text-xs text-slate-300">
                  Active -38dB Noise Cancelling • 42H Battery • Qi Wireless Charging
                </p>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <div className="text-xl font-extrabold text-amber-400">
                      {formatPrice(38.99, currency)}
                    </div>
                    <div className="text-xs text-slate-400 line-through">
                      {formatPrice(79.99, currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      51% Off Direct Sourcing
                    </span>
                    <span className="text-[10px] text-slate-400 block">Sourced via Shenzhen Apex Direct</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
