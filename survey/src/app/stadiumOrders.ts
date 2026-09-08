const ORDERS_KEY = "jibe-cubs-ballpark-orders-v2";
const ORDER_CHANNEL = "jibe-cubs-ballpark-orders-v2";

export type StadiumOrderService = "concierge" | "suite";
export type StadiumOrderStatus = "new" | "preparing" | "ready" | "out-for-delivery" | "fulfilled";

export type StadiumOrderItem = {
  id: string;
  name: string;
  image: string;
  size: string;
  quantity: number;
  unitPrice: number;
};

export type StadiumOrder = {
  version: 1;
  id: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
  kioskId: string;
  service: StadiumOrderService;
  status: StadiumOrderStatus;
  customer: { name: string; phone: string };
  fulfillment: { location: string; instructions: string };
  items: StadiumOrderItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
};

export type StadiumOrderDeliveryResult = "delivered" | "queued";

function readOrders(): StadiumOrder[] {
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as StadiumOrder[] : [];
  } catch {
    return [];
  }
}

function announceOrder(order: StadiumOrder) {
  try {
    const channel = new BroadcastChannel(ORDER_CHANNEL);
    channel.postMessage({ kind: "upsert", order });
    channel.close();
  } catch {
    // Storage events still keep another open dashboard in sync.
  }
}

export async function submitStadiumOrder(order: StadiumOrder): Promise<StadiumOrderDeliveryResult> {
  const orders = readOrders().filter((item) => item.id !== order.id);
  orders.unshift(order);

  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    announceOrder(order);
    return "delivered";
  } catch {
    return "queued";
  }
}

export async function flushQueuedStadiumOrders() {
  return Promise.resolve();
}
