// Custom hooks for customer credit management
// Following React best practices and existing project patterns

import { useState, useMemo, useCallback } from 'react';
import { message } from 'antd';
import {
  Customer,
  CustomerWithCredit,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerFilters,
  CreateCreditTransactionRequest
} from '../types';
import {
  useCustomersWithCredit,
  useCustomerWithCredit,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useCreateCreditTransaction,
  useRecordPayment,
  useCreditValidation,
  useOverdueCustomers,
  useCustomersApproachingDue,
  useRiskyCustomers,
  useCreditSummary,
  useDashboardStats,
  useCustomerSearch
} from '../api/queries';

// Hook for customer list management with filtering and search
export const useCustomerList = (initialFilters?: CustomerFilters) => {
  const [filters, setFilters] = useState<CustomerFilters>(initialFilters || {});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Main customer query
  const customersQuery = useCustomersWithCredit(filters);
  
  // Search query (only when actively searching)
  const searchQuery2 = useCustomerSearch(searchQuery, isSearching && searchQuery.length >= 2);

  // Determine which data source to use
  const customers = useMemo(() => {
    if (isSearching && searchQuery.length >= 2) {
      return searchQuery2.data || [];
    }
    return customersQuery.data || [];
  }, [isSearching, searchQuery, searchQuery2.data, customersQuery.data]);

  const isLoading = useMemo(() => {
    if (isSearching && searchQuery.length >= 2) {
      return searchQuery2.isLoading;
    }
    return customersQuery.isLoading;
  }, [isSearching, searchQuery, searchQuery2.isLoading, customersQuery.isLoading]);

  const error = useMemo(() => {
    if (isSearching && searchQuery.length >= 2) {
      return searchQuery2.error;
    }
    return customersQuery.error;
  }, [isSearching, searchQuery, searchQuery2.error, customersQuery.error]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<CustomerFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setIsSearching(false);
    setSearchQuery('');
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setIsSearching(false);
    setSearchQuery('');
  }, []);

  // Search functionality
  const search = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length >= 2);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearching(false);
  }, []);

  // Filter functions for specific use cases - cast to CustomerWithCredit for extended properties
  const getOverdueCustomers = useCallback(() => {
    return (customers as CustomerWithCredit[]).filter(customer => customer.isOverdue);
  }, [customers]);

  const getHighRiskCustomers = useCallback(() => {
    return customers.filter(customer => 
      customer.creditStatus === 'blocked' || 
      customer.paymentBehavior === 'problematic'
    );
  }, [customers]);

  const getCustomersNearLimit = useCallback(() => {
    return (customers as CustomerWithCredit[]).filter(customer => 
      customer.creditUtilization >= 90
    );
  }, [customers]);

  return {
    customers,
    isLoading,
    error,
    filters,
    searchQuery,
    isSearching,
    updateFilters,
    clearFilters,
    search,
    clearSearch,
    getOverdueCustomers,
    getHighRiskCustomers,
    getCustomersNearLimit,
    refetch: customersQuery.refetch
  };
};

// Hook for customer CRUD operations with error handling
export const useCustomerOperations = () => {
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const createCustomer = useCallback(async (data: CreateCustomerRequest) => {
    try {
      const result = await createMutation.mutateAsync(data);
      message.success(`Customer "${result.name}" created successfully`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
      message.error(errorMessage);
      throw error;
    }
  }, [createMutation]);

  const updateCustomer = useCallback(async (id: string, data: UpdateCustomerRequest) => {
    try {
      const result = await updateMutation.mutateAsync({ id, data });
      message.success(`Customer "${result.name}" updated successfully`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update customer';
      message.error(errorMessage);
      throw error;
    }
  }, [updateMutation]);

  const deleteCustomer = useCallback(async (id: string, customerName: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      message.success(`Customer "${customerName}" deleted successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete customer';
      message.error(errorMessage);
      throw error;
    }
  }, [deleteMutation]);

  return {
    createCustomer,
    updateCustomer,
    deleteCustomer,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  };
};

// Hook for credit transaction management
export const useCreditTransactions = (customerId?: string) => {
  const createTransactionMutation = useCreateCreditTransaction();
  const recordPaymentMutation = useRecordPayment();

  const createTransaction = useCallback(async (data: CreateCreditTransactionRequest) => {
    try {
      const result = await createTransactionMutation.mutateAsync(data);
      message.success('Transaction recorded successfully');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create transaction';
      message.error(errorMessage);
      throw error;
    }
  }, [createTransactionMutation]);

  const recordPayment = useCallback(async (
    amount: number,
    paymentMethod: string,
    orderId?: string,
    notes?: string
  ) => {
    if (!customerId) {
      throw new Error('Customer ID is required for payment recording');
    }

    try {
      const result = await recordPaymentMutation.mutateAsync({
        customerId,
        amount,
        paymentMethod,
        orderId,
        notes
      });
      message.success(`Payment of Rs. ${amount.toLocaleString()} recorded successfully`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to record payment';
      message.error(errorMessage);
      throw error;
    }
  }, [customerId, recordPaymentMutation]);

  return {
    createTransaction,
    recordPayment,
    isCreatingTransaction: createTransactionMutation.isPending,
    isRecordingPayment: recordPaymentMutation.isPending,
    isLoading: createTransactionMutation.isPending || recordPaymentMutation.isPending
  };
};

// Hook for credit validation with real-time updates
export const useCreditValidator = (customerId?: string) => {
  const [orderAmount, setOrderAmount] = useState(0);
  const [validationEnabled, setValidationEnabled] = useState(false);

  const validationQuery = useCreditValidation(
    customerId || '',
    orderAmount,
    validationEnabled && !!customerId && orderAmount > 0
  );

  const validateOrder = useCallback((amount: number) => {
    setOrderAmount(amount);
    setValidationEnabled(true);
  }, []);

  const clearValidation = useCallback(() => {
    setOrderAmount(0);
    setValidationEnabled(false);
  }, []);

  const canProceed = useMemo(() => {
    return validationQuery.data?.canProceed ?? false;
  }, [validationQuery.data]);

  const validationResult = validationQuery.data;

  return {
    validateOrder,
    clearValidation,
    validationResult,
    canProceed,
    isValidating: validationQuery.isLoading,
    validationError: validationQuery.error
  };
};

// Hook for collection management dashboard
export const useCollectionDashboard = () => {
  const overdueQuery = useOverdueCustomers();
  const approachingDueQuery = useCustomersApproachingDue(7);
  const riskyQuery = useRiskyCustomers();
  const summaryQuery = useCreditSummary();
  const dashboardQuery = useDashboardStats();

  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Calculate collection priorities
  const collectionPriorities = useMemo(() => {
    const overdue = overdueQuery.data || [];
    const approaching = approachingDueQuery.data || [];
    const risky = riskyQuery.data || [];

    return {
      urgent: overdue.filter(c => c.daysSinceLastPayment && c.daysSinceLastPayment > 30),
      high: overdue.filter(c => c.daysSinceLastPayment && c.daysSinceLastPayment <= 30),
      medium: approaching,
      risky: risky
    };
  }, [overdueQuery.data, approachingDueQuery.data, riskyQuery.data]);

  // Calculate collection efficiency
  const collectionEfficiency = useMemo(() => {
    const summary = summaryQuery.data;
    if (!summary || summary.totalOutstanding === 0) return 100;
    
    return ((summary.totalOutstanding - summary.totalOverdue) / summary.totalOutstanding) * 100;
  }, [summaryQuery.data]);

  const isLoading = overdueQuery.isLoading || 
                   approachingDueQuery.isLoading || 
                   riskyQuery.isLoading || 
                   summaryQuery.isLoading || 
                   dashboardQuery.isLoading;

  const error = overdueQuery.error || 
                approachingDueQuery.error || 
                riskyQuery.error || 
                summaryQuery.error || 
                dashboardQuery.error;

  return {
    overdueCustomers: overdueQuery.data || [],
    approachingDueCustomers: approachingDueQuery.data || [],
    riskyCustomers: riskyQuery.data || [],
    summary: summaryQuery.data,
    dashboardStats: dashboardQuery.data,
    collectionPriorities,
    collectionEfficiency,
    selectedPeriod,
    setSelectedPeriod,
    isLoading,
    error,
    refetch: () => {
      overdueQuery.refetch();
      approachingDueQuery.refetch();
      riskyQuery.refetch();
      summaryQuery.refetch();
      dashboardQuery.refetch();
    }
  };
};

// Hook for customer profile management
export const useCustomerProfile = (customerId: string) => {
  const customerQuery = useCustomerWithCredit(customerId);
  const updateMutation = useUpdateCustomer();

  const customer = customerQuery.data;

  // Quick actions for customer profile
  const updateCreditLimit = useCallback(async (newLimit: number, reason?: string) => {
    if (!customer) return;

    try {
      await updateMutation.mutateAsync({
        id: customerId,
        data: { 
          creditLimit: newLimit,
          // Store reason in special instructions for audit trail
          specialInstructions: reason ? 
            `${customer.specialInstructions || ''}\nCredit limit updated to Rs. ${newLimit}: ${reason}`.trim() :
            customer.specialInstructions
        }
      });
      message.success(`Credit limit updated to Rs. ${newLimit.toLocaleString()}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update credit limit';
      message.error(errorMessage);
      throw error;
    }
  }, [customer, customerId, updateMutation]);

  const updatePaymentBehavior = useCallback(async (
    behavior: 'new' | 'excellent' | 'good' | 'delayed' | 'problematic',
    reason?: string
  ) => {
    if (!customer) return;

    try {
      await updateMutation.mutateAsync({
        id: customerId,
        data: { 
          paymentBehavior: behavior,
          specialInstructions: reason ? 
            `${customer.specialInstructions || ''}\nPayment behavior updated to ${behavior}: ${reason}`.trim() :
            customer.specialInstructions
        }
      });
      message.success(`Payment behavior updated to ${behavior}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment behavior';
      message.error(errorMessage);
      throw error;
    }
  }, [customer, customerId, updateMutation]);

  const blockCustomer = useCallback(async (reason: string) => {
    if (!customer) return;

    try {
      await updateMutation.mutateAsync({
        id: customerId,
        data: { 
          creditStatus: 'blocked',
          specialInstructions: `${customer.specialInstructions || ''}\nBlocked: ${reason}`.trim()
        }
      });
      message.warning('Customer has been blocked');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to block customer';
      message.error(errorMessage);
      throw error;
    }
  }, [customer, customerId, updateMutation]);

  const unblockCustomer = useCallback(async (reason: string) => {
    if (!customer) return;

    try {
      await updateMutation.mutateAsync({
        id: customerId,
        data: { 
          creditStatus: 'good',
          specialInstructions: `${customer.specialInstructions || ''}\nUnblocked: ${reason}`.trim()
        }
      });
      message.success('Customer has been unblocked');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unblock customer';
      message.error(errorMessage);
      throw error;
    }
  }, [customer, customerId, updateMutation]);

  return {
    customer,
    isLoading: customerQuery.isLoading,
    error: customerQuery.error,
    isUpdating: updateMutation.isPending,
    updateCreditLimit,
    updatePaymentBehavior,
    blockCustomer,
    unblockCustomer,
    refetch: customerQuery.refetch
  };
};

// Hook for form state management with validation
export const useCustomerForm = (initialData?: Partial<Customer>) => {
  const [formData, setFormData] = useState<CreateCustomerRequest>(() => ({
    name: initialData?.name || '',
    businessName: initialData?.businessName || '',
    cnic: initialData?.cnic || '',
    phone: initialData?.phone || '',
    alternatePhone: initialData?.alternatePhone || '',
    whatsappNumber: initialData?.whatsappNumber || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    area: initialData?.area || '',
    creditLimit: initialData?.creditLimit || 0,
    creditDays: initialData?.creditDays || 30,
    customerType: initialData?.customerType || 'credit',
    shopType: initialData?.shopType || 'retail',
    relationshipType: initialData?.relationshipType || 'business',
    preferredContactMethod: initialData?.preferredContactMethod || 'call',
    bestContactTime: initialData?.bestContactTime || '',
    businessRegistrationNumber: initialData?.businessRegistrationNumber || '',
    ntnNumber: initialData?.ntnNumber || '',
    referredBy: initialData?.referredBy || '',
    collectionAgent: initialData?.collectionAgent || '',
    specialInstructions: initialData?.specialInstructions || ''
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback((field: keyof CreateCustomerRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (formData.cnic && !/^\d{5}-\d{7}-\d{1}$/.test(formData.cnic)) {
      newErrors.cnic = 'CNIC must be in format: 12345-1234567-1';
    }

    if ((formData.creditLimit || 0) < 0) {
      newErrors.creditLimit = 'Credit limit cannot be negative';
    }

    if ((formData.creditDays || 0) <= 0) {
      newErrors.creditDays = 'Credit days must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      businessName: '',
      cnic: '',
      phone: '',
      alternatePhone: '',
      whatsappNumber: '',
      address: '',
      city: '',
      area: '',
      creditLimit: 0,
      creditDays: 30,
      customerType: 'credit',
      shopType: 'retail',
      relationshipType: 'business',
      preferredContactMethod: 'call',
      bestContactTime: '',
      businessRegistrationNumber: '',
      ntnNumber: '',
      referredBy: '',
      collectionAgent: '',
      specialInstructions: ''
    });
    setErrors({});
  }, []);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && formData.name.trim() && formData.phone.trim();
  }, [errors, formData.name, formData.phone]);

  return {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm,
    isValid
  };
};
