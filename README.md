# ServiceTracker

A modern service order management system built with React and NoCode Backend API.

## Backend Migration

This app has been migrated from Supabase to NoCode Backend for improved flexibility and control.

### NoCode Backend Configuration

- **Base URL**: https://openapi.nocodebackend.com
- **Instance**: 53878_service_orders_db
- **Table**: service_orders_public_st847291
- **Authentication**: Bearer token and API key authentication enabled

### API Endpoints

The app now uses REST API calls with authentication:

- **Read**: `GET /read/service_orders_public_st847291?Instance=53878_service_orders_db`
- **Create**: `POST /create/service_orders_public_st847291?Instance=53878_service_orders_db`
- **Update**: `PUT /update/service_orders_public_st847291/{id}?Instance=53878_service_orders_db`
- **Delete**: `DELETE /delete/service_orders_public_st847291/{id}?Instance=53878_service_orders_db`

All requests include:
- `Authorization: Bearer {API_KEY}`
- `X-API-Key: {API_KEY}`
- `Content-Type: application/json`

### Data Schema

The NoCode Backend expects the following field structure:

```json
{
  "service_id": "string (primary key)",
  "customer_name": "string",
  "customer_phone": "string", 
  "customer_email": "string",
  "company": "string",
  "item_type": "string",
  "quantity": "integer",
  "description": "string",
  "urgency": "string",
  "expected_completion": "date",
  "status": "string",
  "serial_number": "string",
  "parts": "string (JSON)",
  "labor": "string (JSON)",
  "parts_total": "number",
  "labor_total": "number", 
  "tax_rate": "number",
  "tax": "number",
  "subtotal": "number",
  "total": "number",
  "archived_at": "datetime",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## Key Features

- **Random Order IDs**: Simple 3-digit numbers (101-999) instead of complex UUIDs
- **Service Order Management**: Create, track, and manage service orders
- **Status Tracking**: Real-time status updates with history
- **Parts & Labor**: Add parts and labor costs with automatic calculations
- **Print Receipts**: Professional receipt printing
- **Archive System**: Archive completed orders
- **Responsive Design**: Works on desktop and mobile
- **Secure API Integration**: Authenticated REST API calls to NoCode Backend

## Development

```bash
npm install
npm run dev
```

## Database Schema

The app uses REST API calls to NoCode Backend:

- `service_orders_public_st847291` - Main service orders table
- `status_history_public_st847291` - Status change history (optional)
- `user_profiles_st847291` - User profile information (optional)

## Authentication

Authentication has been simplified to use local storage instead of Supabase Auth:

- User sessions stored locally
- No external authentication dependencies
- Simple email/password based login
- API calls are secured with Bearer token authentication

## Migration Changes

### What Changed:
1. **Supabase Client Removed**: All `supabase.from()` calls replaced with `fetch()` API calls
2. **Authentication Simplified**: Local storage based auth instead of Supabase Auth
3. **Real-time Removed**: No more real-time subscriptions (polling can be added if needed)
4. **Direct REST API**: All database operations now use HTTP requests
5. **Field Mapping**: Updated to match NoCode Backend schema (e.g., `id` → `service_id`)
6. **API Security**: Added Bearer token and API key authentication

### What Stayed the Same:
1. **UI/UX**: No changes to user interface
2. **Features**: All functionality preserved
3. **Data Structure**: Same logical data format
4. **Order ID System**: Still uses simple 3-digit IDs

## API Security

The NoCode Backend client is now configured with authentication:

```javascript
// API calls include these headers:
{
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer da202a5855991836c853149b2b9ba4d80e2c4db0e0f9c8324d391ee89750',
  'X-API-Key': 'da202a5855991836c853149b2b9ba4d80e2c4db0e0f9c8324d391ee89750'
}
```

## Real-time Updates

Since NoCode Backend uses REST API instead of WebSockets, real-time updates are not available by default. You can implement polling if needed:

```javascript
// Add to useServiceOrders hook
useEffect(() => {
  const interval = setInterval(() => {
    refresh() // Refresh data every 30 seconds
  }, 30000)
  
  return () => clearInterval(interval)
}, [])
```

## Troubleshooting

### Common Issues:

1. **"Record not found" errors**: The API uses `service_id` as the primary key, not `id`
2. **JSON field errors**: Parts and labor are stored as JSON strings in the API
3. **Parameter naming**: Use `Instance` (capital I) in query parameters
4. **Update operations**: Require finding the record first to get the internal ID
5. **Authentication errors**: Ensure API key is valid and included in headers

### Debug Mode:

Enable console logging to see API calls:
- All API requests and responses are logged to the browser console
- Check Network tab in Developer Tools for detailed request/response data
- Authentication status is logged on client initialization

### Status History:

The status history table may not exist in your NoCode Backend instance. The app handles this gracefully and will continue working without status history tracking.

## Security Notes

- API key is embedded in the client code for this demo
- In production, consider using environment variables
- The API key provides access to your NoCode Backend instance
- Keep the API key secure and rotate it regularly