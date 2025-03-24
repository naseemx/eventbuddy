# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# TempHelo Rental Management System

## Recent Updates: Rental Workflow Improvements

The rental process has been enhanced with the following new features:

### Product Rental Process
- Users can select a product and click "Rent Now" to initiate the rental process
- In the order creation screen, users can:
  - Select a customer or add a new one
  - Add multiple items to the rental order
  - Toggle between using the same rental period for all items or specifying different periods per item
  - See automatic price calculations based on rental price × number of days
  - Mark payment as "Paid" or "Unpaid" at the time of order creation

### Order Creation
- Orders now include customer_id for better tracking and reporting
- Invoices are automatically generated with the same payment status as the order
- When payment is marked as "Paid", a transaction record is created
- Product status is updated to "Rented" with customer details and expected return date

### Enhanced Visibility
- Rental history appears in the product view screen with payment status
- Dashboard's Active Rentals widget shows real-time rental information
- Transactions page displays rental payment records
- Product status is visually indicated throughout the application

### Database Updates
To support these features, the database has been updated with:
- customer_id field in the orders table
- payment_status field in orders and invoices
- Enhanced product status tracking with customer relationship fields
- Transaction references to orders and invoices

## Technical Implementation
The implementation required updates to:
- Order creation workflow in orders/add.tsx
- Order and invoice services
- Transaction service
- Product service with status updates
- Dashboard's ActiveRentals component
- Product view with enhanced rental history

## Running Database Updates
To apply the database schema changes, run the SQL script in `scripts/db-updates.sql` against your Supabase database.

## Next Steps
Planned enhancements include:
- Customer rental history view
- Advanced filtering of rental records
- Automated notifications for upcoming returns
- Digital payment integration
