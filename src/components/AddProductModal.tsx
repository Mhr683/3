import React, { useState } from 'react';
import { X, Plus, DollarSign, Package, Layers, Image as ImageIcon, FolderPlus, Tag, Sparkles } from 'lucide-react';
import { Product, CurrencyCode } from '../types/dropship';
import { SUPPLIERS } from '../data/mockProducts';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: CurrencyCode;
  onAddProduct: (product: Product) => void;
  existingCategories?: string[];
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  currency,
  onAddProduct,
  existingCategories = [],
}) => {
  if (!isOpen) return null;

  const DEFAULT_CATEGORIES = [
    'Electronics',
    'Home & Living',
    'Fashion & Beauty',
    'Fitness & Gadgets',
    'Trending Deals',
  ];

  const categoryOptions = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...existingCategories.filter((c) => c && c !== 'All Categories' && c !== 'Wishlist')])
  );

  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryOptions[0] || 'Electronics');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [retailPrice, setRetailPrice] = useState('29.99');
  const [supplierCost, setSupplierCost] = useState('9.50');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80');
  const [supplierId, setSupplierId] = useState(SUPPLIERS[0].id);
  const [variantOptions, setVariantOptions] = useState('Matte Black, Metallic Silver, Royal Blue');

  const generateAutoSku = (name: string) => {
    const clean = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${clean || 'APNA'}-${rand}`;
  };

  const parsedRetail = parseFloat(retailPrice) || 0;
  const parsedCost = parseFloat(supplierCost) || 0;
  const profit = Math.max(0, parsedRetail - parsedCost);
  const marginPercent = parsedRetail > 0 ? Math.round((profit / parsedRetail) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = isCreatingNewCategory
      ? (newCategoryName.trim() || selectedCategory)
      : selectedCategory;

    const supplier = SUPPLIERS.find((s) => s.id === supplierId) || SUPPLIERS[0];
    const rawOptions = variantOptions.split(',').map((s) => s.trim()).filter(Boolean);
    const finalSku = sku.trim() ? sku.trim().toUpperCase() : generateAutoSku(title);

    const options = rawOptions.map((opt, idx) => ({
      id: `v-${Date.now()}-${idx}`,
      name: opt,
      sku: `${finalSku}-${idx + 1}`,
      inStock: true,
    }));

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      sku: finalSku,
      title,
      tagline: tagline || 'Direct dropship sourcing winner',
      description: description || 'High-quality trending product sourced directly from verified manufacturer.',
      category: finalCategory,
      retailPrice: parsedRetail,
      originalPrice: parsedRetail * 1.8,
      supplierCost: parsedCost,
      images: [imageUrl],
      rating: 4.9,
      reviewsCount: 1,
      stock: 50,
      tags: ['New Arrival', 'Dropship Verified', finalCategory],
      importedToStore: true,
      supplier,
      variants: {
        type: 'Option',
        options: options.length > 0 ? options : [{ id: 'opt-1', name: 'Standard Edition', sku: `${finalSku}-STD`, inStock: true }],
      },
      features: [
        'Direct factory wholesale warranty',
        'Quality inspected before dispatch',
        'Doorstep Cash on Delivery eligible',
      ],
      reviews: [],
    };

    onAddProduct(newProd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            <h2 className="font-extrabold text-slate-900 text-base">
              Add Dropship Product
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ultra Smartwatch Pro with AMOLED Screen"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
            />
          </div>

          {/* SKU Field with Auto-Generate Action */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>SKU (Stock Keeping Unit) *</span>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-semibold border border-amber-200">
                  Inventory Code
                </span>
              </label>
              <button
                type="button"
                onClick={() => setSku(generateAutoSku(title || 'PROD'))}
                className="text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Auto-generate a unique alphanumeric stock keeping code"
              >
                <span>⚡ Auto-Generate SKU</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="e.g. AW-PRO-ANC, WATCH-AMOLED-01"
              className="w-full px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider border border-slate-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-slate-50/50 focus:bg-white transition-all shadow-2xs"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Unique SKU code for warehouse inventory tracking, order routing, and accounting.
            </span>
          </div>

          {/* Category Dropdown & Custom Category Creator */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                <span>Storefront Category *</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewCategory(!isCreatingNewCategory);
                  if (!isCreatingNewCategory) {
                    setNewCategoryName('');
                  }
                }}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                {isCreatingNewCategory ? (
                  <span>← Choose existing category</span>
                ) : (
                  <>
                    <FolderPlus className="w-3 h-3 text-amber-600" />
                    <span>+ Create New Category</span>
                  </>
                )}
              </button>
            </div>

            {!isCreatingNewCategory ? (
              <div className="space-y-1.5">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsCreatingNewCategory(true);
                      setNewCategoryName('');
                    } else {
                      setSelectedCategory(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-white font-semibold text-slate-800 transition-all cursor-pointer"
                >
                  <optgroup label="Existing Store Categories">
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Create New">
                    <option value="__NEW__">➕ + Create New Category...</option>
                  </optgroup>
                </select>
                <span className="text-[10px] text-slate-500 block">
                  Select an existing storefront department or click "+ Create New Category" to establish a new section.
                </span>
              </div>
            ) : (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <div className="relative">
                  <input
                    type="text"
                    required={isCreatingNewCategory}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter new category name (e.g. Kitchen & Dining, Watches, Audio)..."
                    className="w-full px-3 py-2 text-xs border-2 border-amber-500 bg-white rounded-xl focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 outline-hidden font-bold text-slate-900 transition-all shadow-2xs"
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-amber-800 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Will create a new category and add it to the storefront navigation.</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewCategory(false);
                      setNewCategoryName('');
                    }}
                    className="text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Dropship Wholesale Supplier *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden bg-white cursor-pointer font-medium text-slate-800"
            >
              {SUPPLIERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.location}) • {s.dispatchTime}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Supplier Cost (Wholesale USD)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={supplierCost}
                onChange={(e) => setSupplierCost(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Selling Price (Retail USD)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
              />
            </div>
          </div>

          {/* Profit Preview Widget */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
            <span className="text-emerald-900 font-medium">Estimated Net Profit Margin:</span>
            <span className="font-black text-emerald-800 text-sm">
              +${profit.toFixed(2)} ({marginPercent}%)
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Image URL
            </label>
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Variants (Comma separated)
            </label>
            <input
              type="text"
              value={variantOptions}
              onChange={(e) => setVariantOptions(e.target.value)}
              placeholder="e.g. Small, Medium, Large"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Add Product to Apna Store
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
