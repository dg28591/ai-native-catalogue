# Decisions

## Workspace and boundaries

The project uses npm workspaces with `apps/web` and `apps/api`. The web app owns presentation and browser routing; the API owns product retrieval, search, ranking, validation, and external requests. Frontend and backend define their own product types to avoid adding a shared-package build step for this small application.

## Product provider

The API depends on a `ProductProvider` interface. `FakeStoreProductProvider` is the current implementation and validates upstream JSON before returning typed product data. Routes depend on the interface, which permits deterministic route tests and a future provider replacement without changing the route contract.

Featured products are sorted by rating descending, with product ID as a deterministic tie-breaker, and limited to five. Category results are deduplicated and ordered with their five highest-rated products first. Search matching is case-insensitive across title, description, and category.

## Browser API access and images

The browser uses the same-origin `/api` base path. Vite proxies that path to the API during local development. Product image URLs from Fake Store are not used directly by the browser: the API looks up the product and proxies the image only from `https://fakestoreapi.com/img/`. Redirects are rejected, only JPEG, PNG, WebP, and GIF are accepted, response streaming is capped at 8 MiB, and successful responses include `X-Content-Type-Options: nosniff` and a one-day cache directive.

The image proxy currently performs a product lookup for each uncached image request. This favors a narrow allowlisted interface over accepting arbitrary image URLs, at the cost of extra upstream requests.

## Errors and tests

The API returns structured client errors for invalid input, 404 for missing products/categories, and 502 for typed provider failures. Frontend pages expose loading, error/retry, and empty states. API route tests mock the provider; direct Fake Store adapter tests inject a mock `fetch`, so automated tests do not require external network access.

## Enquiries and email

The enquiry route validates the product ID and customer fields on the backend, confirms the product exists, and responds with `201` only after the selected `EmailProvider` completes. The frontend repeats field validation for immediate feedback and displays its thank-you state only after that response. Field limits are name 2–100 characters, email up to 254 characters, phone 7–15 digits (with common formatting punctuation), and message 10–2000 characters.

`EMAIL_PROVIDER=development` is the default and logs the enquiry locally without sending email. `EMAIL_PROVIDER=smtp` creates a Nodemailer SMTP transport from environment variables and sends to `SALES_INBOX`; the customer's email is used as `Reply-To`. SMTP failures are converted to a generic provider error so transport details are not sent to the browser. SMTP credentials are never stored in source files.

Production requires an explicit `EMAIL_PROVIDER=smtp` configuration; missing, invalid, or development provider selection fails during startup rather than silently accepting enquiries without email delivery. The public enquiry endpoint is limited to five submissions per IP in a 15-minute in-memory window. This simple store is suitable for the single-process take-home app but resets on restart and is not shared across replicas.

Enquiries are not persisted. The development logger includes customer contact details and should be treated as local-only. Authentication, administration, and deployment infrastructure remain out of scope.