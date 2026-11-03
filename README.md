# AI-Native Catalogue

A small product catalogue built with React, TypeScript, Vite, Node.js, and Express. Product data is supplied by Fake Store API through the backend; the browser talks only to the local catalogue API, including for product images.

## Local Setup

Prerequisites: Node.js 22.12 or later and npm 10 or later.

From the repository root:

```powershell
npm install
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
npm run dev
```

Open `http://localhost:5173`. The Vite development server proxies `/api` to the Express API at `http://localhost:3000`. The sample environment files contain no credentials. Copying them is optional for the defaults, but provides a local place for configuration; `.env` files are ignored by Git.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API and web development servers together |
| `npm test` | Run backend and frontend Vitest suites |
| `npm run typecheck` | Typecheck both workspaces |
| `npm run build` | Create production builds for both workspaces |

The API tests use mocked providers and mocked `fetch`; test runs do not depend on Fake Store API availability.

## Environment Variables

| Workspace | Variable | Default / example | Purpose |
| --- | --- | --- | --- |
| API | `PORT` | `3000` | Express listening port |
| API | `FAKE_STORE_API_BASE_URL` | `https://fakestoreapi.com` | Product provider base URL |
| Web | `VITE_API_BASE_URL` | `/api` | Same-origin catalogue API path |
| API | `EMAIL_PROVIDER` | `development` outside production | Selects local `development` logging or `smtp` delivery. Production requires explicitly setting `smtp`. |
| API | `SALES_INBOX` | Blank in the example | Required destination for SMTP enquiries |
| API | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Host/user/password/from blank; port `587`; secure `false` | SMTP connection, authentication, and sender configuration; required when `EMAIL_PROVIDER=smtp` |

Never put real credentials in source files or commit local `.env` files. SMTP example values are intentionally blank and are not usable credentials.

### Email Modes

- **Local development:** `EMAIL_PROVIDER=development` is the default when `NODE_ENV` is not `production`. Enquiries are written to the API process log, including customer contact details; no email is sent. Treat these logs as personal data.
- **SMTP:** Set `EMAIL_PROVIDER=smtp`, `SALES_INBOX`, and all required `SMTP_*` values. SMTP enquiries go to `SALES_INBOX`, with the customer address set as `Reply-To`.
- **Production:** `NODE_ENV=production` requires `EMAIL_PROVIDER=smtp`. Missing, invalid, or development-provider configuration fails during API startup instead of silently logging submissions.

## Catalogue Behavior

- The homepage requests the backend's featured endpoint and renders at most five top-rated products.
- Category pages show the top five products first, then any additional unique products.
- Search is performed by the backend against product title, description, and category.
- Product detail and catalogue image requests use backend endpoints.
- Product images are fetched by the API only from the allowlisted Fake Store image host, limited to supported raster formats and 8 MiB, streamed with cancellation on overflow, and returned with `nosniff`.
- Product detail pages provide an enquiry form for customer name, email, phone, and message. The API validates the values and verifies the product before dispatching to the selected email provider.
- The development provider logs enquiries locally. SMTP delivery sends to `SALES_INBOX` and sets the customer's email as `Reply-To`.
- The thank-you state appears only after the backend returns `201`; validation failures return `400`, missing products `404`, and provider failures `502`.
- The enquiry API permits five submissions per IP per 15-minute window and responds with `429` after that limit.

## API Routes

- `GET /health`
- `GET /api/products/featured`
- `GET /api/products`
- `GET /api/products/categories`
- `GET /api/products/category/:category`
- `GET /api/products/search?q=term`
- `GET /api/products/:id`
- `GET /api/products/image/:id`
- `POST /api/enquiries` with JSON fields `productId`, `customerName`, `email`, `phone`, and `message`

## Known Limitations

- Enquiries are not persisted. The development provider logs personally identifiable enquiry data to the API process output; use SMTP configuration when local logging is not appropriate.
- Enquiry rate limiting uses an in-memory, per-process store. It resets on restart and is not shared across replicas. If deployed behind a proxy, configure Express trusted proxies narrowly so client IP-based limits behave correctly.
- Product and category data depend on Fake Store API availability. There is no catalogue cache or pagination.
- SMTP delivery depends on valid deployment-supplied settings and an available SMTP service; no credentials are included in this repository.
- Each uncached image-proxy request looks up the product to obtain its image URL; successful image responses are cached by clients for one day.
- The production frontend build assumes the deployed web app and API share an origin, with `/api` routed to the backend. Deployment configuration is not included.
- This project has no authentication or administration features.