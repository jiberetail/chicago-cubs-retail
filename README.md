# Chicago Cubs Retail Experience

Copied survey and dashboard with Cubs branding. Public URL must be organization-owned and contain no personal name.

- /survey/ — merchandise, feedback, and assisted ordering.
- /dashboard/ — demo analytics and device-local order queue.

Orders synchronize between tabs on the same browser using localStorage; no live Cubs sales integration is configured. MLB Shop checkout opens the actual product page; baskets do not transfer.

The September 8, 2026 catalog snapshot contains 4,526 distinct products across 24 merchandise departments. All accessible category pages were traversed, titles and prices audited, and product photos resolved from the official store. Listings overlap and change during collection; this is a snapshot, not a live inventory feed. Customers may request a size or option; MLB Shop confirms final availability and payment.

Public survey: https://jiberetail.github.io/chicago-cubs-retail/survey/

Public dashboard: https://jiberetail.github.io/chicago-cubs-retail/dashboard/

Build the survey then dashboard, then run node scripts/assemble.mjs.
