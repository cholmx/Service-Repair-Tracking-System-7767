# ServiceTracker

A modern service order management system built with React and Supabase on Bolt.new.

## Key Features

- **Simple Order IDs**: Easy-to-remember 3-digit order numbers (101-999)
- **Service Order Management**: Create, track, and manage repair/service orders
- **Status Tracking**: Real-time status updates with complete history
- **Quote Management**: Create and approve quotes before starting work
- **Parts & Labor**: Track parts and labor with automatic cost calculations
- **Warranty Support**: Mark parts and labor as warranty items (no charge)
- **Print Receipts**: Professional receipt printing for customers
- **Archive System**: Archive completed orders to keep workspace clean
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Supabase Integration**: Fast, reliable database with Bolt.new

## Setup

1. The Supabase database is pre-configured in Bolt.new
2. Database tables are automatically created via migration
3. Just run the app and start using it!

## Development

```bash
npm install
npm run dev
```

## File Structure

- `src/lib/supabase.js` - Supabase client configuration for Bolt.new
- `src/hooks/useServiceOrders.js` - React hook for service order management
- `src/pages/` - Main application pages (Dashboard, ItemIntake, ItemDetails, etc.)
- `src/components/` - Reusable UI components
- `supabase/migrations/` - Database schema migrations

## Database Schema

The Supabase database uses the following tables:

```json
{
  "id": "TEXT PRIMARY KEY",
  "customer_name": "TEXT NOT NULL",
  "customer_phone": "TEXT NOT NULL", 
  "customer_email": "TEXT",
  "company": "TEXT",
  "item_type": "TEXT NOT NULL",
  "quantity": "INTEGER DEFAULT 1",
  "description": "TEXT NOT NULL",
  "urgency": "TEXT DEFAULT 'normal'",
  "expected_completion": "DATE",
  "status": "TEXT DEFAULT 'received'",
  "serial_number": "TEXT",
  "parts": "TEXT (JSON string)",
  "labor": "TEXT (JSON string)", 
  "parts_total": "DECIMAL(10,2)",
  "labor_total": "DECIMAL(10,2)",
  "tax_rate": "DECIMAL(5,2)",
  "tax": "DECIMAL(10,2)",
  "subtotal": "DECIMAL(10,2)",
  "total": "DECIMAL(10,2)",
  "archived_at": "TIMESTAMP",
  "created_at": "TIMESTAMP",
  "updated_at": "TIMESTAMP"
}
```

## Status Workflow

- With quotes: `received` → `needs-quote` → `quote-approval` → `in-progress` → `ready` → `completed` → `archived`
- Without quotes: `received` → `in-progress` → `ready` → `completed` → `archived`
- Can also go to `waiting-parts` during `in-progress` if waiting on parts to arrive

## Parts & Labor with Warranty Support

### Parts JSON Structure
```json
{
  "description": "Replacement Screen",
  "quantity": 1,
  "price": 0,
  "isWarranty": true
}
```

### Labor JSON Structure  
```json
{
  "description": "Screen Installation",
  "hours": 2,
  "rate": 0,
  "isWarranty": true
}
```

When `isWarranty` is `true`, the price/rate is set to 0 and not included in totals.

## Data Management

- **Export**: Download all service orders as JSON for backup
- **Import**: Restore service orders from exported JSON files
- **Archive**: Move completed orders to archive to keep dashboard clean
- **Delete**: Permanently delete archived orders

## Technology Stack

- **Frontend**: React 18 with React Router
- **Styling**: TailwindCSS with custom design system
- **Animations**: Framer Motion
- **Icons**: React Icons (Feather Icons)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Bolt.new