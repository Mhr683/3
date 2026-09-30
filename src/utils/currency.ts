import { CurrencyCode, CurrencyConfig } from '../types/dropship';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    rate: 1.0,
    name: 'US Dollar',
  },
  PKR: {
    code: 'PKR',
    symbol: 'Rs. ',
    rate: 280.0,
    name: 'Pakistani Rupee',
  },
  AED: {
    code: 'AED',
    symbol: 'AED ',
    rate: 3.67,
    name: 'UAE Dirham',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    rate: 0.92,
    name: 'Euro',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    rate: 0.79,
    name: 'British Pound',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    rate: 86.5,
    name: 'Indian Rupee',
  },
};

export function formatPrice(amountInUSD: number, currency: CurrencyCode = 'USD'): string {
  const conf = CURRENCIES[currency] || CURRENCIES.USD;
  const converted = amountInUSD * conf.rate;

  if (currency === 'PKR' || currency === 'INR') {
    return `${conf.symbol}${Math.round(converted).toLocaleString()}`;
  }

  return `${conf.symbol}${converted.toFixed(2)}`;
}

export function convertAmount(amountInUSD: number, targetCurrency: CurrencyCode): number {
  const rate = CURRENCIES[targetCurrency]?.rate || 1.0;
  return Number((amountInUSD * rate).toFixed(2));
}

export function usdToPkr(amountInUSD: number): number {
  return Math.round(amountInUSD * 280);
}

export function pkrToUsd(amountInPKR: number): number {
  return Number((amountInPKR / 280).toFixed(2));
}

export function toUsd(amountInCurrency: number, currency: CurrencyCode): number {
  const rate = CURRENCIES[currency]?.rate || 1.0;
  return Number((amountInCurrency / rate).toFixed(2));
}

export function formatPKR(amountInPKR: number): string {
  return `Rs. ${Math.round(amountInPKR).toLocaleString()}`;
}

export function getWholesalePricePKR(supplierCostUSD: number): number {
  return usdToPkr(supplierCostUSD);
}

export function getDirectCustomerPricePKR(supplierCostUSD: number, markupPKR: number = 200): number {
  return usdToPkr(supplierCostUSD) + markupPKR;
}
