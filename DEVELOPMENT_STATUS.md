# Development status

This checklist distinguishes implemented code from external services that still require credentials and verification.

## Implemented

- [x] Separate React/Vite frontend and Express/Mongoose backend with workspace scripts.
- [x] Customer/vendor registration and login, JWT authentication, role authorization, validation, rate limiting, and admin provisioning script.
- [x] Product catalog, categories, pagination/search/filters, vendor application and approval, ownership-scoped product management and uploads.
- [x] Customer cart and saved addresses; server-priced multi-vendor checkout with parent order, vendor suborders, commission records, stock reservation, and MongoDB transactions.
- [x] Order history, seller shipment updates/cancellation limits, coupon validation/admin endpoints, customer review flow/moderation, notifications, and PDF invoices.
- [x] Admin dashboard and vendor/customer/category/order/payment/commission API surfaces; customer/vendor/admin frontend areas.
- [x] Razorpay adapter with test-mode order setup, backend signature/provider capture verification, and signed webhook support.
- [x] Optional Redis adapter, Elasticsearch search/reindex adapter with MongoDB search fallback, and validated local/S3 upload path.
- [x] Seed and admin-provision scripts, API docs, database/architecture/setup/testing documentation.
- [x] Backend automated tests and frontend production build pass in the current workspace.

## Partial or not implemented

- [ ] MongoDB transaction and end-to-end integration tests against a replica set.
- [ ] Browser-based E2E/accessibility test suite.
- [ ] Customer profile editing, wishlist, and a complete account dashboard.
- [ ] Full admin UI coverage for all available APIs (including categories, coupons, products, reviews, payments, and commission operations).
- [ ] Address update/delete, refunds/disputes, tax calculation, robust order cancellation policy, and vendor settlement/payouts.
- [ ] Redis-backed cart or catalog caching; carts remain MongoDB-backed.
- [ ] S3 public asset delivery strategy (CloudFront or equivalent) and verified deployment configuration.
- [ ] Production deployment automation, monitoring, and operational procedures.

## External service and workspace status

- MongoDB Atlas: requires a developer-provided URI in `backend/.env`; no real Atlas credentials were supplied or tested.
- Redis, Elasticsearch, S3, Razorpay: integration paths exist but no live service connection has been verified.
- The application does not implement automatic vendor split settlement.
- The workspace is not a Git repository; no remote or branch is configured.
