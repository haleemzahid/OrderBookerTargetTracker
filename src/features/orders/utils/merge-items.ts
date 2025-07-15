import type { OrderItemData } from '../components/order-items-table';

/**
 * Merges order items that have the same product ID, cost price, and sell price.
 * Items with matching criteria will have their cartons and return cartons combined.
 */
export const mergeOrderItems = (items: OrderItemData[]): OrderItemData[] => {
  const mergedMap = new Map<string, OrderItemData>();

  items.forEach(item => {
    // Create a unique key based on productId, costPrice, and sellPrice
    const mergeKey = `${item.productId}-${item.costPrice}-${item.sellPrice}`;
    
    if (mergedMap.has(mergeKey)) {
      // Merge with existing item
      const existingItem = mergedMap.get(mergeKey)!;
      const mergedCartons = (existingItem.cartons || 0) + (item.cartons || 0);
      const mergedReturnCartons = (existingItem.returnCartons || 0) + (item.returnCartons || 0);
      
      // Recalculate totals based on merged quantities
      const totalCost = mergedCartons * (item.costPrice || 0);
      const totalAmount = mergedCartons * (item.sellPrice || 0);
      const profit = totalAmount - totalCost;
      
      mergedMap.set(mergeKey, {
        ...existingItem,
        cartons: mergedCartons,
        returnCartons: mergedReturnCartons,
        totalCost,
        totalAmount,
        profit,
      });
    } else {
      // Add new item to map
      mergedMap.set(mergeKey, { ...item });
    }
  });

  return Array.from(mergedMap.values());
};

/**
 * Checks if an item should be merged with existing items based on productId, costPrice, and sellPrice
 */
export const findMergeableItem = (
  newItem: OrderItemData, 
  existingItems: OrderItemData[]
): OrderItemData | null => {
  return existingItems.find(item => 
    item.productId === newItem.productId &&
    item.costPrice === newItem.costPrice &&
    item.sellPrice === newItem.sellPrice &&
    item.key !== newItem.key // Don't merge with itself when editing
  ) || null;
};
