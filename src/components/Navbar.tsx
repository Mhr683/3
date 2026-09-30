import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Truck, 
  Store, 
  ChevronDown, 
  Sparkles, 
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  X,
  Wallet,
  FileSpreadsheet,
  Layers,
  ArrowRightLeft,
  Heart,
  BellRing,
  User,
  UserPlus,
  LogIn,
  Building2,
  BadgeCheck
} from 'lucide-react';
import { CurrencyCode, UserAccount } from '../types/dropship';
import { CURRENCIES, formatPKR } from '../utils/currency';

interface NavbarProps {
  currentCurrency: CurrencyCode;
  onCurrencyChange: (curr: CurrencyCode) => void;
  cartCount: number;
  wishlistCount?: number;
  priceAlertsCount?: number;
  hasTriggeredAlerts?: boolean;
  onOpenPriceAlerts?: () => void;
  onOpenCart: () => void;
  onOpenTracking: () => void;
  activeView: 'store' | 'merchant';
  onToggleView: (view: 'store' | 'merchant') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenWholesaleCatalog: () => void;
  isResellerMode: boolean;
  onToggleResellerMode: () => void;
  onOpenResellerPortal: () => void;
  onOpenCsvModal: () => void;
  resellerWalletBalancePKR: number;
  availableCategories?: string[];
  currentUser: UserAccount | null;
  onOpenAuth: (mode?: 'login' | 'register' | 'profile') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCurrency,
  onCurrencyChange,
  cartCount,
  wishlistCount = 0,
  priceAlertsCount = 0,
  hasTriggeredAlerts = false,
  onOpenPriceAlerts,
  onOpenCart,
  onOpenTracking,
  activeView,
  onToggleView,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onOpenWholesaleCatalog,
  isResellerMode,
  onToggleResellerMode,
  onOpenResellerPortal,
  onOpenCsvModal,
  resellerWalletBalancePKR,
  availableCategories = [],
  currentUser,
  onOpenAuth,
}) => {
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  const baseCategories = [
    'All Categories',
    'Wishlist',
    'Trending Deals',
    'Electronics',
    'Home & Living',
    'Fashion & Beauty',
    'Fitness & Gadgets',
  ];

  const categories = Array.from(new Set([...baseCategories, ...availableCategories]));

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Banner Ticker */}
      <div className="bg-slate-900 text-white text-xs py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Announcement Text */}
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase">
              <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
              Reseller & Dropship
            </span>
            <span className="truncate text-slate-300 text-[11px] sm:text-xs">
              Resellers get <strong>Factory Wholesale Rates</strong> • Direct Customers get <strong>+Rs. 200</strong> retail pricing • 100% Cash on Delivery nationwide
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs">
            {/* Reseller Wallet Quick Action */}
            <button
              onClick={onOpenResellerPortal}
              className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
              title="Reseller Earnings & JazzCash / EasyPaisa Payouts"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-extrabold">{formatPKR(resellerWalletBalancePKR)}</span>
              <span className="text-[10px] text-emerald-400/80 hidden sm:inline">Munafa</span>
            </button>

            {/* Currency Picker */}
            <div className="relative">
              <button
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center gap-1.5 hover:text-amber-400 transition-colors text-slate-300 focus:outline-hidden cursor-pointer"
              >
                <span className="font-semibold text-white">{currentCurrency}</span>
                <span className="text-slate-400">({CURRENCIES[currentCurrency].symbol})</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {currencyDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Select Currency
                  </div>
                  {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                    <button
                      key={code}
                      onClick={() => {
                        onCurrencyChange(code);
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-100 transition-colors ${
                        currentCurrency === code ? 'bg-amber-50 text-amber-900 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{CURRENCIES[code].name}</span>
                        {code === 'PKR' && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">PK</span>
                        )}
                      </span>
                      <span className="text-slate-400 font-mono">{code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onOpenTracking}
              className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
            >
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Track Parcel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleView('store')}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900 font-display">
                    Apna<span className="text-amber-600">Store</span>
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                    Reseller Hub
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-none">
                  Wholesale & White-Label Delivery
                </p>
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search viral electronics, gadgets, home decor..."
                className="w-full pl-10 pr-9 py-2 bg-slate-100 hover:bg-slate-50 focus:bg-white text-sm text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-hidden"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Reseller Mode Toggle & Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Mode Switcher: Reseller (Wholesale) vs Direct Customer */}
            <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center text-xs font-bold">
              <button
                onClick={() => {
                  if (!isResellerMode) onToggleResellerMode();
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  isResellerMode
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View wholesale prices with +Rs. 200 customer margin"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Reseller View</span>
              </button>
              <button
                onClick={() => {
                  if (isResellerMode) onToggleResellerMode();
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  !isResellerMode
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View direct customer retail prices"
              >
                <span>Direct Customer</span>
              </button>
            </div>

            {/* CSV Product Lister Button */}
            <button
              onClick={onOpenCsvModal}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-xs"
              title="Bulk import products from CSV file"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>CSV Lister</span>
            </button>

            {/* Merchant Dashboard Toggle */}
            <button
              onClick={() => onToggleView(activeView === 'store' ? 'merchant' : 'store')}
              className={`hidden xl:flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                activeView === 'merchant'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{activeView === 'merchant' ? 'Back to Store' : 'Merchant Hub'}</span>
            </button>

            {/* Price Alerts Bell Button */}
            {onOpenPriceAlerts && (
              <button
                onClick={onOpenPriceAlerts}
                className={`relative p-2.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  hasTriggeredAlerts
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-200'
                    : priceAlertsCount > 0
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:text-amber-800 hover:bg-slate-50'
                }`}
                aria-label="View Price Alerts"
                title={hasTriggeredAlerts ? "Supplier Price Drop Triggered!" : "Wholesale Price Alerts"}
              >
                <BellRing className={`w-4 h-4 ${hasTriggeredAlerts ? 'text-emerald-600 animate-bounce' : priceAlertsCount > 0 ? 'text-amber-600' : 'text-slate-600'}`} />
                <span className="text-xs font-bold hidden xl:inline">Alerts</span>
                {priceAlertsCount > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${
                    hasTriggeredAlerts ? 'bg-emerald-600 text-white animate-pulse' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {priceAlertsCount}
                  </span>
                )}
              </button>
            )}

            {/* Wishlist Button */}
            <button
              onClick={() => {
                onToggleView('store');
                onSelectCategory('Wishlist');
              }}
              className={`relative p-2.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                selectedCategory === 'Wishlist' && activeView === 'store'
                  ? 'bg-rose-50 text-rose-600 border-rose-300 ring-2 ring-rose-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:text-rose-600 hover:bg-slate-50'
              }`}
              aria-label="View Wishlist"
              title="View your saved products"
            >
              <Heart className={`w-4 h-4 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
              <span className="text-xs font-bold hidden sm:inline">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-scale">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Bag Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">Bag</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account / Profile Button */}
            <button
              onClick={() => onOpenAuth(currentUser ? 'profile' : 'login')}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                currentUser
                  ? currentUser.role === 'wholesaler'
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300 ring-1 ring-amber-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300 ring-1 ring-emerald-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800'
              }`}
              title={currentUser ? `Logged in as ${currentUser.fullName} (${currentUser.role})` : 'Create Account or Sign In'}
            >
              {currentUser ? (
                <>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white shrink-0 ${
                    currentUser.role === 'wholesaler' ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}>
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block leading-tight">
                    <span className="block text-xs font-bold truncate max-w-[85px]">{currentUser.fullName}</span>
                    <span className={`block text-[9px] font-black uppercase ${
                      currentUser.role === 'wholesaler' ? 'text-amber-800' : 'text-emerald-700'
                    }`}>
                      {currentUser.role === 'wholesaler' ? 'Wholesaler' : 'Reseller'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold hidden sm:inline">Partner Sign In</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="mt-2.5 md:hidden">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-8 py-2 bg-slate-100 text-sm text-slate-900 rounded-xl border border-slate-200 outline-hidden"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Mobile Quick Action Buttons Bar */}
        <div className="lg:hidden flex items-center justify-between gap-1.5 mt-2 pt-2 border-t border-slate-100">
          <button
            onClick={onOpenCsvModal}
            className="flex-1 py-1.5 px-2 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate">CSV Lister</span>
          </button>
          <button
            onClick={onOpenResellerPortal}
            className="flex-1 py-1.5 px-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate">Munafa</span>
          </button>
          {/* Mobile Account Button */}
          <button
            onClick={() => onOpenAuth(currentUser ? 'profile' : 'login')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
              currentUser
                ? currentUser.role === 'wholesaler'
                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                : 'bg-slate-900 text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="truncate">{currentUser ? currentUser.fullName.split(' ')[0] : 'Account'}</span>
          </button>
          {onOpenPriceAlerts && (
            <button
              onClick={onOpenPriceAlerts}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                hasTriggeredAlerts
                  ? 'bg-emerald-600 text-white animate-pulse'
                  : priceAlertsCount > 0
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>{priceAlertsCount > 0 ? priceAlertsCount : 'Alerts'}</span>
            </button>
          )}
          <button
            onClick={() => onToggleView(activeView === 'store' ? 'merchant' : 'store')}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
              activeView === 'merchant' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Categories Bar */}
        {activeView === 'store' && (
          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 overflow-x-auto scrollbar-none pb-0.5">
            {categories.map((cat) => {
              const isActive = (cat === 'All Categories' && selectedCategory === 'all') || selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat === 'All Categories' ? 'all' : cat)}
                  className={`text-xs whitespace-nowrap px-3 py-1 rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? cat === 'Wishlist'
                        ? 'bg-rose-600 text-white font-bold'
                        : 'bg-slate-900 text-white'
                      : cat === 'Wishlist'
                      ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {cat === 'Wishlist' ? (
                    <>
                      <Heart className={`w-3.5 h-3.5 ${wishlistCount > 0 ? 'fill-current' : ''}`} />
                      <span>Wishlist ({wishlistCount})</span>
                    </>
                  ) : cat === 'Trending Deals' ? (
                    '🔥 Trending Deals'
                  ) : (
                    cat
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
