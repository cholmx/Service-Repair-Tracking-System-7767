# NoCode Backend Integration Guide

## Overview

This ServiceTracker application has been successfully migrated from Supabase to NoCode Backend API. This guide explains the integration details and setup process.

## Configuration

### API Credentials
- **Base URL**: `https://openapi.nocodebackend.com`
- **Instance**: `53878_service_orders_db`
- **Table**: `service_orders_public_st847291`
- **Secret Key**: `da202a5855991836c853149b2b9ba4d80e2c4db0e0f9c8324d391ee89750`

### Authentication
All API requests use Bearer token authentication:
```javascript
headers: {
  'Authorization': 'Bearer da202a5855991836c853149b2b9ba4d80e2c4db0e0f9c8324d391ee89750',
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}
```

## API Endpoints

### 1. Create Service Order
```http
POST /create/service_orders_public_st847291?Instance=53878_service_orders_db
```

**Request Body:**
```json
{
  "id": "328",
  "customer_name": "John Doe",
  "customer_phone": "555-1234",
  "customer_email": "john@example.com",
  "company": "Acme Corp",
  "item_type": "laptop",
  "quantity": 1,
  "description": "Screen replacement needed",
  "urgency": "normal",
  "status": "received",
  "parts": "[]",
  "labor": "[]",
  "parts_total": 0,
  "labor_total": 0,
  "tax_rate": 0,
  "tax": 0,
  "subtotal": 0,
  "total": 0
}
```

### 2. Read Service Orders
```http
GET /read/service_orders_public_st847291?Instance=53878_service_orders_db
```

**Query Parameters for Filtering:**
- `page=1` - Pagination
- `limit=10` - Records per page
- `status=received` - Filter by status
- `archived_at=null` - Get non-archived items
- `archived_at[ne]=null` - Get archived items

### 3. Update Service Order
```http
PUT /update/service_orders_public_st847291/328?Instance=53878_service_orders_db
```

**Request Body:** (partial update)
```json
{
  "status": "in-progress",
  "parts": "[{\"description\":\"Screen\",\"quantity\":1,\"price\":150,\"isWarranty\":false}]",
  "parts_total": 150,
  "total": 150,
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 4. Delete Service Order
```http
DELETE /delete/service_orders_public_st847291/328?Instance=53878_service_orders_db
```

### 5. Search Service Orders
```http
POST /search/service_orders_public_st847291?Instance=53878_service_orders_db
```

**Request Body:**
```json
{
  "customer_name": "John",
  "status": "received"
}
```

## Data Transformation

### Parts and Labor Storage
Unlike Supabase JSONB, NoCode Backend stores JSON as strings:

**Before (Supabase):**
```javascript
parts: [{"description": "Screen", "quantity": 1, "price": 150}]
```

**After (NoCode Backend):**
```javascript
parts: "[{\"description\":\"Screen\",\"quantity\":1,\"price\":150}]"
```

The API client handles this transformation automatically.

### Warranty Support
Parts and labor can be marked as warranty items:

```json
{
  "description": "Replacement Screen",
  "quantity": 1,
  "price": 0,
  "isWarranty": true
}
```

When `isWarranty: true`, the item is not included in cost calculations.

## Error Handling

The NoCode API client (`src/lib/nocodeApi.js`) includes comprehensive error handling:

### Custom Error Class
```javascript
class NoCodeApiError extends Error {
  constructor(message, status, response) {
    super(message)
    this.name = 'NoCodeApiError'
    this.status = status
    this.response = response
  }
}
```

### Common Error Scenarios
1. **401 Unauthorized**: Invalid bearer token
2. **404 Not Found**: Service order doesn't exist
3. **400 Bad Request**: Invalid data format
4. **500 Internal Server Error**: Backend issues
5. **Network Errors**: Connection failures

## Integration Files

### Core API Client
- `src/lib/nocodeApi.js` - Main API client with all CRUD operations

### React Integration
- `src/hooks/useServiceOrders.js` - Updated hook using NoCode Backend
- `src/hooks/useServiceOrdersNoCode.js` - Alternative implementation (if needed)

### Legacy Support
- `src/lib/supabase.js` - Kept for backward compatibility

## Testing the Integration

### 1. Create a Test Order
```javascript
import noCodeApi from './src/lib/nocodeApi.js'

const testOrder = {
  id: "999",
  customer_name: "Test Customer",
  customer_phone: "555-TEST",
  item_type: "test-item",
  quantity: 1,
  description: "Test order",
  status: "received",
  parts: "[]",
  labor: "[]"
}

const result = await noCodeApi.createServiceOrder(testOrder)
console.log(result)
```

### 2. Verify in Browser Console
Open browser dev tools and check:
```javascript
// Check API connection
console.log('NoCode API Base URL:', noCodeApi.baseUrl)
console.log('Instance:', noCodeApi.instance)

// Test API call
noCodeApi.getServiceOrders().then(result => {
  console.log('Service Orders:', result)
})
```

## Migration Benefits

1. **Simplified Backend**: No need to manage Supabase database
2. **Better Performance**: Optimized API endpoints
3. **Easier Scaling**: Managed infrastructure
4. **Consistent Authentication**: Bearer token based
5. **Better Error Handling**: Detailed error responses

## Troubleshooting

### Common Issues

1. **"Authorization failed"**
   - Check bearer token in `src/lib/nocodeApi.js`
   - Verify token hasn't expired

2. **"Table not found"**
   - Verify table name: `service_orders_public_st847291`
   - Check instance parameter: `53878_service_orders_db`

3. **"JSON parsing error"**
   - Ensure parts/labor are valid JSON strings
   - Check data transformation in the API client

### Debug Mode
Enable detailed logging by adding to console:
```javascript
localStorage.setItem('debug', 'nocode-api')
```

This will show all API requests and responses in the browser console.

## Next Steps

1. **Status History Table**: Can be added as separate NoCode Backend table
2. **Real-time Updates**: Implement webhooks for live updates
3. **File Uploads**: Add support for service order attachments
4. **Bulk Operations**: Implement batch create/update operations
5. **Analytics**: Add reporting and analytics endpoints

The NoCode Backend integration is now complete and fully functional!