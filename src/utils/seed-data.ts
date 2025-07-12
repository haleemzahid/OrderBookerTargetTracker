import { getDatabase } from '../services/database';
import { v4 as uuidv4 } from 'uuid';

interface SeedDataConfig {
  clearExisting?: boolean;
  generateOrders?: boolean;
  generateDailySales?: boolean;
  monthsToGenerate?: number;
}

const DEFAULT_CONFIG: SeedDataConfig = {
  clearExisting: true,
  generateOrders: true,
  generateDailySales: true,
  monthsToGenerate: 6, // Last 6 months including current
};

// Order Booker data as requested
const ORDER_BOOKERS = [
  { name: 'Kashif', nameUrdu: 'کاشف', phone: '+92-300-1000001', email: 'kashif@fruiticana.com' },
  { name: 'Abdur Rehman', nameUrdu: 'عبدالرحمن', phone: '+92-300-1000002', email: 'abdur.rehman@fruiticana.com' },
  { name: 'Naveed', nameUrdu: 'نوید', phone: '+92-300-1000003', email: 'naveed@fruiticana.com' },
  { name: 'Mobin', nameUrdu: 'موبن', phone: '+92-300-1000004', email: 'mobin@fruiticana.com' },
];

// Company and Products data
const COMPANY = {
  name: 'Fruiticana',
  address: 'Karachi, Pakistan',
  email: 'info@fruiticana.com',
  phone: '+92-21-1234567',
};

const PRODUCTS = [
  { name: 'Fruity Orange', costPrice: 100, sellPrice: 120, unitPerCarton: 24 },
  { name: 'Fruity Apple', costPrice: 110, sellPrice: 135, unitPerCarton: 24 },
  { name: 'Fruity Mango', costPrice: 120, sellPrice: 150, unitPerCarton: 24 },
  { name: 'Fresh Cola', costPrice: 80, sellPrice: 100, unitPerCarton: 24 },
  { name: 'Lemon Fizz', costPrice: 90, sellPrice: 115, unitPerCarton: 24 },
  { name: 'Energy Boost', costPrice: 150, sellPrice: 180, unitPerCarton: 12 },
];

const MONTHLY_TARGET = 700000; // Rs. 700,000 for all order bookers

/**
 * Generate realistic fake data for demonstration
 */
export const seedDemoData = async (config: SeedDataConfig = DEFAULT_CONFIG): Promise<void> => {
  try {
    console.log('🌱 Starting data seeding...');
    
    if (config.clearExisting) {
      await clearExistingData();
    }
    
    // 1. Create company
    const companyId = await createCompany();
    console.log('✅ Company created');
    
    // 2. Create products
    const productIds = await createProducts(companyId);
    console.log('✅ Products created');
    
    // 3. Create order bookers
    const orderBookerIds = await createOrderBookers();
    console.log('✅ Order bookers created');
    
    // 4. Create monthly targets
    await createMonthlyTargets(orderBookerIds, config.monthsToGenerate || 6);
    console.log('✅ Monthly targets created');
    
    // 5. Generate orders and sales data
    if (config.generateOrders) {
      await generateOrdersData(orderBookerIds, productIds, config.monthsToGenerate || 6);
      console.log('✅ Orders data generated');
    }
    
    if (config.generateDailySales) {
      await generateDailySalesData(orderBookerIds, productIds, config.monthsToGenerate || 6);
      console.log('✅ Daily sales data generated');
    }
    
    // 6. Update monthly targets with achieved amounts
    await updateMonthlyTargetsWithAchievements(orderBookerIds);
    console.log('✅ Monthly targets updated with achievements');
    
    console.log('🎉 Data seeding completed successfully!');
    
    // Show summary
    await showDataSummary();
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
};

/**
 * Clear existing data from all tables
 */
const clearExistingData = async (): Promise<void> => {
  const db = getDatabase();
  
  console.log('🧹 Clearing existing data...');
  
  // Clear in reverse dependency order
  await db.execute('DELETE FROM order_items');
  await db.execute('DELETE FROM orders');
  await db.execute('DELETE FROM daily_entry_items');
  await db.execute('DELETE FROM daily_entries');
  await db.execute('DELETE FROM monthly_targets');
  await db.execute('DELETE FROM products');
  await db.execute('DELETE FROM companies');
  await db.execute('DELETE FROM order_bookers');
  
  console.log('✅ Existing data cleared');
};

/**
 * Create the Fruiticana company
 */
const createCompany = async (): Promise<string> => {
  const db = getDatabase();
  const companyId = uuidv4();
  const now = new Date().toISOString();
  
  await db.execute(
    `INSERT INTO companies (id, name, address, email, phone, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [companyId, COMPANY.name, COMPANY.address, COMPANY.email, COMPANY.phone, now, now]
  );
  
  return companyId;
};

/**
 * Create beverage products
 */
const createProducts = async (companyId: string): Promise<string[]> => {
  const db = getDatabase();
  const productIds: string[] = [];
  const now = new Date().toISOString();
  
  for (const product of PRODUCTS) {
    const productId = uuidv4();
    await db.execute(
      `INSERT INTO products (id, company_id, name, cost_price, sell_price, unit_per_carton, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, companyId, product.name, product.costPrice, product.sellPrice, product.unitPerCarton, now, now]
    );
    productIds.push(productId);
  }
  
  return productIds;
};

/**
 * Create order bookers
 */
const createOrderBookers = async (): Promise<string[]> => {
  const db = getDatabase();
  const orderBookerIds: string[] = [];
  const now = new Date().toISOString();
  const joinDate = '2024-01-01';
  
  for (const orderBooker of ORDER_BOOKERS) {
    const orderBookerId = uuidv4();
    await db.execute(
      `INSERT INTO order_bookers (id, name, name_urdu, phone, email, join_date, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderBookerId, orderBooker.name, orderBooker.nameUrdu, orderBooker.phone, orderBooker.email, joinDate, 1, now, now]
    );
    orderBookerIds.push(orderBookerId);
  }
  
  return orderBookerIds;
};

/**
 * Create monthly targets for all order bookers
 */
const createMonthlyTargets = async (orderBookerIds: string[], monthsToGenerate: number): Promise<void> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  const currentDate = new Date();
  
  for (let monthOffset = 0; monthOffset < monthsToGenerate; monthOffset++) {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;
    
    // Calculate working days in month (approximate)
    const daysInMonth = new Date(year, month, 0).getDate();
    const workingDaysInMonth = Math.floor(daysInMonth * 5 / 7); // Approximate working days
    const dailyTargetAmount = MONTHLY_TARGET / workingDaysInMonth;
    
    for (const orderBookerId of orderBookerIds) {
      const targetId = uuidv4();
      await db.execute(
        `INSERT INTO monthly_targets (
          id, order_booker_id, year, month, target_amount, achieved_amount, 
          remaining_amount, achievement_percentage, days_in_month, 
          working_days_in_month, daily_target_amount, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          targetId, orderBookerId, year, month, MONTHLY_TARGET, 0, 
          MONTHLY_TARGET, 0, daysInMonth, workingDaysInMonth, 
          dailyTargetAmount, now, now
        ]
      );
    }
  }
};

/**
 * Generate realistic orders data
 */
const generateOrdersData = async (orderBookerIds: string[], productIds: string[], monthsToGenerate: number): Promise<void> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  const currentDate = new Date();
  
  for (let monthOffset = 0; monthOffset < monthsToGenerate; monthOffset++) {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (const orderBookerId of orderBookerIds) {
      // Generate 15-25 orders per month per order booker
      const ordersCount = Math.floor(Math.random() * 11) + 15;
      
      for (let orderIndex = 0; orderIndex < ordersCount; orderIndex++) {
        const orderId = uuidv4();
        const orderDay = Math.floor(Math.random() * daysInMonth) + 1;
        const orderDate = new Date(year, month - 1, orderDay).toISOString().split('T')[0];
        
        // Create order header
        await db.execute(
          `INSERT INTO orders (
            id, order_booker_id, order_date, supply_date, total_amount, total_cost, 
            total_profit, total_cartons, return_cartons, return_amount, status, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, orderBookerId, orderDate, orderDate, 0, 0, 0, 0, 0, 0, 'completed', 'Demo order', now, now]
        );
        
        // Generate 2-5 order items per order
        const itemsCount = Math.floor(Math.random() * 4) + 2;
        let orderTotalAmount = 0;
        let orderTotalCost = 0;
        let orderTotalCartons = 0;
        
        for (let itemIndex = 0; itemIndex < itemsCount; itemIndex++) {
          const itemId = uuidv4();
          const productId = productIds[Math.floor(Math.random() * productIds.length)];
          
          // Get product details
          const productResult = await db.select<any[]>(
            'SELECT cost_price, sell_price, unit_per_carton FROM products WHERE id = ?',
            [productId]
          );
          
          if (productResult.length === 0) continue;
          
          const product = productResult[0];
          const quantity = Math.floor(Math.random() * 100) + 10; // 10-109 units
          const cartons = quantity / product.unit_per_carton;
          const totalCost = quantity * product.cost_price;
          const totalAmount = quantity * product.sell_price;
          const profit = totalAmount - totalCost;
          
          // Some orders have returns (10% chance)
          const hasReturn = Math.random() < 0.1;
          const returnQuantity = hasReturn ? Math.floor(quantity * 0.05) : 0; // 5% return rate
          const returnAmount = returnQuantity * product.sell_price;
          const returnCartons = returnQuantity / product.unit_per_carton;
          
          await db.execute(
            `INSERT INTO order_items (
              id, order_id, product_id, quantity, cost_price, sell_price, 
              total_cost, total_amount, profit, cartons, return_quantity, 
              return_amount, return_cartons, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemId, orderId, productId, quantity, product.cost_price, product.sell_price,
              totalCost, totalAmount, profit, cartons, returnQuantity, returnAmount, 
              returnCartons, now, now
            ]
          );
          
          orderTotalAmount += totalAmount - returnAmount;
          orderTotalCost += totalCost;
          orderTotalCartons += cartons - returnCartons;
        }
        
        // Update order totals
        const orderTotalProfit = orderTotalAmount - orderTotalCost;
        await db.execute(
          `UPDATE orders SET 
            total_amount = ?, total_cost = ?, total_profit = ?, total_cartons = ?
           WHERE id = ?`,
          [orderTotalAmount, orderTotalCost, orderTotalProfit, orderTotalCartons, orderId]
        );
      }
    }
  }
};

/**
 * Generate daily sales data based on orders
 */
const generateDailySalesData = async (orderBookerIds: string[], productIds: string[], monthsToGenerate: number): Promise<void> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  const currentDate = new Date();
  
  for (let monthOffset = 0; monthOffset < monthsToGenerate; monthOffset++) {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (const orderBookerId of orderBookerIds) {
      // Generate daily sales entries (not every day, but most days)
      for (let day = 1; day <= daysInMonth; day++) {
        // 80% chance of having sales on any given day
        if (Math.random() > 0.8) continue;
        
        const entryDate = new Date(year, month - 1, day).toISOString().split('T')[0];
        const entryId = uuidv4();
        
        // Get sales from orders for this date
        const orderSalesResult = await db.select<any[]>(
          `SELECT COALESCE(SUM(total_amount), 0) as totalSales 
           FROM orders 
           WHERE order_booker_id = ? AND order_date = ?`,
          [orderBookerId, entryDate]
        );
        
        const dailySales = orderSalesResult[0]?.totalSales || 0;
        const returnAmount = dailySales * 0.02; // 2% return rate
        const netSales = dailySales - returnAmount;
        
        // Create daily entry header
        await db.execute(
          `INSERT INTO daily_entries (
            id, order_booker_id, date, notes, total_amount, total_return_amount, 
            net_amount, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [entryId, orderBookerId, entryDate, 'Daily sales entry', dailySales, returnAmount, netSales, now, now]
        );
        
        // Create daily entry items for each product sold
        const productsUsed = Math.floor(Math.random() * 3) + 1; // 1-3 products per day
        for (let i = 0; i < productsUsed; i++) {
          const itemId = uuidv4();
          const productId = productIds[Math.floor(Math.random() * productIds.length)];
          
          const quantitySold = Math.floor(Math.random() * 50) + 10;
          const quantityReturned = Math.floor(quantitySold * 0.02); // 2% return
          const netQuantity = quantitySold - quantityReturned;
          
          // Get product price
          const productResult = await db.select<any[]>(
            'SELECT cost_price, sell_price FROM products WHERE id = ?',
            [productId]
          );
          
          if (productResult.length === 0) continue;
          
          const product = productResult[0];
          const totalCost = netQuantity * product.cost_price;
          const totalRevenue = quantitySold * product.sell_price;
          
          await db.execute(
            `INSERT INTO daily_entry_items (
              id, daily_entry_id, product_id, quantity_sold, quantity_returned, 
              net_quantity, cost_price_override, sell_price_override, total_cost, 
              total_revenue, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemId, entryId, productId, quantitySold, quantityReturned, netQuantity,
              product.cost_price, product.sell_price, totalCost, totalRevenue, now, now
            ]
          );
        }
      }
    }
  }
};

/**
 * Update monthly targets with actual achieved amounts from orders
 */
const updateMonthlyTargetsWithAchievements = async (orderBookerIds: string[]): Promise<void> => {
  const db = getDatabase();
  
  for (const orderBookerId of orderBookerIds) {
    // Get all monthly targets for this order booker
    const targets = await db.select<any[]>(
      'SELECT id, year, month, target_amount FROM monthly_targets WHERE order_booker_id = ?',
      [orderBookerId]
    );
    
    for (const target of targets) {
      // Calculate achieved amount from orders in that month
      const startDate = `${target.year}-${String(target.month).padStart(2, '0')}-01`;
      const endDate = new Date(target.year, target.month, 0).toISOString().split('T')[0];
      
      const achievedResult = await db.select<any[]>(
        `SELECT COALESCE(SUM(total_amount), 0) as achieved 
         FROM orders 
         WHERE order_booker_id = ? AND order_date >= ? AND order_date <= ?`,
        [orderBookerId, startDate, endDate]
      );
      
      const achievedAmount = achievedResult[0]?.achieved || 0;
      const remainingAmount = target.target_amount - achievedAmount;
      const achievementPercentage = target.target_amount > 0 ? (achievedAmount / target.target_amount) * 100 : 0;
      
      await db.execute(
        `UPDATE monthly_targets 
         SET achieved_amount = ?, remaining_amount = ?, achievement_percentage = ?, updated_at = ?
         WHERE id = ?`,
        [achievedAmount, remainingAmount, achievementPercentage, new Date().toISOString(), target.id]
      );
    }
  }
};

/**
 * Show a summary of seeded data
 */
const showDataSummary = async (): Promise<void> => {
  const db = getDatabase();
  
  console.log('\n📊 Data Summary:');
  
  const counts = await Promise.all([
    db.select<any[]>('SELECT COUNT(*) as count FROM companies'),
    db.select<any[]>('SELECT COUNT(*) as count FROM products'),
    db.select<any[]>('SELECT COUNT(*) as count FROM order_bookers'),
    db.select<any[]>('SELECT COUNT(*) as count FROM monthly_targets'),
    db.select<any[]>('SELECT COUNT(*) as count FROM orders'),
    db.select<any[]>('SELECT COUNT(*) as count FROM order_items'),
    db.select<any[]>('SELECT COUNT(*) as count FROM daily_entries'),
    db.select<any[]>('SELECT COUNT(*) as count FROM daily_entry_items'),
  ]);
  
  console.log(`• Companies: ${counts[0][0].count}`);
  console.log(`• Products: ${counts[1][0].count}`);
  console.log(`• Order Bookers: ${counts[2][0].count}`);
  console.log(`• Monthly Targets: ${counts[3][0].count}`);
  console.log(`• Orders: ${counts[4][0].count}`);
  console.log(`• Order Items: ${counts[5][0].count}`);
  console.log(`• Daily Entries: ${counts[6][0].count}`);
  console.log(`• Daily Entry Items: ${counts[7][0].count}`);
  
  // Show some business insights
  const totalSales = await db.select<any[]>('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders');
  const avgAchievement = await db.select<any[]>('SELECT COALESCE(AVG(achievement_percentage), 0) as avg FROM monthly_targets');
  
  console.log(`\n💰 Business Insights:`);
  console.log(`• Total Sales: Rs. ${Number(totalSales[0].total).toLocaleString()}`);
  console.log(`• Average Target Achievement: ${Number(avgAchievement[0].avg).toFixed(1)}%`);
  
  console.log('\n🎯 Ready for demonstration!');
};

/**
 * Quick seed with minimal data for testing
 */
export const seedMinimalData = async (): Promise<void> => {
  await seedDemoData({
    clearExisting: true,
    generateOrders: true,
    generateDailySales: false,
    monthsToGenerate: 2,
  });
};

/**
 * Comprehensive seed with rich data for full demo
 */
export const seedComprehensiveData = async (): Promise<void> => {
  await seedDemoData({
    clearExisting: true,
    generateOrders: true,
    generateDailySales: true,
    monthsToGenerate: 12,
  });
};
