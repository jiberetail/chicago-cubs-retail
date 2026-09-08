# Chicago Cubs Retail Experience

Copied survey and dashboard with Cubs branding. Public URL must be organization-owned and contain no personal name.

- /survey/ — merchandise, feedback, and assisted ordering.
- /dashboard/ — demo analytics and device-local order queue.

Orders synchronize between tabs on the same browser using localStorage; no live Cubs sales integration is configured. MLB Shop checkout opens the actual product page; baskets do not transfer.

The September 8, 2026 catalog snapshot contains 4,526 distinct products across 24 merchandise departments. Product options come from MLB Shop's structured product variants. The survey uses the reference size buttons, quantity controls, and Add to Basket flow. Availability is an import-time snapshot, not a live inventory feed; the numeric inventory values are selectable flags, not stock quantities.

Collect options with `node --max-old-space-size=128 scripts/collect-mlb-options.mjs`, then `node scripts/import-mlb-options.mjs mlb-options.json`. Collection caches completed records and uses two concurrent requests; add `--refresh` to fetch a new snapshot. MLB Shop blocks GitHub-hosted collection, so run this from a network that can access the public product pages. The importer requires coverage of the entire catalog, and the release checks reject placeholder options.

Public survey: https://jiberetail.github.io/chicago-cubs-retail/survey/

Public dashboard: https://jiberetail.github.io/chicago-cubs-retail/dashboard/

Build the survey then dashboard, then run node scripts/assemble.mjs.
