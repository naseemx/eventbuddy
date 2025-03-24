# Rental Workflow Migration Plan

This document provides a step-by-step guide for implementing the rental workflow changes in the TempHelo application.

## 1. Database Changes

Execute the following SQL script against your Supabase database:

```sql
-- Add customer_id to orders table
ALTER TABLE orders
ADD COLUMN customer_id UUID REFERENCES customers(id);

-- Add payment_status to orders table
ALTER TABLE orders
ADD COLUMN payment_status TEXT DEFAULT 'Unpaid' CHECK (payment_status IN ('Paid', 'Unpaid'));

-- Add rental fields to products table
ALTER TABLE products
ADD COLUMN rented_to_customer_id UUID REFERENCES customers(id),
ADD COLUMN rental_start_date DATE,
ADD COLUMN rental_end_date DATE;

-- Add order_id to transactions table
ALTER TABLE transactions
ADD COLUMN order_id UUID REFERENCES orders(id);

-- Create indexes for faster queries
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_transactions_order_id ON transactions(order_id);
```

## 2. Code Changes

### Update Order Form (app/orders/add.tsx)

1. Add customer_id and payment_status to OrderData interface
2. Update initial state to include these fields
3. Add per-item rental toggle after date picker section
4. Add payment status selector after notes section
5. Modify createOrder function to handle the new fields

### Update OrderService (app/services/orderService.ts)

1. Modify createOrder function to:
   - Include customer_id and payment_status in the order insert
   - Create transaction record if payment_status is 'Paid'
   - Update product status to 'Rented' with customer information

### Update Product View (app/products/view.tsx)

1. Add rental history section to product view page
2. Fetch rental history with payment status information
3. Display rental history in a table format

### Update Customer View (app/customers/view.tsx)

1. Add rental history section to customer view page
2. Fetch all rentals associated with the customer
3. Display rental history in a table format

### Update Dashboard (app/dashboard/components/ActiveRentals.tsx)

1. Modify active rentals component to include payment status
2. Update the query to fetch both paid and unpaid rentals
3. Add visual indicators for payment status

### Update Finances (app/finances/index.tsx)

1. Modify transaction listing to include order reference
2. Add link to the associated order for each transaction

## 3. Implementation Steps

1. Run the database migration script
2. Update the OrderData interface and form elements in add.tsx
3. Implement the per-item rental period toggle functionality
4. Add the payment status selector
5. Update the createOrder function in orderService.ts
6. Implement rental history display in product and customer views
7. Update the dashboard to show active rentals with payment status
8. Update the finances section to link transactions to orders

## 4. Testing Plan

1. Create a new order with a customer and multiple items
2. Test both shared and per-item rental periods
3. Test both payment statuses (Paid and Unpaid)
4. Verify that:
   - Order is created with correct customer_id and payment_status
   - Products are marked as "Rented" with customer information
   - Transaction record is created for paid orders
   - Rental history appears in product and customer views
   - Dashboard shows active rentals with correct payment status
   - Finances section shows transactions linked to orders

## 5. Rollback Plan

In case of issues, prepare the following rollback SQL:

```sql
-- Remove indexes
DROP INDEX IF EXISTS idx_transactions_order_id;
DROP INDEX IF EXISTS idx_products_status;
DROP INDEX IF EXISTS idx_orders_customer_id;

-- Remove columns
ALTER TABLE transactions DROP COLUMN IF EXISTS order_id;
ALTER TABLE products DROP COLUMN IF EXISTS rental_end_date;
ALTER TABLE products DROP COLUMN IF EXISTS rental_start_date;
ALTER TABLE products DROP COLUMN IF EXISTS rented_to_customer_id;
ALTER TABLE orders DROP COLUMN IF EXISTS payment_status;
ALTER TABLE orders DROP COLUMN IF EXISTS customer_id;
```

## 6. Post-Migration Verification

After implementing all changes, verify:

1. All orders have a customer_id (run a data migration if needed)
2. All orders have a payment_status (default is 'Unpaid')
3. Product status correctly reflects rental status
4. All rental-related UI elements display correctly
5. The application functions as expected with no errors

## 7. Performance Considerations

- The added indexes should improve query performance
- Monitor query performance after implementation
- Consider adding additional indexes if needed
- Consider implementing pagination for rental history if the lists become long 