# Database schema notes

All schemas use Mongoose timestamps, validation, and indexes for common lookups. Exact field constraints are defined in `backend/src/models/`.

## User

| Field | Type | Notes |
| --- | --- | --- |
| `name` | String | Required, trimmed |
| `email` | String | Required, normalized, unique index |
| `password` | String | Required; bcrypt hash, excluded from default queries |
| `role` | Enum | `customer`, `vendor`, or `admin`; public customer registration forces `customer` |

## Product

| Field | Type | Notes |
| --- | --- | --- |
| `name`, `slug` | String | Required; slug unique |
| `description` | String | Required |
| `price` | Number | Required, non-negative |
| `images` | String[] | Image URLs; vendor uploads use S3 when configured or local development storage |
| `categoryId`, `category` | ObjectId/String | Category reference and searchable category label |
| `vendor` | ObjectId | Vendor user reference; sample browse-only products can be unassigned |
| `inventory` | Number | Non-negative integer |
| `status` | Enum | `active` or `draft`; only active products are public |

## Commerce relationships

- `Vendor` belongs to a `User` and stores a unique store slug and approval state.
- `Cart` belongs to a customer and contains product references and quantities. Prices are read from `Product` at checkout.
- `Address` belongs to a customer.
- `Order` is the customer-facing parent order with server-calculated minor-unit totals, payment status, and status history.
- `VendorOrder` belongs to one parent order and one vendor. Its item snapshots and seller-level totals allow separate fulfillment workflows.
- `Payment` is one provider payment attempt per parent order. `Commission` records platform commission independently from vendor net earnings.
- `Coupon` stores usage rules and limits. Usage count increments within checkout transactions.
- `Review` references a delivered product purchase and is moderated by an administrator.
- `Notification` belongs to a user and has read state.
- `Category` contains unique slugs and active state.

Checkout and payment finalization use MongoDB sessions/transactions and therefore require a replica set. Prices in `Product` are major currency units; order/payment/commission totals are integer minor units. Currency is INR in the Razorpay integration. Tax is not currently calculated.
