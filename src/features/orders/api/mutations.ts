import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createOrder, 
  updateOrder, 
  deleteOrder,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem
} from './service';
import { queryKeys } from './keys';
import type { 
  CreateOrderRequest, 
  UpdateOrderRequest, 
  Order,
  CreateOrderItemRequest,
  UpdateOrderItemRequest,
  OrderItem
} from '../types';

// Order Mutations
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: CreateOrderRequest) => createOrder(order),
    onSuccess: (newOrder: Order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byOrderBooker(newOrder.orderBookerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.summary() });
      queryClient.setQueryData(queryKeys.orders.detail(newOrder.id), newOrder);
    },
    onError: (error) => {
      console.error('Error creating order:', error);
    }
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderRequest }) => updateOrder(id, data),
    onSuccess: (updatedOrder: Order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byOrderBooker(updatedOrder.orderBookerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byStatus(updatedOrder.status) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.summary() });
      queryClient.setQueryData(queryKeys.orders.detail(updatedOrder.id), updatedOrder);
    },
    onError: (e) => {
      console.error('Error updating order:', e);
    }
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteOrder(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.summary() });
      queryClient.removeQueries({ queryKey: queryKeys.orders.detail(id) });
      queryClient.removeQueries({ queryKey: queryKeys.orderItems.byOrder(id) });
    },
    onError: (e) => {
      console.error('Error deleting order:', e);
    }
  });
};

// Order Item Mutations
export const useCreateOrderItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: CreateOrderItemRequest }) => 
      createOrderItem(orderId, data),
    onSuccess: (newItem: OrderItem) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orderItems.byOrder(newItem.orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(newItem.orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.summary() });
    },
    onError: (e) => {
      console.error('Error creating order item:', e);
    }
  });
};

export const useUpdateOrderItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderItemRequest }) => 
      updateOrderItem(id, data),
    onSuccess: (updatedItem: OrderItem) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orderItems.byOrder(updatedItem.orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(updatedItem.orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.summary() });
    },
    onError: (e) => {
      console.error('Error updating order item:', e);
    }
  });
};

export const useDeleteOrderItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; orderId: string }) => deleteOrderItem(id),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orderItems.byOrder(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.summary() });
    },
    onError: (e) => {
      console.error('Error deleting order item:', e);
    }
  });
};
