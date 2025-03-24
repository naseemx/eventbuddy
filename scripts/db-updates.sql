-- SQL Script to update database structure for rental workflow management

-- 1. Add customer_id column to the orders table if not exists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- 2. Add payment_status column to the orders table if not exists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Unpaid' CHECK (payment_status IN ('Paid', 'Unpaid'));

-- 3. Add rental fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS rented_to_customer_id UUID REFERENCES customers(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS rental_start_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rental_end_date DATE;

-- 4. Add order_id to transactions table for linking payments to orders
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id);

-- 5. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);

-- 6. Add rental status to products table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
        CREATE TYPE product_status AS ENUM ('Available', 'Rented', 'Maintenance', 'Sold');
    ELSE
        -- Check if 'Rented' value exists in the enum
        BEGIN
            ALTER TYPE product_status ADD VALUE 'Rented' AFTER 'Available';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
    END IF;
END$$;

-- 7. Update product status column to use the enum if necessary
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'status' AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE products ALTER COLUMN status TYPE product_status USING status::product_status;
    END IF;
END$$;

-- 8. Create a trigger to update product status when a rental order is created
CREATE OR REPLACE FUNCTION update_product_status_on_rental()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product status when a new order is created
    UPDATE products
    SET 
        status = 'Rented',
        rented_to_customer_id = NEW.customer_id,
        rental_start_date = NEW.rental_start_date,
        rental_end_date = NEW.rental_end_date
    FROM order_items
    WHERE products.id = order_items.product_id
    AND order_items.order_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS update_product_status_on_rental_trigger ON orders;
CREATE TRIGGER update_product_status_on_rental_trigger
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION update_product_status_on_rental();

-- 9. Create a trigger to create transaction records for paid orders
CREATE OR REPLACE FUNCTION create_transaction_for_paid_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create transaction for paid orders
    IF NEW.payment_status = 'Paid' THEN
        INSERT INTO transactions (
            order_id,
            amount,
            type,
            date,
            description
        ) VALUES (
            NEW.id,
            NEW.total_amount,
            'income',
            CURRENT_DATE,
            'Payment for Order #' || NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS create_transaction_for_paid_order_trigger ON orders;
CREATE TRIGGER create_transaction_for_paid_order_trigger
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION create_transaction_for_paid_order();

-- 10. Update existing orders without customer_id (if needed)
-- This is a safe operation as it only updates NULL values
UPDATE orders SET customer_id = (
  SELECT customers.id FROM customers 
  WHERE customers.name = orders.customer_name AND customers.email = orders.customer_email
)
WHERE orders.customer_id IS NULL AND orders.customer_name IS NOT NULL;

-- Script completion message
DO $$
BEGIN
  RAISE NOTICE 'Database updates for rental workflow completed successfully.';
END $$; 