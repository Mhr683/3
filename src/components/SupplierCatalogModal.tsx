import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  Plus, 
  Check, 
  DollarSign, 
  Package, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Product, CurrencyCode } from '../types/dropship';
import { formatPrice } from '../utils/currency';

interface SupplierCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  wholesaleCatalog: Product[];
  currency: CurrencyCode;
  onImportProduct: (product: Product, customRetailPrice?: number) => void;
}

export const SupplierCatalogModal: React.FC<SupplierCatalogModalProps> = ({
  isOpen,
  onClose,
  wholesaleCatalog,
  currency,
  onImportProduct,
}) => {
  if (!isOpen) return null;

  const [markupMap, setMarkupMap] = useState<Record<string, number>>({});
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const handlePriceChange = (productId: string, newPrice: number) => {
    setMarkupMap((prev) => ({
      ...prev,
      [productId]: newPrice,
    }));
  };

  const handleImport = (product: Product) => {
    const finalRetail = markupMap[product.id] || product.retailPrice;
    onImportProduct(product, finalRetail);
    setImportedIds((prev) => new Set([...prev, product.id]));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base flex items-center gap-2">
                <span>Wholesale Direct Sourcing Hub</span>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                  1-Click Import
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Browse factory-tested viral dropship winners, set custom profit margins, and push directly to your Apna Store storefront.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Catalog Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Smart Margin Engine:</strong> Adjust the suggested selling price to preview your net profit per unit before importing.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wholesaleCatalog.map((product) => {
              const customRetail = markupMap[product.id] ?? product.retailPrice;
              const unitProfit = customRetail - product.supplierCost;
              const marginPercent = Math.round((unitProfit / customRetail) * 100);
              const isImported = importedIds.has(product.id) || product.importedToStore;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between gap-3"
                >
                  <div className="flex gap-3">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-24 h-24 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-500">{product.supplier.name}</span>
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                          {product.supplier.location}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-2">
                        {product.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {product.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Financial Sourcing Matrix */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Factory Cost</span>
                        <span className="font-bold text-slate-800">
                          {formatPrice(product.supplierCost, currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Your Price</span>
                        <input
                          type="number"
                          step="0.5"
                          min={product.supplierCost + 1}
                          value={customRetail}
                          onChange={(e) =>
                            handlePriceChange(product.id, parseFloat(e.target.value) || product.retailPrice)
                          }
                          className="w-full text-center font-bold text-slate-900 border border-slate-300 rounded bg-white py-0.5 text-xs outline-hidden"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-700 block">Your Profit</span>
                        <span className="font-extrabold text-emerald-700">
                          +{formatPrice(unitProfit, currency)} ({marginPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => handleImport(product)}
                    disabled={isImported}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isImported
                        ? 'bg-emerald-100 text-emerald-800 cursor-default'
                        : 'bg-slate-900 hover:bg-amber-600 text-white shadow-xs'
                    }`}
                  >
                    {isImported ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-700" />
                        <span>Imported to Apna Store</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Push to Storefront</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
