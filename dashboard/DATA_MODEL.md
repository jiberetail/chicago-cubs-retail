# Dashboard Data Model

The dashboard is organized around the four Version 2 kiosk journeys:

- Concierge merchandise pickup
- Suite delivery
- Ship it home
- Season-ticket interest

## Core Events

| Event | Required fields |
| --- | --- |
| `kiosk_session_started` | session ID, kiosk ID, timestamp, language |
| `service_selected` | session ID, service, timestamp |
| `product_viewed` | session ID, product ID, category, price |
| `cart_updated` | session ID, product ID, quantity, cart value |
| `checkout_started` | session ID, service, cart value |
| `order_confirmed` | session ID, order ID, service, revenue, fulfillment time |
| `ticket_interest_submitted` | session ID, lead ID, qualification status |
| `feedback_submitted` | session ID, rating, associate rating, feedback themes |

## Financial Definitions

- **Attributed GMV:** confirmed merchandise revenue completed through a kiosk journey.
- **Incremental GMV:** attributed GMV multiplied by the approved incrementality rate.
- **Gross profit:** incremental GMV multiplied by merchandise gross margin.
- **Net contribution:** gross profit minus kiosk program cost.
- **Gross return multiple:** gross profit divided by kiosk program cost.
- **Season-ticket pipeline:** qualified lead value tracked separately and excluded from retail ROI.

The current client build uses a deterministic sample dataset shaped to this
contract. A production event pipeline can replace the sample source without
changing the dashboard views or KPI definitions.
