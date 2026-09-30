import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  MessageCircle, 
  DollarSign, 
  ShieldCheck, 
  Truck,
  Image as ImageIcon,
  QrCode,
  Printer,
  Download,
  Store,
  Palette,
  CheckCircle2,
  BadgePercent
} from 'lucide-react';
import { Product, CurrencyCode } from '../types/dropship';
import { formatPKR, usdToPkr } from '../utils/currency';

interface ShareProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  currency: CurrencyCode;
  resellerBrandName: string;
}

export const ShareProductModal: React.FC<ShareProductModalProps> = ({
  product,
  isOpen,
  onClose,
  currency,
  resellerBrandName,
}) => {
  if (!isOpen || !product) return null;

  const wholesalePKR = usdToPkr(product.supplierCost);
  // Default margin is 200 PKR as requested by user
  const [profitMarginPKR, setProfitMarginPKR] = useState(200);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedQrLink, setCopiedQrLink] = useState(false);

  // Tab switch: 'pitch' (WhatsApp text) vs 'qrcode' (Printable QR Code)
  const [activeTab, setActiveTab] = useState<'pitch' | 'qrcode'>('pitch');

  // QR Code Customization
  const [qrColor, setQrColor] = useState<'#0f172a' | '#047857' | '#d97706'>('#0f172a');
  const [qrActionType, setQrActionType] = useState<'store_link' | 'whatsapp_order'>('store_link');
  const [resellerWhatsApp, setResellerWhatsApp] = useState('03001234567');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [customBrand, setCustomBrand] = useState(resellerBrandName || 'Apna Reseller Store');
  const printableAreaRef = useRef<HTMLDivElement>(null);

  const customerPricePKR = wholesalePKR + profitMarginPKR;

  // Construct target URL for the QR code
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://apnastore.pk';
  const cleanPhone = resellerWhatsApp.replace(/\D/g, '');
  const encodedMsg = encodeURIComponent(
    `Salam! I want to order ${product.title} (Price: Rs. ${customerPricePKR.toLocaleString()}) with Cash on Delivery from ${customBrand}.`
  );

  const targetLink =
    qrActionType === 'whatsapp_order'
      ? `https://wa.me/${cleanPhone.startsWith('92') ? cleanPhone : '92' + cleanPhone.replace(/^0/, '')}?text=${encodedMsg}`
      : `${baseUrl}/?product=${product.id}&brand=${encodeURIComponent(customBrand)}&price=${customerPricePKR}`;

  // Generate QR Code image when parameters change
  useEffect(() => {
    let isSubscribed = true;
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(targetLink, {
          width: 480,
          margin: 1.5,
          color: {
            dark: qrColor,
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        if (isSubscribed) {
          setQrDataUrl(url);
        }
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQR();
    return () => {
      isSubscribed = false;
    };
  }, [targetLink, qrColor]);

  // Generate sales pitch without revealing wholesale cost
  const generateSalesPitch = () => {
    return `🔥 *${product.title}* 🔥\n\n` +
      `✨ *Special Offer Price:* Rs. ${customerPricePKR.toLocaleString()}\n` +
      `📦 *Category:* ${product.category}\n` +
      `🚚 *Cash on Delivery (COD):* Available all over Pakistan!\n` +
      `🛡️ *Customer Guarantee:* Open parcel & check quality upon doorstep delivery.\n\n` +
      `⭐ *Key Features:*\n` +
      product.features.map(f => `• ${f}`).join('\n') +
      `\n\n📲 *Order Karne K Liye Apna Naam, Pata, Phone Number Send Karein.*\n` +
      `🏪 Presented by: *${customBrand}*\n` +
      `🔗 Direct Catalog Link: ${targetLink}`;
  };

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(generateSalesPitch());
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2500);
  };

  const handleCopyImage = () => {
    navigator.clipboard.writeText(product.images[0]);
    setCopiedImage(true);
    setTimeout(() => setCopiedImage(false), 2500);
  };

  const handleCopyQrLink = () => {
    navigator.clipboard.writeText(targetLink);
    setCopiedQrLink(true);
    setTimeout(() => setCopiedQrLink(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(generateSalesPitch());
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleDownloadQrCode = () => {
    if (!qrDataUrl) return;
    const downloadLink = document.createElement('a');
    downloadLink.href = qrDataUrl;
    const sanitizedTitle = product.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
    downloadLink.download = `${customBrand.toLowerCase().replace(/\s+/g, '-')}-${sanitizedTitle}-qr.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handlePrintQrFlyer = () => {
    let iframe = document.getElementById('qr-print-iframe') as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'qr-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${customBrand} - ${product.title} QR Flyer</title>
          <style>
            @page { size: auto; margin: 15mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #0f172a;
              text-align: center;
              padding: 20px;
              margin: 0;
            }
            .card {
              max-width: 440px;
              margin: 0 auto;
              border: 3px solid #0f172a;
              border-radius: 24px;
              padding: 24px;
              box-sizing: border-box;
            }
            .brand-badge {
              display: inline-block;
              background-color: #047857;
              color: white;
              font-size: 13px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              padding: 6px 16px;
              border-radius: 9999px;
              margin-bottom: 12px;
            }
            .prod-title {
              font-size: 18px;
              font-weight: 800;
              margin: 8px 0;
              line-height: 1.3;
            }
            .price-pill {
              font-size: 24px;
              font-weight: 900;
              color: #047857;
              margin: 10px 0;
            }
            .qr-frame {
              margin: 16px auto;
              padding: 12px;
              background: #f8fafc;
              border: 2px dashed #cbd5e1;
              border-radius: 18px;
              display: inline-block;
            }
            .qr-frame img {
              width: 220px;
              height: 220px;
              display: block;
            }
            .scan-instructions {
              font-size: 14px;
              font-weight: 700;
              color: #334155;
              margin-top: 10px;
            }
            .cod-banner {
              background: #f1f5f9;
              padding: 8px;
              border-radius: 10px;
              font-size: 12px;
              font-weight: 700;
              margin-top: 14px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand-badge">${customBrand}</div>
            <div class="prod-title">${product.title}</div>
            <div class="price-pill">Rs. ${customerPricePKR.toLocaleString()}</div>
            <div class="qr-frame">
              <img src="${qrDataUrl}" alt="Scan QR Code" />
            </div>
            <div class="scan-instructions">📷 Scan with your Phone Camera to Order Instantly!</div>
            <div class="cod-banner">🚚 Cash on Delivery Available Across Pakistan • Open Parcel Delivery</div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base flex items-center gap-2">
                <span>Reseller Product Share & QR Generator</span>
              </h2>
              <p className="text-xs text-emerald-200">
                Create customer sales pitches and printable QR codes linking to your store
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-emerald-300 hover:text-white rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: WhatsApp Pitch vs Printable QR Code */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('pitch')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'pitch'
                ? 'border-emerald-600 text-emerald-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp Sales Pitch</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qrcode')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'qrcode'
                ? 'border-emerald-600 text-emerald-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>Printable Store QR Code</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-black">
              NEW
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 space-y-4">
          {/* Product Summary */}
          <div className="flex gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-white shrink-0 border border-slate-200"
            />
            <div className="flex-1 space-y-1 min-w-0">
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                {product.category}
              </span>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2">
                {product.title}
              </h3>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="text-slate-500">Your Wholesale Cost:</span>
                <span className="font-bold text-slate-800">{formatPKR(wholesalePKR)}</span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-700 font-black">Customer Price: {formatPKR(customerPricePKR)}</span>
              </div>
            </div>
          </div>

          {/* Reseller Profit Margin Slider / Input */}
          <div className="p-3.5 sm:p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-black text-xs text-slate-900 block">
                  Your Reseller Profit Margin
                </label>
                <span className="text-[11px] text-slate-500">
                  Customer pays wholesale + your added profit
                </span>
              </div>
              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-emerald-300">
                <span className="text-xs font-bold text-slate-500">Rs.</span>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={profitMarginPKR}
                  onChange={(e) => setProfitMarginPKR(Math.max(50, parseInt(e.target.value) || 0))}
                  className="w-20 text-right font-black text-emerald-700 text-sm outline-hidden"
                />
              </div>
            </div>

            {/* Quick Profit Presets */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] text-slate-500 font-medium">Quick Profit:</span>
              {[200, 300, 500, 800, 1000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setProfitMarginPKR(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    profitMarginPKR === preset
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  +Rs. {preset}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: WHATSAPP SALES PITCH */}
          {activeTab === 'pitch' && (
            <div className="space-y-4">
              {/* Generated Sales Pitch Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Customer WhatsApp Sales Message (Ready to Share)
                  </label>
                  <button
                    onClick={handleCopyPitch}
                    className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPitch ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPitch ? 'Copied to Clipboard!' : 'Copy Text'}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-900 text-emerald-300 font-sans text-xs rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
                  {generateSalesPitch()}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleCopyImage}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-slate-600" />
                  <span>{copiedImage ? 'Image Link Copied!' : 'Copy Photo Link'}</span>
                </button>

                <button
                  onClick={handleOpenWhatsApp}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share to WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PRINTABLE STORE QR CODE GENERATOR */}
          {activeTab === 'qrcode' && (
            <div className="space-y-4">
              {/* QR Controls / Customization Bar */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Store Brand Name on Flyer
                    </label>
                    <input
                      type="text"
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      placeholder="Your Reseller Store Name"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl outline-hidden focus:border-emerald-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      QR Code Destination
                    </label>
                    <select
                      value={qrActionType}
                      onChange={(e) => setQrActionType(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl outline-hidden cursor-pointer"
                    >
                      <option value="store_link">Direct Store Catalog Product Page</option>
                      <option value="whatsapp_order">Direct WhatsApp 1-Click Order Chat</option>
                    </select>
                  </div>
                </div>

                {qrActionType === 'whatsapp_order' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Your WhatsApp Number (For incoming orders)
                    </label>
                    <input
                      type="text"
                      value={resellerWhatsApp}
                      onChange={(e) => setResellerWhatsApp(e.target.value)}
                      placeholder="03001234567"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl outline-hidden focus:border-emerald-500 font-mono"
                    />
                  </div>
                )}

                {/* QR Theme Color Selection */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-slate-400" />
                    QR Color Theme:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQrColor('#0f172a')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        qrColor === '#0f172a' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-white text-slate-700 border'
                      }`}
                    >
                      Midnight Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrColor('#047857')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        qrColor === '#047857' ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-white text-slate-700 border'
                      }`}
                    >
                      Emerald Green
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrColor('#d97706')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        qrColor === '#d97706' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-white text-slate-700 border'
                      }`}
                    >
                      Royal Amber
                    </button>
                  </div>
                </div>
              </div>

              {/* Printable Flyer Visual Card Preview */}
              <div 
                ref={printableAreaRef}
                className="bg-gradient-to-b from-slate-50 via-white to-slate-50 p-5 rounded-3xl border-2 border-slate-800 text-center space-y-3 shadow-md max-w-sm mx-auto"
              >
                {/* Store Brand Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-xs">
                  <Store className="w-3 h-3" />
                  <span>{customBrand}</span>
                </div>

                <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                  {product.title}
                </h4>

                <div className="text-xl font-black text-emerald-700">
                  Rs. {customerPricePKR.toLocaleString()}
                </div>

                {/* QR Code Frame */}
                <div className="p-3 bg-white border-2 border-dashed border-slate-300 rounded-2xl inline-block shadow-xs">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="Product Store QR Code" 
                      className="w-44 h-44 object-contain mx-auto"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                      Generating QR...
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-black text-slate-800 flex items-center justify-center gap-1">
                    <span>📷 Scan with Mobile Camera to Order</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    100% Cash on Delivery Across Pakistan • Check Parcel Before Paying
                  </div>
                </div>
              </div>

              {/* QR Actions: Download Image & Print Flyer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadQrCode}
                  className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Download PNG image for WhatsApp status, Instagram stories, or TikTok"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Download QR (PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintQrFlyer}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  title="Print retail flyer for parcel boxes or shop display"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Retail Flyer</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyQrLink}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy encoded direct product link"
                >
                  {copiedQrLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedQrLink ? 'Link Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
