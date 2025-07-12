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
      // Invalidate all order-related queries to ensure fresh data
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
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.summary() });
      queryClient.setQueryData(queryKeys.orders.detail(updatedOrder.id), updatedOrder);
    },
    onError: (error) => {
      console.error('Error updating order:', error);
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
    onError: (error) => {
      console.error('Error deleting order:', error);
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
      // Invalidate order items for this order
      queryClient.invalidateQueries({ queryKey: queryKeys.orderItems.byOrder(newItem.orderId) });
      // Invalidate the order detail to show updated totals
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(newItem.orderId) });
      // Invalidate order lists to show updated totals
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.summary() });
    },
    onError: (error) => {
      console.error('Error creating order item:', error);
    }
  });
};

export const useUpdateOrderItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderItemRequest }) => 
      updateOrderItem(id, data),
    onSuccess: (updatedItem: OrderItem) => {
      // Invalidate order items for this order
      queryClient.invalidateQueries({ queryKey: queryKeys.orderItems.byOrder(updatedItem.orderId) });
      // Invalidate the order detail to show updated totals
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(updatedItem.orderId) });
      // Invalidate order lists to show updated totals
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.summary() });
    },
    onError: (error) => {
      console.error('Error updating order item:', error);
    }
  });
};

export const useDeleteOrderItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; orderId: string }) => deleteOrderItem(id),
    onSuccess: (_, { orderId }) => {
      // Invalidate order items for this order
      queryClient.invalidateQueries({ queryKey: queryKeys.orderItems.byOrder(orderId) });
      // Invalidate the order detail to show updated totals
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      // Invalidate order lists to show updated totals
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.summary() });
    },
    onError: (error) => {
      console.error('Error deleting order item:', error);
    }
  });
};
