import { recalculateAllOrderTotals } from '../features/orders/utils/calculations';

/**
 * Developer utility to recalculate all order totals
 * Call this if you need to fix order calculations in the database
 */
export const fixOrderTotals = async (): Promise<void> => {
  try {
    console.log('🔧 Starting order totals recalculation...');
    await recalculateAllOrderTotals();
    console.log('✅ Order totals recalculation completed successfully!');
  } catch (error) {
    console.error('❌ Failed to recalculate order totals:', error);
    throw error;
  }
};

// Export for easy access from browser console in development
if (typeof window !== 'undefined') {
  (window as any).fixOrderTotals = fixOrderTotals;
}
