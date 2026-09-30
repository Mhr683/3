import React from 'react';
import { 
  X, 
  Bell, 
  BellRing, 
  TrendingDown, 
  ExternalLink, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Mail, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { PriceAlert, Product, CurrencyCode } from '../types/dropship';
import { formatPrice } from '../utils/currency';

interface PriceAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: PriceAlert[];
  products: Product[];
  currency: CurrencyCode;
  onSelectProduct: (product: Product) => void;
  onRemoveAlert: (alertId: string) => void;
  onSimulateDrop: (productId: string) => void;
  onClearAllAlerts: () => void;
}

export const PriceAlertsModal: React.FC<PriceAlertsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  products,
  currency,
  onSelectProduct,
  onRemoveAlert,
  onSimulateDrop,
  onClearAllAlerts,
}) => {
  if (!isOpen) return null;

  const triggeredAlerts = alerts.filter(a => a.isTriggered);
  const activeAlerts = alerts.filter(a => !a.isTriggered);

  const getProductForAlert = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shadow-xs">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Wholesale Price Alerts
                </h2>
                {alerts.length > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200">
                    {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Track factory wholesale drops to maximize your dropship & reseller margins
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* If there are triggered alerts */}
          {triggeredAlerts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>Price Drops Triggered ({triggeredAlerts.length})</span>
              </div>

              <div className="space-y-2.5">
                {triggeredAlerts.map(alert => {
                  const product = getProductForAlert(alert.productId);
                  const currentCost = product ? product.supplierCost : alert.triggeredCost || alert.targetWholesaleCost;
                  const savings = alert.currentWholesaleCost - currentCost;

                  return (
                    <div
                      key={alert.id}
                      className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={alert.productImage}
                          alt={alert.productTitle}
                          className="w-14 h-14 rounded-lg object-cover bg-white border border-emerald-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded">
                              PRICE DROPPED
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Triggered {alert.triggeredAt || 'just now'}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 truncate mt-0.5">
                            {alert.productTitle}
                          </h4>
                          <div className="flex items-center gap-2 text-xs mt-1">
                            <span className="text-slate-500 line-through">
                              {formatPrice(alert.currentWholesaleCost, currency)}
                            </span>
                            <span className="font-black text-emerald-700">
                              Now {formatPrice(currentCost, currency)}
                            </span>
                            <span className="text-emerald-800 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded text-[11px]">
                              Saved {formatPrice(Math.max(0, savings), currency)} / unit!
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-200">
                        {product && (
                          <button
                            onClick={() => {
                              onClose();
                              onSelectProduct(product);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          >
                            <span>View & Order</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveAlert(alert.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Dismiss alert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Monitoring Alerts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-600" />
                Active Price Watchlist ({activeAlerts.length})
              </span>
              {alerts.length > 0 && (
                <button
                  onClick={onClearAllAlerts}
                  className="text-slate-400 hover:text-rose-600 text-[11px] underline cursor-pointer"
                >
                  Clear All Alerts
                </button>
              )}
            </div>

            {activeAlerts.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No active price alerts</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Open any product in the store and click <strong className="text-slate-700">&quot;Set Price Alert&quot;</strong> to receive instant notifications when factory suppliers lower wholesale costs.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeAlerts.map(alert => {
                  const product = getProductForAlert(alert.productId);
                  const currentCost = product ? product.supplierCost : alert.currentWholesaleCost;

                  return (
                    <div
                      key={alert.id}
                      className="bg-white border border-slate-200 hover:border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={alert.productImage}
                          alt={alert.productTitle}
                          className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {alert.productTitle}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>Current Wholesale: <strong>{formatPrice(currentCost, currency)}</strong></span>
                            <span>•</span>
                            <span className="text-amber-700 font-bold">
                              Alert below: {formatPrice(alert.targetWholesaleCost, currency)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                            {alert.channel === 'email' && (
                              <span className="flex items-center gap-1 text-slate-600">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {alert.email || 'Email notification'}
                              </span>
                            )}
                            {alert.channel === 'whatsapp' && (
                              <span className="flex items-center gap-1 text-slate-600">
                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                                {alert.phone || 'WhatsApp notification'}
                              </span>
                            )}
                            {alert.channel === 'in_app' && (
                              <span className="flex items-center gap-1 text-slate-600">
                                <Bell className="w-3 h-3 text-amber-500" />
                                In-App Notification
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Simulation Drop Button for direct verification */}
                        <button
                          onClick={() => onSimulateDrop(alert.productId)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Simulate supplier price drop below threshold"
                        >
                          <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                          <span>Simulate Drop</span>
                        </button>

                        {product && (
                          <button
                            onClick={() => {
                              onClose();
                              onSelectProduct(product);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View product details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => onRemoveAlert(alert.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete alert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Educational Note */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-amber-700" />
              How Supplier Price Alerts Work
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              When international or local manufacturers lower raw material or shipping costs, factory wholesale rates drop. Setting a target alert ensures you are notified immediately to capitalize on higher profit margins or run flash discounts for your customers.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {activeAlerts.length} active monitoring, {triggeredAlerts.length} triggered
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
