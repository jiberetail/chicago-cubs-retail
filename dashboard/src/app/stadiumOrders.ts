import { useCallback, useEffect, useRef, useState } from "react";

const ORDERS_KEY = "jibe-cubs-ballpark-orders-v2";
const ORDER_CHANNEL = "jibe-cubs-ballpark-orders-v2";

export type StadiumOrderService = "concierge" | "suite";
export type StadiumOrderStatus = "new" | "preparing" | "ready" | "out-for-delivery" | "fulfilled";
export type StadiumOrdersLinkStatus = "connecting" | "live" | "reconnecting" | "offline";

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

function isStadiumOrder(value: unknown): value is StadiumOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<StadiumOrder>;
  return order.version === 1
    && typeof order.id === "string"
    && typeof order.reference === "string"
    && Array.isArray(order.items)
    && typeof order.total === "number";
}

function newestFirst(left: StadiumOrder, right: StadiumOrder) {
  return Date.parse(right.createdAt) - Date.parse(left.createdAt);
}

function readStoredOrders(): StadiumOrder[] {
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isStadiumOrder).sort(newestFirst) : [];
  } catch {
    return [];
  }
}

function writeStoredOrders(orders: StadiumOrder[]) {
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function useStadiumOrders() {
  const [orders, setOrders] = useState<StadiumOrder[]>(readStoredOrders);
  const [linkStatus, setLinkStatus] = useState<StadiumOrdersLinkStatus>("connecting");
  const [lastReceivedOrderId, setLastReceivedOrderId] = useState("");
  const ordersRef = useRef(orders);

  const replaceOrders = useCallback((nextOrders: StadiumOrder[]) => {
    const sortedOrders = [...nextOrders].sort(newestFirst);
    ordersRef.current = sortedOrders;
    setOrders(sortedOrders);
    try {
      writeStoredOrders(sortedOrders);
      setLinkStatus("live");
    } catch {
      setLinkStatus("offline");
    }
  }, []);

  useEffect(() => {
    replaceOrders(readStoredOrders());

    const refreshFromStorage = () => {
      const nextOrders = readStoredOrders();
      const incoming = nextOrders.find((order) => !ordersRef.current.some((current) => current.id === order.id));
      if (incoming) setLastReceivedOrderId(incoming.id);
      ordersRef.current = nextOrders;
      setOrders(nextOrders);
      setLinkStatus("live");
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ORDERS_KEY) refreshFromStorage();
    };

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(ORDER_CHANNEL);
      channel.onmessage = refreshFromStorage;
    } catch {
      channel = null;
    }

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      channel?.close();
    };
  }, [replaceOrders]);

  const updateOrderStatus = useCallback((orderId: string, status: StadiumOrderStatus) => {
    const nextOrders = ordersRef.current.map((order) => order.id === orderId
      ? { ...order, status, updatedAt: new Date().toISOString() }
      : order);
    replaceOrders(nextOrders);
  }, [replaceOrders]);

  const deleteOrder = useCallback((orderId: string) => {
    replaceOrders(ordersRef.current.filter((order) => order.id !== orderId));
  }, [replaceOrders]);

  return { orders, linkStatus, lastReceivedOrderId, updateOrderStatus, deleteOrder };
}
