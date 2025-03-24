-- Rental Workflow Database Updates - FIXED VERSION

-- Add customer_id to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- Add payment_status to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Unpaid' CHECK (payment_status IN ('Paid', 'Unpaid'));

-- Add rental fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS rented_to_customer_id UUID REFERENCES customers(id);
ALTER TABLE products
ADD COLUMN IF NOT EXISTS rental_start_date DATE;
ALTER TABLE products
ADD COLUMN IF NOT EXISTS rental_end_date DATE;

-- Add order_id to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);

-- Create the enum type if it doesn't exist
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

-- Fix for the status column conversion
-- This approach preserves existing status values while safely converting to the enum type

-- 1. Add a temporary status column that uses the enum type
ALTER TABLE products 
ADD COLUMN temp_status product_status;

-- 2. Update the temp_status column with mapped values from the existing status
UPDATE products 
SET temp_status = CASE 
    WHEN status = 'Available' OR status IS NULL THEN 'Available'::product_status
    WHEN status = 'Rented' THEN 'Rented'::product_status
    WHEN status = 'Maintenance' THEN 'Maintenance'::product_status
    WHEN status = 'Sold' THEN 'Sold'::product_status
    ELSE 'Available'::product_status -- Default for unrecognized values
END;

-- 3. Drop the original status column and rename the temp column
ALTER TABLE products DROP COLUMN status;
ALTER TABLE products RENAME COLUMN temp_status TO status;

-- Create a trigger to update product status when a rental order is created
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

-- Create a trigger to create transaction records for paid orders
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

-- Script completion message
DO $$
BEGIN
  RAISE NOTICE 'Database updates for rental workflow completed successfully.';
END $$; 