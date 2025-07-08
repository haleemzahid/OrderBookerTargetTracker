/**
 * Utility functions for Pakistani Rupee currency formatting
 */

export const formatRupees = (amount: number): string => {
  return `Rs. ${amount.toLocaleString('en-PK')}`;
};

export const parseRupees = (value: string): number => {
  return parseFloat(value.replace(/[Rs.,\s]/g, '')) || 0;
};

export const formatCurrency = (amount: number, options?: {
  showSymbol?: boolean;
  precision?: number;
}): string => {
  const { showSymbol = true, precision = 2 } = options || {};
  const formatted = amount.toLocaleString('en-PK', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
  
  return showSymbol ? `Rs. ${formatted}` : formatted;
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

export const formatPercentage = (value: number, precision: number = 1): string => {
  return `${value.toFixed(precision)}%`;
};
