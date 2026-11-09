# API documentation

Base URL: `http://localhost:5000/api`. JSON request bodies use `Content-Type: application/json`. Protected endpoints require `Authorization: Bearer <JWT>`. Responses use JSON; errors include a `message` and may include validation `errors`.

Browse the small OpenAPI reference at `/api/docs` while the API is running. The table below describes the implemented REST surface. For exact validation rules, see the route validators in `backend/src/validators/`.

## Health and catalog

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | API and MongoDB readiness; 503 when DB is unavailable |
| GET | `/products` | Public | Search/filter active products; supports `q`, `category`, `minPrice`, `maxPrice`, `sort`, `page`, `limit` |
| GET | `/products/:idOrSlug` | Public | Active product detail |
| GET | `/products/:productId/reviews` | Public | Approved reviews for a product |
| GET | `/categories` | Public | Active categories |

## Authentication

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Create customer account |
| POST | `/auth/vendor/register` | Public | Create vendor user and pending store application |
| POST | `/auth/login` | Public, rate-limited | Authenticate and return JWT + public user |
| GET | `/auth/me` | Authenticated | Return current public user |

Customer registration body: `{ "name": "...", "email": "...", "password": "..." }`. Vendor registration additionally accepts `storeName` and `description`. Public registration cannot create admins; provision the first admin using the documented environment-backed script.

## Customer

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/cart` | Customer | Read cart and server-computed display subtotal |
| POST | `/cart/items` | Customer | Add `{ "productId": "...", "quantity": 1 }` |
| PATCH | `/cart/items/:productId` | Customer | Set `{ "quantity": 2 }` |
| DELETE | `/cart/items/:productId` | Customer | Remove cart item |
| GET/POST | `/addresses` | Customer | List/create saved addresses |
| POST | `/checkout` | Customer | Create transactional parent order and vendor suborders |
| GET | `/orders` | Customer | List own orders |
| GET | `/orders/:orderId` | Customer | Read own order and shipments |
| GET | `/orders/:orderId/invoice` | Customer | Download PDF invoice for own order |
| GET | `/coupons/validate?code=...&subtotalMinor=...` | Customer | Validate coupon; checkout revalidates and recalculates |
| POST | `/reviews` | Customer | Review an item from a delivered purchase |
| GET | `/reviews/mine` | Customer | List own reviews |
| GET | `/notifications` | Authenticated | List own notifications |
| PATCH | `/notifications/:notificationId/read` | Authenticated | Mark own notification read |

Checkout accepts cart/address references and an optional coupon code. It does not accept authoritative client prices or totals. The backend reloads prices, checks stock and vendor approval, computes shipping/discount/commission, then creates the order inside a MongoDB transaction.

## Vendors

All vendor endpoints require an authenticated vendor. Product/order/analytics/commission operations additionally require an approved store.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/vendor/me` | Store/application information |
| GET/POST | `/vendor/products` | List/create own products |
| PATCH/DELETE | `/vendor/products/:productId` | Update/delete own product |
| POST | `/vendor/uploads` | Upload one validated image (JPEG/PNG/WebP, max 5 MB) |
| GET | `/vendor/orders` | List own vendor suborders |
| PATCH | `/vendor/orders/:vendorOrderId/status` | Move allowed shipment status |
| GET | `/vendor/analytics` | Sales/fulfillment metrics |
| GET | `/vendor/commissions` | Own commission records |
| GET | `/payments/vendor/commissions` | Alias for own commission records |

Vendor product and order queries are ownership-scoped. Vendor cancellation is restricted to newly placed, unpaid vendor shipments.

## Admin

Admin paths require a JWT with the `admin` role.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/dashboard` | Marketplace summary metrics |
| GET/PATCH | `/admin/vendors`, `/admin/vendors/:vendorId/status` | Review vendor applications and set status |
| GET/PATCH | `/admin/customers`, `/admin/customers/:userId/status` | List and activate/deactivate customers |
| GET | `/admin/products` | List products |
| GET | `/admin/orders` | List marketplace orders |
| GET/POST | `/admin/categories` | List/create categories |
| PATCH | `/admin/categories/:categoryId/status` | Activate/deactivate category |
| GET/POST | `/coupons/admin` | List/create coupons |
| PATCH | `/coupons/admin/:couponId/status` | Activate/deactivate coupon |
| GET/PATCH | `/reviews/admin`, `/reviews/admin/:reviewId` | Review moderation queue/actions |
| GET | `/payments/admin/payments` | Payment records |
| GET | `/payments/admin/commissions` | Commission records |

## Payments

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/payments/orders` | Customer | Create/reuse a Razorpay order for own pending order |
| POST | `/payments/verify` | Customer | Verify signature and provider-captured status |
| POST | `/payments/webhook` | Razorpay | Validate raw-body webhook signature and process event |

Payment verification is unavailable unless backend Razorpay test credentials are configured. The backend never marks an order paid based only on the browser callback. This API records commission accounting but does not automatically settle vendor funds.
