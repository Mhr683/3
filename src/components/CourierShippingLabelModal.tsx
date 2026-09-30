import React, { useState, useRef } from 'react';
import { 
  X, 
  Printer, 
  Truck, 
  Package, 
  CheckCircle2, 
  Building2, 
  User, 
  MapPin, 
  Phone, 
  QrCode, 
  ShieldCheck, 
  Calendar, 
  Copy, 
  Download,
  AlertCircle
} from 'lucide-react';
import { Order, CurrencyCode } from '../types/dropship';
import { formatPKR, usdToPkr } from '../utils/currency';

interface CourierShippingLabelModalProps {
  order: Order | null;
  onClose: () => void;
  currency: CurrencyCode;
}

export const CourierShippingLabelModal: React.FC<CourierShippingLabelModalProps> = ({
  order,
  onClose,
  currency,
}) => {
  if (!order) return null;

  const [selectedCarrier, setSelectedCarrier] = useState<string>(
    order.carrier || 'TCS Express Pakistan'
  );
  const [allowOpenBeforePay, setAllowOpenBeforePay] = useState(true);
  const [copied, setCopied] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const CARRIERS = [
    { id: 'TCS Express Pakistan', name: 'TCS Express', code: 'TCS', color: 'bg-red-600' },
    { id: 'Trax Logistics Pakistan', name: 'Trax Logistics', code: 'TRX', color: 'bg-orange-600' },
    { id: 'Leopards Courier', name: 'Leopards', code: 'LCS', color: 'bg-yellow-600' },
    { id: 'Call Courier', name: 'Call Courier', code: 'CCL', color: 'bg-blue-600' },
    { id: 'PostEx Logistics', name: 'PostEx COD', code: 'PEX', color: 'bg-indigo-600' },
  ];

  const codAmountPKR = usdToPkr(order.total);
  const senderName = order.isResellerOrder && order.resellerBrandName
    ? order.resellerBrandName
    : 'Apna Store Dropship Hub';

  const orderDateFormatted = new Date(order.createdAt).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalItemsCount = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `COURIER AIRWAY BILL (AWB)
Tracking No: ${order.trackingNumber}
Carrier: ${selectedCarrier}
Consignee: ${order.customerName} (${order.phone})
Address: ${order.address}, ${order.city}
COD Amount to Collect: PKR ${codAmountPKR.toLocaleString()}
Items: ${order.items?.map(i => `${i.quantity}x ${i.product.title}`).join(', ')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight">
                Courier Airway Bill (AWB) Thermal Shipping Slip
              </h2>
              <p className="text-[11px] text-slate-300">
                Official 4x6 / A6 Packing Slip for TCS, Trax, Leopards & Call Courier
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Carrier Selector & Quick Controls */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-700">Select Carrier:</span>
            {CARRIERS.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCarrier(c.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-xs border ${
                  selectedCarrier === c.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allowOpenBeforePay}
              onChange={(e) => setAllowOpenBeforePay(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Open & Check Before Pay Badge</span>
          </label>
        </div>

        {/* Thermal Label Body (Printable Area) */}
        <div className="p-5 max-h-[70vh] overflow-y-auto bg-slate-100 flex justify-center">
          <div 
            ref={printableRef}
            className="w-full max-w-md bg-white border-2 border-dashed border-slate-400 p-5 rounded-lg shadow-sm font-sans text-slate-900 space-y-4"
            style={{ minHeight: '520px' }}
          >
            {/* Top Bar with Carrier and COD Warning */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase bg-slate-900 text-white px-2 py-0.5 rounded">
                  {selectedCarrier}
                </span>
                <div className="text-xs font-bold text-slate-600 mt-1">
                  EXPRESS COD PARCEL
                </div>
              </div>

              {/* Large COD Alert Tag */}
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-rose-700 block">
                  CASH ON DELIVERY (COD)
                </span>
                <div className="text-xl font-black text-rose-600 leading-none">
                  PKR {codAmountPKR.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Tracking Barcode Mock Simulation */}
            <div className="text-center py-2 bg-slate-50 border border-slate-300 rounded p-2">
              <div className="flex items-center justify-center gap-1 h-10 overflow-hidden mx-auto max-w-[280px]">
                {/* Simulated Barcode vertical bars */}
                {[...Array(42)].map((_, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-900 h-full inline-block"
                    style={{
                      width: `${(idx % 4 === 0 ? 3 : idx % 2 === 0 ? 1.5 : 2.5)}px`,
                      marginRight: `${(idx % 3 === 0 ? 2 : 1)}px`,
                    }}
                  />
                ))}
              </div>
              <div className="text-xs font-mono font-black tracking-widest mt-1 text-slate-900">
                {order.trackingNumber}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Order Ref: {order.id} | Date: {orderDateFormatted}
              </div>
            </div>

            {/* Sender (Shipper) and Receiver (Consignee) Grid */}
            <div className="grid grid-cols-2 gap-3 border-y-2 border-slate-900 py-3 text-xs">
              {/* Shipper */}
              <div className="space-y-1 pr-2 border-r border-slate-300">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                  SHIPPER (RETURN ADDRESS)
                </span>
                <div className="font-extrabold text-slate-900">
                  {senderName}
                </div>
                <div className="text-[11px] text-slate-600 leading-tight">
                  Apna Fulfillment Center, Sector 15<br />
                  Lahore / Karachi, Pakistan<br />
                  WhatsApp: +92 300 1234567
                </div>
              </div>

              {/* Consignee */}
              <div className="space-y-1 pl-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                  CONSIGNEE (DELIVER TO)
                </span>
                <div className="font-extrabold text-slate-900 text-sm">
                  {order.customerName}
                </div>
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-600" />
                  <span>{order.phone}</span>
                </div>
                <div className="text-[11px] text-slate-700 leading-tight">
                  {order.address}
                </div>
                <div className="font-black text-slate-900 uppercase text-xs pt-0.5">
                  City: {order.city}
                </div>
              </div>
            </div>

            {/* Parcel Details Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold border-b border-slate-200 pb-1">
                <span>Contents Description</span>
                <span>Qty: {totalItemsCount}</span>
              </div>
              <div className="space-y-1 text-xs">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 text-slate-800">
                    <span className="font-medium truncate max-w-[250px]">
                      {item.quantity}x {item.product.title}
                      {item.selectedVariant ? ` (${item.selectedVariant.name})` : ''}
                    </span>
                    <span className="font-mono shrink-0">
                      {formatPKR(usdToPkr((item.product.retailPrice || item.product.supplierCost) * item.quantity))}
                    </span>
                  </div>
                ))}
              </div>

              {order.orderNote && (
                <div className="p-2 bg-amber-50 rounded border border-amber-200 text-[10px] text-amber-900 font-semibold">
                  <strong>Customer Note:</strong> "{order.orderNote}"
                </div>
              )}
            </div>

            {/* Special Instructions & Badges */}
            <div className="pt-2 border-t border-slate-900 space-y-2">
              {allowOpenBeforePay && (
                <div className="p-1.5 bg-emerald-100 text-emerald-900 text-center font-black text-[10px] rounded uppercase tracking-wide border border-emerald-300">
                  ✓ CUSTOMER IS ALLOWED TO OPEN & CHECK BEFORE PAYMENT
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-600">
                <div className="p-1.5 bg-slate-100 rounded text-center">
                  Payment: <strong>CASH ON DELIVERY</strong>
                </div>
                <div className="p-1.5 bg-slate-100 rounded text-center">
                  Inspection: <strong>DO NOT RESEAL</strong>
                </div>
              </div>

              <div className="text-[9px] text-slate-400 text-center leading-tight pt-1">
                This airway bill is generated by ApnaStore White-Label Logistics Engine. For queries or COD discrepancies, contact courier helpline with AWB {order.trackingNumber}.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-t border-slate-200 gap-3">
          <button
            onClick={handleCopySummary}
            className="px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'AWB Copied!' : 'Copy AWB Details'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Thermal Slip (4x6 / A6)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
