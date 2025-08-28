# ServiceTracker

A modern service order management system built with React and Tailwind CSS. All data is stored locally in your browser using localStorage.

## Features

- **Random Order IDs**: Simple 3-digit numbers (101-999) instead of complex UUIDs
- **Service Order Management**: Create, track, and manage service orders
- **Status Tracking**: Real-time status updates with history
- **Parts & Labor**: Add parts and labor costs with automatic calculations
- **Print Receipts**: Professional receipt printing
- **Archive System**: Archive completed orders
- **Local Storage**: All data stored locally in your browser
- **Export/Import**: Backup and restore your data
- **Responsive Design**: Works on desktop and mobile

## Getting Started

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## Data Storage

This application uses **localStorage** to store all data locally in your browser:

- **Active Orders**: Stored in `serviceTracker_activeOrders`
- **Archived Orders**: Stored in `serviceTracker_archivedOrders`
- **Used Order IDs**: Stored in `serviceTracker_usedOrderIds`

### Data Persistence

- Data persists between browser sessions
- Clearing browser data will remove all service orders
- Use the export/import feature in Settings to backup your data
- Data is not synced between different browsers or devices

## Key Features

### Order ID System
- Uses simple 3-digit IDs (101-999)
- Randomly generated to avoid sequential patterns
- Automatically tracks used IDs to prevent duplicates

### Status Management
- **Received**: New orders just logged into the system
- **Needs Quote**: Items requiring price estimation
- **In Progress**: Active repair work
- **Waiting on Parts**: Delayed due to parts availability
- **Quote Approval**: Awaiting customer approval for repairs
- **Ready**: Completed and ready for pickup/delivery
- **Completed**: Finished orders
- **Archived**: Long-term storage for completed orders

### Parts & Labor Tracking
- Add multiple parts with quantities and prices
- Track labor hours and rates
- Automatic tax calculations
- Warranty support (parts/labor marked as warranty don't count toward totals)

### Receipt Printing
- Professional printable receipts
- Includes all service details, parts, labor, and totals
- Quote approval forms for customer signatures

## Data Management

### Export Data
- Download all service orders as JSON
- Option to include or exclude archived orders
- Preserves all data including status history

### Import Data
- Restore from previously exported JSON files
- Merges with existing data
- Updates existing orders and adds new ones
- Preserves order IDs and status history

### Clear Data
- Reset the entire application
- Removes all orders and resets order ID counter
- Cannot be undone - use export first for backup

## Development

### Project Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── common/             # Common components (SafeIcon)
```

### Key Files
- `src/hooks/useServiceOrders.js`: Main data management logic
- `src/utils/orderIdGenerator.js`: Order ID generation system
- `src/pages/Settings.jsx`: Data export/import functionality

## Browser Compatibility

Works in all modern browsers that support:
- localStorage
- ES6 features
- CSS Grid and Flexbox

## Limitations

- Data is not synchronized between devices
- Storage limited by browser localStorage limits (typically 5-10MB)
- No user authentication or multi-user support
- No real-time collaboration features

## Future Enhancements

Potential features for future versions:
- Cloud storage integration
- Multi-user support
- Real-time synchronization
- Mobile app
- Advanced reporting and analytics