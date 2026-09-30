import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Table, 
  Plus, 
  Sparkles,
  Info
} from 'lucide-react';
import { Product, CurrencyCode } from '../types/dropship';
import { SUPPLIERS } from '../data/mockProducts';
import { pkrToUsd, formatPKR } from '../utils/currency';

interface CsvProductManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currency: CurrencyCode;
  onBulkImport: (newProducts: Product[]) => void;
}

interface ParsedCsvRow {
  title: string;
  category: string;
  wholesalePricePKR: number;
  customerPricePKR: number;
  profitPKR: number;
  stock: number;
  image: string;
  description: string;
  variants: string;
  isValid: boolean;
  errorMessage?: string;
}

export const CsvProductManagerModal: React.FC<CsvProductManagerModalProps> = ({
  isOpen,
  onClose,
  products,
  currency,
  onBulkImport,
}) => {
  if (!isOpen) return null;

  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'preview'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleCsvData = `title,category,wholesalePricePKR,customerPricePKR,stock,image,description,variants
"Wireless Bluetooth Neckband Pro","Electronics",1100,1300,50,"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80","Deep bass magnetic earphones with 30H battery","Black, Blue"
"LED Crystal Touch Table Lamp","Home & Living",1400,1600,35,"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80","Diamond ambient crystal night lamp with 3 light modes","Warm Yellow, White, Dual"
"Heavy Grip Metal Hand Exerciser","Fitness & Gadgets",650,850,80,"https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80","Non-slip aluminum hand gripper for forearm strength","100 LB, 150 LB, 200 LB"
"Portable Mini USB Fruit Blender","Home & Living",1800,2000,45,"https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80","Rechargeable smoothie maker with 6 stainless steel blades","Pink, Green, White"`;

  const parseCsv = (text: string) => {
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      alert('CSV must contain a header row and at least 1 product row.');
      return;
    }

    const rows: ParsedCsvRow[] = [];

    // Parse lines with quoted values support
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Regex to split by comma outside quotes
      const columns = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => {
        let val = col.trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/""/g, '"');
        }
        return val;
      });

      const title = columns[0] || '';
      const category = columns[1] || 'Trending Deals';
      const wholesalePKR = parseFloat(columns[2]) || 0;
      // Default to wholesale + 200 if not specified
      let customerPKR = parseFloat(columns[3]) || 0;
      if (!customerPKR || customerPKR <= wholesalePKR) {
        customerPKR = wholesalePKR + 200;
      }
      const profitPKR = customerPKR - wholesalePKR;
      const stock = parseInt(columns[4]) || 50;
      const image = columns[5] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
      const description = columns[6] || 'Premium verified product for wholesale dropshipping & reselling.';
      const variants = columns[7] || 'Standard';

      const isValid = Boolean(title.length >= 3 && wholesalePKR > 0);

      rows.push({
        title,
        category,
        wholesalePricePKR: wholesalePKR,
        customerPricePKR: customerPKR,
        profitPKR,
        stock,
        image,
        description,
        variants,
        isValid,
        errorMessage: !isValid ? 'Title must be 3+ characters and Wholesale Price > 0' : undefined,
      });
    }

    setParsedRows(rows);
    if (rows.length > 0) {
      setActiveTab('preview');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      parseCsv(content);
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCsvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'apna_store_reseller_products_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExistingProducts = () => {
    const header = 'title,category,wholesalePricePKR,customerPricePKR,stock,image,description,variants\n';
    const rows = products.map((p) => {
      const wholesalePKR = Math.round(p.supplierCost * 280);
      const customerPKR = Math.round(p.retailPrice * 280);
      const variantsList = p.variants.options.map(o => o.name).join('; ');
      return `"${p.title.replace(/"/g, '""')}","${p.category}",${wholesalePKR},${customerPKR},${p.stock},"${p.images[0]}","${p.description.replace(/"/g, '""')}","${variantsList}"`;
    }).join('\n');

    const fullCsv = header + rows;
    const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `apna_store_catalog_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('No valid rows found to import.');
      return;
    }

    setIsProcessing(true);

    const convertedProducts: Product[] = validRows.map((row, idx) => {
      const rawVariants = row.variants.split(/[,;]/).map(v => v.trim()).filter(Boolean);
      const options = rawVariants.map((vName, vIdx) => ({
        id: `var-${Date.now()}-${idx}-${vIdx}`,
        name: vName,
        sku: `${row.title.substring(0, 3).toUpperCase()}-${vIdx + 1}`,
        inStock: true,
      }));

      return {
        id: `csv-prod-${Date.now()}-${idx}`,
        sku: `CSV-${(row.category || 'GEN').substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        title: row.title,
        tagline: 'Wholesale Verified Reseller Product',
        description: row.description,
        category: (row.category as any) || 'Trending Deals',
        retailPrice: pkrToUsd(row.customerPricePKR),
        originalPrice: pkrToUsd(row.customerPricePKR * 1.5),
        supplierCost: pkrToUsd(row.wholesalePricePKR),
        images: [row.image],
        rating: 4.9,
        reviewsCount: 1,
        stock: row.stock,
        tags: ['CSV Imported', 'Reseller Ready', '+Rs. 200 Profit'],
        importedToStore: true,
        supplier: SUPPLIERS[2], // Apna Local Hub
        variants: {
          type: 'Option',
          options: options.length > 0 ? options : [{ id: 'opt-1', name: 'Standard', sku: 'STD', inStock: true }],
        },
        features: [
          'Direct Wholesale Sourcing Price',
          'Cash on Delivery (COD) Enabled',
          'Standard Quality Sealed Packaging',
        ],
        reviews: [],
      };
    });

    setTimeout(() => {
      onBulkImport(convertedProducts);
      setIsProcessing(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base flex items-center gap-2">
                <span>CSV Bulk Product Importer & Sourcing Manager</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30 uppercase">
                  PKR Wholesale
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload CSV files to list hundreds of products in seconds with automated +Rs. 200 customer pricing.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar & Mode Switcher */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                activeTab === 'upload' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-700 hover:bg-slate-100'
              }`}
            >
              Upload / Paste CSV
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              disabled={parsedRows.length === 0}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white border text-slate-400 hover:text-slate-700 disabled:opacity-50'
              }`}
            >
              Preview Rows ({parsedRows.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSample}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Sample CSV Template</span>
            </button>

            <button
              onClick={handleExportExistingProducts}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Export Catalog ({products.length})</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* File Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/30 rounded-2xl p-8 text-center transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,text/csv"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800">
                  Click to Browse & Upload CSV File
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Supports Excel export, Google Sheets CSV, or custom supplier feeds. Wholesale and customer prices are automatically formatted in Pakistani Rupees (PKR).
                </p>
                <span className="inline-block mt-3 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                  Standard Reseller Rule: Wholesale + Rs. 200 Markup
                </span>
              </div>

              {/* Paste CSV raw text */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Or Paste CSV Data Directly Below:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvText(sampleCsvData);
                      parseCsv(sampleCsvData);
                    }}
                    className="text-xs text-emerald-700 font-bold hover:underline"
                  >
                    Load Sample Products
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`title,category,wholesalePricePKR,customerPricePKR,stock,image,description,variants\n"Bluetooth Earbuds",Electronics,1200,1400,50,"https://...", "Description", "Black, White"`}
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:border-emerald-500 outline-hidden bg-slate-50/50"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => parseCsv(csvText)}
                  disabled={!csvText.trim()}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Parse & Preview CSV Rows</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
                <span className="text-emerald-900 font-medium">
                  Found <strong>{parsedRows.filter(r => r.isValid).length}</strong> valid product(s) ready to import. Each product includes wholesale price and customer price (+Rs. 200 reseller profit).
                </span>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="text-emerald-800 font-bold underline text-xs"
                >
                  Edit CSV
                </button>
              </div>

              {/* Table Preview */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Product Title</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Wholesale (PKR)</th>
                      <th className="py-2.5 px-3">Customer Price</th>
                      <th className="py-2.5 px-3">Your Profit</th>
                      <th className="py-2.5 px-3">Variants</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="py-2.5 px-3">
                          {row.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <span title={row.errorMessage}>
                              <AlertCircle className="w-4 h-4 text-rose-500" />
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 max-w-[200px] truncate">
                          {row.title}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {row.category}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {formatPKR(row.wholesalePricePKR)}
                        </td>
                        <td className="py-2.5 px-3 font-black text-slate-900">
                          {formatPKR(row.customerPricePKR)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700">
                          +{formatPKR(row.profitPKR)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-[140px] truncate">
                          {row.variants}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Products will be immediately available on your storefront with Cash on Delivery (COD).
                </span>
                <button
                  onClick={handleConfirmImport}
                  disabled={isProcessing || parsedRows.filter(r => r.isValid).length === 0}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Importing Products...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Import {parsedRows.filter(r => r.isValid).length} Products to Store</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
