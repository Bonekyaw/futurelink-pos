I'll generate a comprehensive step-by-step development roadmap for your Restaurant POS system, organized by technical phases from database to deployment.

---

## 📋 Phase 1: Foundation & Database

### **Prompt 1.1 — Database Schema Design (Prisma)**

```
Design a SQLite schema using Prisma for the Restaurant POS with these entities:

1. **User** (Waiters/Admins): id, name, pin (4-digit), role (ADMIN/WAITER), isActive, createdAt
2. **Table**: id, number, capacity, status (AVAILABLE/OCCUPIED/CLEANING), currentOrderId (nullable)
3. **Order**: id, tableId (nullable for parcel), waiterId, status (PENDING/COOKING/READY/COMPLETED), type (DINE_IN/PARCEL), totalAmount, createdAt, completedAt, paymentStatus (PENDING/CONFIRMED)
4. **OrderItem**: id, orderId, menuItemId, quantity, price, status (PENDING/COOKING/READY/DELIVERED), notes, createdAt, deliveredAt, deliveredBy (waiterId)
5. **MenuItem**: id, name, price, category, preparationTime (minutes), isAvailable
6. **AuditLog**: id, userId, action (CREATE_ORDER/MODIFY_ORDER/DELIVER_ITEM/PAYMENT_INIT/PAYMENT_CONFIRM), orderId, details (JSON), timestamp
7. **Payment**: id, orderId, amount, method (CASH/CARD/UPI), status (PENDING/CONFIRMED), initiatedBy, confirmedBy, createdAt

Rules:
- One active order per table (unique constraint on tableId where status != COMPLETED)
- Cascade delete handling for order items
- Indexes on tableId, orderId, userId for audit queries
- JSON field in AuditLog to track specific changes (old vs new values)

Generate the schema.prisma file with proper relations and constraints.
```

### **Prompt 1.2 — Real-time Infrastructure Setup**

```
Set up real-time synchronization between Admin Dashboard and Waiter App:

1. Choose between Socket.io (self-hosted) or Pusher/Ably (managed) for production reliability
2. Create a Room-based architecture:
   - Room: `restaurant:{restaurantId}` for global updates
   - Room: `table:{tableId}` for specific table updates
   - Room: `kitchen` for order notifications
3. Implement event types:
   - ORDER_CREATED, ORDER_UPDATED, ITEM_DELIVERED, ORDER_READY, PAYMENT_REQUESTED, PAYMENT_CONFIRMED
4. Next.js API route handler for socket connections (if using Socket.io) or webhook handlers for Pusher
5. Authentication middleware for socket connections (validate JWT token)
6. Create a shared types file for socket events (TypeScript strict)

Deliver: socket.ts config, event types, and connection handler with auth.
```

---

## 📋 Phase 2: Backend API (Next.js)

### **Prompt 2.1 — Authentication System**

```
Build the authentication layer:

1. **PIN-based Login** (optimized for waiters):
   - API: POST /api/auth/login with 4-digit PIN
   - JWT token generation (short expiry: 8 hours)
   - Middleware to protect routes and validate roles

2. **Session Management**:
   - HTTP-only cookies for web (Admin)
   - Bearer tokens for mobile (Waiter app)
   - Role-based access control (RBAC) middleware

3. **User Management** (Admin only):
   - CRUD endpoints for waiters
   - PIN reset functionality
   - Toggle active/inactive users

Implement using NextAuth.js or custom JWT implementation with iron-session.
```

### **Prompt 2.2 — Order Management API**

```
Create the core order business logic with strict validation:

**POST /api/orders**
- Validation: Check if table has active order (if yes, reject new order)
- Create order with status PENDING
- Create OrderItems linked to menu items
- Audit log: "CREATE_ORDER" with waiter ID
- Emit socket event: ORDER_CREATED to kitchen and admin
- Return: Order with calculated totals

**PATCH /api/orders/:id/items**
- Validation: Only allow if order status is PENDING or COOKING
- Add new items or update quantities (cannot delete, only add)
- Audit log: "MODIFY_ORDER" with changes diff
- Emit socket event: ORDER_UPDATED
- Recalculate totals

**GET /api/orders/active**
- Query parameters: tableId, waiterId, status
- Returns: Orders with items, filtered by status (exclude COMPLETED)
- Include: Preparation time alerts (if item in PENDING > estimated time)

**GET /api/orders/:id/bill**
- Calculate subtotal, tax, total
- Return printable bill structure

Use tRPC or standard REST with Zod validation. Ensure all endpoints verify user permissions.
```

### **Prompt 2.3 — Kitchen Display & Delivery System**

```
Build the kitchen coordination endpoints:

**GET /api/kitchen/orders**
- Split view data: Pending (PENDING/COOKING) vs Completed (READY/DELIVERED)
- Sort: Oldest first (FIFO priority)
- Include: Time elapsed since order creation, item preparation times
- Alert logic: If current time > createdAt + preparationTime, flag as DELAYED

**POST /api/kitchen/orders/:id/status**
- Update order or specific item status (COOKING → READY)
- Restricted to ADMIN role (kitchen staff uses admin dashboard)
- Emit socket event: ORDER_READY

**POST /api/orders/:orderId/items/:itemId/deliver**
- Waiter marks specific item as DELIVERED
- Update deliveredBy field with current user ID
- Audit log: "DELIVER_ITEM"
- If all items delivered, auto-update order status to READY_FOR_PAYMENT
- Emit socket event: ITEM_DELIVERED to specific table room
```

### **Prompt 2.4 — Payment Workflow API**

```
Implement the two-step payment authorization:

**POST /api/orders/:id/payment/request**
- Waiter initiates payment (sets paymentStatus to PENDING_CONFIRMATION)
- Create Payment record with initiatedBy
- Audit log: "PAYMENT_INIT"
- Emit socket event: PAYMENT_REQUESTED to admin dashboard
- Block any further modifications to the order

**POST /api/orders/:id/payment/confirm**
- Admin confirms payment (protected route, ADMIN only)
- Update payment status to CONFIRMED
- Update order status to COMPLETED
- Update table status to AVAILABLE (clear currentOrderId)
- Audit log: "PAYMENT_CONFIRM" with confirmedBy
- Emit socket event: PAYMENT_CONFIRMED to waiter app
- Return: Receipt data

**POST /api/orders/:id/payment/cancel**
- Admin can cancel pending payment request (returns to order editing)

Validation: Ensure only ADMIN can confirm, waiters can only initiate.
```

### **Prompt 2.5 — Audit & Reporting**

```
Create comprehensive audit trails:

**GET /api/audit/logs**
- Query params: dateRange, userId, actionType, orderId
- Pagination: cursor-based or offset
- Filters: Show all actions by specific waiter, or all modifications to specific order

**GET /api/reports/daily**
- Sales summary by payment method
- Waiter performance (orders taken, items delivered)
- Kitchen performance (average prep time, delayed orders)
- Table turnover rate

**Audit Logging Middleware**:
- Intercept all order modifications
- Store before/after state in JSON
- Automatic logging for all CREATE, UPDATE, DELETE operations on orders
```

---

## 📋 Phase 3: Admin Dashboard (Next.js)

### **Prompt 3.1 — Dashboard Layout & Real-time Setup**

```
Build the Admin Dashboard UI (Counter Computer):

1. **Layout Structure**:
   - Sidebar: Orders, Kitchen Display, Tables, Reports, Settings
   - Top bar: Current time, logged-in user, notifications bell (for payment requests)
   - Main area: Dynamic content based on route

2. **Real-time Integration**:
   - Socket.io client connection on mount
   - Listen for: ORDER_CREATED, PAYMENT_REQUESTED, ORDER_DELAYED
   - Toast notifications for new orders and payment requests
   - Audio alert for new orders (optional)

3. **Overview Dashboard**:
   - Grid view of all tables (color-coded: Green=Available, Red=Occupied, Yellow=Payment Pending)
   - Quick stats: Active Orders, Pending Payments, Delayed Orders, Today's Revenue

Use shadcn/ui components, Tailwind CSS, and React Query for server state.
```

### **Prompt 3.2 — Table Management View**

```
Create the table grid interface:

1. **Table Grid Component**:
   - Masonry or CSS Grid layout
   - Each table card shows: Table number, current status, order total, elapsed time
   - Click table to view current order details

2. **Order Detail Modal**:
   - List of items with statuses (color-coded)
   - Action buttons: Print Bill, Confirm Payment, Cancel Order
   - Audit trail view (who created, who modified, timestamps)
   - Real-time updates as items are delivered

3. **Kitchen Display Split View**:
   - Left panel: Pending Orders (auto-refresh every 30s)
   - Right panel: Ready for Delivery
   - Delayed orders highlighted in red with warning icon
   - Button to mark item as cooked/ready

Implement optimistic UI updates for status changes.
```

### **Prompt 3.3 — Payment Confirmation Interface**

```
Build the payment authorization UI:

1. **Payment Requests Queue**:
   - List of pending payment confirmations
   - Shows: Table number, amount, requested by (waiter name), time requested
   - Approve/Reject buttons with confirmation modal

2. **Bill Preview**:
   - Modal showing itemized bill before confirmation
   - Payment method selection (Cash/Card/UPI)
   - Print receipt button (connected to counter printer if available)

3. **Receipt Generator**:
   - Printable A4/Thermal receipt component
   - Restaurant info, order details, tax breakdown
   - QR code for digital receipt (optional)

Use React Query mutations with loading states for payment processing.
```

---

## 📋 Phase 4: Waiter App (React Native Expo)

### **Prompt 4.1 — Expo Project Setup & Navigation**

```
Initialize the Waiter mobile application:

1. **Project Structure**:
```

src/
app/ # Expo Router
(tabs)/ # Main navigation
tables.tsx # Table selection
orders.tsx # Active orders
account.tsx # Profile/logout
order/
[id].tsx # Order detail/modification
new.tsx # Create order flow
payment/
confirm.tsx # Payment request screen

```

2. **Navigation Setup**:
- Bottom tabs: Tables, Orders, Account
- Stack navigation for order creation flow
- Deep linking support for notifications

3. **State Management**:
- Zustand for global state (current user, active orders)
- React Query for server state
- AsyncStorage for offline queue (if connection drops)

4. **Authentication**:
- PIN login screen (4-digit numeric input)
- Biometric fallback (optional)
- Auto-logout after 8 hours

Deliver: Complete navigation structure with TypeScript types.
```

### **Prompt 4.2 — Table & Order Creation Flow**

```
Build the order taking interface:

1. **Table Selection Screen**:
   - Grid of tables with status indicators
   - Visual distinction: Available (green), Occupied (red with order summary)
   - "Parcel" button for takeaway orders (no table)
   - Press available table → Start new order
   - Press occupied table → View/modify existing order

2. **Menu & Item Selection**:
   - Category tabs (Drinks, Food, Desserts)
   - Search bar for items
   - Item cards: Image, name, price, +/- quantity buttons
   - Special notes input per item (e.g., "No sugar", "Extra spicy")
   - Running total at bottom

3. **Order Review**:
   - List of selected items
   - Edit quantities or remove items (only before submission)
   - Submit to Kitchen button
   - Confirmation dialog: "Print kitchen ticket?"

4. **Order Modification**:
   - If table occupied, show current order with "Add Items" button
   - Cannot remove already submitted items, only add new ones
   - Show audit trail of who added what

Use React Native Paper or native components, ensure 60fps scrolling.
```

### **Prompt 4.3 — Kitchen Bluetooth Printing**

```
Implement thermal printing from Waiter App:

1. **Bluetooth Setup**:
   - expo-bluetooth or react-native-bluetooth-escpos-printer
   - Scan and pair with kitchen printer (store MAC address in AsyncStorage)
   - Connection status indicator in header

2. **Print Formatting**:
```

KITCHEN ORDER
Table: 5 | Order #123
Waiter: John
Time: 14:30

2x Chicken Curry
Note: Extra spicy

1x Iced Tea

---

```

3. **Print Triggers**:
- Auto-print on order submission
- Manual reprint option in order details
- Queue system: If printer offline, queue and retry

4. **Error Handling**:
- Alert if printer not connected
- Option to skip printing and rely on dashboard only
- Vibration feedback on successful print

Note: Test with actual ESC/POS commands for 58mm/80mm thermal printers.
```

### **Prompt 4.4 — Delivery & Payment Workflow**

```
Create the service completion flow:

1. **Active Orders Screen**:
   - List of waiter's active orders
   - Status badges: Cooking, Ready, Delivered
   - Time elapsed indicator

2. **Item Delivery**:
   - Order detail shows items ready for delivery (status=READY)
   - Checkbox to mark "Delivered to table"
   - Record timestamp and waiter ID automatically
   - Visual progress: Pending → Cooking → Ready → Delivered

3. **Payment Initiation**:
   - "View Bill" button (calculates total with tax)
   - Bill modal: Itemized list, total amount
   - "Request Payment" button (sends to admin)
   - Shows pending status until admin confirms
   - Block new orders for this table until payment confirmed

4. **Real-time Updates**:
   - Listen for PAYMENT_CONFIRMED socket event
   - Success animation/table cleared notification
   - Auto-refresh table list

Implement pull-to-refresh and optimistic updates for better UX.
```

---

## 📋 Phase 5: Integration & Features

### **Prompt 5.1 — Time Alerts & Notifications**

```
Implement delayed order warnings:

1. **Background Logic**:
   - Calculate: Current Time - Order Time > Preparation Time
   - Check every minute using setInterval or background tasks

2. **Visual Alerts**:
   - Admin Dashboard: Red flashing border on delayed orders, sound alert
   - Waiter App: Push notification + in-app banner
   - Kitchen Display: Yellow warning icon with minutes overdue

3. **Escalation**:
   - 5 min over: Warning
   - 10 min over: Critical (manager notification)
   - Log delays in database for kitchen performance reports

Use Expo Notifications for mobile alerts when app in background.
```

### **Prompt 5.2 — Offline Support & Sync**

```
Build resilience for network issues:

1. **Offline Queue**:
   - If socket disconnected, queue actions in AsyncStorage
   - Actions: Create Order, Deliver Item, Request Payment

2. **Sync on Reconnect**:
   - Auto-retry queued actions
   - Conflict resolution: If order modified offline and online, merge carefully

3. **Optimistic UI**:
   - Show orders as "sent" immediately, sync in background
   - Error states if submission fails after retry

4. **Connection Status**:
   - Green/red indicator in app header
   - Banner when "Offline mode active"
```

### **Prompt 5.3 — Security & Data Integrity**

```
Harden the system:

1. **Input Validation**:
   - Zod schemas for all API inputs
   - SQL injection prevention (Prisma handles this)
   - XSS protection in admin dashboard

2. **PIN Security**:
   - bcrypt hashing for PINs (treat as passwords)
   - Rate limiting on login attempts (5 tries, then 5-min lockout)

3. **Audit Integrity**:
   - Append-only audit logs (soft delete only)
   - Digital signatures for critical actions (optional)

4. **Role Enforcement**:
   - Middleware checks on every API route
   - Client-side role display but never trust client for permissions
```

---

## 📋 Phase 6: Deployment & DevOps

### **Prompt 6.1 — Deployment Setup**

```
Production deployment configuration:

1. **Next.js (Admin)**:
   - Vercel or Railway deployment
   - Environment variables: DATABASE_URL, JWT_SECRET, PUSHER_KEY
   - PostgreSQL on Supabase or Railway
   - Redis for Socket.io adapter (if scaling to multiple servers)

2. **Expo (Mobile)**:
   - EAS Build for iOS/Android
   - OTA updates configuration
   - App Store/Play Store submission materials
   - Enterprise distribution (if using company devices)

3. **Database**:
   - Migration strategy: Prisma migrate deploy
   - Seeding: Default admin user, sample menu items
   - Backups: Daily automated backups (pg_dump)

4. **Monitoring**:
   - Sentry for error tracking (both web and mobile)
   - LogRocket or PostHog for session replay
   - Uptime monitoring for API
```

### **Prompt 6.2 — Testing Strategy**

```
Comprehensive testing:

1. **Backend**:
   - Unit tests: Order calculation logic, audit trail generation
   - Integration tests: API endpoints with test database
   - WebSocket tests: Real-time event flow

2. **Frontend**:
   - Component tests: Table grid, order forms
   - E2E: Playwright for admin dashboard flows

3. **Mobile**:
   - Detox or Maestro for E2E flows (login → create order → payment)
   - Bluetooth printing tests (manual with hardware)

4. **Load Testing**:
   - k6 or Artillery: Simulate 20 concurrent waiters, 100 orders/hour
   - Socket.io connection limits
```

---

## 🎯 Quick Start Sequence

**Week 1: Core Flow**

1. Database schema → Backend API (Orders, Auth) → Basic Admin UI
2. Socket.io setup for real-time

**Week 2: Mobile & Integration** 3. Expo app skeleton → Order creation → Bluetooth printing 4. Connect mobile to API, test end-to-end

**Week 3: Business Logic** 5. Payment workflow (two-step authorization) 6. Audit logging and reporting

**Week 4: Polish & Deploy** 7. Time alerts, offline mode 8. Testing, deployment, staff training

**Critical Path:** The "Single Active Order per Table" constraint and Payment Authorization flow are your core differentiators—implement these first and test thoroughly with edge cases (network drops mid-payment, etc.).
