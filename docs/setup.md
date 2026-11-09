# Setup and deployment

## Local development

### Requirements

- Node.js 20+ and npm.
- MongoDB Atlas or MongoDB configured as a replica set. Checkout and payment finalization require transaction support.

### Configure environment

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`. Add the connection URI only to `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<database-user>:<url-encoded-password>@<cluster-host>/<database>?retryWrites=true&w=majority
JWT_SECRET=<random-secret-of-at-least-32-characters>
```

In Atlas, create a database user, allow the development machine's IP in Network Access, and replace the placeholders with your own values. URL-encode special characters in the database password. Never commit `.env` files or share secrets.

Then run from the project root:

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`, `http://localhost:5000/api/health`, and `http://localhost:5000/api/docs`. A healthy API returns `database: "connected"`. A 503/disconnected health result means MongoDB has not connected; inspect your URI, Atlas user, network access, and server logs. The app does not claim successful Atlas connectivity without this test.

### Initial data and admin

With MongoDB configured:

```powershell
npm run seed
npm run provision-admin -w backend
```

Set `ADMIN_NAME`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` (at least 12 characters) in `backend/.env` before provisioning. The script refuses to modify an existing account. Sample products are browse-only unless `SEED_VENDOR_EMAIL`, `SEED_VENDOR_PASSWORD`, and optionally `SEED_VENDOR_NAME` are set before running the seed script; never use real or reusable passwords for demo data.

### Optional integrations

All optional values go in `backend/.env`, never the Vite frontend environment:

- Razorpay test: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. Set the webhook URL to `/api/payments/webhook`; configure the matching secret in Razorpay.
- Redis: `REDIS_URL`. Redis is currently connection-checked as an optional cache adapter; carts remain in MongoDB.
- Elasticsearch: `ELASTICSEARCH_URL`; start the API and run `npm run reindex -w backend` to index existing products. MongoDB search remains the fallback.
- S3: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`. Grant only required object write permissions. S3 objects are private by default, so provide a CloudFront/public asset strategy before rendering returned object URLs in a production storefront.
- `PLATFORM_COMMISSION_PERCENT` and `SHIPPING_FEE_MINOR` configure server-side calculation. Tax is not implemented.

Without optional credentials the app uses explicit development fallbacks or returns a configuration error for payment; it does not fake a successful payment.

## Production deployment checklist

1. Deploy frontend and API separately; configure `CLIENT_URL` to the exact HTTPS storefront origin and `PUBLIC_API_URL` to the public API origin.
2. Use a replica-set MongoDB deployment, TLS, least-privilege database credentials, backups, and tested restore procedures.
3. Configure strong secrets in the hosting provider's secret manager. Do not copy `.env` into images or source control.
4. Configure HTTPS, CORS allowlisting, reverse-proxy body-size limits, health monitoring, and log redaction.
5. Configure private S3 storage plus a deliberate image delivery policy (for example CloudFront); do not assume direct S3 object URLs are public.
6. Configure Razorpay webhooks and test signature/capture behavior in test mode. Have a separate operational settlement process; automatic split payments are not implemented.
7. Build with `npm run build`; run `npm test`; run a manual checkout using test credentials and a replica-set database before release.
8. Configure rate limiting for the production topology, audit dependencies, and add observability/alerting and data retention policies before handling real users.

This repository does not include a deployment provider configuration and should not be treated as production-certified.
