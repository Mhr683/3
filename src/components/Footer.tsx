import React from 'react';
import { 
  Store, 
  Truck, 
  ShieldCheck, 
  Banknote, 
  Headphones, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { CurrencyCode } from '../types/dropship';

interface FooterProps {
  currency: CurrencyCode;
  onOpenTracking: () => void;
  onOpenMerchant: () => void;
  onOpenSourcing: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  currency,
  onOpenTracking,
  onOpenMerchant,
  onOpenSourcing,
}) => {
  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 space-y-10">
        {/* Value Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-8 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Cash on Delivery (COD)</h4>
              <p className="text-slate-400 mt-0.5">Pay safely at your doorstep with zero risk.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Express Air Dispatch</h4>
              <p className="text-slate-400 mt-0.5">Automated fulfillment via TCS & Leopards.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">7-Day Return Guarantee</h4>
              <p className="text-slate-400 mt-0.5">Full replacement if damaged in transit.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Dedicated WhatsApp Support</h4>
              <p className="text-slate-400 mt-0.5">Live order and courier status help.</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-xs">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white">
                <Store className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-white font-display">
                Apna<span className="text-amber-500">Store</span>
              </span>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                Dropship Direct
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Apna Store bridges direct factory manufacturers and local retail consumers with verified Cash on Delivery, instant wholesale margins, and reliable doorstep fulfillment.
            </p>
          </div>

          {/* Quick Nav */}
          <div className="md:col-span-3 space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Customer Service
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <button onClick={onOpenTracking} className="hover:text-amber-400 transition-colors">
                  Track My Parcel
                </button>
              </li>
              <li>
                <a href="#trending" className="hover:text-amber-400 transition-colors">
                  Trending Viral Products
                </a>
              </li>
              <li>
                <span className="text-slate-500">Delivery Timelines (3-5 Days)</span>
              </li>
              <li>
                <span className="text-slate-500">Cash on Delivery Policy</span>
              </li>
            </ul>
          </div>

          {/* Dropship Hub */}
          <div className="md:col-span-4 space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Dropshipper & Merchant Hub
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <button onClick={onOpenMerchant} className="hover:text-amber-400 transition-colors">
                  Merchant Operations Dashboard
                </button>
              </li>
              <li>
                <button onClick={onOpenSourcing} className="hover:text-amber-400 transition-colors">
                  Wholesale Supplier Sourcing Catalog
                </button>
              </li>
              <li>
                <span className="text-slate-500">Automated Courier Dispatch (TCS / Leopards)</span>
              </li>
              <li>
                <span className="text-slate-500">Gross Margin & Profit Tracker</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Apna Store (drop-shiper). Built for high-volume dropshipping & direct wholesale sourcing.
          </div>
          <div className="flex items-center gap-4">
            <span>Verified SSL 256-Bit Encryption</span>
            <span>•</span>
            <span>Direct Sourcing Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
