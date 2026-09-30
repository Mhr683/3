import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Copy, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { Order, CurrencyCode } from '../types/dropship';
import { formatPrice } from '../utils/currency';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  currency: CurrencyCode;
  initialTrackingQuery?: string;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  orders,
  currency,
  initialTrackingQuery,
}) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState(initialTrackingQuery || orders[0]?.id || '');
  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    if (initialTrackingQuery) {
      const q = initialTrackingQuery.trim().toLowerCase();
      const match = orders.find(
        (o) =>
          o.id.toLowerCase() === q ||
          o.trackingNumber.toLowerCase() === q ||
          o.phone.toLowerCase().includes(q)
      );
      if (match) return match;
    }
    return orders[0] || null;
  });
  const [copied, setCopied] = useState(false);
  const [searched, setSearched] = useState(Boolean(initialTrackingQuery));

  useEffect(() => {
    if (initialTrackingQuery) {
      setSearchQuery(initialTrackingQuery);
      setSearched(true);
      const q = initialTrackingQuery.trim().toLowerCase();
      const match = orders.find(
        (o) =>
          o.id.toLowerCase() === q ||
          o.trackingNumber.toLowerCase() === q ||
          o.phone.toLowerCase().includes(q)
      );
      if (match) {
        setActiveOrder(match);
      }
    }
  }, [initialTrackingQuery, orders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    const q = searchQuery.trim().toLowerCase();
    const found = orders.find(
      (o) =>
        o.id.toLowerCase() === q ||
        o.trackingNumber.toLowerCase() === q ||
        o.phone.toLowerCase().includes(q)
    );
    setActiveOrder(found || null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">
                Track Dropship Parcel
              </h2>
              <p className="text-xs text-slate-500">
                Live logistics tracking from factory sourcing to doorstep delivery
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-5 border-b border-slate-100 bg-white">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order ID (e.g. APNA-98241) or Tracking #"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:border-amber-500 focus:bg-white outline-hidden"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Track
            </button>
          </form>

          {/* Quick Demo Order Chips */}
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-500 flex-wrap">
            <span>Quick test:</span>
            {orders.slice(0, 3).map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setSearchQuery(o.id);
                  setActiveOrder(o);
                  setSearched(true);
                }}
                className={`px-2 py-0.5 rounded-md font-mono text-[11px] border transition-colors ${
                  activeOrder?.id === o.id
                    ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                    : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {o.id}
              </button>
            ))}
          </div>
        </div>

        {/* Tracking Details */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeOrder ? (
            <div className="space-y-6">
              {/* Order Meta Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Order Reference</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {activeOrder.id}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block">Carrier Tracking #</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-amber-700 text-xs">
                        {activeOrder.trackingNumber}
                      </span>
                      <button
                        onClick={() => handleCopy(activeOrder.trackingNumber)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        title="Copy tracking number"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block">Courier</span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {activeOrder.carrier}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block">Payment Mode</span>
                    <span className="font-bold text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {activeOrder.paymentMethod}
                    </span>
                  </div>
                </div>

                {/* Destination & Recipient */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block">{activeOrder.customerName}</span>
                      <span className="text-slate-500">{activeOrder.address}, {activeOrder.city}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {activeOrder.items.length} Item(s) • Total: {formatPrice(activeOrder.total, currency)}
                      </span>
                      <span className="text-slate-500 line-clamp-1">
                        {activeOrder.items.map((i) => i.product.title).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                {(activeOrder.orderNote || activeOrder.notes) && (
                  <div className="pt-2 border-t border-slate-200/80 text-xs flex items-start gap-2 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                    <span className="font-bold text-amber-900 shrink-0">Delivery Instructions / Note:</span>
                    <span className="text-slate-700 italic">{activeOrder.orderNote || activeOrder.notes}</span>
                  </div>
                )}
              </div>

              {/* Step-by-Step Logistics Timeline */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Logistics Milestones
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {activeOrder.trackingTimeline.map((step, idx) => (
                    <div key={idx} className="relative group">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                          step.completed
                            ? 'bg-emerald-600 border-white text-white shadow-xs'
                            : 'bg-white border-slate-300 text-slate-300'
                        } ${step.current ? 'ring-4 ring-emerald-100 animate-pulse' : ''}`}
                      >
                        {step.completed ? (
                          <Check className="w-3 h-3 stroke-3" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`font-bold text-xs ${
                              step.completed ? 'text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {step.title}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {step.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : searched ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No parcel found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We couldn't locate any order matching "<strong>{searchQuery}</strong>". Please verify your Order ID or phone number.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
