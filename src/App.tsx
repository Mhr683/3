/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  Flame, 
  ArrowUpDown, 
  SlidersHorizontal, 
  Truck, 
  CheckCircle2, 
  ShoppingBag, 
  ShieldCheck,
  Package,
  Layers,
  Store,
  Wallet,
  FileSpreadsheet,
  Share2,
  Heart,
  ArrowRight
} from 'lucide-react';
import { 
  Product, 
  CartItem, 
  Order, 
  CurrencyCode, 
  ProductVariant, 
  ProductReview,
  ResellerWallet,
  ResellerPayoutRecord,
  PriceAlert,
  UserAccount,
  UserRole,
  DiscountCoupon
} from './types/dropship';
import { INITIAL_PRODUCTS, WHOLESALE_DISCOVER_CATALOG, INITIAL_ORDERS } from './data/mockProducts';
import { DEFAULT_ACCOUNTS } from './data/defaultAccounts';
import { formatPrice, formatPKR, usdToPkr } from './utils/currency';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { MerchantDashboard } from './components/MerchantDashboard';
import { SupplierCatalogModal } from './components/SupplierCatalogModal';
import { AddProductModal } from './components/AddProductModal';
import { ResellerPortalModal } from './components/ResellerPortalModal';
import { CsvProductManagerModal } from './components/CsvProductManagerModal';
import { ShareProductModal } from './components/ShareProductModal';
import { PriceAlertsModal } from './components/PriceAlertsModal';
import { AuthModal } from './components/AuthModal';
import { WelcomeBackBanner } from './components/WelcomeBackBanner';
import { Footer } from './components/Footer';

export default function App() {
  // Global Currency State (PKR by default as requested)
  const [currency, setCurrency] = useState<CurrencyCode>('PKR');
  const [activeView, setActiveView] = useState<'store' | 'merchant'>('store');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [wholesaleCatalog, setWholesaleCatalog] = useState<Product[]>(WHOLESALE_DISCOVER_CATALOG);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [cart, setCart] = useState<CartItem[]>([
    {
      product: INITIAL_PRODUCTS[0],
      selectedVariant: INITIAL_PRODUCTS[0].variants.options[0],
      quantity: 1,
    }
  ]);

  // Reseller Application Features
  const [isResellerMode, setIsResellerMode] = useState<boolean>(true);
  const [resellerBrandName, setResellerBrandName] = useState<string>('Apna Reseller Store');
  const [resellerWallet, setResellerWallet] = useState<ResellerWallet>({
    totalProfitEarnedPKR: 5200,
    pendingClearancePKR: 1600,
    withdrawableBalancePKR: 3600,
    payoutHistory: [
      {
        id: 'po-101',
        amountPKR: 2000,
        method: 'JazzCash',
        accountTitle: 'M. Ali Reseller',
        accountNumber: '0301-7654321',
        date: '2 days ago',
        status: 'completed',
        transactionId: 'JC-9823412',
      },
      {
        id: 'po-102',
        amountPKR: 1600,
        method: 'EasyPaisa',
        accountTitle: 'M. Ali Reseller',
        accountNumber: '0345-9876543',
        date: '5 days ago',
        status: 'completed',
        transactionId: 'EP-4421890',
      }
    ]
  });

  // Filtering & Sorting
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'trending' | 'price-low' | 'price-high' | 'rating'>('trending');

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [shareProduct, setShareProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState<boolean>(false);
  const [selectedTrackingQuery, setSelectedTrackingQuery] = useState<string | undefined>(undefined);
  const [isSourcingCatalogOpen, setIsSourcingCatalogOpen] = useState<boolean>(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);
  const [isResellerPortalOpen, setIsResellerPortalOpen] = useState<boolean>(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);
  const [isPriceAlertsOpen, setIsPriceAlertsOpen] = useState<boolean>(false);

  // User Authentication & Partner Account State (Wholesaler & Reseller)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('apna_auth_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ACCOUNTS[0]; // Default active demo reseller
  });

  const [lastUser, setLastUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('apna_last_auth_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ACCOUNTS[0];
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'profile' | 'relogin'>('login');
  const [showWelcomeBack, setShowWelcomeBack] = useState<boolean>(true);

  // Sync auth state to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('apna_auth_user', JSON.stringify(currentUser));
        localStorage.setItem('apna_last_auth_user', JSON.stringify(currentUser));
        setLastUser(currentUser);
        if (currentUser.role === 'reseller' && currentUser.brandName) {
          setResellerBrandName(currentUser.brandName);
        }
      } else {
        localStorage.removeItem('apna_auth_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const handleOpenAuth = (mode: 'login' | 'register' | 'profile' | 'relogin' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogin = (user: UserAccount, remember: boolean = true) => {
    setCurrentUser(user);
    setLastUser(user);
    setShowWelcomeBack(true);

    if (user.role === 'wholesaler') {
      setIsResellerMode(false);
      showToast(`Welcome back, ${user.fullName}! Switched to Wholesaler Factory Hub.`);
    } else {
      setIsResellerMode(true);
      if (user.brandName) setResellerBrandName(user.brandName);
      showToast(`Welcome back, ${user.fullName}! Reseller store "${user.brandName || 'Apna Reseller'}" active.`);
    }
  };

  const handleRegister = (newUser: UserAccount) => {
    setCurrentUser(newUser);
    setLastUser(newUser);
    setShowWelcomeBack(true);

    if (newUser.role === 'wholesaler') {
      setIsResellerMode(false);
      showToast(`🚀 Welcome to Apna Store! Wholesaler account registered for "${newUser.companyName || newUser.fullName}".`);
    } else {
      setIsResellerMode(true);
      if (newUser.brandName) setResellerBrandName(newUser.brandName);
      showToast(`🚀 Welcome to Apna Store! Reseller account registered for "${newUser.brandName || newUser.fullName}".`);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowWelcomeBack(false);
    showToast('Signed out. You can quick re-login anytime.');
  };

  // Price Alerts State (with persistent storage & preset sample alert)
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('apna_price_alerts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'alert-sample-1',
        productId: 'prod-1',
        productTitle: 'AuraWave Pro ANC Wireless Earbuds',
        productImage: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
        currentWholesaleCost: 14.50,
        targetWholesaleCost: 12.00,
        channel: 'in_app',
        email: 'specialforme683@gmail.com',
        createdAt: 'Today',
        isTriggered: false,
      }
    ];
  });

  // Keep priceAlerts synchronized with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apna_price_alerts', JSON.stringify(priceAlerts));
    } catch (e) {
      console.error(e);
    }
  }, [priceAlerts]);

  // Promotional Discount Coupons & Vouchers State
  const [coupons, setCoupons] = useState<DiscountCoupon[]>(() => {
    try {
      const saved = localStorage.getItem('apna_store_coupons');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'coupon-1',
        code: 'APNA20',
        discountType: 'percentage',
        discountValue: 20,
        minSpendPKR: 1500,
        isActive: true,
        usageCount: 142,
        description: '20% Flash Discount on all trending viral gadgets',
      },
      {
        id: 'coupon-2',
        code: 'FREESHIP',
        discountType: 'fixed_pkr',
        discountValue: 250,
        minSpendPKR: 2000,
        isActive: true,
        usageCount: 89,
        description: 'Free Shipping Voucher (Rs. 250 off delivery fee)',
      },
      {
        id: 'coupon-3',
        code: 'EID2026',
        discountType: 'percentage',
        discountValue: 15,
        minSpendPKR: 2500,
        isActive: true,
        usageCount: 34,
        description: '15% Off Festive Season dropship special',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('apna_store_coupons', JSON.stringify(coupons));
    } catch (e) {
      console.error(e);
    }
  }, [coupons]);

  // Audio chime for price drop alert
  const playPriceDropChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  };

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  // Price Alert Operations
  const handleSetPriceAlert = (alertData: {
    productId: string;
    productTitle: string;
    productImage: string;
    currentWholesaleCost: number;
    targetWholesaleCost: number;
    channel: 'in_app' | 'email' | 'whatsapp';
    email?: string;
    phone?: string;
  }) => {
    setPriceAlerts((prev) => {
      const existingIndex = prev.findIndex((a) => a.productId === alertData.productId);
      const newAlert: PriceAlert = {
        id: existingIndex >= 0 ? prev[existingIndex].id : `alert-${Date.now()}`,
        ...alertData,
        createdAt: 'Today',
        isTriggered: false,
      };
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = newAlert;
        return copy;
      }
      return [newAlert, ...prev];
    });

    showToast(`🔔 Price alert active for "${alertData.productTitle}" below ${formatPrice(alertData.targetWholesaleCost, currency)}!`);
  };

  const handleRemovePriceAlert = (productId: string) => {
    setPriceAlerts((prev) => prev.filter((a) => a.productId !== productId));
    showToast('Price alert removed.');
  };

  const handleSimulateSupplierPriceDrop = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const alert = priceAlerts.find((a) => a.productId === productId);
    // Lower the supplier cost below target
    const newSupplierCost = alert 
      ? Number((alert.targetWholesaleCost * 0.92).toFixed(2))
      : Number((prod.supplierCost * 0.8).toFixed(2));

    // Update products list
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, supplierCost: newSupplierCost } : p))
    );

    // Update selectedProduct if currently open in modal
    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct((prev) => (prev ? { ...prev, supplierCost: newSupplierCost } : null));
    }

    // Mark alert as triggered
    setPriceAlerts((prev) =>
      prev.map((a) => {
        if (a.productId === productId) {
          return {
            ...a,
            isTriggered: true,
            triggeredAt: 'Just now',
            triggeredCost: newSupplierCost,
          };
        }
        return a;
      })
    );

    playPriceDropChime();
    showToast(`🎉 FACTORY PRICE DROP! "${prod.title}" wholesale cost fell to ${formatPrice(newSupplierCost, currency)}!`);
  };

  const triggeredAlertsCount = useMemo(() => priceAlerts.filter(a => a.isTriggered).length, [priceAlerts]);

  // Cart operations
  const handleAddToCart = (product: Product, variant?: ProductVariant, quantity: number = 1) => {
    const chosenVariant = variant || product.variants.options[0];
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.product.id === product.id && i.selectedVariant?.id === chosenVariant?.id
      );

      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        return next;
      } else {
        return [...prev, { product, selectedVariant: chosenVariant, quantity }];
      }
    });

    showToast(`Added "${product.title}" to bag!`);
  };

  const handleBuyNow = (product: Product, variant?: ProductVariant, quantity: number = 1) => {
    handleAddToCart(product, variant, quantity);
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    setCart((prev) => {
      const next = [...prev];
      next[index].quantity = newQty;
      return next;
    });
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Reseller Order & Wallet Operations
  const handleOrderPlaced = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);

    // If it's a reseller order, register the profit in wallet
    if (newOrder.isResellerOrder && newOrder.resellerProfitTotalPKR) {
      const profit = newOrder.resellerProfitTotalPKR;
      setResellerWallet((prev) => ({
        ...prev,
        pendingClearancePKR: prev.pendingClearancePKR + profit,
        totalProfitEarnedPKR: prev.totalProfitEarnedPKR + profit,
      }));
      showToast(`Reseller Order #${newOrder.id} booked! +${formatPKR(profit)} profit registered to your Munafa Wallet.`);
    } else {
      showToast(`Order #${newOrder.id} confirmed! Doorstep COD fulfillment initiated.`);
    }
  };

  const handleFulfillOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const generatedTracking = ord.trackingNumber.startsWith('AWAITING')
            ? `TCS-${Math.floor(1000000000 + Math.random() * 9000000000)}`
            : ord.trackingNumber;

          // If this was a reseller order, clear pending profit to withdrawable balance!
          if (ord.isResellerOrder && ord.resellerProfitTotalPKR) {
            const profit = ord.resellerProfitTotalPKR;
            setResellerWallet((w) => ({
              ...w,
              pendingClearancePKR: Math.max(0, w.pendingClearancePKR - profit),
              withdrawableBalancePKR: w.withdrawableBalancePKR + profit,
            }));
          }

          return {
            ...ord,
            status: 'shipped',
            trackingNumber: generatedTracking,
            trackingTimeline: ord.trackingTimeline.map((step) => {
              if (step.status === 'shipped') {
                return {
                  ...step,
                  completed: true,
                  current: true,
                  timestamp: 'Just now',
                  description: `Dispatched from hub via ${ord.carrier}. Tracking #${generatedTracking}.`,
                };
              }
              if (step.status === 'sourcing') {
                return { ...step, completed: true, current: false };
              }
              return step;
            }),
          };
        }
        return ord;
      })
    );
    showToast(`Order #${orderId} fulfilled & dispatched via courier!`);
  };

  // Simulate incoming real-time customer order for testing
  const handleSimulateNewOrder = () => {
    const sampleCustomers = [
      { name: 'Hamza Farooq', phone: '+92 300 8472910', city: 'Lahore', address: 'House 44, Sector Y, DHA Phase 3' },
      { name: 'Zainab Bibi', phone: '+92 321 9845123', city: 'Karachi', address: 'Apartment 4B, Clifton Block 2' },
      { name: 'Bilal Ahmed', phone: '+92 333 4567890', city: 'Islamabad', address: 'Street 12, Sector F-10/2' },
      { name: 'Sana Rauf', phone: '+92 345 6789012', city: 'Faisalabad', address: 'Kohinoor City, Jaranwala Road' },
      { name: 'Usman Tariq', phone: '+92 312 3456789', city: 'Rawalpindi', address: 'Chaklala Scheme 3' },
      { name: 'Ayesha Noor', phone: '+92 302 1122334', city: 'Multan', address: 'Bosan Road, Gulgasht Colony' },
      { name: 'Kashif Mehmood', phone: '+92 334 5566778', city: 'Peshawar', address: 'Hayatabad Phase 4' },
    ];
    const randCust = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
    const randProd = products[Math.floor(Math.random() * products.length)] || INITIAL_PRODUCTS[0];
    const randVariant = randProd.variants?.options?.[0] || {
      id: 'default',
      name: 'Standard',
      sku: `${randProd.id}-std`,
      stock: randProd.stock,
      inStock: true,
    };
    const quantity = Math.floor(Math.random() * 2) + 1;
    const subtotal = Number((randProd.retailPrice * quantity).toFixed(2));
    const supplierCost = Number((randProd.supplierCost * quantity).toFixed(2));
    const profit = Number((subtotal - supplierCost).toFixed(2));
    const orderId = `APNA-${Math.floor(10000 + Math.random() * 90000)}`;

    const newSimulatedOrder: Order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customerName: randCust.name,
      phone: randCust.phone,
      email: `${randCust.name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      address: randCust.address,
      city: randCust.city,
      paymentMethod: Math.random() > 0.25 ? 'Cash on Delivery (COD)' : 'JazzCash / EasyPaisa',
      items: [
        {
          product: randProd,
          selectedVariant: randVariant,
          quantity,
        },
      ],
      subtotal,
      discount: 0,
      shippingFee: 0,
      total: subtotal,
      currency: 'USD',
      status: 'unfulfilled',
      supplierName: randProd.supplier.name,
      supplierCostTotal: supplierCost,
      profitEarned: profit,
      trackingNumber: `AWAITING-${Math.floor(100000 + Math.random() * 900000)}`,
      carrier: 'TCS Express Pakistan',
      orderNote: 'Please call recipient on mobile before arriving. Ring doorbell twice.',
      notes: 'Please call recipient on mobile before arriving. Ring doorbell twice.',
      isResellerOrder: false,
      resellerBrandName: 'Apna Store',
      resellerProfitTotalPKR: 0,
      trackingTimeline: [
        {
          status: 'placed',
          title: 'Order Placed by Customer',
          description: 'Online checkout completed. Awaiting merchant dispatch.',
          timestamp: 'Just now',
          completed: true,
          current: true,
        },
        {
          status: 'sourcing',
          title: 'Wholesale Supplier Routing',
          description: `Direct routing to ${randProd.supplier.name}`,
          timestamp: 'Pending',
          completed: false,
        },
        {
          status: 'shipped',
          title: 'Courier Dispatch',
          description: 'Handover to TCS Express Pakistan',
          timestamp: 'Pending',
          completed: false,
        },
        {
          status: 'delivered',
          title: 'Doorstep Delivery',
          description: 'Cash collected upon delivery',
          timestamp: 'Pending',
          completed: false,
        },
      ],
    };

    setOrders((prev) => [newSimulatedOrder, ...prev]);
  };

  // Reseller Payout Request
  const handleRequestPayout = (payout: Omit<ResellerPayoutRecord, 'id' | 'date' | 'transactionId' | 'status'>) => {
    const newRecord: ResellerPayoutRecord = {
      id: `po-${Date.now()}`,
      amountPKR: payout.amountPKR,
      method: payout.method,
      accountTitle: payout.accountTitle,
      accountNumber: payout.accountNumber,
      date: 'Just now',
      status: 'completed',
      transactionId: `${payout.method.substring(0, 2).toUpperCase()}-${Math.floor(1000000 + Math.random() * 9000000)}`,
    };

    setResellerWallet((prev) => ({
      ...prev,
      withdrawableBalancePKR: Math.max(0, prev.withdrawableBalancePKR - payout.amountPKR),
      payoutHistory: [newRecord, ...prev.payoutHistory],
    }));

    showToast(`Payout of ${formatPKR(payout.amountPKR)} via ${payout.method} transferred to ${payout.accountTitle}!`);
  };

  // CSV Bulk Product Import
  const handleBulkCsvImport = (newProducts: Product[]) => {
    setProducts((prev) => [...newProducts, ...prev]);
    showToast(`Successfully listed ${newProducts.length} new products via CSV with automated wholesale pricing!`);
  };

  // Sourcing & Product Operations
  const handleImportProduct = (product: Product, customRetailPrice?: number) => {
    const retail = customRetailPrice ?? product.retailPrice;
    const importedProduct: Product = {
      ...product,
      retailPrice: retail,
      importedToStore: true,
    };

    setProducts((prev) => [importedProduct, ...prev]);
    setWholesaleCatalog((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, importedToStore: true } : p))
    );
    showToast(`"${product.title}" imported! Wholesale: ${formatPKR(usdToPkr(product.supplierCost))}`);
  };

  const handleAddCustomProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    showToast(`Added custom product "${newProd.title}"!`);
  };

  const handleUpdateProductPrice = (productId: string, newRetailPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, retailPrice: newRetailPrice } : p))
    );
    showToast('Product selling price updated!');
  };

  const handleAddCoupon = (newCouponData: Omit<DiscountCoupon, 'id' | 'usageCount'>) => {
    const newCoupon: DiscountCoupon = {
      ...newCouponData,
      id: `coupon-${Date.now()}`,
      usageCount: 0,
    };
    setCoupons((prev) => [newCoupon, ...prev]);
    showToast(`Voucher code "${newCoupon.code}" created & activated!`);
  };

  const handleToggleCouponActive = (couponId: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === couponId ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const handleDeleteCoupon = (couponId: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    showToast('Coupon removed.');
  };

  const handleVerifyOrderAddress = (orderId: string, isVerified: boolean, note?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            isAddressVerified: isVerified,
            verificationNotes: note || o.verificationNotes,
          };
        }
        return o;
      })
    );
    showToast(`Order #${orderId} marked as address verified ✓`);
  };

  const handleReorderProductStock = (productId: string, unitsToAdd: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newStock = p.stock + unitsToAdd;
          return { ...p, stock: newStock };
        }
        return p;
      })
    );
    const targetProd = products.find((p) => p.id === productId);
    showToast(`⚡ Restocked +${unitsToAdd} units of "${targetProd?.title || 'Item'}" from supplier!`);
  };

  const handleAddReview = (
    productId: string,
    newReviewData: Omit<ProductReview, 'id' | 'date'>
  ) => {
    const newReview: ProductReview = {
      id: `rev-${Date.now()}`,
      ...newReviewData,
      date: 'Just now',
    };

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const updatedReviews = [newReview, ...p.reviews];
          const totalRatingSum = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
          const newAvgRating = Number((totalRatingSum / updatedReviews.length).toFixed(2));
          return {
            ...p,
            reviews: updatedReviews,
            rating: newAvgRating,
            reviewsCount: p.reviewsCount + 1,
          };
        }
        return p;
      })
    );

    setSelectedProduct((prev) => {
      if (prev && prev.id === productId) {
        const updatedReviews = [newReview, ...prev.reviews];
        const totalRatingSum = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
        const newAvgRating = Number((totalRatingSum / updatedReviews.length).toFixed(2));
        return {
          ...prev,
          reviews: updatedReviews,
          rating: newAvgRating,
          reviewsCount: prev.reviewsCount + 1,
        };
      }
      return prev;
    });

    showToast(`Thank you, ${newReview.author}! Your review has been published.`);
  };

  // Wishlist Operations
  const wishlistedProducts = useMemo(() => {
    return products.filter((p) => Boolean(p.isWishlisted));
  }, [products]);

  const wishlistCount = wishlistedProducts.length;

  const handleToggleWishlist = (productId: string) => {
    let nowWishlisted = false;
    let targetTitle = '';

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          nowWishlisted = !p.isWishlisted;
          targetTitle = p.title;
          return { ...p, isWishlisted: nowWishlisted };
        }
        return p;
      })
    );

    setSelectedProduct((prev) => {
      if (prev && prev.id === productId) {
        return { ...prev, isWishlisted: !prev.isWishlisted };
      }
      return prev;
    });

    if (nowWishlisted) {
      showToast(`Added "${targetTitle || 'Item'}" to your Wishlist ❤️`);
    } else {
      showToast(`Removed from Wishlist`);
    }
  };

  const handleAddAllWishlistToBag = () => {
    if (wishlistedProducts.length === 0) return;
    wishlistedProducts.forEach((p) => {
      handleAddToCart(p);
    });
    showToast(`Added all ${wishlistedProducts.length} wishlist items to bag!`);
  };

  const handleClearWishlist = () => {
    setProducts((prev) => prev.map((p) => ({ ...p, isWishlisted: false })));
    showToast('Wishlist cleared.');
  };

  // Filter and Sort Products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchCat =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'Wishlist'
          ? Boolean(p.isWishlisted)
          : selectedCategory === 'Trending Deals'
          ? p.isTrending || p.isFlashSale
          : p.category === selectedCategory;

      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCat && matchSearch;
    });

    if (sortBy === 'price-low') {
      result = [...result].sort((a, b) => a.supplierCost - b.supplierCost);
    } else if (sortBy === 'price-high') {
      result = [...result].sort((a, b) => b.supplierCost - a.supplierCost);
    } else if (sortBy === 'rating') {
      result = [...result].sort((a, b) => b.rating - a.rating);
    } else {
      // Trending
      result = [...result].sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0));
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  const totalCartUnits = cart.reduce((acc, i) => acc + i.quantity, 0);

  // Dynamic distinct categories extracted from current live inventory
  const distinctCategories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  }, [products]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-amber-500 selection:text-slate-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        currentCurrency={currency}
        onCurrencyChange={setCurrency}
        cartCount={totalCartUnits}
        wishlistCount={wishlistCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTracking={() => setIsTrackingOpen(true)}
        activeView={activeView}
        onToggleView={setActiveView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenWholesaleCatalog={() => setIsSourcingCatalogOpen(true)}
        isResellerMode={isResellerMode}
        priceAlertsCount={priceAlerts.length}
        hasTriggeredAlerts={triggeredAlertsCount > 0}
        onOpenPriceAlerts={() => setIsPriceAlertsOpen(true)}
        onToggleResellerMode={() => {
          setIsResellerMode(!isResellerMode);
          showToast(!isResellerMode ? 'Switched to Reseller Wholesale Mode (+Rs. 200 Profit)' : 'Switched to Direct Customer Mode');
        }}
        onOpenResellerPortal={() => setIsResellerPortalOpen(true)}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        resellerWalletBalancePKR={resellerWallet.withdrawableBalancePKR}
        availableCategories={distinctCategories}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
      />

      {/* Welcome Back Notification Overlay Banner */}
      {showWelcomeBack && currentUser && (
        <WelcomeBackBanner
          user={currentUser}
          onDismiss={() => setShowWelcomeBack(false)}
          onOpenWallet={() => setIsResellerPortalOpen(true)}
          onOpenMerchant={() => setActiveView('merchant')}
          onOpenCatalog={() => setIsSourcingCatalogOpen(true)}
          resellerWalletBalancePKR={resellerWallet.withdrawableBalancePKR}
          currency={currency}
        />
      )}

      {/* Main Content Area */}
      {activeView === 'store' ? (
        <main className="flex-1">
          {/* Hero Banner with Spotlight & Trust Points */}
          <HeroBanner
            currency={currency}
            onExploreClick={() => {
              const el = document.getElementById('products-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenSourcing={() => setIsSourcingCatalogOpen(true)}
            isResellerMode={isResellerMode}
          />

          {/* Reseller Info Bar Callout */}
          <div className="max-w-7xl mx-auto px-4 mt-6">
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 text-xs transition-colors ${
              isResellerMode 
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isResellerMode ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                  {isResellerMode ? <Wallet className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-extrabold text-sm flex items-center gap-2">
                    <span>{isResellerMode ? 'Reseller Wholesale View ACTIVE' : 'Direct Customer Shopping View'}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                      isResellerMode ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                    }`}>
                      {isResellerMode ? 'Wholesale Price' : 'Customer Price (+Rs. 200)'}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    {isResellerMode 
                      ? 'You see direct wholesale rates. Direct customers pay +Rs. 200 (your guaranteed profit). Share to WhatsApp with 1-click!'
                      : 'You are viewing direct retail prices with Cash on Delivery included. Switch to Reseller View anytime for wholesale rates.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isResellerMode && (
                  <button
                    onClick={() => setIsResellerPortalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Munafa Wallet ({formatPKR(resellerWallet.withdrawableBalancePKR)})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Storefront Products Section */}
          <div id="products-section" className="max-w-7xl mx-auto px-4 py-8 sm:py-10 space-y-6">
            {/* Dedicated Wishlist Shelf when viewing all products */}
            {selectedCategory === 'all' && wishlistCount > 0 && !searchQuery && (
              <div className="bg-gradient-to-r from-rose-50/90 via-white to-pink-50/80 border border-rose-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-rose-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
                      <Heart className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                        <span>Your Saved Wishlist</span>
                        <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold">
                          {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500">Quick access to your saved favorite products</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddAllWishlistToBag}
                      className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer hidden sm:flex items-center gap-1.5 shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-900" />
                      <span>Add All to Bag</span>
                    </button>
                    <button
                      onClick={() => setSelectedCategory('Wishlist')}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <span>View Full Wishlist</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {wishlistedProducts.slice(0, 4).map((wp) => (
                    <div
                      key={wp.id}
                      onClick={() => setSelectedProduct(wp)}
                      className="group relative bg-white p-2.5 rounded-xl border border-rose-100 hover:border-rose-300 hover:shadow-md transition-all cursor-pointer flex items-center gap-2.5"
                    >
                      <img
                        src={wp.images[0]}
                        alt={wp.title}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-50 shrink-0 border border-slate-100 group-hover:scale-105 transition-transform"
                      />
                      <div className="overflow-hidden flex-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{wp.title}</h4>
                        <div className="text-[11px] font-black text-rose-600 mt-0.5">
                          {formatPrice(wp.retailPrice, currency)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWishlist(wp.id);
                        }}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0 cursor-pointer"
                        title="Remove from wishlist"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Header & Sorter */}
            {selectedCategory === 'Wishlist' ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-rose-50 via-white to-pink-50 border border-rose-200 rounded-2xl shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-md shadow-rose-600/20">
                    <Heart className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        My Saved Wishlist & Favorites
                      </h2>
                      <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                        {wishlistCount} saved items
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Your handpicked dropship & wholesale winners. Order with Cash on Delivery or resell to your customers!
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {wishlistCount > 0 && (
                    <>
                      <button
                        onClick={handleAddAllWishlistToBag}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add All to Bag</span>
                      </button>
                      <button
                        onClick={handleClearWishlist}
                        className="px-3.5 py-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Clear Wishlist
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    View All Products
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {selectedCategory === 'all'
                        ? (isResellerMode ? 'Wholesale Reseller Products' : 'Featured Trending Products')
                        : selectedCategory}
                    </h2>
                    <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {filteredProducts.length} items
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isResellerMode 
                      ? 'Wholesale prices for resellers. Direct customers pay +Rs. 200. White-label COD courier dispatch.'
                      : 'Factory-direct sourcing with instant Cash on Delivery and doorstep inspection across Pakistan.'}
                  </p>
                </div>

                {/* Action buttons & Sort by selector */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    onClick={() => setIsCsvModalOpen(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Import / Export CSV</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-amber-500 outline-hidden cursor-pointer"
                    >
                      <option value="trending">🔥 Most Viral / Trending</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Top Rated (Stars)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              selectedCategory === 'Wishlist' ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-rose-200/80 p-8 space-y-4 shadow-xs">
                  <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center animate-pulse">
                    <Heart className="w-8 h-8 fill-rose-500/20" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="font-extrabold text-slate-900 text-lg">Your Wishlist is Empty</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Click the heart icon on any product in our wholesale or customer catalog to save your favorite products here.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Explore Products</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">No products found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try adjusting your search terms or upload products using the CSV Lister.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setSearchQuery('');
                      }}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                    <button
                      onClick={() => setIsCsvModalOpen(true)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      Upload CSV
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    currency={currency}
                    onSelect={(p) => setSelectedProduct(p)}
                    onAddToCart={(p) => handleAddToCart(p)}
                    isResellerMode={isResellerMode}
                    onShareProduct={(p) => setShareProduct(p)}
                    onToggleWishlist={handleToggleWishlist}
                    hasPriceAlert={priceAlerts.some((a) => a.productId === product.id)}
                  />
                ))}
              </div>
            )}

            {/* Sourcing Banner Callout */}
            <div className="mt-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-orange-600/10">
              <div className="space-y-2 text-center md:text-left">
                <span className="bg-white/20 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider">
                  Wholesale Reseller Network
                </span>
                <h3 className="text-xl sm:text-2xl font-black">
                  Start your own online store with zero stock investment!
                </h3>
                <p className="text-xs sm:text-sm text-amber-100 max-w-xl">
                  Apna Store features 1-click wholesale sourcing, automated +Rs. 200 profit margin protection, white-label courier flyers, and CSV bulk catalog imports.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
                <button
                  onClick={() => setIsCsvModalOpen(true)}
                  className="px-4 py-3 bg-white text-slate-950 rounded-xl font-black text-xs shadow-md hover:bg-amber-50 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Bulk CSV Lister</span>
                </button>
                <button
                  onClick={() => setIsResellerPortalOpen(true)}
                  className="px-4 py-3 bg-slate-950 text-white rounded-xl font-black text-xs shadow-md hover:bg-slate-900 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Reseller Munafa Wallet</span>
                </button>
                <button
                  onClick={() => setActiveView('merchant')}
                  className="px-4 py-3 bg-slate-950/40 text-white border border-white/30 rounded-xl font-bold text-xs hover:bg-slate-950/60 transition-colors cursor-pointer"
                >
                  Merchant Hub
                </button>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* Merchant Hub View */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:py-8">
          <MerchantDashboard
            orders={orders}
            products={products}
            currency={currency}
            onFulfillOrder={handleFulfillOrder}
            onOpenSourcingCatalog={() => setIsSourcingCatalogOpen(true)}
            onOpenAddProduct={() => setIsAddProductOpen(true)}
            onUpdateProductPrice={handleUpdateProductPrice}
            onOpenCsvModal={() => setIsCsvModalOpen(true)}
            onSimulateOrder={handleSimulateNewOrder}
            onReorderProductStock={handleReorderProductStock}
            coupons={coupons}
            onAddCoupon={handleAddCoupon}
            onToggleCouponActive={handleToggleCouponActive}
            onDeleteCoupon={handleDeleteCoupon}
            onVerifyOrderAddress={handleVerifyOrderAddress}
          />
        </main>
      )}

      {/* Footer */}
      <Footer
        currency={currency}
        onOpenTracking={() => setIsTrackingOpen(true)}
        onOpenMerchant={() => setActiveView('merchant')}
        onOpenSourcing={() => setIsSourcingCatalogOpen(true)}
      />

      {/* Modals & Slide-outs */}
      <ProductDetailModal
        product={selectedProduct}
        currency={currency}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(prod, variant, qty) => handleAddToCart(prod, variant, qty)}
        onBuyNow={(prod, variant, qty) => handleBuyNow(prod, variant, qty)}
        onAddReview={handleAddReview}
        isResellerMode={isResellerMode}
        onShareProduct={(prod) => setShareProduct(prod)}
        onToggleWishlist={handleToggleWishlist}
        priceAlert={selectedProduct ? priceAlerts.find(a => a.productId === selectedProduct.id) : null}
        onSetPriceAlert={handleSetPriceAlert}
        onRemovePriceAlert={handleRemovePriceAlert}
        onSimulatePriceDrop={handleSimulateSupplierPriceDrop}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        currency={currency}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onOrderPlaced={handleOrderPlaced}
        isResellerMode={isResellerMode}
        resellerBrandName={resellerBrandName}
        onOpenResellerPortal={() => setIsResellerPortalOpen(true)}
        coupons={coupons}
      />

      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => {
          setIsTrackingOpen(false);
          setSelectedTrackingQuery(undefined);
        }}
        orders={orders}
        currency={currency}
        initialTrackingQuery={selectedTrackingQuery}
      />

      <SupplierCatalogModal
        isOpen={isSourcingCatalogOpen}
        onClose={() => setIsSourcingCatalogOpen(false)}
        wholesaleCatalog={wholesaleCatalog}
        currency={currency}
        onImportProduct={handleImportProduct}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        currency={currency}
        onAddProduct={handleAddCustomProduct}
        existingCategories={distinctCategories}
      />

      {/* Reseller Earnings & Wallet Modal */}
      <ResellerPortalModal
        isOpen={isResellerPortalOpen}
        onClose={() => setIsResellerPortalOpen(false)}
        wallet={resellerWallet}
        resellerBrandName={resellerBrandName}
        onUpdateBrandName={(name) => {
          setResellerBrandName(name);
          showToast(`Reseller brand name updated to "${name}"!`);
        }}
        onRequestPayout={handleRequestPayout}
        orders={orders}
        currency={currency}
        onOpenTracking={(trackingNum) => {
          setSelectedTrackingQuery(trackingNum);
          setIsResellerPortalOpen(false);
          setIsTrackingOpen(true);
        }}
      />

      {/* CSV Bulk Importer & Exporter Modal */}
      <CsvProductManagerModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        products={products}
        currency={currency}
        onBulkImport={handleBulkCsvImport}
      />

      {/* Reseller Social & WhatsApp Share Modal */}
      <ShareProductModal
        product={shareProduct}
        isOpen={Boolean(shareProduct)}
        onClose={() => setShareProduct(null)}
        currency={currency}
        resellerBrandName={resellerBrandName}
      />

      {/* Wholesale Price Alerts Management Modal */}
      <PriceAlertsModal
        isOpen={isPriceAlertsOpen}
        onClose={() => setIsPriceAlertsOpen(false)}
        alerts={priceAlerts}
        products={products}
        currency={currency}
        onSelectProduct={(prod) => {
          setSelectedProduct(prod);
          setIsPriceAlertsOpen(false);
        }}
        onRemoveAlert={(alertId) => {
          setPriceAlerts((prev) => prev.filter((a) => a.id !== alertId));
          showToast('Price alert removed.');
        }}
        onSimulateDrop={(productId) => handleSimulateSupplierPriceDrop(productId)}
        onClearAllAlerts={() => {
          setPriceAlerts([]);
          showToast('All price alerts cleared.');
        }}
      />

      {/* Reseller & Wholesaler Account & Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        lastUser={lastUser}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        initialMode={authModalMode}
      />
    </div>
  );
}
