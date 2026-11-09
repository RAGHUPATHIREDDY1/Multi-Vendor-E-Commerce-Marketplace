# Testing

## Automated checks

Run from the repository root:

```powershell
npm test
npm run build
```

Backend tests use Vitest and Supertest. They cover authentication and role protections, validation, catalog behavior, order arithmetic/discount allocation, and Razorpay HMAC signature verification. The frontend build verifies that Vite can compile the application; there is not yet a browser-level UI test suite.

## Manual workflow checks

These workflows require a configured MongoDB replica set; payment checks additionally require Razorpay test credentials and a test webhook:

1. Register a customer, then register a vendor in a separate session.
2. Provision an admin through the environment-backed script. Sign in as admin and approve the vendor.
3. Sign in as the vendor; create a product and confirm it is scoped to the vendor account.
4. As customer, add products from two approved vendors; change/remove a cart line and check the displayed subtotal.
5. Submit checkout. Confirm one parent order and one suborder per vendor; verify prices, discounts, shipping, commission, and vendor net amounts were derived server-side.
6. Confirm stock reservations and order history. Attempt an invalid quantity or unapproved vendor product and verify a controlled error.
7. With Razorpay test credentials, create a payment order, complete a test payment, and verify through the backend. A forged callback/signature must not mark the order paid. Test signed and invalid webhooks.
8. Test vendor ownership by requesting another vendor's product/order IDs; access must be denied or return not found.
9. Mark a shipment delivered, submit a review, and verify it enters moderation. Download only the customer's own invoice.
10. Check `/api/health` while MongoDB is reachable and unavailable; expected database statuses are `connected`/HTTP 200 and `disconnected`/HTTP 503.

## Known test gaps

- Automated MongoDB replica-set integration tests for checkout, inventory concurrency, payment state, and order transitions are not present; real external service credentials are not supplied.
- Redis, Elasticsearch, and S3 service connectivity has not been verified in this workspace.
- No browser-based accessibility, responsive viewport, or end-to-end UI suite is configured.
- The database transaction workflows require a replica set; standalone MongoDB is not a valid checkout test environment.
