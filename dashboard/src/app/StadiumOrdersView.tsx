import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  MapPin,
  PackageCheck,
  PackageOpen,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import type {
  StadiumOrder,
  StadiumOrdersLinkStatus,
  StadiumOrderStatus,
} from "./stadiumOrders";

type OrderFilter = "active" | "new" | "preparing" | "handoff" | "fulfilled" | "all";

type StadiumOrdersViewProps = {
  orders: StadiumOrder[];
  linkStatus: StadiumOrdersLinkStatus;
  lastReceivedOrderId: string;
  onStatus: (orderId: string, status: StadiumOrderStatus) => void;
  onDelete: (orderId: string) => void;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const statusLabels: Record<StadiumOrderStatus, string> = {
  new: "New order",
  preparing: "Preparing",
  ready: "Ready for pickup",
  "out-for-delivery": "Out for delivery",
  fulfilled: "Fulfilled",
};

const linkCopy: Record<StadiumOrdersLinkStatus, { label: string; detail: string }> = {
  live: { label: "Shared order feed live", detail: "Receiving orders from every connected kiosk" },
  connecting: { label: "Connecting to order feed", detail: "Loading the shared ballpark queue" },
  reconnecting: { label: "Syncing order feed", detail: "The local order queue remains available" },
  offline: { label: "Order feed offline", detail: "Changes will sync automatically when the connection returns" },
};

function formatElapsed(timestamp: string, now: number) {
  const elapsedMinutes = Math.max(0, Math.floor((now - new Date(timestamp).getTime()) / 60000));
  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;
  return minutes ? `${hours}h ${minutes}m ago` : `${hours}h ago`;
}

function nextStatus(order: StadiumOrder): StadiumOrderStatus | null {
  if (order.status === "new") return "preparing";
  if (order.status === "preparing") return order.service === "suite" ? "out-for-delivery" : "ready";
  if (order.status === "ready" || order.status === "out-for-delivery") return "fulfilled";
  return null;
}

function nextActionLabel(order: StadiumOrder) {
  if (order.status === "new") return "Start Preparing";
  if (order.status === "preparing") return order.service === "suite" ? "Send to Suite" : "Mark Ready";
  if (order.status === "ready" || order.status === "out-for-delivery") return "Mark Fulfilled";
  return "Reopen Order";
}

function serviceLabel(order: StadiumOrder) {
  return order.service === "suite" ? "Suite Delivery" : "Concierge Pickup";
}

function statusSteps(order: StadiumOrder) {
  return order.service === "suite"
    ? ["new", "preparing", "out-for-delivery", "fulfilled"] as StadiumOrderStatus[]
    : ["new", "preparing", "ready", "fulfilled"] as StadiumOrderStatus[];
}

export function StadiumOrdersView({
  orders,
  linkStatus,
  lastReceivedOrderId,
  onStatus,
  onDelete,
}: StadiumOrdersViewProps) {
  const [filter, setFilter] = useState<OrderFilter>("active");
  const [query, setQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<StadiumOrder | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!lastReceivedOrderId) return;
    setFilter("active");
    setSelectedOrderId(lastReceivedOrderId);
  }, [lastReceivedOrderId]);

  const counts = useMemo(() => ({
    active: orders.filter((order) => order.status !== "fulfilled").length,
    new: orders.filter((order) => order.status === "new").length,
    preparing: orders.filter((order) => order.status === "preparing").length,
    handoff: orders.filter((order) => order.status === "ready" || order.status === "out-for-delivery").length,
    fulfilled: orders.filter((order) => order.status === "fulfilled").length,
    all: orders.length,
  }), [orders]);

  const activeValue = useMemo(
    () => orders.filter((order) => order.status !== "fulfilled").reduce((total, order) => total + order.total, 0),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return orders
      .filter((order) => {
        if (filter === "active" && order.status === "fulfilled") return false;
        if (filter === "new" && order.status !== "new") return false;
        if (filter === "preparing" && order.status !== "preparing") return false;
        if (filter === "handoff" && order.status !== "ready" && order.status !== "out-for-delivery") return false;
        if (filter === "fulfilled" && order.status !== "fulfilled") return false;
        if (!normalizedQuery) return true;

        return [
          order.reference,
          order.customer.name,
          order.customer.phone,
          order.fulfillment.location,
          ...order.items.map((item) => item.name),
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filter, orders, query]);

  useEffect(() => {
    if (filteredOrders.some((order) => order.id === selectedOrderId)) return;
    setSelectedOrderId(filteredOrders[0]?.id ?? "");
  }, [filteredOrders, selectedOrderId]);

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;
  const selectedNextStatus = selectedOrder ? nextStatus(selectedOrder) : null;
  const filters: Array<{ id: OrderFilter; label: string }> = [
    { id: "active", label: "Active" },
    { id: "new", label: "New" },
    { id: "preparing", label: "Preparing" },
    { id: "handoff", label: "Ready / Delivery" },
    { id: "fulfilled", label: "Fulfilled" },
    { id: "all", label: "All" },
  ];
  const currentLink = linkCopy[linkStatus];

  return (
    <div className="stadium-orders-page">
      <section className="orders-command-band">
        <div className="orders-command-title">
          <span className={`orders-live-indicator status-${linkStatus}`}><i /><BellRing size={18} /> {currentLink.label}</span>
          <h2>Wrigley Field fulfillment command center</h2>
          <p>{currentLink.detail}. Fulfilled orders leave the active queue and remain available until staff deletes them.</p>
        </div>
        <div className="orders-command-metrics">
          <div><span>Active orders</span><strong>{counts.active}</strong><small>Pickup and suite delivery</small></div>
          <div><span>Needs attention</span><strong>{counts.new}</strong><small>New orders awaiting action</small></div>
          <div><span>Ready / en route</span><strong>{counts.handoff}</strong><small>Guest notification stage</small></div>
          <div><span>Active order value</span><strong>{money.format(activeValue)}</strong><small>Estimated kiosk total</small></div>
        </div>
      </section>

      <section className="orders-toolbar" aria-label="Order queue controls">
        <div className="order-filters">
          {filters.map((item) => (
            <button
              key={item.id}
              className={filter === item.id ? "active" : ""}
              onClick={() => setFilter(item.id)}
              aria-pressed={filter === item.id}
            >
              {item.label}<span>{counts[item.id]}</span>
            </button>
          ))}
        </div>
        <label className="orders-search">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer, reference, item or location" />
          {query && <button type="button" aria-label="Clear order search" onClick={() => setQuery("")}><X size={15} /></button>}
        </label>
      </section>

      <section className="orders-workspace">
        <div className="order-queue-panel">
          <header>
            <div><span>Live queue</span><strong>{filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"}</strong></div>
            <small>Newest first</small>
          </header>

          <div className="order-queue-list">
            {filteredOrders.length ? filteredOrders.map((order) => (
              <article
                key={order.id}
                className={`order-queue-card status-${order.status} ${selectedOrderId === order.id ? "selected" : ""} ${lastReceivedOrderId === order.id ? "just-arrived" : ""}`}
              >
                <button className="order-queue-select" onClick={() => setSelectedOrderId(order.id)}>
                  <div className="order-queue-card-top">
                    <span className={`order-status-pill status-${order.status}`}><i />{statusLabels[order.status]}</span>
                    <time>{formatElapsed(order.createdAt, now)}</time>
                  </div>
                  <div className="order-queue-card-main">
                    <span className="order-service-icon">{order.service === "suite" ? <Truck size={21} /> : <PackageCheck size={21} />}</span>
                    <div><strong>{order.customer.name}</strong><span>{serviceLabel(order)} · {order.fulfillment.location}</span></div>
                    <b>{money.format(order.total)}</b>
                  </div>
                  <div className="order-queue-card-bottom">
                    <span>{order.reference}</span><span>{order.itemCount} item{order.itemCount === 1 ? "" : "s"}</span><ChevronRight size={16} />
                  </div>
                </button>
                <button className="order-quick-delete" title="Delete order" aria-label={`Delete ${order.reference}`} onClick={() => setDeleteCandidate(order)}><Trash2 size={16} /></button>
              </article>
            )) : (
              <div className="orders-empty-state">
                <PackageOpen size={52} />
                <strong>{orders.length ? "No orders match this view" : "Waiting for the next ballpark order"}</strong>
                <p>{orders.length ? "Change the filter or clear the search." : "Pickup and suite-delivery orders will appear here as soon as they are submitted on the kiosk."}</p>
              </div>
            )}
          </div>
        </div>

        <aside className="order-detail-panel" aria-live="polite">
          {selectedOrder ? (
            <>
              <header className="order-detail-header">
                <div>
                  <span>{serviceLabel(selectedOrder)}</span>
                  <h3>{selectedOrder.reference}</h3>
                  <p><Clock3 size={14} /> Received {new Date(selectedOrder.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                </div>
                <span className={`order-status-pill status-${selectedOrder.status}`}><i />{statusLabels[selectedOrder.status]}</span>
              </header>

              <div className="order-progress" aria-label="Fulfillment progress">
                {statusSteps(selectedOrder).map((status, index, steps) => {
                  const currentIndex = steps.indexOf(selectedOrder.status);
                  const complete = index <= currentIndex;
                  return <div key={status} className={complete ? "complete" : ""}><span>{complete ? <Check size={14} /> : index + 1}</span><small>{statusLabels[status]}</small></div>;
                })}
              </div>

              <div className="order-contact-grid">
                <section>
                  <span><UserRound size={17} /> Customer</span>
                  <strong>{selectedOrder.customer.name}</strong>
                  <a href={`tel:${selectedOrder.customer.phone}`}><Phone size={15} /> {selectedOrder.customer.phone}</a>
                </section>
                <section>
                  <span><MapPin size={17} /> Fulfillment</span>
                  <strong>{selectedOrder.fulfillment.location}</strong>
                  <p>{selectedOrder.fulfillment.instructions}</p>
                </section>
              </div>

              <section className="order-items-section">
                <header><span><ShoppingBag size={17} /> Order items</span><strong>{selectedOrder.itemCount} total</strong></header>
                <div className="order-item-list">
                  {selectedOrder.items.map((item) => (
                    <article key={`${item.id}-${item.size}`}>
                      <img src={item.image} alt="" />
                      <div><strong>{item.name}</strong><span>Size {item.size} · Quantity {item.quantity}</span></div>
                      <b>{money.format(item.unitPrice * item.quantity)}</b>
                    </article>
                  ))}
                </div>
              </section>

              <div className="order-financials">
                <div><span>Subtotal</span><strong>{money.format(selectedOrder.subtotal)}</strong></div>
                <div><span>Estimated tax</span><strong>{money.format(selectedOrder.tax)}</strong></div>
                <div className="total"><span>Estimated total</span><strong>{money.format(selectedOrder.total)}</strong></div>
              </div>

              <footer className="order-detail-actions">
                <button className="order-delete-action" onClick={() => setDeleteCandidate(selectedOrder)}><Trash2 size={17} /> Delete</button>
                <button
                  className="order-progress-action"
                  onClick={() => onStatus(selectedOrder.id, selectedNextStatus ?? "new")}
                >
                  {selectedOrder.status === "fulfilled" ? <CircleDot size={18} /> : selectedNextStatus === "fulfilled" ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
                  {nextActionLabel(selectedOrder)}
                </button>
              </footer>
            </>
          ) : (
            <div className="order-detail-empty"><PackageOpen size={58} /><strong>Select an order</strong><span>Customer, item and fulfillment details will appear here.</span></div>
          )}
        </aside>
      </section>

      {deleteCandidate && (
        <div className="order-delete-overlay">
          <section className="order-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-order-title">
            <span><Trash2 size={28} /></span>
            <div><small>Delete ballpark order</small><h3 id="delete-order-title">Remove {deleteCandidate.reference}?</h3></div>
            <p>This permanently removes {deleteCandidate.customer.name}'s order from this dashboard. This action cannot be undone.</p>
            <div>
              <button onClick={() => setDeleteCandidate(null)}>Keep Order</button>
              <button onClick={() => { onDelete(deleteCandidate.id); setDeleteCandidate(null); }}>Delete Order</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
