# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VanMart is a "接龙团购" (group-buying chain) platform with a Node.js/Express backend and React frontend. The platform enables users to create and participate in group-buying events (called "marts").

## Common Commands

### Backend

```bash
cd backend

# Development
npm run dev              # Run with ts-node

# Build & Run
npm run build            # Compile TypeScript
npm start                # Run production build

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma database GUI
npm run db:seed          # Seed database
npm run db:push         # Push schema to database

# Testing & Linting
npm test                 # Run all tests
npm run lint             # Lint TypeScript
```

### Frontend

```bash
cd frontend

npm run dev              # Start Vite dev server
npm run build            # Production build
npm run lint             # ESLint check
```

## Architecture

### Backend Structure (`backend/src/`)

- `app.ts` - Express app setup with middleware and route registration
- `index.ts` - Entry point
- `db.ts` - Prisma client instance
- `routes/` - API route handlers:
  - `orders.ts` - Order CRUD and status transitions
  - `marts.ts` - Group-buying event management
  - `goods.ts` - Product management
  - `messages.ts` - User notifications
  - `stats.ts` - Analytics endpoints
  - `users.ts` - User authentication and profiles

### Database Schema (`backend/prisma/schema.prisma`)

- **User** - Core user model with profile, sessions, addresses
- **Mart** - Group-buying event with status (OPEN/CLOSED/ENDED)
- **Goods** - Products within a mart
- **Order** - Customer orders with status flow (CREATED → PENDING_SHIPMENT → SHIPPED → DELIVERED → COMPLETED/CANCELED)
- **OrderItem** - Line items in orders
- **Message** - User notifications
- **Supporting models**: ShippingAddress, MartParticipation, GoodsLike, GoodsReview, Material, LowStockAlert, etc.

### Frontend Structure (`frontend/src/`)

- `App.tsx` - Main app with React Router routes
- `pages/` - Route components:
  - `OrderList.tsx`, `OrderDetail.tsx`, `OrderCreate.tsx` - Order management
  - `MessageCenter.tsx` - Notifications
- `components/` - Reusable UI components
- `services/api.ts` - API client
- `i18n/` - Internationalization (i18next)
- `types/` - TypeScript type definitions

## Key Patterns

### Order Status Flow
```
CREATED → PENDING_SHIPMENT → SHIPPED → DELIVERED → COMPLETED
                ↓                           ↓
              CANCELED ←─────────────────┘
```

### Mart Status
- `OPEN` - Accepting orders
- `CLOSED` - Manually closed by organizer
- `ENDED` - Past finishTime with setFinishTime enabled

### API Response Format
- Success: `{ data: ... }` or `{ data: [...], pagination: {...} }`
- Error: `{ error: string, message?: string }`

## Environment Variables

Backend requires `DATABASE_URL` in `.env` for PostgreSQL connection.

## Design System

### Colors (Mobile-optimized)
- **Primary**: Emerald `#059669` (emerald-600)
- **Primary Light**: `#10B981` (emerald-500)
- **CTA**: Orange `#F97316` (orange-500)
- **Background**: `#F8FAFC` (slate-50)
- **Text**: `#064E3B` (emerald-900)

### Typography
- **Headings**: Rubik (font-semibold)
- **Body**: Nunito Sans

### Mobile UI Guidelines
- Minimum touch target: 44px (`min-h-[44px]`)
- Cards: White with `rounded-2xl` and subtle shadow
- Floating headers with `backdrop-blur-md bg-white/90`
- Smooth transitions: `transition-all duration-200`
- Loading states: Spinning emerald ring

### Component Patterns
- **Status badges**: Colored pills with icons
- **Buttons**: Gradient backgrounds with shadow, scale effect on click
- **Lists**: Card-based with hover/active states
- **Modals**: Bottom sheet style on mobile (`rounded-t-3xl`)

