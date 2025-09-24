# ServiceTracker

A modern service order management system built with React and NoCode Backend API.

## 🔄 Migration to NoCode Backend

This application has been **migrated from Supabase to NoCode Backend API** for improved performance and simplified backend management.

### NoCode Backend Configuration

- **Base URL**: `https://openapi.nocodebackend.com`
- **Instance**: `53878_service_orders_db`
- **Table**: `service_orders_public_st847291`
- **Authentication**: Bearer Token (configured in `src/lib/nocodeApi.js`)

### API Endpoints Used

1. **Create Service Order**: `POST /create/service_orders_public_st847291?Instance=53878_service_orders_db`
2. **Read Service Orders**: `GET /read/service_orders_public_st847291?Instance=53878_service_orders_db`
3. **Update Service Order**: `PUT /update/service_orders_public_st847291/{id}?Instance=53878_service_orders_db`
4. **Delete Service Order**: `DELETE /delete/service_orders_public_st847291/{id}?Instance=53878_service_orders_db`
5. **Search Service Orders**: `POST /search/service_orders_public_st847291?Instance=53878_service_orders_db`

## Key Features

- **Random Order IDs**: Simple 3-digit numbers (101-999) instead of complex UUIDs
- **Service Order Management**: Create, track, and manage service orders
- **Status Tracking**: Real-time status updates with history
- **Parts & Labor**: Add parts and labor costs with automatic calculations
- **Warranty Support**: Mark parts and labor as warranty items
- **Print Receipts**: Professional receipt printing
- **Archive System**: Archive completed orders
- **Responsive Design**: Works on desktop and mobile
- **NoCode Backend Integration**: Seamless API integration with proper error handling

## Development

```bash
npm install
npm run dev
```

## File Structure

### API Integration
- `src/lib/nocodeApi.js` - NoCode Backend API client with full CRUD operations
- `src/hooks/useServiceOrders.js` - React hook for service order management (updated for NoCode Backend)

### Legacy Files (Maintained for Reference)
- `src/lib/supabase.js` - Original Supabase client (kept for backward compatibility)

## Database Schema

The NoCode Backend uses the following table structure:

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

- `received` → `needs-quote` → `quote-approval` → `in-progress` → `ready` → `completed` → `archived`
- Direct path: `received` → `in-progress` → `ready` → `completed` → `archived`

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

## Error Handling

The NoCode API client includes comprehensive error handling:

- **Network errors**: Handles connection failures and timeouts
- **Authentication errors**: Manages invalid bearer tokens
- **Validation errors**: Processes API validation responses
- **Rate limiting**: Handles API rate limit responses
- **Data transformation**: Ensures consistent data format between API and UI

## Migration Notes

1. **Data Format**: Parts and labor are stored as JSON strings in NoCode Backend vs JSONB in Supabase
2. **Status History**: Currently handled in local state (can be extended to separate table if needed)
3. **Authentication**: Uses Bearer token authentication instead of Supabase RLS
4. **Real-time Updates**: Currently polling-based (can be enhanced with webhooks)

The application maintains full backward compatibility and all existing features work seamlessly with the new NoCode Backend.