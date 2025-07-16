// Utility functions for formatting customer and credit data
// Following Pakistani business context and currency formatting

import { Customer } from '../types';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  CloseCircleOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import React from 'react';

// Union types for customer fields
type PaymentBehavior = Customer['paymentBehavior'];
type CreditStatus = Customer['creditStatus'];

/**
 * Format currency values for Pakistani Rupees
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Get color for credit status display
 */
export const getStatusColor = (status: CreditStatus): string => {
  switch (status) {
    case 'good':
      return 'green';
    case 'warning':
      return 'orange';
    case 'blocked':
      return 'red';
    case 'cash_only':
      return 'blue';
    default:
      return 'default';
  }
};

/**
 * Get icon for payment behavior
 */
export const getPaymentBehaviorIcon = (behavior: PaymentBehavior): React.ReactElement => {
  switch (behavior) {
    case 'excellent':
      return React.createElement(CheckCircleOutlined, { style: { color: '#52c41a' } });
    case 'good':
      return React.createElement(CheckCircleOutlined, { style: { color: '#1890ff' } });
    case 'new':
      return React.createElement(MinusCircleOutlined, { style: { color: '#8c8c8c' } });
    case 'delayed':
      return React.createElement(ExclamationCircleOutlined, { style: { color: '#faad14' } });
    case 'problematic':
      return React.createElement(CloseCircleOutlined, { style: { color: '#ff4d4f' } });
    default:
      return React.createElement(MinusCircleOutlined, { style: { color: '#8c8c8c' } });
  }
};

/**
 * Format Pakistani CNIC number with proper dashes
 */
export const formatCNIC = (cnic: string): string => {
  // Remove any existing dashes and non-numeric characters
  const cleanCnic = cnic.replace(/\D/g, '');
  
  // Add dashes in proper format: 12345-1234567-1
  if (cleanCnic.length === 13) {
    return `${cleanCnic.slice(0, 5)}-${cleanCnic.slice(5, 12)}-${cleanCnic.slice(12)}`;
  }
  
  return cnic; // Return as-is if not 13 digits
};

/**
 * Format phone number for Pakistani format
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove any non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Pakistani mobile numbers start with 03 and are 11 digits
  if (cleanPhone.startsWith('03') && cleanPhone.length === 11) {
    return `${cleanPhone.slice(0, 4)}-${cleanPhone.slice(4, 7)}-${cleanPhone.slice(7)}`;
  }
  
  // Landline numbers vary but typically 10-11 digits
  if (cleanPhone.length >= 10) {
    return `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3)}`;
  }
  
  return phone; // Return as-is if doesn't match expected patterns
};

/**
 * Get risk level text and color based on customer data
 */
export const getRiskLevel = (
  creditUtilization: number,
  paymentBehavior: PaymentBehavior,
  isOverdue: boolean,
  daysSinceLastPayment: number
): { level: string; color: string } => {
  if (isOverdue && daysSinceLastPayment > 60) {
    return { level: 'Very High', color: 'red' };
  }
  
  if (paymentBehavior === 'problematic') {
    return { level: 'High', color: 'volcano' };
  }
  
  if (creditUtilization > 90 || isOverdue) {
    return { level: 'Medium', color: 'orange' };
  }
  
  if (creditUtilization > 70 || paymentBehavior === 'delayed') {
    return { level: 'Low', color: 'gold' };
  }
  
  return { level: 'Very Low', color: 'green' };
};

/**
 * Format payment terms in Urdu/English for Pakistani context
 */
export const formatPaymentTerms = (days: number): string => {
  if (days === 0) return 'Cash (نقد)';
  if (days <= 7) return `${days} days (${days} دن)`;
  if (days <= 30) return `${days} days (${days} دن)`;
  if (days === 45) return '45 days (ڈیڑھ ماہ)';
  if (days === 60) return '2 months (دو ماہ)';
  if (days === 90) return '3 months (تین ماہ)';
  return `${days} days`;
};

/**
 * Get appropriate action label based on context
 */
export const getActionLabel = (action: string, isUrdu: boolean = false): string => {
  const labels: Record<string, { en: string; ur: string }> = {
    pay: { en: 'Pay', ur: 'ادائیگی' },
    edit: { en: 'Edit', ur: 'تبدیل کریں' },
    view: { en: 'View', ur: 'دیکھیں' },
    delete: { en: 'Delete', ur: 'حذف کریں' },
    block: { en: 'Block', ur: 'بلاک کریں' },
    unblock: { en: 'Unblock', ur: 'ان بلاک کریں' },
    suspend: { en: 'Suspend', ur: 'معطل کریں' },
    activate: { en: 'Activate', ur: 'فعال کریں' }
  };
  
  return labels[action] ? (isUrdu ? labels[action].ur : labels[action].en) : action;
};
