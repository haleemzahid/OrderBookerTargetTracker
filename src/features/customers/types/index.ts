// Customer Credit Management Type Definitions
// Following kebab-case naming convention and TypeScript best practices

export interface Customer {
  id: string;
  name: string;
  businessName?: string;
  cnic?: string; // Pakistani CNIC number
  phone: string;
  alternatePhone?: string;
  whatsappNumber?: string;
  address?: string;
  city?: string;
  area?: string;
  
  // Credit Information
  creditLimit: number;
  creditDays: number;
  currentOutstanding: number;
  
  // Business Classification
  customerType: 'cash' | 'credit' | 'special';
  shopType: 'retail' | 'distributor' | 'sub_distributor';
  paymentBehavior: 'new' | 'excellent' | 'good' | 'delayed' | 'problematic';
  relationshipType: 'business' | 'family' | 'friend' | 'reference';
  
  // Risk Assessment
  creditStatus: 'good' | 'warning' | 'blocked' | 'cash_only';
  lastPaymentDate?: Date;
  averageDelayDays: number;
  totalOrdersCount: number;
  totalLifetimeValue: number;
  
  // Communication Preferences
  preferredContactMethod: 'call' | 'whatsapp' | 'visit' | 'sms';
  bestContactTime?: string;
  
  // Business Registration
  businessRegistrationNumber?: string;
  ntnNumber?: string; // National Tax Number for Pakistan
  
  // Relationship Management
  referredBy?: string;
  collectionAgent?: string; // Order booker ID responsible for collections
  specialInstructions?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerCreditTransaction {
  id: string;
  customerId: string;
  transactionType: 'SALE' | 'PAYMENT' | 'ADJUSTMENT' | 'REFUND';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  orderId?: string;
  
  // Payment Details
  paymentMethod?: 'cash' | 'bank_transfer' | 'cheque' | 'mobile_banking' | 'advance';
  paymentReference?: string;
  receivedBy?: string;
  paymentLocation?: 'shop' | 'bank' | 'office' | 'home' | 'market';
  
  // Dates and Terms
  transactionDate: Date;
  dueDate?: Date;
  
  // Partial Payment Support
  isPartialPayment: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  
  // Pakistani Business Context
  customerExcuse?: string;
  collectionDifficulty?: 'easy' | 'moderate' | 'difficult' | 'very_difficult';
  relationshipImpact?: string;
  
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerCreditTerms {
  id: string;
  customerId: string;
  
  // Standard Terms
  creditLimit: number;
  paymentDays: number;
  earlyPaymentDiscount: number;
  latePaymentPenalty: number;
  
  // Pakistani Cultural Terms
  ramadanExtension: boolean;
  eidExtensionDays: number;
  weddingSeasonAdjustment: boolean;
  harvestSeasonConsideration: boolean;
  
  // Business Relationship Terms
  familyFriendTerms: boolean;
  bulkPurchaseDiscount: number;
  loyaltyDiscount: number;
  seasonalAdjustmentPercentage: number;
  
  // Risk Management
  guarantorRequired: boolean;
  guarantorName?: string;
  guarantorPhone?: string;
  advancePaymentRequired: boolean;
  securityDepositRequired: number;
  securityDepositReceived: number;
  
  // Special Conditions
  maximumOrderValue: number; // 0 means no limit
  minimumOrderValue: number;
  restrictedProducts?: string; // JSON array of product IDs
  
  // Effective Dates
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  
  // Approval
  approvedBy: string;
  approvalReason?: string;
  specialConditions?: string;
  reviewDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionAlert {
  id: string;
  customerId: string;
  
  // Alert Classification
  alertType: 'overdue' | 'approaching_due' | 'credit_limit' | 'no_contact' | 'behavior_change';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Financial Context
  amountInvolved: number;
  daysOverdue: number;
  overdueAmount: number;
  
  // Communication Tracking
  lastContactDate?: Date;
  contactAttempts: number;
  excuseCount: number;
  lastExcuse?: string;
  contactResponse?: 'positive' | 'neutral' | 'negative' | 'hostile' | 'no_response';
  
  // Pakistani Business Context
  relationshipConsideration?: 'handle_gently' | 'family_friend' | 'strict_business' | 'respect_required' | 'elder_customer';
  culturalNotes?: string;
  languagePreference: 'urdu' | 'english' | 'punjabi' | 'sindhi' | 'pashto';
  
  // Action Management
  assignedTo?: string;
  escalationLevel: number;
  suggestedAction: 'call' | 'whatsapp' | 'visit' | 'sms' | 'email' | 'stop_credit' | 'legal_notice';
  bestContactTime?: string;
  preferredContactMethod?: string;
  
  // Visit Planning
  lastVisitDate?: Date;
  nextPlannedVisit?: Date;
  visitResult?: string;
  distanceFromOffice?: number;
  
  // Resolution
  status: 'open' | 'in_progress' | 'resolved' | 'escalated' | 'closed';
  resolutionNotes?: string;
  resolvedDate?: Date;
  resolvedBy?: string;
  resolutionAmount?: number;
  
  // Automation
  nextActionDate?: Date;
  alertFrequency: 'hourly' | 'daily' | 'weekly' | 'manual';
  autoEscalateAfterDays: number;
  
  // Business Intelligence
  collectionDifficultyScore: number; // 1-10 scale
  customerCooperationLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'hostile' | 'unknown';
  
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response Types
export interface CreateCustomerRequest {
  name: string;
  businessName?: string;
  cnic?: string;
  phone: string;
  alternatePhone?: string;
  whatsappNumber?: string;
  address?: string;
  city?: string;
  area?: string;
  creditLimit?: number;
  creditDays?: number;
  customerType?: 'cash' | 'credit' | 'special';
  shopType?: 'retail' | 'distributor' | 'sub_distributor';
  relationshipType?: 'business' | 'family' | 'friend' | 'reference';
  preferredContactMethod?: 'call' | 'whatsapp' | 'visit' | 'sms';
  bestContactTime?: string;
  businessRegistrationNumber?: string;
  ntnNumber?: string;
  referredBy?: string;
  collectionAgent?: string;
  specialInstructions?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  paymentBehavior?: 'new' | 'excellent' | 'good' | 'delayed' | 'problematic';
  creditStatus?: 'good' | 'warning' | 'blocked' | 'cash_only';
  averageDelayDays?: number;
  totalOrdersCount?: number;
  totalLifetimeValue?: number;
}

export interface CustomerFilters {
  search?: string;
  creditStatus?: 'good' | 'warning' | 'blocked' | 'cash_only';
  paymentBehavior?: 'new' | 'excellent' | 'good' | 'delayed' | 'problematic';
  customerType?: 'cash' | 'credit' | 'special';
  area?: string;
  city?: string;
  collectionAgent?: string;
  outstandingFrom?: number;
  outstandingTo?: number;
  creditLimitFrom?: number;
  creditLimitTo?: number;
  lastPaymentBefore?: Date;
  lastPaymentAfter?: Date;
}

export interface CreateCreditTransactionRequest {
  customerId: string;
  transactionType: 'SALE' | 'PAYMENT' | 'ADJUSTMENT' | 'REFUND';
  amount: number;
  orderId?: string;
  paymentMethod?: 'cash' | 'bank_transfer' | 'cheque' | 'mobile_banking' | 'advance';
  paymentReference?: string;
  paymentLocation?: 'shop' | 'bank' | 'office' | 'home' | 'market';
  dueDate?: Date;
  isPartialPayment?: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  customerExcuse?: string;
  collectionDifficulty?: 'easy' | 'moderate' | 'difficult' | 'very_difficult';
  notes?: string;
}

export interface CreditValidationResult {
  canProceed: boolean;
  warnings: string[];
  errors: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  availableCredit: number;
  recommendedAction?: string;
  alternatives?: string[];
}

export interface CustomerCreditSummary {
  totalCustomers: number;
  totalOutstanding: number;
  totalCreditLimit: number;
  totalOverdue: number;
  averageDelayDays: number;
  collectionEfficiency: number;
  riskDistribution: {
    good: number;
    warning: number;
    blocked: number;
    cashOnly: number;
  };
}

export interface PaymentReminderRequest {
  customerId: string;
  amount: number;
  dueDate: Date;
  preferredMethod: 'call' | 'whatsapp' | 'visit' | 'sms';
  culturalConsiderations?: string;
  languagePreference?: 'urdu' | 'english' | 'punjabi' | 'sindhi' | 'pashto';
}

// Enhanced customer with calculated fields
export interface CustomerWithCredit extends Customer {
  availableCredit: number; // creditLimit - currentOutstanding
  creditUtilization: number; // (currentOutstanding / creditLimit) * 100
  daysSinceLastPayment?: number;
  isOverdue: boolean;
  overdueAmount: number;
  nextPaymentDue?: Date;
  riskScore: number; // 1-100 scale
  activeAlerts: number;
  lastOrderDate?: Date;
  averageOrderValue: number;
  collectionDifficulty: 'easy' | 'moderate' | 'difficult' | 'very_difficult';
}

// Collection alerts with customer information
export interface CollectionAlertWithCustomer extends CollectionAlert {
  customer: Pick<Customer, 'name' | 'businessName' | 'phone' | 'area' | 'preferredContactMethod'>;
}

// Dashboard stats for management
export interface CreditDashboardStats {
  todayCollections: number;
  pendingCollections: number;
  overdueCustomers: number;
  totalOutstanding: number;
  collectionTargetForMonth: number;
  collectionAchievedForMonth: number;
  alertsRequiringAction: number;
  highRiskCustomers: number;
}
