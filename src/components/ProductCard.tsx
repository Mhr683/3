import React from 'react';
import { Star, ShoppingBag, Eye, Truck, Check, Sparkles, Share2, DollarSign, Heart, BellRing } from 'lucide-react';
import { Product, CurrencyCode } from '../types/dropship';
import { formatPrice, usdToPkr, formatPKR, pkrToUsd } from '../utils/currency';

interface ProductCardProps {
  product: Product;
  currency: CurrencyCode;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isResellerMode?: boolean;
  onShareProduct?: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  hasPriceAlert?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  onSelect,
  onAddToCart,
  isResellerMode = false,
  onShareProduct,
  onToggleWishlist,
  hasPriceAlert = false,
}) => {
  const discountPercent = Math.round(
    ((product.originalPrice - product.retailPrice) / product.originalPrice) * 100
  );

  // In Reseller mode: Reseller gets wholesale price, customer gets wholesale + Rs. 200 (or custom retail)
  const wholesalePKR = usdToPkr(product.supplierCost);
  const defaultCustomerPKR = wholesalePKR + 200; // Rs. 200 mehnga rule
  const resellerProfitPKR = 200;

  return (
    <div className={`group bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
      isResellerMode ? 'border-emerald-200 shadow-emerald-50 hover:shadow-xl hover:border-emerald-400' : 'border-slate-200 shadow-xs hover:shadow-xl'
    }`}>
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden bg-slate-100 cursor-pointer" onClick={() => onSelect(product)}>
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {hasPriceAlert && (
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs border border-amber-600/30">
              <BellRing className="w-2.5 h-2.5 fill-current animate-bounce" />
              Price Alert
            </span>
          )}
          {isResellerMode ? (
            <span className="bg-emerald-600 text-white font-black text-[11px] px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              +Rs. 200 Reseller Profit
            </span>
          ) : (
            <>
              {discountPercent > 0 && (
                <span className="bg-rose-600 text-white font-black text-[11px] px-2 py-0.5 rounded-md shadow-xs">
                  -{discountPercent}%
                </span>
              )}
              {product.isTrending && (
                <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-2.5 h-2.5" />
                  Viral Deal
                </span>
              )}
            </>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist && onToggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full transition-all duration-200 z-20 shadow-md cursor-pointer ${
            product.isWishlisted 
              ? 'bg-rose-600 text-white hover:bg-rose-700 scale-105 ring-2 ring-rose-300' 
              : 'bg-white/90 backdrop-blur-md text-slate-600 hover:text-rose-600 hover:bg-white hover:scale-105'
          }`}
          aria-label={product.isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          title={product.isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
        >
          <Heart className={`w-3.5 h-3.5 ${product.isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Supplier indicator badge */}
        <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
          <Truck className="w-3 h-3 text-amber-400" />
          <span>{product.supplier.name}</span>
        </div>

        {/* Quick View Button */}
        <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="px-4 py-2 bg-white text-slate-900 rounded-xl font-bold text-xs shadow-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {product.category}
            </span>
            <div className="flex items-center gap-1 text-slate-700">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold">{Number(product.rating).toFixed(1)}</span>
              <span className="text-slate-400 text-[11px]">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelect(product)}
            className="font-bold text-slate-900 text-sm hover:text-amber-600 transition-colors line-clamp-2 cursor-pointer"
            title={product.title}
          >
            {product.title}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-1 mt-1">
            {product.tagline}
          </p>
        </div>

        {/* Pricing Layout */}
        {isResellerMode ? (
          /* Reseller Mode Pricing Card */
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/80 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Wholesale Cost:</span>
                <span className="font-black text-slate-900">{formatPKR(wholesalePKR)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Customer Price (+Rs. 200):</span>
                <span className="font-bold text-slate-700">{formatPKR(defaultCustomerPKR)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-emerald-200 text-emerald-800 font-bold">
                <span className="text-[11px]">Your Net Profit:</span>
                <span className="text-emerald-700 font-extrabold">+Rs. {resellerProfitPKR}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onShareProduct && onShareProduct(product)}
                className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                title="Share product with your profit on WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share & Earn</span>
              </button>

              <button
                onClick={() => onAddToCart(product)}
                className="py-2 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Order COD</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Customer Pricing (Wholesale + Rs. 200 Direct Customer Markup) */
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <div>
              <div className="text-lg font-black text-slate-900 leading-tight">
                {currency === 'PKR' ? formatPKR(defaultCustomerPKR) : formatPrice(pkrToUsd(defaultCustomerPKR), currency)}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 line-through">
                  {currency === 'PKR' ? formatPKR(defaultCustomerPKR + 800) : formatPrice(product.originalPrice, currency)}
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-bold">
                  COD Available
                </span>
              </div>
            </div>

            <button
              onClick={() => onAddToCart(product)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
