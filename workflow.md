# Smart Queue System - Walkthrough Guide

The Smart Queue System is a premium, full-stack contactless queue management application built using **Next.js 15 (App Router)** and **SQLite** managed via **Prisma ORM**. It features an elegant Vanilla CSS design system, reactive real-time updates via **Server-Sent Events (SSE)**, and synthesized chime and vocal speech announcements for a premium waiting hall experience.

Below is the user manual and code structure guide for the prototype implementation.

---

## Installation & Setup (Instant Launch)

The application has been successfully configured and compiled. To run the system locally, follow these simple steps:

### 1. Start the Development Server
Run the local next development server using:
```bash
npm run dev
```
By default, the application will boot at **[http://localhost:3000](http://localhost:3000)**.

### 2. Initialize the SQLite Database
When you first open the home page at [http://localhost:3000](http://localhost:3000), you will see a developer diagnostics card indicating that the database is not seeded. 
1. Click the glowing **"Initialize Database Settings"** button.
2. Alternatively, navigate directly to **[http://localhost:3000/api/setup](http://localhost:3000/api/setup)**.
3. This creates a clean local SQLite file (`dev.db` in `prisma/dev.db`), sets up all tables, and seeds initial data (3 service categories, 3 active counters, system settings, and standard staff/admin accounts).

---

## 📂 Project Architecture & Key Files

The system contains the following files inside the `d:\project\SmartQR\Prototype` workspace:

1. **`package.json`**: Package specifications and dependencies (`next`, `react`, `@prisma/client`, `lucide-react`).
2. **`next.config.mjs`**: Standard Next.js server configuration.
3. **`prisma/schema.prisma`**: Relational models for `ServiceType` (Priority levels), `Counter`, `Queue` (Tickets), `SystemSettings` (Static/Daily QR), and `User` (Credentials).
4. **`src/lib/db.js`**: A global singleton manager for the Prisma SQLite client to avoid connection leaks during development reload phases.
5. **`src/lib/sse.js`**: An in-memory event-pubsub stream dispatcher enabling backend routes to broadcast ticket calls directly to active clients.
6. **`src/app/globals.css`**: The core **Vanilla CSS Design System**. Declares custom dark HSL color palettes, deep glassmorphic structures, custom glowing borders, reactive scrollbars, and keyframe animations for modal overlays and TV display calling flashes.
7. **`src/app/layout.js`**: Global layout integrating global CSS, responsive viewport controls, and modern Google font integrations (`Outfit` and `Noto Sans Lao`).
8. **`src/app/page.js`**: Home portal menu containing quick links to all system views and live database connection alerts.

### Backend Routing APIs:
- **`src/app/api/setup/route.js`**: Seeding and purge route to reset the system.
- **`src/app/api/queue/route.js`**: Contactless ticket generation POST (incorporates daily dynamic QR security parameters) and active queue listing GET.
- **`src/app/api/queue/stream/route.js`**: Reactive Server-Sent Events stream using modern native Next.js stream buffers.
- **`src/app/api/counter/route.js`**: Operator actions (Call Next, Recall, Complete, Skip) updating state and broadcasting SSE alerts.
- **`src/app/api/admin/route.js`**: Admin settings editor and real-time reports analytics calculations.

### Frontend Module Views:
- **`src/app/customer/register/page.js`**: Contactless signup card, allowing visitors to input details and reserve a ticket.
- **`src/app/customer/status/[id]/page.js`**: Mobile tracking ticket displaying live order queues ahead, estimated wait time, proceed-to-counter modal overlays, and sound call synthesis.
- **`src/app/staff/counter/page.js`**: Command center dashboard for operators to call prioritized FIFO tickets, recall screens, skip no-shows, and view live queues.
- **`src/app/tv/page.js`**: Full-screen large display board featuring serving grids, upcoming queue logs, automated overlay modal popups, and fully synthesized bell audio and TTS speech.
- **`src/app/admin/page.js`**: Central admin configuration panel managing daily dynamic QR keys, category priorities, terminal registers, and custom SVG reports.

---

## 🚀 Step-by-Step Operations Walkthrough

To experience the full capacity of the prototype, open multiple tabs on your browser and run through this end-to-end operation scenario:

### Phase 1: Set Up and Configure the System
1. Open the **Admin Panel** at **[http://localhost:3000/admin](http://localhost:3000/admin)**.
2. Select the **QR Terminal settings** tab.
3. Toggle between **Static QR Code** and **Daily Dynamic QR Code**. Note how the check-in URL on the right dynamically appends `?token=xyz` when in daily security mode to prevent users booking tickets from home.
4. Click **Print Sign** or **Download HQ** to preview the customer scan layout.

### Phase 2: Open the TV Display Board
1. Open the **TV Display Board** at **[http://localhost:3000/tv](http://localhost:3000/tv)**.
2. Optimize it for full screen.
3. **CRITICAL**: Click the glowing amber **"Enable Sound Announcements"** button at the top. Browsers restrict autoplaying sound/speech synthesis until a user interacts with the page. Clicking this unlocks the high-fidelity sound channel.

### Phase 3: Register a Customer Queue Ticket
1. Scan the QR code from the Admin screen (or click **Customer Portal** on the home page).
2. The registration page renders all active service categories as large clickable buttons styled with premium Lao typography.
3. Simply click a category button (e.g. **VIP Service / ບໍລິການພິເສດ VIP**).
4. A ticket is immediately issued without typing name or phone (defaulted to "ລູກຄ້າ / Customer") and redirects the user to the live tracking page (`/customer/status/[id]`) showing the queues ahead and wait time in Lao.

### Phase 4: Staff Terminal Operation (Calling the Ticket)
1. Open the **Counter Dashboard** at **[http://localhost:3000/staff/counter](http://localhost:3000/staff/counter)** in a separate window.
2. In the top right, select **Counter 1** from the dropdown terminal locker.
3. The panel displays `Counter Idle` and indicates `1` waiting ticket.
4. Click the glowing cyan **"Call Next Queue"** button.
5. **Instant Reactive Broadcast (SSE)**:
   - **On the TV screen**: The entire screen flashes, a massive glowing overlay modal pops up, a synthesized C-major chime rings, and a voice announces: *"Queue B 0 0 1, please proceed to Counter 1"*.
   - **On the Customer mobile screen**: The ticket layout turns cyan and flashes, presenting a direct callout card: *"Go to Counter: Counter 1"*, accompanied by a localized mobile chime ring and vibe warning!
   - **On the Staff Dashboard**: The screen displays ticket B001 as active, unlocking **Recall**, **Skip**, and **Complete** buttons.

### Phase 5: Closing out and Viewing Analytics
1. On the Staff Dashboard, click **Complete Service**.
2. Note that the Customer Status mobile screen instantly transitions to a completed card showing: *"Thank You! Your service has been successfully completed"*.
3. Go to the **Admin Panel** under the **Overview & Analytics** tab.
4. Review the updated statistics showing total tickets completed, status breakdowns, and wait/service performance times immediately update in real-time.
