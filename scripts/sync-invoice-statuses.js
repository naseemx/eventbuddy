// Script to sync invoice statuses with their corresponding orders
const { syncInvoicesWithOrders } = require('../services/orderService');

// Self-executing async function
(async () => {
  console.log('Starting invoice status sync process...');
  
  try {
    const success = await syncInvoicesWithOrders();
    
    if (success) {
      console.log('✅ Invoice status synchronization completed successfully.');
    } else {
      console.error('❌ Invoice status synchronization failed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error during invoice status synchronization:', error);
    process.exit(1);
  }
  
  process.exit(0);
})(); 