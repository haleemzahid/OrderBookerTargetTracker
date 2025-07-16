# Order Booker Target Tracker Issues

This document outlines critical issues in the Order Booker Target Tracker application that need to be addressed.

## UI Issues

### 1. Order Form: Save and Create Button Still Close Popup

**Issue Description:**
When clicking "Save & Add Another" in the order item dialog, the popup incorrectly closes despite the intention to continue adding items.

**File Location:**
`src/features/orders/components/order-item-dialog.tsx`

**Root Cause:**
In the `handleSave` function, there's a logic issue where the dialog is closed unconditionally after saving an item, even when `addAnother` is `true`.

**Fix Required:**
Modify the `handleSave` function to only close the dialog when `addAnother` is `false` or when editing an existing item.

```tsx
const handleSave = async (addAnother = false) => {
    try {
        // Existing validation logic
        // ...

        // Save the item
        onSave(orderItem);

        if (addAnother && !editingItem) {
            // Reset form for next item but don't close the modal
            message.success('Item added! Add another item.');
            // Don't call onClose() here
        } else {
            onClose();
            message.success(editingItem ? 'Item updated successfully' : 'Item added successfully');
        }
    } catch (error) {
        console.error('Validation failed:', error);
    }
};
```

### 2. Order Filters Not Preserved when Moving Back to Order List

**Issue Description:**
When navigating from the order list to create an order and then returning to the list, the previously applied filters are lost.

**File Location:**
`src/features/orders/pages/orders-list.tsx` and `src/features/orders/pages/order-form-page.tsx`

**Root Cause:**
Filter state is not being preserved between navigations.

**Fix Required:**
Implement state persistence for filters using URL search parameters or React Context to maintain filter state across navigation events.

### 3. Dashboard: Recent Stock Movement Not Showing Product Name

**Issue Description:**
In the dashboard's recent stock movement section, product names are not displayed correctly.

**File Location:**
`src/features/simple-dashboard/components/recent-stock-transactions-section.tsx`

**Root Cause:**
Based on the code analysis, the component is trying to use `transaction.productName` but it might not be available or populated correctly. In the stock-transactions-table.tsx, a `getProductName` function is used to resolve product names from IDs.

**Fix Required:**
Ensure that product names are properly included in the stock transaction data. If they aren't available directly, implement a similar approach to the stock-transactions-table.tsx where product names are looked up using the productId.

```tsx
// In renderItem function
<List.Item.Meta
  title={
    <Space>
      <Text strong>{getProductName(transaction.productId) || 'Unknown Product'}</Text>
      <Tag color={getTransactionTypeColor(transaction.transactionType)}>
        {getTransactionIcon(transaction.transactionType)}{transaction.quantity}
      </Tag>
    </Space>
  }
  // rest of the component
/>
```

### 4. Record Payment Form: Shown INR Instead of PKR

**Issue Description:**
The payment form displays "INR" (Indian Rupees) instead of "PKR" (Pakistani Rupees) for currency formatting.

**File Locations:**
Multiple files including:
- `src/features/customers/utils/formatters.ts`
- `src/shared/utils/currency.ts`

**Root Cause:**
Incorrect currency code is being used in the formatting functions.

**Fix Required:**
Update all currency formatting functions to use "PKR" instead of "INR". Check the formatCurrency and formatRupees functions:

```tsx
// In formatters.ts or currency.ts
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};
```

Verify that all custom display of currency values use "Rs." or "PKR" consistently.

### 5. Customer: Can't Click on 3 Dot Button as it Navigates to Details Page

**Issue Description:**
When trying to click on the 3-dot button (action menu) in the customer list, it incorrectly navigates to the customer details page instead of showing the dropdown menu.

**File Location:**
`src/features/customers/components/customer-list.tsx`

**Root Cause:**
Event propagation issue where the click event on the 3-dot button is also triggering the row click handler that navigates to the customer details page.

**Fix Required:**
Modify the action menu button to stop event propagation when clicked:

```tsx
// Inside customer-list.tsx, modify the more actions button:
<Dropdown menu={getActionMenu(record)} trigger={['click']}>
  <Button 
    type="text" 
    icon={<MoreOutlined />} 
    onClick={(e) => e.stopPropagation()} // Add this to prevent event propagation
  />
</Dropdown>
```

## Functional Issues

### 6. Customer: Edit Will Create New Customer

**Issue Description:**
When editing an existing customer, the form submits a new customer creation request instead of updating the existing one.

**File Location:**
`src/features/customers/components/customer-form.tsx`

**Root Cause:**
The `isEditing` flag in the customer form might not be correctly set when opening the form in edit mode. The code is checking for `mode === 'edit'`, but the mode prop might not be correctly passed to the component when editing.

**Fix Required:**
Ensure the mode prop is correctly passed to the CustomerForm component when editing an existing customer:

```tsx
// In customer-detail-page.tsx
<CustomerForm
  customer={customer as Customer}
  mode="edit" // Explicitly set mode to edit
  onSuccess={handleEditSuccess}
  onCancel={() => setShowEditForm(false)}
/>

// In customer-list-page.tsx
<CustomerForm
  customer={editingCustomer || undefined}
  mode={editingCustomer ? 'edit' : 'create'} // Set mode based on editingCustomer
  onSuccess={handleCustomerFormSuccess}
  onCancel={() => {
    setShowCustomerForm(false);
    setEditingCustomer(null);
  }}
/>
```

Also verify the handleSubmit function in customer-form.tsx to ensure it's correctly checking for edit mode:

```tsx
const handleSubmit = async (values: any) => {
  try {
    const customerData: CreateCustomerRequest | UpdateCustomerRequest = {
      ...values,
      whatsappNumber: hasWhatsApp ? values.whatsappNumber : undefined
    };

    let result: Customer;
    if ((isEditing || mode === 'edit') && customer) {
      result = await updateCustomerMutation.mutateAsync({
        id: customer.id,
        data: customerData as UpdateCustomerRequest
      });
      message.success('Customer updated successfully');
    } else {
      result = await createCustomerMutation.mutateAsync(customerData as CreateCustomerRequest);
      message.success('Customer created successfully');
    }

    if (onSuccess) {
      onSuccess(result);
    }
  } catch (error) {
    console.error('Customer form error:', error);
    message.error(isEditing ? 'Failed to update customer' : 'Failed to create customer');
  }
};
```

### 7. Customer: Transaction and Credit Utilization Not Updated After Order Creation

**Issue Description:**
When a customer places an order, their transaction history, credit utilization, and order listing are not being updated.

**File Location:**
Multiple files including:
- `src/features/orders/api/service.ts`
- `src/features/customers/api/service.ts`

**Root Cause:**
The connection between order creation and customer credit updates might be missing or not functioning correctly. After an order is created, the customer's credit transactions and balances need to be updated.

**Fix Required:**
Implement or fix the integration between order creation and customer credit updates:

1. After creating an order, trigger an update to the customer's credit balance
2. Create a credit transaction record for the order amount
3. Ensure proper invalidation of related queries to refresh customer data:

```tsx
// In order creation mutation success handler
onSuccess: (newOrder) => {
  queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists() });
  
  // Also invalidate customer queries to refresh credit status
  if (newOrder.customerId) {
    queryClient.invalidateQueries({ 
      queryKey: customerQueryKeys.detail(newOrder.customerId) 
    });
    queryClient.invalidateQueries({ 
      queryKey: customerQueryKeys.transactions(newOrder.customerId) 
    });
    queryClient.invalidateQueries({ 
      queryKey: customerQueryKeys.creditStatus(newOrder.customerId) 
    });
  }
}
```

## Next Steps

1. Prioritize these issues based on user impact
2. Create a development branch for each issue
3. Implement fixes following the React best practices and Design System guidelines
4. Add appropriate tests for each fix
5. Test thoroughly in development environment before merging to main branch

## Additional Notes

- Follow the design system guidelines for consistent UI elements
- Ensure proper error handling and user feedback for all operations
- Maintain type safety with proper TypeScript interfaces
- Follow Pakistan-specific business context requirements, especially for currency formatting and CNIC validation
