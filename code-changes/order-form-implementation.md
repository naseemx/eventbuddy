# Order Form Implementation Guide

This document outlines the specific code changes needed in `app/orders/add.tsx` to implement the enhanced rental workflow.

## Required Changes

### 1. Update OrderData Interface

Add the following fields to the OrderData interface:

```typescript
interface OrderData {
  // Existing fields
  id?: string;
  order_date: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  rental_start_date: string;
  rental_end_date: string;
  notes: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    // New fields for per-item rental periods
    rental_start_date?: string;
    rental_end_date?: string;
  }>;
  total_amount: number;
  
  // New fields
  customer_id: string | null;
  payment_status: 'Paid' | 'Unpaid';
}
```

### 2. Update Initial State

Modify the initial state to include the new fields:

```typescript
const [orderData, setOrderData] = useState<OrderData>({
  order_date: format(new Date(), 'yyyy-MM-dd'),
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  rental_start_date: format(new Date(), 'yyyy-MM-dd'),
  rental_end_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
  notes: '',
  items: [],
  total_amount: 0,
  
  // New fields with default values
  customer_id: null,
  payment_status: 'Unpaid',
});
```

### 3. Add Per-Item Rental Toggle

Add a state for tracking the rental period mode:

```typescript
// After existing state declarations
const [perItemRentalPeriods, setPerItemRentalPeriods] = useState(false);
```

Add the toggle component after the date picker section:

```tsx
{/* Rental period section */}
<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
  {/* ... existing date picker code ... */}
</div>

{/* Add this toggle component */}
<div className="mb-4 mt-2">
  <div className="flex items-center">
    <Switch
      checked={perItemRentalPeriods}
      onChange={setPerItemRentalPeriods}
      className={`${
        perItemRentalPeriods ? 'bg-indigo-600' : 'bg-gray-200'
      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
    >
      <span
        className={`${
          perItemRentalPeriods ? 'translate-x-6' : 'translate-x-1'
        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
      />
    </Switch>
    <span className="ml-2 text-sm font-medium text-gray-700">
      Set rental periods per item
    </span>
  </div>
</div>
```

### 4. Add Payment Status Selector

Add this component after the notes section:

```tsx
{/* Notes section */}
<div className="mb-4">
  {/* ... existing notes code ... */}
</div>

{/* Add this payment status selector */}
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700">
    Payment Status
  </label>
  <select
    value={orderData.payment_status}
    onChange={(e) => setOrderData({
      ...orderData,
      payment_status: e.target.value as 'Paid' | 'Unpaid'
    })}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
  >
    <option value="Unpaid">Unpaid</option>
    <option value="Paid">Paid</option>
  </select>
</div>
```

### 5. Modify Item Display for Per-Item Dates

Update the item rendering section to include per-item date pickers when the toggle is enabled:

```tsx
{orderData.items.map((item, index) => (
  <div key={index} className="mb-4 rounded border p-4">
    {/* ... existing item display code ... */}
    
    {/* Add this conditional render for per-item date pickers */}
    {perItemRentalPeriods && (
      <div className="mt-2 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Rental Start
          </label>
          <DatePicker
            selected={item.rental_start_date ? new Date(item.rental_start_date) : null}
            onChange={(date) => {
              const newItems = [...orderData.items];
              newItems[index] = {
                ...newItems[index],
                rental_start_date: date ? format(date, 'yyyy-MM-dd') : undefined,
              };
              setOrderData({ ...orderData, items: newItems });
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Rental End
          </label>
          <DatePicker
            selected={item.rental_end_date ? new Date(item.rental_end_date) : null}
            onChange={(date) => {
              const newItems = [...orderData.items];
              newItems[index] = {
                ...newItems[index],
                rental_end_date: date ? format(date, 'yyyy-MM-dd') : undefined,
              };
              setOrderData({ ...orderData, items: newItems });
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
    )}
  </div>
))}
```

### 6. Update Customer Selection

When you select a customer, update the code to store the customer ID:

```typescript
// For example, in your handleCustomerSelect function:
const handleCustomerSelect = (customer: Customer) => {
  setOrderData({
    ...orderData,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    // Add this line to capture the customer ID
    customer_id: customer.id,
  });
  // Close modal or other logic
};
```

### 7. Update createOrder Function

Modify the createOrder function to handle per-item rental periods and payment status:

```typescript
const createOrder = async () => {
  try {
    setIsLoading(true);
    
    // Prepare order data with correct rental periods
    const orderItems = orderData.items.map(item => ({
      ...item,
      // Use per-item dates if enabled, otherwise use the shared dates
      rental_start_date: perItemRentalPeriods 
        ? item.rental_start_date 
        : orderData.rental_start_date,
      rental_end_date: perItemRentalPeriods 
        ? item.rental_end_date 
        : orderData.rental_end_date,
    }));
    
    const finalOrderData = {
      ...orderData,
      items: orderItems,
      // Include customer_id and payment_status
      customer_id: orderData.customer_id,
      payment_status: orderData.payment_status,
    };
    
    // Create order with updated data
    const { data, error } = await orderService.createOrder(finalOrderData);
    
    if (error) {
      throw error;
    }
    
    // Success handling
    toast.success('Order created successfully!');
    router.push('/orders');
  } catch (error) {
    console.error('Error creating order:', error);
    toast.error('Failed to create order. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

## Dependencies

Make sure you have the necessary imports:

```typescript
// For the toggle component
import { Switch } from '@headlessui/react';
```

If you don't have @headlessui installed, you can implement a simpler toggle using a checkbox or install it with:

```
npm install @headlessui/react
```

## Implementation Order

1. Update the OrderData interface first
2. Add the state variables and modify the initial state
3. Add the per-item rental toggle component
4. Add the payment status selector
5. Modify the item rendering section for per-item dates
6. Update the customer selection logic
7. Update the createOrder function

Following this order will minimize the chance of encountering errors during implementation. 