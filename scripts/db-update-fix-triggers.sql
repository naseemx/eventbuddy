-- Script to fix the transaction trigger for paid orders

-- Drop the old trigger
DROP TRIGGER IF EXISTS create_transaction_for_paid_order_trigger ON orders;

-- Drop the old function
DROP FUNCTION IF EXISTS create_transaction_for_paid_order();

-- Create the updated function
CREATE OR REPLACE FUNCTION create_transaction_for_paid_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create transaction for paid orders
    IF NEW.payment_status = 'Paid' THEN
        INSERT INTO transactions (
            type,
            description,
            amount,
            transaction_date,
            category,
            reference_id,
            reference_type,
            payment_method
        ) VALUES (
            'income',
            'Payment for Order #' || NEW.id,
            NEW.total_amount,
            CURRENT_DATE,
            CASE WHEN NEW.order_type = 'rental' THEN 'rental_income' ELSE 'sales_income' END,
            NEW.id,
            'order',
            'cash' -- Default payment method
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the updated trigger
CREATE TRIGGER create_transaction_for_paid_order_trigger
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION create_transaction_for_paid_order();

-- Script completion message
DO $$
BEGIN
  RAISE NOTICE 'Transaction trigger update completed successfully.';
END $$; 