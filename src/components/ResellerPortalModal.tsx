import React, { useState, useMemo } from 'react';
import { 
  X, 
  Wallet, 
  ArrowUpRight, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Store, 
  ChevronRight,
  HelpCircle,
  TrendingUp,
  Receipt,
  Package,
  Search,
  ExternalLink,
  Copy,
  Check,
  Truck,
  MapPin,
  Phone,
  Calendar,
  Filter,
  User
} from 'lucide-react';
import { ResellerWallet, ResellerPayoutRecord, Order, CurrencyCode } from '../types/dropship';
import { formatPKR, formatPrice, pkrToUsd } from '../utils/currency';

interface ResellerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: ResellerWallet;
  resellerBrandName: string;
  onUpdateBrandName: (name: string) => void;
  onRequestPayout: (payout: Omit<ResellerPayoutRecord, 'id' | 'date' | 'transactionId' | 'status'>) => void;
  orders?: Order[];
  currency?: CurrencyCode;
  onOpenTracking?: (trackingNumber?: string) => void;
}

export const ResellerPortalModal: React.FC<ResellerPortalModalProps> = ({
  isOpen,
  onClose,
  wallet,
  resellerBrandName,
  onUpdateBrandName,
  onRequestPayout,
  orders = [],
  currency = 'PKR',
  onOpenTracking,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'wallet' | 'orders' | 'withdraw' | 'history' | 'settings'>('wallet');
  const [brandInput, setBrandInput] = useState(resellerBrandName || 'Apna Reseller Store');
  const [withdrawMethod, setWithdrawMethod] = useState<'JazzCash' | 'EasyPaisa' | 'Bank Transfer'>('JazzCash');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState(wallet.withdrawableBalancePKR > 0 ? wallet.withdrawableBalancePKR.toString() : '1000');
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // Order Search & Filter State
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'delivered' | 'in_transit' | 'sourcing'>('all');
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = orderSearchQuery.toLowerCase();
      const matchesSearch = 
        !orderSearchQuery ||
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.phone.toLowerCase().includes(q) ||
        order.city.toLowerCase().includes(q) ||
        order.trackingNumber.toLowerCase().includes(q);

      const matchesStatus = 
        orderStatusFilter === 'all'
          ? true
          : orderStatusFilter === 'delivered'
          ? order.status === 'delivered'
          : orderStatusFilter === 'in_transit'
          ? order.status === 'shipped' || order.status === 'out_for_delivery'
          : orderStatusFilter === 'sourcing'
          ? order.status === 'sourcing' || order.status === 'unfulfilled'
          : true;

      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearchQuery, orderStatusFilter]);

  // Aggregate Order Analytics
  const totalProfitAcrossOrdersPKR = useMemo(() => {
    return orders.reduce((sum, o) => {
      const profit = o.resellerProfitTotalPKR ?? Math.round(o.profitEarned * 280);
      return sum + profit;
    }, 0);
  }, [orders]);

  const handleBrandSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandInput.trim()) return;
    onUpdateBrandName(brandInput.trim());
    alert('Reseller Business Name updated! This brand will be printed on all courier labels.');
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(withdrawAmount) || 0;
    if (amount <= 0 || amount > wallet.withdrawableBalancePKR) {
      alert(`Please enter a valid amount up to your withdrawable balance of ${formatPKR(wallet.withdrawableBalancePKR)}`);
      return;
    }
    if (!accountTitle.trim() || !accountNumber.trim()) {
      alert('Please fill in your account title and account number.');
      return;
    }

    onRequestPayout({
      amountPKR: amount,
      method: withdrawMethod,
      accountTitle: accountTitle.trim(),
      accountNumber: accountNumber.trim(),
    });

    setPayoutSuccess(true);
    setTimeout(() => {
      setPayoutSuccess(false);
      setActiveTab('history');
    }, 2000);
  };

  const handleCopyTracking = (trackingNum: string) => {
    navigator.clipboard.writeText(trackingNum);
    setCopiedTrackingId(trackingNum);
    setTimeout(() => {
      setCopiedTrackingId((curr) => (curr === trackingNum ? null : curr));
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base flex items-center gap-2">
                <span>Reseller Earnings, Wallet & Order Portal</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30 uppercase">
                  PKR Wholesale
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Track your customer orders, net +Rs. 200 profit margins, JazzCash / EasyPaisa payouts, and courier dispatches.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 bg-slate-50 border-b border-slate-200 text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`pb-3 font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'wallet' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Wallet Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'orders' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Order History</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              activeTab === 'orders' ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-700'
            }`}>
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('withdraw')}
            className={`pb-3 font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'withdraw' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Withdraw Profit</span>
            {wallet.withdrawableBalancePKR > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'history' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Payout History ({wallet.payoutHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Business Slip Settings</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
          {/* TAB 1: WALLET OVERVIEW */}
          {activeTab === 'wallet' && (
            <div className="space-y-6">
              {/* Financial Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-1">
                  <span className="text-xs text-emerald-800 font-semibold block">
                    Withdrawable Profit
                  </span>
                  <div className="text-2xl font-black text-emerald-900">
                    {formatPKR(wallet.withdrawableBalancePKR)}
                  </div>
                  <button
                    onClick={() => setActiveTab('withdraw')}
                    className="text-xs text-emerald-800 font-bold hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    <span>Withdraw Now</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-1">
                  <span className="text-xs text-amber-800 font-semibold block">
                    Pending COD Clearance
                  </span>
                  <div className="text-2xl font-black text-amber-900">
                    {formatPKR(wallet.pendingClearancePKR)}
                  </div>
                  <span className="text-[11px] text-amber-700 block">
                    Clears once courier delivers parcel
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500 font-semibold block">
                    Total Lifetime Earnings
                  </span>
                  <div className="text-2xl font-black text-slate-900">
                    {formatPKR(wallet.totalProfitEarnedPKR)}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold block">
                    100% Guaranteed COD margins
                  </span>
                </div>
              </div>

              {/* Quick Jump to Orders Callout */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-900 text-white rounded-xl shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      You have {orders.length} past customer orders
                    </h4>
                    <p className="text-slate-500">
                      Total profit recorded across all orders: <strong className="text-emerald-700">{formatPKR(totalProfitAcrossOrdersPKR)}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('orders')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <span>View All Orders</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* How Reseller System Works Step Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
                <h4 className="font-extrabold text-sm flex items-center gap-2 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  How Reseller Dropshipping Works on Apna Store
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                    <span className="font-bold text-amber-300 block">1. Wholesale Factory Price</span>
                    <p className="text-[11px] leading-relaxed">
                      You get products at raw factory wholesale rates.
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                    <span className="font-bold text-amber-300 block">2. Automatic +Rs. 200 Markup</span>
                    <p className="text-[11px] leading-relaxed">
                      Direct customers see wholesale + your profit margin.
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                    <span className="font-bold text-amber-300 block">3. Direct JazzCash / EasyPaisa</span>
                    <p className="text-[11px] leading-relaxed">
                      When the customer pays cash on delivery, your profit is credited to your wallet!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDER HISTORY (NEW COMPREHENSIVE TAB) */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Order KPI Analytics Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold block">Total Orders Placed</span>
                  <div className="text-xl font-black text-slate-900 mt-0.5">{orders.length} Orders</div>
                  <span className="text-[10px] text-slate-500">Booked through Reseller Portal</span>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-semibold block">Total Profit Earned</span>
                  <div className="text-xl font-black text-emerald-700 mt-0.5">+{formatPKR(totalProfitAcrossOrdersPKR)}</div>
                  <span className="text-[10px] text-emerald-800">Your net earnings from customer COD</span>
                </div>

                <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-[11px] text-blue-800 font-semibold block">Active Flyer Brand</span>
                  <div className="text-base font-black text-blue-900 mt-0.5 truncate">{resellerBrandName}</div>
                  <span className="text-[10px] text-blue-700">Printed on courier packaging slips</span>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search Order ID, buyer, tracking..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 outline-hidden"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  {orderSearchQuery && (
                    <button
                      onClick={() => setOrderSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {(['all', 'in_transit', 'delivered', 'sourcing'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setOrderStatusFilter(tab)}
                      className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                        orderStatusFilter === tab
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab === 'in_transit' ? 'In Transit' : tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <Package className="w-10 h-10 text-slate-400 mx-auto" />
                  <h4 className="font-extrabold text-slate-900 text-sm">No Orders Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {orderSearchQuery || orderStatusFilter !== 'all'
                      ? 'No orders match your search filters.'
                      : 'You have not placed any orders yet. Add items to your bag and book white-label delivery for your customers!'}
                  </p>
                  {(orderSearchQuery || orderStatusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setOrderSearchQuery('');
                        setOrderStatusFilter('all');
                      }}
                      className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredOrders.map((order) => {
                    const profitPKR = order.resellerProfitTotalPKR ?? Math.round(order.profitEarned * 280);
                    const totalCustomerAmountPKR = Math.round(order.total * 280);
                    const isCopied = copiedTrackingId === order.trackingNumber;

                    const statusBadgeClass = 
                      order.status === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : order.status === 'shipped' || order.status === 'out_for_delivery'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200';

                    const statusLabel = 
                      order.status === 'delivered'
                        ? 'Delivered (Profit Cleared)'
                        : order.status === 'out_for_delivery'
                        ? 'Out for Delivery'
                        : order.status === 'shipped'
                        ? 'Dispatched & In Transit'
                        : order.status === 'sourcing'
                        ? 'Supplier Sourcing'
                        : 'Pending';

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden"
                      >
                        {/* Top Header of Card */}
                        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-black text-sm text-slate-900">
                              {order.id}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(order.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </span>
                            {order.resellerBrandName && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                                <Store className="w-3 h-3 text-amber-700" />
                                <span>Flyer: {order.resellerBrandName}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Status badge */}
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${statusBadgeClass}`}>
                              {order.status === 'delivered' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              <span>{statusLabel}</span>
                            </span>

                            {/* Reseller Profit Badge */}
                            <div className="bg-emerald-600 text-white font-black text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>+{formatPKR(profitPKR)} Profit</span>
                            </div>
                          </div>
                        </div>

                        {/* Order Body Details */}
                        <div className="p-4 sm:p-5 space-y-4">
                          {/* Products breakdown */}
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                              Ordered Items ({order.items.length})
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                  <img
                                    src={item.product.images[0]}
                                    alt={item.product.title}
                                    className="w-12 h-12 rounded-lg object-cover bg-white shrink-0 border border-slate-200"
                                  />
                                  <div className="overflow-hidden flex-1">
                                    <h5 className="font-bold text-xs text-slate-900 truncate" title={item.product.title}>
                                      {item.product.title}
                                    </h5>
                                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                                      <span>Qty: <strong>{item.quantity}</strong></span>
                                      {item.selectedVariant && (
                                        <span>• {item.selectedVariant.name}</span>
                                      )}
                                    </div>
                                    <span className="text-[11px] font-semibold text-slate-700 block">
                                      Cost: {formatPKR(Math.round(item.product.supplierCost * 280))}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Customer & Courier Logistics Bar */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                            {/* Customer details */}
                            <div className="space-y-1">
                              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <span>Customer: {order.customerName}</span>
                              </div>
                              <div className="text-slate-600 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{order.phone}</span>
                              </div>
                              <div className="text-slate-600 flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{order.address}, {order.city}</span>
                              </div>
                              {order.notes && (
                                <p className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200 mt-1 italic">
                                  Note: "{order.notes}"
                                </p>
                              )}
                            </div>

                            {/* Tracking & Delivery actions */}
                            <div className="space-y-2 flex flex-col justify-between pt-2 md:pt-0 border-t md:border-t-0 md:border-l md:pl-3 border-slate-200">
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 text-[11px]">Courier Carrier:</span>
                                  <span className="font-bold text-slate-900">{order.carrier}</span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-slate-500 text-[11px]">Tracking ID:</span>
                                  <div className="flex items-center gap-1.5 font-mono font-bold text-amber-800 text-xs">
                                    <span>{order.trackingNumber}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyTracking(order.trackingNumber)}
                                      className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                                      title="Copy tracking number"
                                    >
                                      {isCopied ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-slate-500 text-[11px]">Total COD Collectable:</span>
                                  <span className="font-black text-slate-900">{formatPKR(totalCustomerAmountPKR)}</span>
                                </div>
                              </div>

                              {/* Action button to open tracking */}
                              <div className="pt-2 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onOpenTracking && onOpenTracking(order.trackingNumber);
                                  }}
                                  className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                >
                                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                                  <span>View Live Delivery Tracking</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WITHDRAW PROFIT */}
          {activeTab === 'withdraw' && (
            <form onSubmit={handleWithdrawSubmit} className="space-y-4 max-w-lg mx-auto">
              <div className="text-center space-y-1">
                <h3 className="font-black text-slate-900 text-base">
                  Withdraw Your Reseller Profit
                </h3>
                <p className="text-xs text-slate-500">
                  Available Balance: <strong className="text-emerald-700">{formatPKR(wallet.withdrawableBalancePKR)}</strong>
                </p>
              </div>

              {payoutSuccess && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Payout request submitted! Transfer will be initiated to your mobile account.</span>
                </div>
              )}

              {/* Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Select Payout Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['JazzCash', 'EasyPaisa', 'Bank Transfer'] as const).map((method) => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setWithdrawMethod(method)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                        withdrawMethod === method
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {method === 'Bank Transfer' ? (
                        <Building2 className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Smartphone className="w-5 h-5 text-emerald-600" />
                      )}
                      <span>{method}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Withdrawal Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    max={wallet.withdrawableBalancePKR}
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 outline-hidden font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Account Title (Full Name on Account) *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountTitle}
                    onChange={(e) => setAccountTitle(e.target.value)}
                    placeholder="e.g. Muhammad Mohsin"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {withdrawMethod === 'Bank Transfer' ? 'IBAN / Bank Account Number *' : `${withdrawMethod} Mobile Number *`}
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={withdrawMethod === 'Bank Transfer' ? 'PK00MEZN000...' : '03001234567'}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 outline-hidden font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={wallet.withdrawableBalancePKR <= 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                Request Instant Transfer ({formatPKR(parseInt(withdrawAmount) || 0)})
              </button>
            </form>
          )}

          {/* TAB 4: PAYOUT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                Recent Profit Withdrawals
              </h3>

              {wallet.payoutHistory.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">No payout history yet. Place orders and withdraw once parcels are delivered.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {wallet.payoutHistory.map((record) => (
                    <div
                      key={record.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{record.method}</span>
                          <span className="font-mono text-[10px] text-slate-400">Ref: {record.transactionId}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {record.accountTitle} ({record.accountNumber}) • {record.date}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-emerald-700 text-sm block">
                          +{formatPKR(record.amountPKR)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                          {record.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BUSINESS SLIP SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleBrandSave} className="space-y-4 max-w-lg mx-auto">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm">
                  White-Label Courier Packing Slip
                </h3>
                <p className="text-xs text-slate-500">
                  When Apna Store dispatches parcels on your behalf, this brand name is printed as the sender. The customer will never see supplier details.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Your Reseller Brand / Store Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={brandInput}
                    onChange={(e) => setBrandInput(e.target.value)}
                    placeholder="e.g. Mohsin Collections / Al-Madina Traders"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden font-bold text-slate-900"
                  />
                  <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Visual preview of courier flyer */}
              <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-300 text-xs space-y-1.5 font-mono">
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                  Courier Flyer Preview (TCS / Leopards Slip):
                </span>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-800 space-y-1">
                  <div><strong>From:</strong> {brandInput || 'Your Reseller Store'} (Verified Seller)</div>
                  <div><strong>Payment:</strong> Cash on Delivery (COD)</div>
                  <div><strong>Note:</strong> Customer may inspect parcel before payment</div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Save Business Brand Name
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
