import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Phone, 
  CheckCircle2, 
  Send, 
  MapPin, 
  User, 
  Package, 
  Banknote, 
  Copy, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Order, CurrencyCode } from '../types/dropship';
import { formatPKR, usdToPkr } from '../utils/currency';

interface WhatsAppOrderVerificationModalProps {
  order: Order | null;
  onClose: () => void;
  currency: CurrencyCode;
  onConfirmVerification: (orderId: string, isVerified: boolean, note?: string) => void;
}

export const WhatsAppOrderVerificationModal: React.FC<WhatsAppOrderVerificationModalProps> = ({
  order,
  onClose,
  currency,
  onConfirmVerification,
}) => {
  if (!order) return null;

  const [verificationNote, setVerificationNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [templateType, setTemplateType] = useState<'standard' | 'urgent' | 'address_correction'>('standard');

  const codAmountPKR = usdToPkr(order.total);
  const brandName = order.isResellerOrder && order.resellerBrandName
    ? order.resellerBrandName
    : 'Apna Store';

  // Format clean Pakistan phone number for WhatsApp: 03001234567 -> 923001234567
  const cleanPhoneDigits = (order.phone || '').replace(/\D/g, '');
  const internationalPhone = cleanPhoneDigits.startsWith('92')
    ? cleanPhoneDigits
    : cleanPhoneDigits.startsWith('0')
    ? `92${cleanPhoneDigits.slice(1)}`
    : `92${cleanPhoneDigits}`;

  const itemsListSummary = order.items
    ?.map((i) => `${i.quantity}x ${i.product.title}`)
    .join(', ') || 'Your ordered items';

  // Templates
  const getMessageText = () => {
    if (templateType === 'urgent') {
      return `Assalam o Alaikum ${order.customerName} sahab!

Yeh message *${brandName}* ki taraf se hai. Aap ka order #${order.id} for:
📦 *${itemsListSummary}*
💰 Total COD Bill: *PKR ${codAmountPKR.toLocaleString()}*

Courier rider parcel deliver karne ke liye ready hai. Baraye meherbani foran *YES* reply kar ke apna address confirm karein:
📍 *${order.address}, ${order.city}*

Shukriya!`;
    }

    if (templateType === 'address_correction') {
      return `Assalam o Alaikum ${order.customerName} sahab!

Shukriya aap ne *${brandName}* se order place kiya (Order #${order.id}).
Parcel dispatch karne ke liye humein aap ke delivery address ki tasdeeq darkaar hai:
📍 *${order.address}, ${order.city}*
💰 Total Bill (Cash on Delivery): *PKR ${codAmountPKR.toLocaleString()}*

Kya aap ka address aur phone number 100% theek hai? Baraye meherbani *YES* likh kar reply karein taake parcel dispatch kiya ja sake.`;
    }

    // Standard
    return `Assalam o Alaikum ${order.customerName} ji! 

Shukriya for shopping with *${brandName}*. 

Aap ka order book ho chuka hai:
🆔 *Order ID:* ${order.id}
📦 *Items:* ${itemsListSummary}
💵 *Cash on Delivery (COD):* PKR ${codAmountPKR.toLocaleString()}
📍 *Delivery Address:* ${order.address}, ${order.city}

Parcel courier (TCS/Trax) ko handover karne se pehle tasdeeq ke liye baraye meherbani is message par *YES* reply kar dein.

JazakAllah Khair!`;
  };

  const messageText = getMessageText();

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    const url = `https://wa.me/${internationalPhone}?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveVerified = () => {
    onConfirmVerification(order.id, true, verificationNote.trim() || 'Customer confirmed delivery via WhatsApp');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 backdrop-blur-xs rounded-xl">
              <MessageSquare className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                <span>WhatsApp Order Verification</span>
                {order.isAddressVerified && (
                  <span className="bg-emerald-300 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Verified ✓
                  </span>
                )}
              </h2>
              <p className="text-xs text-emerald-100">
                Confirm order with customer on WhatsApp before booking courier to prevent RTO / Return losses
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customer Quick Summary */}
        <div className="p-4 bg-emerald-50/60 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
              {order.customerName.charAt(0)}
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-sm">{order.customerName}</div>
              <div className="text-slate-600 flex items-center gap-2">
                <span className="font-mono font-bold text-emerald-800">+{internationalPhone}</span>
                <span>•</span>
                <span className="font-bold text-slate-800">{order.city}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">COD Collection</span>
            <span className="font-black text-emerald-800 text-sm font-mono">
              PKR {codAmountPKR.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Template Selector */}
        <div className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Select Message Template:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTemplateType('standard')}
                className={`py-2 px-2.5 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                  templateType === 'standard'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Standard COD
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('address_correction')}
                className={`py-2 px-2.5 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                  templateType === 'address_correction'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Address Check
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('urgent')}
                className={`py-2 px-2.5 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                  templateType === 'urgent'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Urgent Dispatch
              </button>
            </div>
          </div>

          {/* WhatsApp Preview Box */}
          <div>
            <div className="flex items-center justify-between text-slate-600 mb-1.5 font-bold">
              <span>WhatsApp Message Preview:</span>
              <button
                onClick={handleCopyMessage}
                className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer font-bold"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            <div className="bg-[#e5ddd5] p-3 rounded-2xl border border-slate-300">
              <div className="bg-white p-3.5 rounded-xl shadow-xs text-slate-900 leading-relaxed font-sans text-xs whitespace-pre-wrap border-l-4 border-emerald-500">
                {messageText}
              </div>
            </div>
          </div>

          {/* Action to Mark Verified */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <label className="font-bold text-slate-700 block">
              Internal Verification Note (Optional):
            </label>
            <input
              type="text"
              value={verificationNote}
              onChange={(e) => setVerificationNote(e.target.value)}
              placeholder="e.g. Customer replied YES on WhatsApp / Verified on Call"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-200 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveVerified}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                order.isAddressVerified
                  ? 'bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{order.isAddressVerified ? 'Marked as Verified' : 'Mark Verified ✓'}</span>
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Open in WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
