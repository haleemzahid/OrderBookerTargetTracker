// Customer Credit Management React Query Integration
// Following React Query patterns and existing project structure

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerFilters,
  CreateCreditTransactionRequest
} from '../types';
import customerService from './service';

// Query Keys for cache management
export const customerQueryKeys = {
  all: ['customers'] as const,
  lists: () => [...customerQueryKeys.all, 'list'] as const,
  list: (filters?: CustomerFilters) => [...customerQueryKeys.lists(), { filters }] as const,
  details: () => [...customerQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerQueryKeys.details(), id] as const,
  withCredit: () => [...customerQueryKeys.all, 'withCredit'] as const,
  withCreditList: (filters?: CustomerFilters) => [...customerQueryKeys.withCredit(), { filters }] as const,
  transactions: (customerId: string) => [...customerQueryKeys.detail(customerId), 'transactions'] as const,
  summary: () => [...customerQueryKeys.all, 'summary'] as const,
  dashboard: () => [...customerQueryKeys.all, 'dashboard'] as const,
  validation: (customerId: string, amount: number) => 
    [...customerQueryKeys.detail(customerId), 'validation', amount] as const,
  overdue: (daysOverdue?: number) => [...customerQueryKeys.all, 'overdue', daysOverdue] as const,
  approachingDue: (daysAhead?: number) => [...customerQueryKeys.all, 'approachingDue', daysAhead] as const,
  risky: () => [...customerQueryKeys.all, 'risky'] as const,
  search: (query: string) => [...customerQueryKeys.all, 'search', query] as const,
  byArea: (area: string) => [...customerQueryKeys.all, 'byArea', area] as const,
  byAgent: (agentId: string) => [...customerQueryKeys.all, 'byAgent', agentId] as const
};

// Customer Queries
export const useCustomers = (filters?: CustomerFilters) => {
  return useQuery({
    queryKey: customerQueryKeys.list(filters),
    queryFn: () => customerService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
};

export const useCustomersWithCredit = (filters?: CustomerFilters) => {
  return useQuery({
    queryKey: customerQueryKeys.withCreditList(filters),
    queryFn: () => customerService.getAllWithCredit(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent for credit data)
    refetchOnWindowFocus: false
  });
};

export const useCustomer = (id: string, enabled = true) => {
  return useQuery({
    queryKey: customerQueryKeys.detail(id),
    queryFn: () => customerService.getById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000
  });
};

export const useCustomerWithCredit = (id: string, enabled = true) => {
  return useQuery({
    queryKey: [...customerQueryKeys.detail(id), 'withCredit'],
    queryFn: () => customerService.getByIdWithCredit(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000
  });
};

export const useCustomerTransactions = (customerId: string, limit?: number, enabled = true) => {
  return useQuery({
    queryKey: [...customerQueryKeys.transactions(customerId), limit],
    queryFn: () => customerService.getCreditTransactions(customerId, limit),
    enabled: enabled && !!customerId,
    staleTime: 1 * 60 * 1000 // 1 minute for transaction data
  });
};

// Credit Management Queries
export const useCreditValidation = (customerId: string, orderAmount: number, enabled = true) => {
  return useQuery({
    queryKey: customerQueryKeys.validation(customerId, orderAmount),
    queryFn: () => customerService.validateCreditForOrder(customerId, orderAmount),
    enabled: enabled && !!customerId && orderAmount > 0,
    staleTime: 30 * 1000, // 30 seconds for validation (should be fresh)
    refetchOnWindowFocus: true
  });
};

export const useAvailableCredit = (customerId: string, enabled = true) => {
  return useQuery({
    queryKey: [...customerQueryKeys.detail(customerId), 'availableCredit'],
    queryFn: () => customerService.calculateAvailableCredit(customerId),
    enabled: enabled && !!customerId,
    staleTime: 2 * 60 * 1000
  });
};

// Collection and Risk Queries
export const useOverdueCustomers = (daysOverdue?: number) => {
  return useQuery({
    queryKey: customerQueryKeys.overdue(daysOverdue),
    queryFn: () => customerService.getOverdueCustomers(daysOverdue),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000 // Auto-refresh every 5 minutes
  });
};

export const useCustomersApproachingDue = (daysAhead = 7) => {
  return useQuery({
    queryKey: customerQueryKeys.approachingDue(daysAhead),
    queryFn: () => customerService.getCustomersApproachingDue(daysAhead),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000
  });
};

export const useRiskyCustomers = () => {
  return useQuery({
    queryKey: customerQueryKeys.risky(),
    queryFn: () => customerService.identifyRiskyCustomers(),
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000
  });
};

// Dashboard and Summary Queries
export const useCreditSummary = () => {
  return useQuery({
    queryKey: customerQueryKeys.summary(),
    queryFn: () => customerService.getCreditSummary(),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000
  });
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: customerQueryKeys.dashboard(),
    queryFn: () => customerService.getDashboardStats(),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000
  });
};

// Search Queries
export const useCustomerSearch = (query: string, enabled = true) => {
  return useQuery({
    queryKey: customerQueryKeys.search(query),
    queryFn: () => customerService.searchCustomers(query),
    enabled: enabled && query.length >= 2, // Only search with 2+ characters
    staleTime: 5 * 60 * 1000
  });
};

export const useCustomersByArea = (area: string, enabled = true) => {
  return useQuery({
    queryKey: customerQueryKeys.byArea(area),
    queryFn: () => customerService.getCustomersByArea(area),
    enabled: enabled && !!area,
    staleTime: 10 * 60 * 1000
  });
};

export const useCustomersByAgent = (agentId: string, enabled = true) => {
  return useQuery({
    queryKey: customerQueryKeys.byAgent(agentId),
    queryFn: () => customerService.getCustomersByAgent(agentId),
    enabled: enabled && !!agentId,
    staleTime: 5 * 60 * 1000
  });
};

// Additional queries for customer detail page
export const useCustomerOrders = (customerId: string, enabled = true) => {
  return useQuery({
    queryKey: [...customerQueryKeys.detail(customerId), 'orders'],
    queryFn: async () => {
      // TODO: Implement actual order service integration
      // For now, return empty array until order integration is complete
      return [];
    },
    enabled: enabled && !!customerId,
    staleTime: 2 * 60 * 1000
  });
};

export const useCustomerAlerts = (customerId: string, enabled = true) => {
  return useQuery({
    queryKey: [...customerQueryKeys.detail(customerId), 'alerts'],
    queryFn: async () => {
      // TODO: Implement actual collection alerts service
      // For now, return empty array until collection service is complete
      return [];
    },
    enabled: enabled && !!customerId,
    staleTime: 1 * 60 * 1000
  });
};

// Customer Mutations
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => customerService.create(data),
    onSuccess: (newCustomer) => {
      // Invalidate and refetch customer lists
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.withCredit() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.dashboard() });
      
      // Optimistically add to cache if possible
      queryClient.setQueryData(customerQueryKeys.detail(newCustomer.id), newCustomer);
    }
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerRequest }) => 
      customerService.update(id, data),
    onSuccess: (updatedCustomer) => {
      // Update specific customer in cache
      queryClient.setQueryData(customerQueryKeys.detail(updatedCustomer.id), updatedCustomer);
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.withCredit() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.dashboard() });
    }
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: customerQueryKeys.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.withCredit() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.dashboard() });
    }
  });
};

// Credit Transaction Mutations
export const useCreateCreditTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCreditTransactionRequest) => 
      customerService.createCreditTransaction(data),
    onSuccess: (transaction) => {
      // Invalidate customer data to refresh balances
      queryClient.invalidateQueries({ 
        queryKey: customerQueryKeys.detail(transaction.customerId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: customerQueryKeys.transactions(transaction.customerId) 
      });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.withCredit() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.dashboard() });
      
      // Invalidate validation queries for this customer
      queryClient.invalidateQueries({ 
        queryKey: [...customerQueryKeys.detail(transaction.customerId), 'validation'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [...customerQueryKeys.detail(transaction.customerId), 'availableCredit'] 
      });
    }
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      customerId, 
      amount, 
      paymentMethod, 
      orderId, 
      notes 
    }: {
      customerId: string;
      amount: number;
      paymentMethod: string;
      orderId?: string;
      notes?: string;
    }) => customerService.recordPayment(customerId, amount, paymentMethod, orderId, notes),
    onSuccess: (transaction) => {
      // Invalidate all relevant data after payment
      queryClient.invalidateQueries({ 
        queryKey: customerQueryKeys.detail(transaction.customerId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: customerQueryKeys.transactions(transaction.customerId) 
      });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.withCredit() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.overdue() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.approachingDue() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.risky() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.dashboard() });
    }
  });
};

// Utility hooks for cache management
export const useInvalidateCustomerData = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.all });
    },
    invalidateCustomer: (customerId: string) => {
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.detail(customerId) });
    },
    invalidateLists: () => {
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.withCredit() });
    },
    invalidateSummary: () => {
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.dashboard() });
    }
  };
};

// Real-time data hooks with auto-refresh
export const useRealtimeCreditSummary = (intervalMs = 30000) => {
  return useQuery({
    queryKey: [...customerQueryKeys.summary(), 'realtime'],
    queryFn: () => customerService.getCreditSummary(),
    refetchInterval: intervalMs,
    refetchIntervalInBackground: true,
    staleTime: 0 // Always consider stale for real-time data
  });
};

export const useRealtimeDashboardStats = (intervalMs = 30000) => {
  return useQuery({
    queryKey: [...customerQueryKeys.dashboard(), 'realtime'],
    queryFn: () => customerService.getDashboardStats(),
    refetchInterval: intervalMs,
    refetchIntervalInBackground: true,
    staleTime: 0
  });
};
