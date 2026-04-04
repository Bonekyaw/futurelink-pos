
Restaurant POS System (Tea Shop / Restaurant)

To develop a dual-interface Point of Sale (POS) system that streamlines operations from order taking to payment confirmation, ensuring seamless communication between waitstaff, the kitchen, and the admin.

System Architecture & Users

1. Admin Dashboard (Web - Next.js)
Location: Counter Computer
Role: Manage orders, confirm payments, oversee all tables, and monitor kitchen performance.

2. Waiter App (Mobile - React Native Expo)
Location: Tablet Handheld by Staff
Role: Take orders, manage table statuses, confirm deliveries, and process payments.

3. Kitchen Printer (IoT Integration)
Output: Bluetooth Thermal Printer for instant order tickets.

Order Management Workflow

A. Placing an Order
Create/Modify: Waiter opens app, selects table or "Parcel" mode.
Submission: Waiter submits food items.
Kitchen Ticket: Bluetooth printer in kitchen prints receipt (Waiter Name, Table No, Order No, Food List).
Dashboard Sync: Admin dashboard displays the new order with quantity, total amount, and table number.

B. Order Rules
Single Active Order: Only one active order per table. Until the current order is paid/completed, you can only add items; you cannot create a new order for that table.
Modifications: Waiters can request changes (admin/system checks viability).

Delivery & Status Tracking

Real-Time Monitoring
Kitchen Display: Admin dashboard and Waiter App show a split view of Pending Orders vs. Completed Orders.
Delivery Management: Waiters mark items as "Delivered" once food is placed on the table.
Time Alerts: If a pending order exceeds the estimated preparation time, a Warning Message appears on both the Admin Dashboard and the Waiter App.

Payment & Closing Process

1. Initiate Payment:
Waiter views the bill via the tablet (filtered by table number).
Waiter clicks "Confirm Payment" on the App.

2. Authorization:
Approval Required: The payment is not finalized until the Admin confirms the transaction on the Counter Dashboard.

3. Table Reset:
Once the Admin confirms payment, the order is marked "Completed."
The table is unlocked, allowing waiters to place a new order for new customers.

Accountability & Audit Trail

To manage multiple waiters efficiently, the system tracks all actions:
Order Acceptance: Records which waiter took the order.
Re-orders/Changes: Records which waiter modified the order.
Delivery: Records which waiter confirmed the food was served.
Permissions: All waiter accounts have equal rights to manage orders, but every action is logged with the specific waiter’s name.

Print Example: Kitchen receipts display the specific waiter's name for accountability.

Technical Implementation

Frontend & Backend: Next.js (FullStack)
Admin Dashboard: Server-side rendered React interface for the counter computer.
API Layer: Built-in API routes to handle business logic (order validation, payment authorization) and serve data to the mobile app.
Mobile Client: React Native Expo
Waiter App: Cross-platform tablet application.
Features: Real-time data sync with the Next.js backend to update order statuses instantly.
Hardware Integration:
Bluetooth Printing: Utilize Expo’s Bluetooth libraries to connect to thermal printers in the kitchen.
Database:
Plan: (Suggest PostgreSQL via Next.js) to store Orders, Users (Waiters), Tables, and Audit Logs.