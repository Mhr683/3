import React from 'react';
import { 
  Sparkles, 
  Store, 
  Building2, 
  Wallet, 
  FileSpreadsheet, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  BadgeCheck, 
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { UserAccount, CurrencyCode } from '../types/dropship';
import { formatPKR } from '../utils/currency';

interface WelcomeBackBannerProps {
  user: UserAccount | null;
  onDismiss: () => void;
  onOpenWallet: () => void;
  onOpenMerchant: () => void;
  onOpenCatalog: () => void;
  resellerWalletBalancePKR: number;
  currency: CurrencyCode;
}

export const WelcomeBackBanner: React.FC<WelcomeBackBannerProps> = ({
  user,
  onDismiss,
  onOpenWallet,
  onOpenMerchant,
  onOpenCatalog,
  resellerWalletBalancePKR,
}) => {
  if (!user) return null;

  const isReseller = user.role === 'reseller';

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white border-b border-amber-500/30 px-4 py-2.5 sm:py-3 shadow-md animate-in slide-in-from-top-3 duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left greeting & identity */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-md ${
              isReseller ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'
            }`}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover rounded-xl" />
              ) : (
                isReseller ? <Store className="w-5 h-5" /> : <Building2 className="w-5 h-5" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-300 font-medium">Welcome Back,</span>
              <span className="font-extrabold text-sm text-white">{user.fullName}!</span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                isReseller
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                <BadgeCheck className="w-3 h-3" />
                {isReseller ? 'Verified Reseller Partner' : 'Official Wholesale Factory'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xl">
              {isReseller
                ? `Active Store: "${user.brandName || 'Apna Reseller'}" • Munafa Balance: ${formatPKR(resellerWalletBalancePKR)} • Ready for COD order dispatch.`
                : `Supply Hub: "${user.companyName || 'Factory Sourcing'}" • ${user.warehouseLocation || 'Karachi/Lahore Warehouse'} • Dispatch: ${user.dispatchTime || '24 hrs'}.`}
            </p>
          </div>
        </div>

        {/* Right quick actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
          {isReseller ? (
            <>
              <button
                onClick={onOpenWallet}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Munafa Wallet ({formatPKR(resellerWalletBalancePKR)})</span>
              </button>

              <button
                onClick={onOpenCatalog}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Wholesale Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onOpenMerchant}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Supplier Merchant Hub</span>
              </button>

              <button
                onClick={onOpenCatalog}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
