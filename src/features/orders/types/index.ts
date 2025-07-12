export interface Order {
  id: string;
  orderBookerId: string;
  orderDate: Date;
  totalAmount: number;
  totalCost: number;
  totalProfit: number;
  totalCartons: number;
  returnCartons: number;
  returnAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  cartons: number;
  costPrice: number;
  sellPrice: number;
  totalCost: number;
  totalAmount: number;
  profit: number;
  returnCartons: number;
  returnAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderRequest {
  orderBookerId: string;
  orderDate: Date;
  notes?: string;
  items: CreateOrderItemRequest[];
}

export interface UpdateOrderRequest {
  orderBookerId?: string;
  orderDate?: Date;
  notes?: string;
}

export interface CreateOrderItemRequest {
  productId: string;
  cartons: number;
  costPrice: number;
  sellPrice: number;
  returnCartons?: number;
}

export interface UpdateOrderItemRequest {
  cartons?: number;
  sellPrice?: number;
  returnCartons?: number;
}

export interface OrderItemRequest {
  productId: string;
  cartons: number;
  costPrice: number;
  sellPrice: number;
}

export interface OrderFilters {
  orderBookerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'ascend' | 'descend';
}

export interface OrderSummary {
  totalOrders: number;
  totalAmount: number;
  totalProfit: number;
  totalCartons: number;
}

// Component Props Interfaces
export interface OrderTableProps {
  data: Order[];
  loading?: boolean;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onView: (order: Order) => void;
}

export interface OrderItemsTableProps {
  orderId: string;
  items: OrderItem[];
  products: any[]; // Will be typed as Product[] when imported
  onItemAdd: (item: CreateOrderItemRequest) => void;
  onItemUpdate: (itemId: string, updates: UpdateOrderItemRequest) => void;
  onItemDelete: (itemId: string) => void;
  loading?: boolean;
  editable?: boolean;
}

export interface OrderFormProps {
  order?: Order;
  onSubmit: (order: CreateOrderRequest | UpdateOrderRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface ReturnDialogProps {
  visible: boolean;
  orderItem: OrderItem;
  onConfirm: (returnQuantity: number) => void;
  onCancel: () => void;
}
