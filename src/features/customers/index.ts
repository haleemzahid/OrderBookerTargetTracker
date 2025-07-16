// Customer Credit Management Feature Module
// Export all public APIs following the established feature pattern

export * from './types';
export * from './api/service-interface';
export { default as customerService } from './api/service';

// Re-export commonly used types for convenience
export type {
  Customer,
  CustomerWithCredit,
  CustomerCreditTransaction,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerFilters,
  CreditValidationResult,
  CustomerCreditSummary
} from './types';
