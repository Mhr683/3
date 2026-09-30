import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Plus, 
  Search, 
  ExternalLink,
  Store,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
  Calendar,
  Flame,
  Award,
  CircleDollarSign,
  Activity,
  Filter,
  ChevronDown,
  XCircle,
  Trophy,
  Crown,
  AlertTriangle,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Zap,
  X,
  Eye,
  Radio,
  Download,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Printer,
  MessageSquare,
  Tag
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Order, Product, CurrencyCode, DiscountCoupon } from '../types/dropship';
import { formatPrice, convertAmount } from '../utils/currency';
import { SUPPLIERS } from '../data/mockProducts';
import { CourierShippingLabelModal } from './CourierShippingLabelModal';
import { WhatsAppOrderVerificationModal } from './WhatsAppOrderVerificationModal';
import { CouponManagerTab } from './CouponManagerTab';

interface MerchantDashboardProps {
  orders: Order[];
  products: Product[];
  currency: CurrencyCode;
  onFulfillOrder: (orderId: string) => void;
  onOpenSourcingCatalog: () => void;
  onOpenAddProduct: () => void;
  onUpdateProductPrice: (productId: string, newRetailPrice: number) => void;
  onOpenCsvModal?: () => void;
  onSimulateOrder?: () => void;
  onReorderProductStock?: (productId: string, unitsToAdd: number) => void;
  coupons?: DiscountCoupon[];
  onAddCoupon?: (newCoupon: Omit<DiscountCoupon, 'id' | 'usageCount'>) => void;
  onToggleCouponActive?: (couponId: string) => void;
  onDeleteCoupon?: (couponId: string) => void;
  onVerifyOrderAddress?: (orderId: string, isVerified: boolean, note?: string) => void;
}

export type OrderStatusFilter = 
  | 'all' 
  | 'pending' 
  | 'shipped' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'cancelled';

export interface OrderToast {
  id: string;
  order: Order;
  timestamp: Date;
}

// Synthesizer Web Audio chime for real-time order alerts
const playOrderChime = () => {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5 note
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5 note
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.1); // High D6 bell
    gain2.gain.setValueAtTime(0.16, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.55);
  } catch {
    // AudioContext blocked or not supported
  }
};

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({
  orders,
  products,
  currency,
  onFulfillOrder,
  onOpenSourcingCatalog,
  onOpenAddProduct,
  onUpdateProductPrice,
  onOpenCsvModal,
  onSimulateOrder,
  onReorderProductStock,
  coupons = [],
  onAddCoupon,
  onToggleCouponActive,
  onDeleteCoupon,
  onVerifyOrderAddress,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'suppliers' | 'analytics' | 'coupons'>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderStatusFilter>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [chartMetric, setChartMetric] = useState<'both' | 'revenue' | 'volume'>('both');

  // New Modals State: Thermal Shipping Label and WhatsApp Verification
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<Order | null>(null);
  const [selectedOrderForWhatsApp, setSelectedOrderForWhatsApp] = useState<Order | null>(null);

  // Low Inventory Warning & Supplier Reorder State
  const [productInventoryFilter, setProductInventoryFilter] = useState<'all' | 'low_stock'>('all');
  const [reorderProduct, setReorderProduct] = useState<Product | null>(null);
  const [reorderUnits, setReorderUnits] = useState<number>(50);

  // Critical Low Stock Threshold (< 5 units as requested)
  const lowStockThreshold = 5;
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock < lowStockThreshold),
    [products]
  );

  // Real-time notification & unread order tracking
  const [unreadOrderIds, setUnreadOrderIds] = useState<string[]>([]);
  const [recentToasts, setRecentToasts] = useState<OrderToast[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);

  const isInitialMount = useRef(true);
  const knownOrderIdsRef = useRef<Set<string>>(new Set(orders.map((o) => o.id)));

  // Dismiss toast handler
  const dismissToast = useCallback((toastId: string) => {
    setRecentToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  // View order from toast or notification banner
  const handleViewOrder = useCallback((orderId: string) => {
    setActiveTab('orders');
    setOrderFilter('all');
    setSearchFilter('');
    setHighlightedOrderId(orderId);
    setRecentToasts((prev) => prev.filter((t) => t.order.id !== orderId));
    setUnreadOrderIds((prev) => prev.filter((id) => id !== orderId));

    // Clear highlight after 6 seconds
    setTimeout(() => {
      setHighlightedOrderId((curr) => (curr === orderId ? null : curr));
    }, 6000);
  }, []);

  // CSV Export for external accounting
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const exportOrdersToCsv = useCallback((ordersToExport: Order[], exportLabel: string) => {
    if (!ordersToExport || ordersToExport.length === 0) return;

    const headers = [
      'Order ID',
      'Date Created (UTC)',
      'Status',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Delivery Address',
      'City',
      'Items Purchased Summary',
      'Total Items Quantity',
      'Payment Method',
      'Currency',
      'Subtotal',
      'Discount',
      'Shipping Fee',
      'Gross Total (Revenue)',
      'Wholesale Supplier Cost Total',
      'Net Dropship Profit',
      'Reseller Profit (PKR)',
      'Reseller Brand Name',
      'Courier Carrier',
      'Tracking Number',
      'Supplier / Fulfillment Hub',
      'Special Customer Notes'
    ];

    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = ordersToExport.map((o) => {
      const itemsSummary = o.items
        ?.map((item) => `${item.quantity || 1}x ${item.product?.title || 'Item'} (${item.selectedVariant?.name || 'Standard'})`)
        .join(' | ') || '';

      const totalQty = o.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

      return [
        escapeCsv(o.id),
        escapeCsv(o.createdAt),
        escapeCsv(o.status),
        escapeCsv(o.customerName),
        escapeCsv(o.email),
        escapeCsv(o.phone),
        escapeCsv(o.address),
        escapeCsv(o.city),
        escapeCsv(itemsSummary),
        escapeCsv(totalQty),
        escapeCsv(o.paymentMethod),
        escapeCsv(o.currency || 'USD'),
        escapeCsv(Number(o.subtotal || 0).toFixed(2)),
        escapeCsv(Number(o.discount || 0).toFixed(2)),
        escapeCsv(Number(o.shippingFee || 0).toFixed(2)),
        escapeCsv(Number(o.total || 0).toFixed(2)),
        escapeCsv(Number(o.supplierCostTotal || 0).toFixed(2)),
        escapeCsv(Number(o.profitEarned || 0).toFixed(2)),
        escapeCsv(o.resellerProfitTotalPKR ?? 0),
        escapeCsv(o.resellerBrandName || 'Apna Store'),
        escapeCsv(o.carrier || ''),
        escapeCsv(o.trackingNumber || ''),
        escapeCsv(o.supplierName || ''),
        escapeCsv(o.orderNote || o.notes || '')
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    const sanitizedLabel = exportLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filename = `orders-accounting-${sanitizedLabel}-${dateStr}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccessMessage(`Exported ${ordersToExport.length} order${ordersToExport.length > 1 ? 's' : ''} to "${filename}" for external accounting.`);
    setTimeout(() => {
      setExportSuccessMessage((prev) => (prev?.includes(filename) ? null : prev));
    }, 6000);
  }, []);

  // Detect newly placed orders in real-time
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      knownOrderIdsRef.current = new Set(orders.map((o) => o.id));
      return;
    }

    const newOrders = orders.filter((o) => !knownOrderIdsRef.current.has(o.id));
    if (newOrders.length > 0) {
      newOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));

      // Append to unread IDs
      setUnreadOrderIds((prev) => [...newOrders.map((o) => o.id), ...prev]);

      // Play sound chime if enabled
      if (soundEnabled) {
        playOrderChime();
      }

      // Add to toasts
      newOrders.forEach((newOrder) => {
        const toastId = `toast-${newOrder.id}-${Date.now()}`;
        setRecentToasts((prev) => [
          {
            id: toastId,
            order: newOrder,
            timestamp: new Date(),
          },
          ...prev.slice(0, 2),
        ]);

        // Auto dismiss after 8 seconds
        setTimeout(() => {
          dismissToast(toastId);
        }, 8000);
      });
    }
  }, [orders, soundEnabled, dismissToast]);

  // Status counts for filtering & badges
  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === 'unfulfilled' || o.status === 'sourcing').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      out_for_delivery: orders.filter((o) => o.status === 'out_for_delivery').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
  }, [orders]);

  // Financial calculations
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const totalSupplierCost = orders.reduce((acc, o) => acc + o.supplierCostTotal, 0);
  const totalNetProfit = orders.reduce((acc, o) => acc + o.profitEarned, 0);
  const avgMargin = totalRevenue > 0 ? Math.round((totalNetProfit / totalRevenue) * 100) : 0;
  const pendingOrdersCount = orders.filter((o) => o.status === 'sourcing' || o.status === 'unfulfilled').length;

  // 7-Day Performance & Trends calculations
  const sevenDaysData = useMemo(() => {
    // Reference anchor date: latest order date or current time
    let maxTime = new Date('2026-09-29T23:59:59Z').getTime();
    orders.forEach((o) => {
      const t = new Date(o.createdAt).getTime();
      if (!isNaN(t) && t > maxTime) {
        maxTime = t;
      }
    });

    const anchorDate = new Date(maxTime);
    anchorDate.setHours(23, 59, 59, 999);

    interface DayPerformance {
      dateKey: string;
      dayLabel: string;
      weekday: string;
      fullDateLabel: string;
      orderVolume: number;
      revenue: number;
      profit: number;
      rawRevenueUSD: number;
      rawProfitUSD: number;
      orders: Order[];
    }

    const daysList: DayPerformance[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(anchorDate);
      d.setDate(anchorDate.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const month = d.toLocaleString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      const weekday = d.toLocaleString('en-US', { weekday: 'short' });

      daysList.push({
        dateKey,
        dayLabel: `${month} ${dayNum}`,
        weekday,
        fullDateLabel: `${weekday}, ${month} ${dayNum}`,
        orderVolume: 0,
        revenue: 0,
        profit: 0,
        rawRevenueUSD: 0,
        rawProfitUSD: 0,
        orders: [] as Order[],
      });
    }

    orders.forEach((order) => {
      if (!order.createdAt) return;
      const orderDateKey = new Date(order.createdAt).toISOString().split('T')[0];
      const target = daysList.find((d) => d.dateKey === orderDateKey);
      if (target) {
        target.orderVolume += 1;
        target.rawRevenueUSD += order.total;
        target.rawProfitUSD += order.profitEarned;
        target.orders.push(order);
      }
    });

    daysList.forEach((d) => {
      d.revenue = Math.round(convertAmount(d.rawRevenueUSD, currency));
      d.profit = Math.round(convertAmount(d.rawProfitUSD, currency));
    });

    return daysList;
  }, [orders, currency]);

  const sevenDaysTotalOrders = useMemo(
    () => sevenDaysData.reduce((acc, d) => acc + d.orderVolume, 0),
    [sevenDaysData]
  );
  const sevenDaysTotalRevenueUSD = useMemo(
    () => sevenDaysData.reduce((acc, d) => acc + d.rawRevenueUSD, 0),
    [sevenDaysData]
  );
  const sevenDaysTotalProfitUSD = useMemo(
    () => sevenDaysData.reduce((acc, d) => acc + d.rawProfitUSD, 0),
    [sevenDaysData]
  );
  const peakDay = useMemo(() => {
    return [...sevenDaysData].sort((a, b) => b.rawRevenueUSD - a.rawRevenueUSD)[0];
  }, [sevenDaysData]);

  const formatRevenueTick = (val: number) => {
    if (val === 0) return '0';
    if (currency === 'PKR') {
      return val >= 1000 ? `Rs. ${(val / 1000).toFixed(0)}k` : `Rs. ${val}`;
    }
    return val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`;
  };

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload;
      if (!item) return null;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-slate-700/80 text-xs min-w-[220px] space-y-2 pointer-events-none">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/60 font-semibold text-slate-200">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{item.fullDateLabel}</span>
            </div>
            <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-bold">
              {item.orderVolume} {item.orderVolume === 1 ? 'Order' : 'Orders'}
            </span>
          </div>
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Total Revenue:
              </span>
              <span className="font-bold text-amber-400 font-mono">
                {formatPrice(item.rawRevenueUSD, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                Order Volume:
              </span>
              <span className="font-bold text-indigo-300 font-mono">
                {item.orderVolume} {item.orderVolume === 1 ? 'sale' : 'sales'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Net Profit:
              </span>
              <span className="font-bold text-emerald-400 font-mono">
                +{formatPrice(item.rawProfitUSD, currency)}
              </span>
            </div>
            {item.orderVolume > 0 && (
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Avg Order Value:</span>
                <span className="text-slate-300 font-mono">
                  {formatPrice(item.rawRevenueUSD / item.orderVolume, currency)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Top Selling Products calculation: Top 5 products by quantity sold
  interface TopProductItem {
    product: Product;
    quantitySold: number;
    totalRevenueUSD: number;
    totalProfitUSD: number;
    ordersCount: number;
    rank: number;
    volumeShare: number;
    isLowStock: boolean;
  }

  const topSellingProducts: TopProductItem[] = useMemo(() => {
    interface ProductSalesAggregate {
      product: Product;
      quantitySold: number;
      totalRevenueUSD: number;
      totalProfitUSD: number;
      ordersCount: number;
    }

    const salesMap: Record<string, ProductSalesAggregate> = {};

    // Seed from available store products
    products.forEach((prod) => {
      salesMap[prod.id] = {
        product: prod,
        quantitySold: 0,
        totalRevenueUSD: 0,
        totalProfitUSD: 0,
        ordersCount: 0,
      };
    });

    // Aggregate from orders (excluding cancelled)
    orders.forEach((order) => {
      if (order.status === 'cancelled') return;

      order.items?.forEach((item) => {
        const prodId = item.product.id;
        if (!salesMap[prodId]) {
          const matched = products.find((p) => p.id === prodId) || item.product;
          salesMap[prodId] = {
            product: matched,
            quantitySold: 0,
            totalRevenueUSD: 0,
            totalProfitUSD: 0,
            ordersCount: 0,
          };
        }
        const qty = item.quantity || 1;
        salesMap[prodId].quantitySold += qty;
        const retail = item.product.retailPrice || 0;
        const cost = item.product.supplierCost || 0;
        salesMap[prodId].totalRevenueUSD += retail * qty;
        salesMap[prodId].totalProfitUSD += (retail - cost) * qty;
        salesMap[prodId].ordersCount += 1;
      });
    });

    const allAggregates = Object.values(salesMap);
    const totalVolumeSold = allAggregates.reduce((acc, curr) => acc + curr.quantitySold, 0) || 1;

    return allAggregates
      .sort((a, b) => {
        if (b.quantitySold !== a.quantitySold) {
          return b.quantitySold - a.quantitySold;
        }
        return b.totalRevenueUSD - a.totalRevenueUSD;
      })
      .slice(0, 5)
      .map((item, index) => {
        const volumeShare = Math.round((item.quantitySold / totalVolumeSold) * 100);
        const stock = item.product.stock;
        const isLowStock = stock < 50;

        return {
          ...item,
          rank: index + 1,
          volumeShare,
          isLowStock,
        };
      });
  }, [orders, products]);

  const totalTop5UnitsSold = useMemo(
    () => topSellingProducts.reduce((acc, item) => acc + item.quantitySold, 0),
    [topSellingProducts]
  );

  const lowStockTopProductsCount = useMemo(
    () => topSellingProducts.filter((item) => item.isLowStock).length,
    [topSellingProducts]
  );

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = (() => {
      if (orderFilter === 'all') return true;
      if (orderFilter === 'pending') return o.status === 'unfulfilled' || o.status === 'sourcing';
      if (orderFilter === 'shipped') return o.status === 'shipped';
      if (orderFilter === 'out_for_delivery') return o.status === 'out_for_delivery';
      if (orderFilter === 'delivered') return o.status === 'delivered';
      if (orderFilter === 'cancelled') return o.status === 'cancelled';
      return o.status === orderFilter;
    })();

    const query = searchFilter.trim().toLowerCase();
    if (!query) return matchesStatus;

    const cleanQueryDigits = query.replace(/\D/g, '');
    const cleanPhoneDigits = (o.phone || '').replace(/\D/g, '');

    const matchesSearch =
      o.id.toLowerCase().includes(query) ||
      o.customerName.toLowerCase().includes(query) ||
      (o.phone && o.phone.toLowerCase().includes(query)) ||
      (cleanQueryDigits.length >= 3 && cleanPhoneDigits.includes(cleanQueryDigits)) ||
      (o.email && o.email.toLowerCase().includes(query)) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(query)) ||
      (o.city && o.city.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Merchant & Dropship Control Center
            </h1>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">
              Apna Store
            </span>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Order Stream Active</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated wholesale dropshipping, real-time incoming order alerts, and 1-click doorstep COD fulfillment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Audio Chime Toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playOrderChime();
            }}
            className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
            }`}
            title={soundEnabled ? 'Order sound alert active (Click to mute)' : 'Order sound alert muted (Click to unmute)'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[11px] hidden sm:inline">Chime On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] hidden sm:inline">Muted</span>
              </>
            )}
          </button>

          {/* Simulate New Order Button */}
          {onSimulateOrder && (
            <button
              onClick={onSimulateOrder}
              className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Test the real-time notification system by simulating an incoming customer order"
            >
              <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
              <span>Simulate New Order</span>
            </button>
          )}

          {/* Export Orders to CSV (Accounting) */}
          <button
            onClick={() => {
              setActiveTab('orders');
              exportOrdersToCsv(filteredOrders, orderFilter === 'all' && !searchFilter ? 'all' : orderFilter);
            }}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Export current orders list to CSV for external accounting & bookkeeping"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Export Orders CSV</span>
          </button>

          {onOpenCsvModal && (
            <button
              onClick={onOpenCsvModal}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Bulk import products or export catalog via CSV"
            >
              <Package className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">CSV Products</span>
            </button>
          )}
          <button
            onClick={onOpenAddProduct}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Custom Item</span>
          </button>
          <button
            onClick={onOpenSourcingCatalog}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Source Products</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Gross GMV Revenue</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {formatPrice(totalRevenue, currency)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>{orders.length} Total orders</span>
          </div>
        </div>

        {/* Dropship Net Profit */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Dropship Net Profit</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {formatPrice(totalNetProfit, currency)}
          </div>
          <div className="text-[11px] text-slate-500">
            After paying factory suppliers
          </div>
        </div>

        {/* Average Margin */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average Net Margin</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {avgMargin}%
          </div>
          <div className="text-[11px] text-amber-700 font-medium">
            High markup winning products
          </div>
        </div>

        {/* Pending Fulfillment */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Orders Pending Fulfillment</span>
            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {pendingOrdersCount}
          </div>
          <div className="text-[11px] text-orange-600 font-semibold">
            {pendingOrdersCount > 0 ? 'Ready for 1-click supplier sync' : 'All orders fulfilled'}
          </div>
        </div>
      </div>

      {/* Low Inventory Warning System Alert Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-sm shrink-0 animate-bounce">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-rose-950">
                  Critical Low Inventory Alert: {lowStockProducts.length} Product{lowStockProducts.length > 1 ? 's' : ''} with &lt; 5 Units in Stock!
                </h3>
                <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs">
                  Immediate Action Required
                </span>
              </div>
              <p className="text-xs text-rose-900/80 mt-1 max-w-2xl leading-relaxed">
                Stock is below safe threshold. Incoming customer Cash on Delivery orders face cancellation risk. Reorder units directly from factory suppliers below.
              </p>
              {/* Quick chip list of low stock items */}
              <div className="flex items-center gap-2 flex-wrap mt-2">
                {lowStockProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActiveTab('products');
                      setProductInventoryFilter('low_stock');
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-300 rounded-lg text-xs font-bold text-rose-900 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                    <span className="truncate max-w-[150px]">{p.title}</span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 px-1 rounded font-black">
                      {p.stock} left
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-end">
            <button
              type="button"
              onClick={() => {
                setActiveTab('products');
                setProductInventoryFilter('low_stock');
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Manage Low Inventory ({lowStockProducts.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 7-DAY RECHARTS LINE CHART SECTION: Daily Order Volume & Total Revenue */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 text-amber-700 rounded-xl">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>7-Day Order Volume & Revenue Performance</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">
                    Live Velocity
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualizing daily order volume alongside gross revenue to track merchant growth over the last 7 days.
                </p>
              </div>
            </div>
          </div>

          {/* Metric Selector & Date Range Pill */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => setChartMetric('both')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMetric === 'both'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                Dual Axis (Both)
              </button>
              <button
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  chartMetric === 'revenue'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                    : 'hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-700" />
                Revenue Only
              </button>
              <button
                onClick={() => setChartMetric('volume')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  chartMetric === 'volume'
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-200" />
                Volume Only
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{sevenDaysData[0]?.dayLabel} – {sevenDaysData[sevenDaysData.length - 1]?.dayLabel}</span>
            </div>
          </div>
        </div>

        {/* 7-Day Quick Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
          <div>
            <span className="text-[11px] text-slate-500 block">7-Day Gross Revenue</span>
            <span className="text-base sm:text-lg font-black text-amber-700">
              {formatPrice(sevenDaysTotalRevenueUSD, currency)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Avg {formatPrice(sevenDaysTotalRevenueUSD / 7, currency)} / day
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block">7-Day Order Volume</span>
            <span className="text-base sm:text-lg font-black text-indigo-700">
              {sevenDaysTotalOrders} Orders
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {(sevenDaysTotalOrders / 7).toFixed(1)} orders / day
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block">Net Dropship Profit</span>
            <span className="text-base sm:text-lg font-black text-emerald-700">
              +{formatPrice(sevenDaysTotalProfitUSD, currency)}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              {sevenDaysTotalRevenueUSD > 0 ? Math.round((sevenDaysTotalProfitUSD / sevenDaysTotalRevenueUSD) * 100) : 0}% net margin
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block">Peak Performance Day</span>
            <span className="text-base sm:text-lg font-black text-slate-900 truncate block">
              {peakDay?.fullDateLabel || 'N/A'}
            </span>
            <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
              {peakDay ? `${peakDay.orderVolume} orders • ${formatPrice(peakDay.rawRevenueUSD, currency)}` : ''}
            </span>
          </div>
        </div>

        {/* Recharts Line Chart Container */}
        <div className="pt-2">
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sevenDaysData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="dayLabel" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={{ stroke: '#e2e8f0' }}
                />
                
                {chartMetric === 'volume' ? (
                  <YAxis 
                    yAxisId="orders" 
                    orientation="left" 
                    allowDecimals={false} 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                  />
                ) : (
                  <YAxis 
                    yAxisId="revenue" 
                    orientation="left" 
                    tickFormatter={formatRevenueTick} 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                  />
                )}

                {chartMetric === 'both' && (
                  <YAxis 
                    yAxisId="orders" 
                    orientation="right" 
                    allowDecimals={false} 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                  />
                )}

                <Tooltip content={<CustomChartTooltip />} />

                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  height={32}
                  iconType="circle"
                  formatter={(value) => <span className="text-xs font-semibold text-slate-700">{value}</span>}
                />

                {(chartMetric === 'both' || chartMetric === 'revenue') && (
                  <Line
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    name={`Total Revenue (${currency})`}
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 4, stroke: '#d97706', strokeWidth: 2, fill: '#ffffff' }}
                    activeDot={{ r: 7, stroke: '#b45309', strokeWidth: 2, fill: '#f59e0b' }}
                  />
                )}

                {(chartMetric === 'both' || chartMetric === 'volume') && (
                  <Line
                    yAxisId="orders"
                    type="monotone"
                    dataKey="orderVolume"
                    name="Daily Order Volume"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4, stroke: '#4f46e5', strokeWidth: 2, fill: '#ffffff' }}
                    activeDot={{ r: 7, stroke: '#3730a3', strokeWidth: 2, fill: '#6366f1' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Day-by-Day Mini Cards */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              Day-by-Day Performance Overview
            </span>
            <span className="text-[11px] text-slate-400">
              Hover points on chart for full customer & item breakdown
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {sevenDaysData.map((day) => {
              const isPeak = peakDay?.dateKey === day.dateKey;
              return (
                <div 
                  key={day.dateKey}
                  className={`p-2.5 rounded-xl border transition-all text-xs ${
                    isPeak 
                      ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300' 
                      : 'bg-slate-50/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">{day.dayLabel}</span>
                    {isPeak && (
                      <span className="text-[9px] font-bold text-amber-800 bg-amber-200/80 px-1 rounded">
                        Peak
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-black text-slate-900">
                    {formatPrice(day.rawRevenueUSD, currency)}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                    <span className="font-bold text-indigo-600">{day.orderVolume} {day.orderVolume === 1 ? 'order' : 'orders'}</span>
                    <span className="text-emerald-700 font-semibold">+{formatPrice(day.rawProfitUSD, currency)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TOP SELLING PRODUCTS SECTION (High-Demand Inventory) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-700 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Top Selling Products
                </h2>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded tracking-wide uppercase flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-600" />
                  Top 5 by Quantity Sold
                </span>
                {lowStockTopProductsCount > 0 && (
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    {lowStockTopProductsCount} Low Stock Alert{lowStockTopProductsCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Top 5 inventory items ranked by quantity sold. Identify high-demand inventory and monitor factory stock to prevent stockouts on winners.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Top 5 Total Volume
              </span>
              <span className="text-sm font-black text-slate-900 font-mono">
                {totalTop5UnitsSold} Units Sold
              </span>
            </div>
            <button
              onClick={() => setActiveTab('products')}
              className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200/80 transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <span>Manage Store Prices</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Top 5 Product Cards */}
        <div className="grid grid-cols-1 gap-3">
          {topSellingProducts.map((item) => {
            const prod = item.product;
            const marginPercent = prod.retailPrice > 0 
              ? Math.round(((prod.retailPrice - prod.supplierCost) / prod.retailPrice) * 100) 
              : 0;

            const rankBadge = (() => {
              if (item.rank === 1) {
                return (
                  <div className="flex items-center gap-1 bg-amber-100 border border-amber-300 text-amber-900 px-2 py-0.5 rounded-lg text-xs font-black shrink-0 shadow-xs">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span>#1 Best Seller</span>
                  </div>
                );
              }
              if (item.rank === 2) {
                return (
                  <div className="flex items-center gap-1 bg-slate-100 border border-slate-300 text-slate-800 px-2 py-0.5 rounded-lg text-xs font-black shrink-0">
                    <Award className="w-3.5 h-3.5 text-slate-600" />
                    <span>#2 Top Runner</span>
                  </div>
                );
              }
              if (item.rank === 3) {
                return (
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-lg text-xs font-black shrink-0">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>#3 High Demand</span>
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg text-xs font-bold shrink-0">
                  <span>#{item.rank} Steady Seller</span>
                </div>
              );
            })();

            return (
              <div
                key={prod.id}
                className={`p-3.5 rounded-2xl border transition-all hover:shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  item.rank === 1
                    ? 'bg-gradient-to-r from-amber-50/60 via-white to-amber-50/20 border-amber-200/90 ring-1 ring-amber-300/40'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left: Rank, Image & Product Info */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <img
                      src={prod.images[0]}
                      alt={prod.title}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover bg-slate-100 border border-slate-200 shadow-xs"
                    />
                    <div className="absolute -top-2 -left-2 sm:hidden">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-md">
                        {item.rank}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="hidden sm:block">
                        {rankBadge}
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                        {prod.category}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span>Supplier:</span>
                        <strong className="text-slate-700">{prod.supplier.name}</strong>
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                      {prod.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                      <span>
                        Store Price: <strong className="text-slate-900 font-mono">{formatPrice(prod.retailPrice, currency)}</strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>
                        Factory Cost: <strong className="text-slate-700 font-mono">{formatPrice(prod.supplierCost, currency)}</strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-700 font-bold">
                        {marginPercent}% Markup
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Quantity Sold, Revenue, Profit & Inventory Health */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3 sm:gap-6 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {/* Quantity Sold & Share */}
                  <div className="space-y-1 min-w-[110px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Quantity Sold
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                        {item.quantitySold}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">units</span>
                      <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-bold">
                        {item.volumeShare}% vol
                      </span>
                    </div>
                    {/* Visual volume bar */}
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-indigo-600 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(10, item.volumeShare * 2))}%` }}
                      />
                    </div>
                  </div>

                  {/* Revenue & Profit Generated */}
                  <div className="space-y-1 min-w-[120px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Gross / Profit
                    </span>
                    <div className="font-black text-slate-900 text-xs sm:text-sm font-mono">
                      {formatPrice(item.totalRevenueUSD, currency)}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-700 font-mono flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>+{formatPrice(item.totalProfitUSD, currency)} profit</span>
                    </div>
                  </div>

                  {/* Supplier Stock & Inventory Health (Demand Insight) */}
                  <div className="space-y-1 min-w-[130px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Supplier Inventory
                    </span>
                    {item.isLowStock ? (
                      <div className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-xl">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{prod.stock} left (Low Stock)</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{prod.stock} in stock</span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 block">
                      {item.isLowStock ? 'Surge warning: Restock soon' : 'Healthy fulfillment buffer'}
                    </span>
                  </div>

                  {/* Action: View Customer Orders */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setActiveTab('orders');
                        setSearchFilter(prod.title);
                        setOrderFilter('all');
                      }}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                      title={`Filter all orders containing ${prod.title}`}
                    >
                      <Search className="w-3.5 h-3.5 text-slate-300" />
                      <span>View Orders</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-2 rounded-t-2xl overflow-x-auto gap-4">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            <span>Customer Orders & Auto-Fulfillment</span>
            <span className="text-slate-400 font-normal">({orders.length})</span>
          </span>

          {/* Visual Indicator on Orders tab for newly placed real-time orders */}
          {unreadOrderIds.length > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black px-2 py-0.5 rounded-full text-[10px] tracking-wide shadow-xs ring-2 ring-amber-300 animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
              </span>
              <span>{unreadOrderIds.length} NEW</span>
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>7-Day Sales Analytics ({sevenDaysTotalOrders} orders)</span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Store Products & Markups ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'suppliers'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Wholesale Suppliers Directory ({SUPPLIERS.length})
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'coupons'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Discount Vouchers ({coupons.length})</span>
        </button>
      </div>

      {/* TAB 1: Orders & 1-Click Fulfillment */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-b-2xl border border-slate-200 border-t-0 p-5 space-y-4">
          {/* Real-time Unread Orders Alert Banner */}
          {unreadOrderIds.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-300 p-3.5 rounded-2xl shadow-xs animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-xs shrink-0 animate-bounce">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-amber-950 flex items-center gap-1.5 flex-wrap">
                    <span>{unreadOrderIds.length} New Order{unreadOrderIds.length > 1 ? 's' : ''} Received in Real-Time!</span>
                    <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded uppercase">
                      New Customer Demand
                    </span>
                  </h3>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Newly placed customer orders are highlighted in gold below. Review details and dispatch via 1-Click fulfillment.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => setOrderFilter('pending')}
                  className="px-3 py-1.5 bg-white hover:bg-amber-50 border border-amber-300 text-amber-950 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  View Pending ({statusCounts.pending})
                </button>
                <button
                  onClick={() => setUnreadOrderIds([])}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
                >
                  Mark All Reviewed
                </button>
              </div>
            </div>
          )}

          {/* Filters Bar with Status Dropdown and Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="order-status-dropdown" className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                  <Filter className="w-3.5 h-3.5 text-amber-600" />
                  <span>Filter Status:</span>
                </label>
                <div className="relative">
                  <select
                    id="order-status-dropdown"
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value as OrderStatusFilter)}
                    className="bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-bold rounded-xl pl-3 pr-8 py-2 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden shadow-xs cursor-pointer appearance-none transition-colors"
                  >
                    <option value="all">All Orders ({statusCounts.all})</option>
                    <option value="pending">⏳ Pending / To Fulfill ({statusCounts.pending})</option>
                    <option value="shipped">🚚 Shipped / In Transit ({statusCounts.shipped})</option>
                    <option value="out_for_delivery">📦 Out for Delivery ({statusCounts.out_for_delivery})</option>
                    <option value="delivered">✅ Delivered ({statusCounts.delivered})</option>
                    <option value="cancelled">❌ Cancelled ({statusCounts.cancelled})</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Quick Status Pill Buttons */}
              <div className="hidden sm:flex items-center gap-1 text-xs">
                {(
                  [
                    { key: 'all', label: 'All', count: statusCounts.all },
                    { key: 'pending', label: 'Pending', count: statusCounts.pending },
                    { key: 'shipped', label: 'Shipped', count: statusCounts.shipped },
                    { key: 'out_for_delivery', label: 'Out for Delivery', count: statusCounts.out_for_delivery },
                    { key: 'delivered', label: 'Delivered', count: statusCounts.delivered },
                    { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
                  ] as const
                ).map((item) => {
                  const isActive = orderFilter === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setOrderFilter(item.key)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                        isActive
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Input & Reset Button */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="relative w-full sm:w-80 md:w-96">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search by customer name, phone number, or order ID..."
                  className="w-full pl-9 pr-7 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden transition-all shadow-xs"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    className="text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 text-sm font-bold cursor-pointer p-0.5"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              {(orderFilter !== 'all' || searchFilter !== '') && (
                <button
                  onClick={() => {
                    setOrderFilter('all');
                    setSearchFilter('');
                  }}
                  className="px-2.5 py-2 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-semibold whitespace-nowrap cursor-pointer border border-transparent hover:border-rose-200"
                  title="Clear all filters"
                >
                  Reset
                </button>
              )}

              {/* Export to CSV Button for Accounting */}
              <button
                onClick={() => exportOrdersToCsv(filteredOrders, orderFilter === 'all' && !searchFilter ? 'all' : orderFilter)}
                disabled={filteredOrders.length === 0}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                title="Export current orders list to CSV formatted for external accounting, QuickBooks, Xero, and Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Orders CSV ({filteredOrders.length})</span>
              </button>
            </div>
          </div>

          {/* Active Filter Indicator & Accounting Format Notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 px-1 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span>Showing <strong className="text-slate-800">{filteredOrders.length}</strong> of <strong className="text-slate-800">{orders.length}</strong> total orders</span>
              {orderFilter !== 'all' && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                  Filter: {orderFilter === 'pending' ? 'Pending Fulfillment' : orderFilter.replace(/_/g, ' ')}
                </span>
              )}
              {searchFilter && (
                <span className="bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Search className="w-2.5 h-2.5 text-amber-600" />
                  <span>Search: "{searchFilter}"</span>
                  <button
                    onClick={() => setSearchFilter('')}
                    className="hover:text-amber-950 font-black ml-0.5 cursor-pointer"
                    title="Clear search filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {filteredOrders.length !== orders.length && (
                <button
                  onClick={() => exportOrdersToCsv(orders, 'all')}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline font-bold cursor-pointer flex items-center gap-1 ml-1"
                  title="Export all orders in database regardless of current filter"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  <span>Export All ({orders.length})</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {orderFilter !== 'all' && (
                <button
                  onClick={() => setOrderFilter('all')}
                  className="text-[11px] text-amber-700 hover:underline font-bold cursor-pointer"
                >
                  Show all statuses
                </button>
              )}
              <span className="text-[11px] text-slate-400 hidden md:flex items-center gap-1">
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                <span>Accounting Ready (QuickBooks, Excel, Tax)</span>
              </span>
            </div>
          </div>

          {/* CSV Export Success Banner */}
          {exportSuccessMessage && (
            <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs px-3.5 py-2.5 rounded-xl shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1 bg-emerald-600 text-white rounded-lg shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold block truncate">{exportSuccessMessage}</span>
                  <span className="text-[11px] text-emerald-700">
                    Includes line items, customer details, supplier costs, reseller profit, and net earnings for external bookkeeping.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setExportSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-950 text-xs font-bold cursor-pointer p-1 rounded-md hover:bg-emerald-100 transition-colors shrink-0"
                title="Dismiss message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Customer / City</th>
                  <th className="py-3 px-3">Product(s)</th>
                  <th className="py-3 px-3">COD Amount</th>
                  <th className="py-3 px-3">Net Profit</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Fulfillment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      <div className="max-w-xs mx-auto space-y-2">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                          <Filter className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-slate-800 text-xs">
                          No orders found matching "{orderFilter === 'all' ? 'search' : orderFilter}"
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {searchFilter ? 'Try clearing your search terms or selecting another status.' : `There are currently no orders with "${orderFilter}" status.`}
                        </p>
                        <button
                          onClick={() => {
                            setOrderFilter('all');
                            setSearchFilter('');
                          }}
                          className="text-xs font-bold text-amber-700 hover:underline cursor-pointer pt-1 block mx-auto"
                        >
                          View All Orders
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isAwaiting = order.status === 'unfulfilled' || order.status === 'sourcing';
                    const isCancelled = order.status === 'cancelled';
                    const isDelivered = order.status === 'delivered';
                    const isOutOfDelivery = order.status === 'out_for_delivery';
                    const isUnread = unreadOrderIds.includes(order.id);
                    const isHighlighted = highlightedOrderId === order.id;

                    return (
                      <tr 
                        key={order.id} 
                        onClick={() => {
                          if (isUnread) {
                            setUnreadOrderIds((prev) => prev.filter((id) => id !== order.id));
                          }
                        }}
                        className={`transition-all duration-300 ${
                          isHighlighted
                            ? 'bg-amber-100/90 ring-2 ring-amber-500 shadow-md'
                            : isUnread
                            ? 'bg-amber-50/80 border-l-4 border-l-amber-500 hover:bg-amber-100/60'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-mono font-bold block ${isCancelled ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                              {order.id}
                            </span>
                            {isUnread && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded uppercase tracking-wider animate-pulse shadow-xs">
                                <Zap className="w-2.5 h-2.5 fill-slate-950" />
                                New
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {order.trackingNumber}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-semibold text-slate-800 block">
                            {order.customerName}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {order.city} • {order.phone}
                          </span>
                          {(order.orderNote || order.notes) && (
                            <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1 inline-block max-w-[200px] truncate" title={order.orderNote || order.notes}>
                              Note: {order.orderNote || order.notes}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 max-w-[200px]">
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 truncate">
                                <span className="font-bold text-slate-700">{item.quantity}x</span>
                                <span className="truncate text-slate-600">{item.product.title}</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`font-black ${isCancelled ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {formatPrice(order.total, currency)}
                          </span>
                          <span className={`text-[10px] block font-semibold ${isCancelled ? 'text-slate-400' : 'text-emerald-700'}`}>
                            {isCancelled ? 'Cancelled' : order.paymentMethod.includes('COD') ? 'COD Pending' : 'Paid'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`font-black ${isCancelled ? 'text-slate-400' : 'text-emerald-700'}`}>
                            {isCancelled ? formatPrice(0, currency) : `+${formatPrice(order.profitEarned, currency)}`}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Cost: {formatPrice(order.supplierCostTotal, currency)}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              isCancelled
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : isDelivered
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isOutOfDelivery
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : order.status === 'shipped'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isCancelled ? (
                              <>
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>Cancelled</span>
                              </>
                            ) : isDelivered ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Delivered</span>
                              </>
                            ) : isOutOfDelivery ? (
                              <>
                                <Truck className="w-3 h-3 text-purple-600" />
                                <span>Out for Delivery</span>
                              </>
                            ) : order.status === 'shipped' ? (
                              <>
                                <Truck className="w-3 h-3 text-blue-600" />
                                <span>Shipped</span>
                              </>
                            ) : order.status === 'sourcing' ? (
                              <>
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Sourcing</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending</span>
                              </>
                            )}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Customer Order Verification */}
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForWhatsApp(order)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                                order.isAddressVerified
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-200'
                                  : 'bg-white hover:bg-emerald-50 text-emerald-700 border-slate-200'
                              }`}
                              title={order.isAddressVerified ? "Address Verified via WhatsApp ✓" : "Verify Customer on WhatsApp (1-Click)"}
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-[10px] font-bold hidden xl:inline">
                                {order.isAddressVerified ? 'Verified' : 'Verify'}
                              </span>
                            </button>

                            {/* Courier Airway Bill Thermal Slip Print */}
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForLabel(order)}
                              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              title="Print 4x6 Courier Thermal Shipping Label (TCS / Trax / Leopards)"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              <span className="text-[10px] font-bold hidden xl:inline">Slip</span>
                            </button>

                            {isCancelled ? (
                              <span className="text-rose-600 text-[11px] font-semibold flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                Cancelled
                              </span>
                            ) : isDelivered ? (
                              <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Delivered
                              </span>
                            ) : isOutOfDelivery ? (
                              <span className="text-purple-700 text-[11px] font-semibold flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-purple-600" />
                                In Transit
                              </span>
                            ) : isAwaiting ? (
                              <button
                                onClick={() => onFulfillOrder(order.id)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Fulfill</span>
                              </button>
                            ) : (
                              <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Shipped
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Active Sourced Products & Price Editor */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-b-2xl border border-slate-200 border-t-0 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span>Live Catalog Inventory & Stock Control</span>
                {lowStockProducts.length > 0 && (
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-rose-200 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    {lowStockProducts.length} Understocked (&lt; 5 units)
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Products with less than 5 units trigger automatic warning flags for instant supplier reordering.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Inventory Filter Switcher */}
              <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setProductInventoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    productInventoryFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Items ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProductInventoryFilter('low_stock')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    productInventoryFilter === 'low_stock'
                      ? 'bg-rose-600 text-white shadow-xs font-black'
                      : lowStockProducts.length > 0
                      ? 'text-rose-700 hover:text-rose-900 bg-rose-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Low Stock ({lowStockProducts.length})</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(productInventoryFilter === 'low_stock' ? lowStockProducts : products).map((prod) => {
              const profit = prod.retailPrice - prod.supplierCost;
              const margin = Math.round((profit / prod.retailPrice) * 100);
              const isLowStock = prod.stock < lowStockThreshold;

              return (
                <div
                  key={prod.id}
                  className={`p-4 rounded-2xl border space-y-3 flex flex-col justify-between transition-all ${
                    isLowStock
                      ? 'bg-gradient-to-b from-rose-50/90 via-white to-amber-50/20 border-rose-300 ring-2 ring-rose-200 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={prod.images[0]}
                        alt={prod.title}
                        className="w-16 h-16 rounded-xl object-cover bg-white border border-slate-200"
                      />
                      {isLowStock && (
                        <div className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 shadow-xs">
                          <AlertTriangle className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          {prod.category}
                        </span>
                        {/* Prominent Inventory SKU Badge */}
                        <span className="inline-flex items-center gap-1 bg-slate-900 text-amber-400 px-2 py-0.5 rounded text-[10px] font-mono font-black tracking-wide border border-slate-800 shadow-2xs">
                          <span className="text-slate-400 font-sans font-bold text-[9px]">SKU:</span>
                          <span>{prod.sku || prod.id.toUpperCase()}</span>
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1" title={prod.title}>
                        {prod.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        Supplier: <span className="font-semibold text-slate-700">{prod.supplier.name}</span>
                      </p>
                    </div>
                  </div>

                  {/* Low Stock Warning Banner on Card */}
                  {isLowStock && (
                    <div className="flex items-center justify-between gap-1 p-2 bg-rose-100/90 text-rose-900 rounded-xl text-xs font-black border border-rose-300">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="truncate">
                          {prod.stock === 0 ? 'CRITICAL: OUT OF STOCK' : `LOW STOCK: Only ${prod.stock} unit${prod.stock > 1 ? 's' : ''} left!`}
                        </span>
                      </div>
                      <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-extrabold uppercase shrink-0">
                        &lt; 5 units
                      </span>
                    </div>
                  )}

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Inventory SKU:</span>
                      <span className="font-mono font-bold text-slate-900 text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {prod.sku || prod.id.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Stock Available:</span>
                      <span className={`font-black ${isLowStock ? 'text-rose-600 text-sm' : 'text-slate-800'}`}>
                        {prod.stock} units
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Factory Wholesale Cost:</span>
                      <span className="font-bold text-slate-800">{formatPrice(prod.supplierCost, currency)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Store Retail Price:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-slate-400">$</span>
                        <input
                          type="number"
                          step="0.5"
                          min={prod.supplierCost + 1}
                          defaultValue={prod.retailPrice}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (val && val > prod.supplierCost) {
                              onUpdateProductPrice(prod.id, val);
                            }
                          }}
                          className="w-16 px-1.5 py-0.5 border border-slate-300 rounded font-bold text-xs text-right"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-emerald-700 font-medium">Your Net Margin:</span>
                      <span className="font-black text-emerald-700">
                        +{formatPrice(profit, currency)} ({margin}%)
                      </span>
                    </div>
                  </div>

                  {/* Quick-Action Reorder Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setReorderProduct(prod);
                      setReorderUnits(50);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                      isLowStock
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 active:scale-95'
                        : 'bg-slate-900 hover:bg-slate-800 text-amber-400 active:scale-95'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>⚡ Reorder from Supplier ({prod.supplier.name.split(' ')[0]})</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Suppliers Directory */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-b-2xl border border-slate-200 border-t-0 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SUPPLIERS.map((supplier) => (
              <div
                key={supplier.id}
                className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-black text-sm text-slate-900">{supplier.name}</h4>
                    <span className="text-xs text-slate-500">{supplier.location}</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">
                    ★ {supplier.rating} Verified
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-white p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Fulfilled</span>
                    <span className="font-bold text-slate-800">{supplier.ordersFulfilled.toLocaleString()}+</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Dispatch</span>
                    <span className="font-bold text-emerald-600">{supplier.dispatchTime}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Transit Time</span>
                    <span className="font-bold text-slate-800">{supplier.avgDeliveryDays}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
                  <span>Policy: {supplier.returnPolicy}</span>
                  <span className="text-amber-700 font-semibold">Active Integration</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: 7-Day Performance & Sales Deep Dive */}
      {activeTab === 'analytics' && (
        <div className="bg-white rounded-b-2xl border border-slate-200 border-t-0 p-5 space-y-6">
          {/* Top Analytical Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-slate-800 p-4 rounded-xl text-white">
            <div>
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
                7-Day Sales Audit & Performance Velocity
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                Comprehensive Day-by-Day Financial Breakdown
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Monitor fulfillment velocity, customer payment methods, and net profit margins across Pakistan.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] text-slate-400 block">7-Day Net Profit</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400">
                +{formatPrice(sevenDaysTotalProfitUSD, currency)}
              </span>
              <span className="text-[10px] text-slate-300 block">
                From {sevenDaysTotalOrders} total customer orders
              </span>
            </div>
          </div>

          {/* Day-by-Day Audit Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Daily Order Volume & Financial Audit (Last 7 Days)</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Order Volume</th>
                    <th className="py-2.5 px-3">Gross GMV</th>
                    <th className="py-2.5 px-3">Factory Cost</th>
                    <th className="py-2.5 px-3">Net Profit</th>
                    <th className="py-2.5 px-3">Net Margin</th>
                    <th className="py-2.5 px-3">Top Cities / Destinations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sevenDaysData.map((day) => {
                    const isPeak = peakDay?.dateKey === day.dateKey;
                    const dayMargin = day.rawRevenueUSD > 0 
                      ? Math.round((day.rawProfitUSD / day.rawRevenueUSD) * 100) 
                      : 0;
                    const cities = Array.from(new Set(day.orders.map((o) => o.city))).join(', ') || 'No orders';

                    return (
                      <tr key={day.dateKey} className={isPeak ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50'}>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{day.fullDateLabel}</span>
                            {isPeak && (
                              <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded uppercase">
                                Peak Day
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{day.dateKey}</span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold bg-indigo-50 text-indigo-700">
                            {day.orderVolume} {day.orderVolume === 1 ? 'order' : 'orders'}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {formatPrice(day.rawRevenueUSD, currency)}
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-500">
                          {formatPrice(day.rawRevenueUSD - day.rawProfitUSD, currency)}
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                          +{formatPrice(day.rawProfitUSD, currency)}
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-700">{dayMargin}%</span>
                        </td>

                        <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate" title={cities}>
                          {cities}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Logistics & Payment Channels Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-slate-600" />
                <span>Courier & Logistics Speed (Last 7 Days)</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">TCS Express Pakistan:</span>
                  <span className="font-bold text-slate-900 font-mono">11 Shipments (45%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Leopards Courier Service:</span>
                  <span className="font-bold text-slate-900 font-mono">8 Shipments (33%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Trax Logistics & M&P:</span>
                  <span className="font-bold text-slate-900 font-mono">5 Shipments (22%)</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-emerald-700">
                  <span>Avg Delivery Turnaround:</span>
                  <span>1.8 Days to Major Hubs</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CircleDollarSign className="w-3.5 h-3.5 text-slate-600" />
                <span>Payment Settlement Channels (Last 7 Days)</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Cash on Delivery (COD):</span>
                  <span className="font-bold text-slate-900 font-mono">19 Orders (79%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">JazzCash / EasyPaisa:</span>
                  <span className="font-bold text-slate-900 font-mono">3 Orders (13%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Card Payment / Direct Bank:</span>
                  <span className="font-bold text-slate-900 font-mono">2 Orders (8%)</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-slate-900">
                  <span>COD Collection Health:</span>
                  <span className="text-emerald-700 font-bold">100% Remittance Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Discount Coupons & Marketing Vouchers */}
      {activeTab === 'coupons' && (
        <div className="bg-white rounded-b-2xl border border-slate-200 border-t-0 p-5">
          <CouponManagerTab
            coupons={coupons}
            onAddCoupon={onAddCoupon || (() => {})}
            onToggleCouponActive={onToggleCouponActive || (() => {})}
            onDeleteCoupon={onDeleteCoupon || (() => {})}
          />
        </div>
      )}

      {/* Real-Time Incoming Order Toast Notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full px-4 pointer-events-none">
        {recentToasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-950/95 text-white border-2 border-amber-500/80 rounded-2xl shadow-2xl p-4 backdrop-blur-md animate-in slide-in-from-top-4 duration-300 ring-4 ring-amber-500/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="relative p-2 bg-amber-500 text-slate-950 rounded-xl shadow-md shrink-0">
                  <BellRing className="w-5 h-5 animate-bounce" />
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-amber-400 tracking-wide uppercase">
                      New Order Placed!
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                      Live Alert
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2 mt-0.5">
                    <span>#{toast.order.id}</span>
                    <span className="text-xs font-normal text-slate-400">• {toast.order.city}</span>
                  </h4>
                </div>
              </div>

              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer & Item snippet */}
            <div className="mt-3 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-slate-200">{toast.order.customerName} ({toast.order.phone})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Item:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                  {toast.order.items[0]?.quantity}x {toast.order.items[0]?.product.title}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                <span className="text-amber-400 font-bold font-mono">
                  {formatPrice(toast.order.total, currency)} ({toast.order.paymentMethod.includes('COD') ? 'COD' : 'Prepaid'})
                </span>
                <span className="text-emerald-400 font-bold font-mono">
                  +{formatPrice(toast.order.profitEarned, currency)} Net Profit
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => handleViewOrder(toast.order.id)}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View in Orders</span>
              </button>
              <button
                onClick={() => {
                  onFulfillOrder(toast.order.id);
                  dismissToast(toast.id);
                }}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1-Click Fulfill</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick-Action Supplier Reorder Modal */}
      {reorderProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    Supplier Inventory Restock Order
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Direct automated wholesale purchase order to factory supplier
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReorderProduct(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {/* Product & Supplier Details */}
              <div className="flex gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <img
                  src={reorderProduct.images[0]}
                  alt={reorderProduct.title}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-white shrink-0 border border-slate-200"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    SKU: {reorderProduct.sku || reorderProduct.id.toUpperCase()}
                  </span>
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-2">
                    {reorderProduct.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="text-slate-500">Current Stock:</span>
                    <span className={`font-bold ${reorderProduct.stock < 5 ? 'text-rose-600 font-black' : 'text-slate-800'}`}>
                      {reorderProduct.stock} units
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">Wholesale Cost:</span>
                    <span className="font-black text-slate-900">{formatPrice(reorderProduct.supplierCost, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Supplier Logistics Badge */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-amber-800 font-bold block uppercase tracking-wider">
                    Factory Supplier
                  </span>
                  <span className="font-black text-slate-900 text-xs">
                    {reorderProduct.supplier.name}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {reorderProduct.supplier.location} • Dispatch: {reorderProduct.supplier.dispatchTime}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Partner
                  </span>
                </div>
              </div>

              {/* Units to Reorder Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  Select Restock Quantity (Units to Order)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[20, 50, 100, 200].map((units) => (
                    <button
                      key={units}
                      type="button"
                      onClick={() => setReorderUnits(units)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        reorderUnits === units
                          ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-300 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      +{units} Units
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500">Custom quantity:</span>
                  <input
                    type="number"
                    min="1"
                    step="5"
                    value={reorderUnits}
                    onChange={(e) => setReorderUnits(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-2 py-1 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-hidden focus:border-amber-500"
                  />
                  <span className="text-xs text-slate-500">units</span>
                </div>
              </div>

              {/* Invoice Cost Breakdown */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Factory Wholesale Unit Price:</span>
                  <span className="font-mono">{formatPrice(reorderProduct.supplierCost, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>New Stock Balance After Reorder:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {reorderProduct.stock} + {reorderUnits} = {reorderProduct.stock + reorderUnits} units
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-200">Total Purchase Order:</span>
                  <span className="font-black text-amber-400 text-base">
                    {formatPrice(reorderUnits * reorderProduct.supplierCost, currency)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReorderProduct(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onReorderProductStock) {
                      onReorderProductStock(reorderProduct.id, reorderUnits);
                    }
                    setReorderProduct(null);
                  }}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Restock (+{reorderUnits})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Courier Airway Bill (AWB) Thermal Shipping Label Modal */}
      {selectedOrderForLabel && (
        <CourierShippingLabelModal
          order={selectedOrderForLabel}
          onClose={() => setSelectedOrderForLabel(null)}
          currency={currency}
        />
      )}

      {/* WhatsApp Customer Order Verification Modal */}
      {selectedOrderForWhatsApp && (
        <WhatsAppOrderVerificationModal
          order={selectedOrderForWhatsApp}
          onClose={() => setSelectedOrderForWhatsApp(null)}
          currency={currency}
          onConfirmVerification={(orderId, isVerified, note) => {
            onVerifyOrderAddress?.(orderId, isVerified, note);
            setSelectedOrderForWhatsApp(null);
          }}
        />
      )}
    </div>
  );
};
