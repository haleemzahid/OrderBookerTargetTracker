// Customer Credit Management Service Interface
// Following TypeScript best practices and existing service patterns

import type {
  Customer,
  CustomerWithCredit,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerFilters,
  CustomerCreditTransaction,
  CreateCreditTransactionRequest,
  CustomerCreditTerms,
  CollectionAlert,
  CollectionAlertWithCustomer,
  CreditValidationResult,
  CustomerCreditSummary,
  PaymentReminderRequest,
  CreditDashboardStats
} from '../types';

/**
 * Customer Service Interface
 * Comprehensive customer management with credit tracking
 */
export interface ICustomerService {
  // Customer CRUD Operations
  getAll(filters?: CustomerFilters): Promise<Customer[]>;
  getAllWithCredit(filters?: CustomerFilters): Promise<CustomerWithCredit[]>;
  getById(id: string): Promise<Customer | null>;
  getByIdWithCredit(id: string): Promise<CustomerWithCredit | null>;
  create(data: CreateCustomerRequest): Promise<Customer>;
  update(id: string, data: UpdateCustomerRequest): Promise<Customer>;
  delete(id: string): Promise<void>;
  
  // Credit Transaction Management
  getCreditTransactions(customerId: string, limit?: number): Promise<CustomerCreditTransaction[]>;
  createCreditTransaction(data: CreateCreditTransactionRequest): Promise<CustomerCreditTransaction>;
  getTransactionById(id: string): Promise<CustomerCreditTransaction | null>;
  
  // Credit Terms Management
  getCustomerCreditTerms(customerId: string): Promise<CustomerCreditTerms | null>;
  updateCreditTerms(customerId: string, terms: Partial<CustomerCreditTerms>): Promise<CustomerCreditTerms>;
  
  // Credit Validation and Business Logic
  validateCreditForOrder(customerId: string, orderAmount: number): Promise<CreditValidationResult>;
  calculateAvailableCredit(customerId: string): Promise<number>;
  updatePaymentBehavior(customerId: string): Promise<void>;
  
  // Payment Processing
  recordPayment(
    customerId: string,
    amount: number,
    paymentMethod: string,
    orderId?: string,
    notes?: string
  ): Promise<CustomerCreditTransaction>;
  
  // Collection Management
  getOverdueCustomers(daysOverdue?: number): Promise<CustomerWithCredit[]>;
  getCustomersApproachingDue(daysAhead?: number): Promise<CustomerWithCredit[]>;
  identifyRiskyCustomers(): Promise<Customer[]>;
  generatePaymentReminder(request: PaymentReminderRequest): Promise<string>;
  
  // Business Intelligence and Reporting
  getCreditSummary(): Promise<CustomerCreditSummary>;
  getDashboardStats(): Promise<CreditDashboardStats>;
  getPaymentTrends(customerId: string): Promise<{
    averageDelayDays: number;
    paymentFrequency: number;
    preferredPaymentMethods: string[];
    seasonalPatterns: Record<string, number>;
  }>;
  
  // Search and Filtering
  searchCustomers(query: string): Promise<Customer[]>;
  getCustomersByArea(area: string): Promise<Customer[]>;
  getCustomersByAgent(agentId: string): Promise<Customer[]>;
  
  // Export and Import
  exportCustomerData(filters?: CustomerFilters): Promise<string>; // CSV format
  bulkUpdateCreditLimits(updates: Array<{ customerId: string; newLimit: number; reason: string }>): Promise<void>;
  
  // Order Integration
  getCustomerOrders(customerId: string): Promise<any[]>;
  
  // Alert Integration  
  getCustomerAlerts(customerId: string): Promise<any[]>;
  getCollectionAlerts(filters?: { 
    priority?: string; 
    status?: string; 
    assignedTo?: string;
    customerId?: string;
  }): Promise<any[]>;
}

/**
 * Collection Alert Service Interface
 * Automated alert system for payment collections
 */
export interface ICollectionAlertService {
  // Alert CRUD Operations
  getAll(filters?: {
    status?: 'open' | 'in_progress' | 'resolved' | 'escalated' | 'closed';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    assignedTo?: string;
    alertType?: string;
  }): Promise<CollectionAlertWithCustomer[]>;
  
  getById(id: string): Promise<CollectionAlert | null>;
  create(alert: Omit<CollectionAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<CollectionAlert>;
  update(id: string, updates: Partial<CollectionAlert>): Promise<CollectionAlert>;
  resolve(id: string, resolutionNotes: string, resolutionAmount?: number): Promise<void>;
  
  // Alert Management
  getAlertsByCustomer(customerId: string): Promise<CollectionAlert[]>;
  getAlertsByAgent(agentId: string): Promise<CollectionAlertWithCustomer[]>;
  escalateAlert(id: string, reason: string): Promise<void>;
  snoozeAlert(id: string, until: Date, reason: string): Promise<void>;
  
  // Automated Alert Generation
  generateOverdueAlerts(): Promise<CollectionAlert[]>;
  generateCreditLimitAlerts(): Promise<CollectionAlert[]>;
  generateBehaviorChangeAlerts(): Promise<CollectionAlert[]>;
  
  // Communication Integration
  sendWhatsAppReminder(alertId: string, customMessage?: string): Promise<boolean>;
  scheduleFollowUpCall(alertId: string, scheduledTime: Date): Promise<void>;
  recordContactAttempt(
    alertId: string, 
    method: string, 
    response: string, 
    notes?: string
  ): Promise<void>;
  
  // Reporting and Analytics
  getCollectionEfficiencyReport(agentId?: string, dateRange?: { from: Date; to: Date }): Promise<{
    totalAlerts: number;
    resolvedAlerts: number;
    averageResolutionTime: number;
    collectionRate: number;
    amountCollected: number;
  }>;
}

/**
 * Risk Assessment Service Interface
 * Calculate payment behavior scores and risk levels
 */
export interface IRiskAssessmentService {
  // Risk Calculation
  calculateCustomerRiskScore(customerId: string): Promise<number>;
  assessCreditWorthiness(customerId: string): Promise<{
    score: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    recommendations: string[];
  }>;
  
  // Behavioral Analysis
  analyzePaymentPattern(customerId: string): Promise<{
    consistency: number;
    averageDelay: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
    seasonalFactors: Record<string, number>;
  }>;
  
  // Portfolio Analysis
  getPortfolioRiskDistribution(): Promise<{
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
    criticalRisk: number;
  }>;
  
  // Early Warning System
  identifyDeterioratingCustomers(): Promise<Customer[]>;
  predictDefaultRisk(customerId: string): Promise<{
    probability: number;
    timeframe: number; // days
    contributingFactors: string[];
  }>;
  
  // Recommendations
  suggestCreditLimitAdjustments(): Promise<Array<{
    customerId: string;
    currentLimit: number;
    suggestedLimit: number;
    reason: string;
    confidence: number;
  }>>;
}

/**
 * Communication Service Interface
 * Handle customer communications with cultural sensitivity
 */
export interface ICustomerCommunicationService {
  // Message Generation
  generatePaymentReminder(
    customerId: string,
    amount: number,
    language: 'urdu' | 'english' | 'punjabi' | 'sindhi' | 'pashto'
  ): Promise<string>;
  
  generateCollectionMessage(
    customerId: string,
    escalationLevel: number,
    culturalConsiderations?: string
  ): Promise<string>;
  
  // Communication Tracking
  recordCommunication(
    customerId: string,
    method: 'call' | 'whatsapp' | 'visit' | 'sms',
    message: string,
    response?: string,
    effectiveness?: 'high' | 'medium' | 'low'
  ): Promise<void>;
  
  // Best Time Optimization
  determineOptimalContactTime(customerId: string): Promise<{
    preferredTime: string;
    confidence: number;
    basis: 'historical' | 'declared' | 'default';
  }>;
  
  // Cultural Adaptation
  adaptMessageForCulture(
    baseMessage: string,
    customerProfile: Pick<Customer, 'relationshipType' | 'area' | 'customerType'>
  ): Promise<string>;
}

// Type for service dependencies injection
export interface CustomerServiceDependencies {
  customerService: ICustomerService;
  collectionAlertService: ICollectionAlertService;
  riskAssessmentService: IRiskAssessmentService;
  communicationService: ICustomerCommunicationService;
}

// Error types for proper error handling
export class CustomerServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CustomerServiceError';
  }
}

export class CreditValidationError extends CustomerServiceError {
  constructor(message: string, public validationResult: CreditValidationResult) {
    super(message, 'CREDIT_VALIDATION_FAILED', { validationResult });
    this.name = 'CreditValidationError';
  }
}

export class InsufficientCreditError extends CustomerServiceError {
  constructor(
    message: string,
    public availableCredit: number,
    public requestedAmount: number
  ) {
    super(message, 'INSUFFICIENT_CREDIT', { availableCredit, requestedAmount });
    this.name = 'InsufficientCreditError';
  }
}
