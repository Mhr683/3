import React, { useState } from 'react';
import { 
  Tag, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Copy, 
  Percent, 
  Banknote, 
  Calendar, 
  Power, 
  AlertCircle,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { DiscountCoupon } from '../types/dropship';
import { formatPKR } from '../utils/currency';

interface CouponManagerTabProps {
  coupons: DiscountCoupon[];
  onAddCoupon: (newCoupon: Omit<DiscountCoupon, 'id' | 'usageCount'>) => void;
  onToggleCouponActive: (couponId: string) => void;
  onDeleteCoupon: (couponId: string) => void;
}

export const CouponManagerTab: React.FC<CouponManagerTabProps> = ({
  coupons,
  onAddCoupon,
  onToggleCouponActive,
  onDeleteCoupon,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_pkr'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(15);
  const [minSpendPKR, setMinSpendPKR] = useState<number>(2000);
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) {
      setErrorMsg('Please enter a valid coupon code (e.g. SUMMER25)');
      return;
    }

    if (coupons.some((c) => c.code.toUpperCase() === cleanCode)) {
      setErrorMsg(`Coupon code "${cleanCode}" already exists!`);
      return;
    }

    if (discountValue <= 0) {
      setErrorMsg('Discount value must be greater than 0');
      return;
    }

    if (discountType === 'percentage' && discountValue > 70) {
      setErrorMsg('Percentage discount cannot exceed 70% to protect margins');
      return;
    }

    onAddCoupon({
      code: cleanCode,
      discountType,
      discountValue: Number(discountValue),
      minSpendPKR: Number(minSpendPKR) || 0,
      description: description.trim() || `${discountType === 'percentage' ? `${discountValue}% off` : `Rs. ${discountValue} off`} promo voucher`,
      isActive: true,
      expiryDate: expiryDate || undefined,
    });

    // Reset Form
    setCode('');
    setDescription('');
    setDiscountValue(15);
    setMinSpendPKR(2000);
    setExpiryDate('');
    setErrorMsg(null);
    setIsCreating(false);
  };

  const handleCopyCode = (coupon: DiscountCoupon) => {
    navigator.clipboard.writeText(coupon.code);
    setCopiedId(coupon.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 p-4 rounded-2xl border border-amber-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shadow-xs shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>Discount Vouchers & Promotional Promo Codes</span>
              <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                {coupons.filter(c => c.isActive).length} Active
              </span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Create marketing coupon codes for festive sales (Eid, Black Friday, Ramadan) redeemable at customer checkout.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsCreating(!isCreating);
            setErrorMsg(null);
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer self-start sm:self-center shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>{isCreating ? 'Cancel Creation' : 'Create New Coupon'}</span>
        </button>
      </div>

      {/* Create Coupon Modal Form */}
      {isCreating && (
        <form 
          onSubmit={handleSubmit}
          className="bg-white p-5 rounded-2xl border-2 border-amber-300 shadow-md space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Configure New Promotional Voucher</span>
            </h3>
            <span className="text-xs text-slate-500">Live on Checkout Immediately</span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {/* Coupon Code */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Coupon Code * (e.g. EID2026, APNA15)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. EID2026"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-slate-900 uppercase focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                required
              />
            </div>

            {/* Discount Type */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Discount Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`py-2 px-2.5 rounded-xl font-bold border transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                    discountType === 'percentage'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Percentage %</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed_pkr')}
                  className={`py-2 px-2.5 rounded-xl font-bold border transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                    discountType === 'fixed_pkr'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Fixed PKR (Rs.)</span>
                </button>
              </div>
            </div>

            {/* Discount Amount */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {discountType === 'percentage' ? 'Discount Percentage (%) *' : 'Flat Discount (PKR) *'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={discountType === 'percentage' ? '70' : '10000'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                  {discountType === 'percentage' ? '%' : 'Rs.'}
                </span>
              </div>
            </div>

            {/* Minimum Spend */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Minimum Spend (PKR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={minSpendPKR}
                  onChange={(e) => setMinSpendPKR(Number(e.target.value))}
                  placeholder="e.g. 2000"
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">
                  PKR
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Order subtotal must exceed this to apply
              </span>
            </div>

            {/* Description */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Public Description / Marketing Label
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 15% off Ramadan Special on Gadgets"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save & Activate Coupon</span>
            </button>
          </div>
        </form>
      )}

      {/* Coupons List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4">Discount</th>
                <th className="py-3.5 px-4">Min. Spend</th>
                <th className="py-3.5 px-4">Redemptions</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((coupon) => {
                const isCopied = copiedId === coupon.id;
                return (
                  <tr key={coupon.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(coupon)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                          title="Copy coupon code"
                        >
                          {isCopied ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {coupon.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{coupon.description}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}% OFF`
                          : `${formatPKR(coupon.discountValue)} FLAT`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {coupon.minSpendPKR > 0 ? formatPKR(coupon.minSpendPKR) : 'No Minimum'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                        <span>{coupon.usageCount} uses</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onToggleCouponActive(coupon.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                          coupon.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                        title="Click to toggle active state"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${coupon.isActive ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                        <span>{coupon.isActive ? 'Active' : 'Disabled'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onDeleteCoupon(coupon.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
