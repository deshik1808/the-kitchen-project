# Google Sheets as a Database

When using Google Sheets as a backend (e.g., for Next.js + n8n projects), headers are critical.

## ⚠️ Header Preservation Rules

- **MANDATORY**: Every tab (`Settings`, `Menu`, `Orders`, `Discounts`) MUST have descriptive headers in row 1.
- **STICKY HEADERS**: Never overwrite row 1 without re-including headers.
- **SETTINGS TAB**: Specifically, the `Settings` tab MUST use `Label` and `Value` as headers in `A1` and `B1`.
- **MENU TAB**: Must include `ID`, `Name`, `Description`, `Price`, `Category`, `Image URL`, `Available`, `Add-ons`, `Sort Order`, `Veg/Non-Veg`.
- **N8N COMPATIBILITY**: n8n nodes often rely on these exact header names (case-insensitive in some nodes, but code nodes use specific keys like `row['Label']`).

## Implementation Pattern

When updating sheets via API or MCP:

1. **Check first**: Verify row 1 contains the expected headers.
2. **Pre-populate**: If row 1 is empty, WRITE the headers immediately.
3. **Data Range**: Use `TabName!A2:Z` for data operations (append/read) to skip headers.

## Fixed Headers for Kitchen Project

- **Settings**: `['Label', 'Value']`
- **Menu**: `['ID', 'Name', 'Description', 'Price', 'Category', 'Image URL', 'Available', 'Add-ons', 'Sort Order', 'Veg/Non-Veg']`
- **Orders**: `['Order ID', 'Timestamp', 'Customer Name', 'Phone', 'Items', 'Subtotal', 'Discount Code', 'Discount Amount', 'Delivery Fee', 'Total', 'Payment Method', 'Payment Status', 'Order Status', 'Delivery Type', 'Address', 'Notes', 'Razorpay Link', 'WhatsApp Sent']`
- **Discounts**: `['Code', 'Type', 'Value', 'Min Order', 'Max Discount', 'Active', 'Expiry', 'Usage Limit', 'Used Count']`
