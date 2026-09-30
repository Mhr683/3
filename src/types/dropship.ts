export type CurrencyCode = 'USD' | 'PKR' | 'AED' | 'EUR' | 'GBP' | 'INR';

export type UserRole = 'reseller' | 'wholesaler';

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  city: string;
  avatarUrl?: string;
  isVerified?: boolean;
  createdAt: string;
  lastLoginAt: string;
  // Reseller specific fields
  brandName?: string;
  payoutMethod?: 'JazzCash' | 'EasyPaisa' | 'Bank Transfer';
  payoutAccountTitle?: string;
  payoutAccountNumber?: string;
  // Wholesaler specific fields
  companyName?: string;
  warehouseLocation?: string;
  dispatchTime?: string;
  ntnOrCnic?: string;
  primaryCategory?: string;
  totalProductsSupplied?: number;
  totalOrdersFulfilled?: number;
  rating?: number;
}

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rate: number; // relative to USD (1 USD = rate)
  name: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  inStock: boolean;
  extraPrice?: number;
}

export interface SupplierInfo {
  id: string;
  name: string;
  location: string;
  rating: number;
  ordersFulfilled: number;
  dispatchTime: string; // e.g. "24-48 hours"
  avgDeliveryDays: string; // e.g. "3-5 days"
  returnPolicy: string;
}

export interface ProductReview {
  id: string;
  author: string;
  city: string;
  rating: number;
  date: string;
  comment: string;
  verifiedPurchase: boolean;
}

export interface Product {
  id: string;
  sku: string; // Stock Keeping Unit identifier
  title: string;
  tagline: string;
  description: string;
  category: string; // Storefront category (e.g. 'Electronics', 'Home & Living', or merchant custom category)
  retailPrice: number; // in USD
  originalPrice: number; // in USD
  supplierCost: number; // wholesale cost
  images: string[];
  rating: number;
  reviewsCount: number;
  stock: number;
  tags: string[];
  isTrending?: boolean;
  isFlashSale?: boolean;
  isWishlisted?: boolean;
  importedToStore: boolean;
  supplier: SupplierInfo;
  variants: {
    type: string; // e.g. "Color" | "Size"
    options: ProductVariant[];
  };
  features: string[];
  reviews: ProductReview[];
}

export interface CartItem {
  product: Product;
  selectedVariant?: ProductVariant;
  quantity: number;
  resellerProfitPKR?: number; // Custom profit added by reseller (default Rs. 200)
}

export interface ResellerPayoutRecord {
  id: string;
  amountPKR: number;
  method: 'JazzCash' | 'EasyPaisa' | 'Bank Transfer';
  accountTitle: string;
  accountNumber: string;
  date: string;
  status: 'completed' | 'processing';
  transactionId: string;
}

export interface ResellerWallet {
  totalProfitEarnedPKR: number;
  pendingClearancePKR: number;
  withdrawableBalancePKR: number;
  payoutHistory: ResellerPayoutRecord[];
}

export interface TrackingStep {
  status: string;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  current?: boolean;
}

export interface PriceAlert {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  targetWholesaleCost: number; // in USD
  currentWholesaleCost: number; // in USD at creation
  channel: 'in_app' | 'email' | 'whatsapp';
  email?: string;
  phone?: string;
  createdAt: string;
  isTriggered: boolean;
  triggeredAt?: string;
  triggeredCost?: number; // wholesale cost in USD that triggered the alert
}

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  paymentMethod: 'Cash on Delivery (COD)' | 'Card Payment' | 'JazzCash / EasyPaisa' | 'Direct Bank Transfer';
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  currency: CurrencyCode;
  status: 'unfulfilled' | 'sourcing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  supplierName: string;
  supplierCostTotal: number;
  profitEarned: number;
  trackingNumber: string;
  carrier: string;
  trackingTimeline: TrackingStep[];
  orderNote?: string; // Optional customer instructions/delivery notes provided during checkout
  notes?: string; // Special instructions provided at checkout
  // Reseller specific fields
  isResellerOrder?: boolean;
  resellerBrandName?: string; // Custom brand printed on courier flyer
  resellerProfitTotalPKR?: number; // Profit credited to reseller wallet
  resellerPayoutMethod?: string;
  resellerPayoutAccount?: string;
  isAddressVerified?: boolean; // COD WhatsApp / call address confirmation
  verificationNotes?: string;
}

export interface DiscountCoupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed_pkr';
  discountValue: number; // e.g. 20 for 20% or 250 for Rs. 250
  minSpendPKR: number; // e.g. 1000
  isActive: boolean;
  usageCount: number;
  maxUses?: number;
  expiryDate?: string;
  description?: string;
}
