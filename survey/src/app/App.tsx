import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Frown,
  Gift,
  Grid3X3,
  Home,
  Languages,
  Mail,
  MapPin,
  Meh,
  MessageSquareText,
  PackageCheck,
  Percent,
  Phone,
  QrCode,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smile,
  Smartphone,
  Ticket,
  ThumbsUp,
  Truck,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { motion, useReducedMotion } from "motion/react";
import logoSrc from "../imports/Chicago-Cubs-Logo.svg";
import categoryHat from "../imports/category-hat.jpg";
import categoryJersey from "../imports/category-jersey.png";
import categoryHoodie from "../imports/category-hoodie.png";
import categoryTshirt from "../imports/category-tshirt.png";
import shopCatalogData from "../data/cubs-store-catalog.json";
import { useV2Language, type V2Translate } from "./contexts/V2LanguageContext";
import {
  flushQueuedStadiumOrders,
  submitStadiumOrder,
  type StadiumOrder,
} from "./stadiumOrders";

const STAGE_WIDTH = 1080;
const STAGE_HEIGHT = 1920;
const cubsDeepSea = "#0E3386";
const ticketUrl = "https://www.mlb.com/cubs/tickets";
const cubsShopCartUrl = "https://www.mlbshop.com/chicago-cubs/o-7876+t-03665322+z-8647-1125435766";

type Flow = "concierge" | "suite" | "tickets" | "feedback" | "ship";
type MerchFlow = Extract<Flow, "concierge" | "suite" | "ship">;
type Screen =
  | "home"
  | "category"
  | "departments"
  | "products"
  | "detail"
  | "basket"
  | "fulfillment"
  | "contact"
  | "checkout"
  | "order-confirm"
  | "survey-experience"
  | "survey-associate-help"
  | "survey-associate-rating"
  | "survey-found-everything"
  | "survey-improve"
  | "survey-missing-item"
  | "survey-email"
  | "survey-discount-confirm"
  | "inventory-error"
  | "ticket-start"
  | "ticket-lead"
  | "ticket-qr"
  | "ticket-confirm"
  | "feedback-start"
  | "lost-demand"
  | "experience"
  | "associate"
  | "feedback-confirm";

type ProductCategory = "hats" | "jerseys" | "sweatshirts" | "tshirts";
type CatalogProductCategory = ProductCategory | "all";

type Department = {
  id: string;
  label: string;
  count: number;
  resourceId: number;
  sourceUrl: string;
};

type Product = {
  id: string;
  sourceId?: string;
  category: CatalogProductCategory;
  categories: ProductCategory[];
  departments: string[];
  departmentLabels: string[];
  name: string;
  style: string;
  price: number;
  regularPrice?: number;
  priceDisplay?: string;
  image: string;
  sourceUrl?: string;
  badges?: string[];
  genderFit: string;
  optionLabel?: string;
  sizes: string[];
  unavailableSizes?: string[];
  inventory: Record<string, number>;
};

type ShopCatalog = {
  generatedAt: string;
  sourceUrl: string;
  totalProductCount: number;
  catalogProductCount: number;
  seededProductCount: number;
  mainCategories: Array<Department & { id: ProductCategory }>;
  departments: Department[];
  products: Product[];
};

type CartLine = {
  product: Product;
  size: string;
  quantity: number;
};

type FlowCard = {
  flow: Flow;
  title: string;
  eyebrow: string;
  description: string;
  action: string;
  Icon: LucideIcon;
};

type WebMCPContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: Record<string, unknown>;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};

const shopCatalog = shopCatalogData as ShopCatalog;
const products = shopCatalog.products;
const mainCategories = shopCatalog.mainCategories;
const categoryLabels = Object.fromEntries(
  mainCategories.map((category) => [category.id, category.label]),
) as Record<ProductCategory, string>;

const flowCards: FlowCard[] = [
  {
    flow: "concierge",
    eyebrow: "Merchandise pickup",
    title: "Concierge Pickup",
    description: "Shop Cubs gear now and pick it up at a nearby merchandise desk.",
    action: "Start Pickup Order",
    Icon: PackageCheck,
  },
  {
    flow: "suite",
    eyebrow: "Premium service",
    title: "Suite Delivery",
    description: "Send merchandise directly to your suite during the game.",
    action: "Deliver to Suite",
    Icon: Bell,
  },
  {
    flow: "ship",
    eyebrow: "Home delivery",
    title: "Ship to Home",
    description: "Buy through the ballpark kiosk and have your order shipped after the game.",
    action: "Build Ship Order",
    Icon: Truck,
  },
  {
    flow: "tickets",
    eyebrow: "Cubs ticketing",
    title: "Season Tickets",
    description: "View opportunities or request contact from a Cubs representative.",
    action: "Explore Tickets",
    Icon: Ticket,
  },
];

const pickupLocations = [
  "Ballpark Concierge Desk",
  "Main Concourse Team Store Pickup",
  "Upper Concourse Merchandise Window",
];

const suiteLocations = ["Suite 212B", "Suite 146A", "Club Level Concierge"];

const lostDemandProducts = products.filter((product) => product.categories.length > 0).slice(0, 6);

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function flowTitle(flow: Flow | null, t: V2Translate) {
  if (flow === "concierge") return t("Concierge Merchandise Pickup");
  if (flow === "suite") return t("Suite Delivery");
  if (flow === "ship") return t("Ship-to-Home Ordering");
  if (flow === "tickets") return t("Season-Ticket Interest");
  if (flow === "feedback") return t("Cubs Merchandise Feedback");
  return t("Cubs Retail Kiosk");
}

function fulfillmentLabel(flow: MerchFlow | null, t: V2Translate) {
  if (flow === "suite") return t("Delivery to suite");
  if (flow === "ship") return t("Ship to home");
  return t("Pickup at ballpark desk");
}

function merchandiseBadgeLabel(badge: string, t: V2Translate) {
  if (badge.endsWith("% off")) {
    return t("{discount} off", { discount: badge.replace(" off", "") });
  }

  return t(badge);
}

function buildOrderId(flow: Flow | null) {
  const prefix = flow === "tickets" ? "LEAD" : flow === "feedback" ? "DATA" : "CUBS";
  return `${prefix}-${Math.floor(1200 + Math.random() * 7800)}`;
}

function buildStadiumOrderId() {
  const uniqueValue = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `stadium-${uniqueValue}`;
}

export default function App() {
  const [stageScale, setStageScale] = useState(1);
  const [screen, setScreen] = useState<Screen>("home");
  const [activeFlow, setActiveFlow] = useState<Flow | null>(null);
  const [category, setCategory] = useState<ProductCategory>("jerseys");
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0]);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [stadiumOrderId, setStadiumOrderId] = useState(buildStadiumOrderId);
  const [isSubmittingStadiumOrder, setIsSubmittingStadiumOrder] = useState(false);
  const [ticketContactMethod, setTicketContactMethod] = useState("");
  const [lostProduct, setLostProduct] = useState<Product | null>(null);
  const [lostSize, setLostSize] = useState("");
  const [feedbackReason, setFeedbackReason] = useState("");
  const [associateHelp, setAssociateHelp] = useState("");
  const [surveyExperience, setSurveyExperience] = useState("");
  const [surveyAssociateHelp, setSurveyAssociateHelp] = useState("");
  const [surveyAssociateRating, setSurveyAssociateRating] = useState("");
  const [surveyFoundEverything, setSurveyFoundEverything] = useState("");
  const [surveyComment, setSurveyComment] = useState("");
  const [surveyMissingItem, setSurveyMissingItem] = useState("");
  const [surveyEmail, setSurveyEmail] = useState("");
  const [confirmationId, setConfirmationId] = useState(buildOrderId(null));
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);

  useEffect(() => {
    const fitStageToViewport = () => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      setStageScale(Math.max(0, Math.min(1, (window.innerWidth - 24) / STAGE_WIDTH, (viewportHeight - 24) / STAGE_HEIGHT)));
    };

    fitStageToViewport();
    window.addEventListener("resize", fitStageToViewport);
    window.visualViewport?.addEventListener("resize", fitStageToViewport);
    return () => {
      window.removeEventListener("resize", fitStageToViewport);
      window.visualViewport?.removeEventListener("resize", fitStageToViewport);
    };
  }, []);

  useEffect(() => {
    const flushOrders = () => {
      void flushQueuedStadiumOrders();
    };
    const intervalId = window.setInterval(flushOrders, 4000);

    flushOrders();
    window.addEventListener("online", flushOrders);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("online", flushOrders);
    };
  }, []);

  const merchFlow = activeFlow === "concierge" || activeFlow === "suite" || activeFlow === "ship" ? activeFlow : null;
  const visibleProducts = useMemo(() => {
    if (selectedDepartment) {
      return products.filter((product) => product.departments.includes(selectedDepartment.id));
    }

    return products.filter((product) => product.categories.includes(category));
  }, [category, selectedDepartment]);
  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const deliveryFee = activeFlow === "ship" ? 8.95 : activeFlow === "suite" ? 0 : 0;
  const tax = subtotal * 0.06625;
  const total = subtotal + deliveryFee + tax;
  const orderId = confirmationId;

  const goHome = () => {
    setScreen("home");
    setActiveFlow(null);
    setCart([]);
    setSelectedProduct(products[0]);
    setSelectedDepartment(null);
    setSelectedSize("");
    setQuantity(1);
    setSelectedLocation("");
    setCustomerName("");
    setCustomerPhone("");
    setIsSubmittingStadiumOrder(false);
    setTicketContactMethod("");
    setLostProduct(null);
    setLostSize("");
    setFeedbackReason("");
    setAssociateHelp("");
    setSurveyExperience("");
    setSurveyAssociateHelp("");
    setSurveyAssociateRating("");
    setSurveyFoundEverything("");
    setSurveyComment("");
    setSurveyMissingItem("");
    setSurveyEmail("");
    setShowStartOverDialog(false);
  };

  const requestHome = () => {
    if (cart.length) {
      setShowStartOverDialog(true);
      return;
    }

    goHome();
  };

  const startFlow = (flow: Flow) => {
    setActiveFlow(flow);
    setCart([]);
    setQuantity(1);
    setSelectedSize("");
    setSelectedLocation("");
    setCustomerName("");
    setCustomerPhone("");
    setStadiumOrderId(buildStadiumOrderId());
    setIsSubmittingStadiumOrder(false);
    setTicketContactMethod("");
    setLostProduct(null);
    setLostSize("");
    setFeedbackReason("");
    setAssociateHelp("");
    setSurveyExperience("");
    setSurveyAssociateHelp("");
    setSurveyAssociateRating("");
    setSurveyFoundEverything("");
    setSurveyComment("");
    setSurveyMissingItem("");
    setSurveyEmail("");
    setConfirmationId(buildOrderId(flow));
    if (flow === "tickets") {
      setScreen("ticket-start");
      return;
    }
    if (flow === "feedback") {
      setScreen("feedback-start");
      return;
    }
    setCategory("hats");
    setSelectedDepartment(null);
    setScreen("category");
  };

  useEffect(() => {
    const context = (document as Document & { modelContext?: WebMCPContext }).modelContext;
    if (!context?.registerTool) return;

    const lifecycle = new AbortController();
    const validServices: MerchFlow[] = ["concierge", "suite", "ship"];
    const validCategories: ProductCategory[] = ["hats", "jerseys", "sweatshirts", "tshirts"];

    try {
      void Promise.resolve(context.registerTool({
        name: "start_cubs_merchandise_order",
        title: "Start Cubs merchandise order",
        description: "Start a Chicago Cubs kiosk merchandise journey and open the requested MLB Shop Cubs Store category.",
        inputSchema: {
          type: "object",
          properties: {
            service: { type: "string", enum: validServices },
            category: { type: "string", enum: validCategories },
          },
          required: ["service", "category"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (!input || typeof input !== "object") throw new Error("A service and category are required.");
          const { service, category: requestedCategory } = input as { service?: string; category?: string };
          if (!validServices.includes(service as MerchFlow)) throw new Error("Unsupported fulfillment service.");
          if (!validCategories.includes(requestedCategory as ProductCategory)) throw new Error("Unsupported merchandise category.");

          startFlow(service as MerchFlow);
          setCategory(requestedCategory as ProductCategory);
          setScreen("products");
          return { screen: "products", service, category: requestedCategory };
        },
      }, { signal: lifecycle.signal })).catch(() => undefined);
    } catch {
      return;
    }

    return () => lifecycle.abort();
  }, []);

  const back = () => {
    if (screen === "home") return;
    if (screen === "category" || screen === "ticket-start" || screen === "feedback-start") {
      goHome();
      return;
    }
    if (screen === "departments") setScreen("category");
    else if (screen === "products") setScreen(selectedDepartment ? "departments" : "category");
    else if (screen === "detail") setScreen("products");
    else if (screen === "basket") setScreen("products");
    else if (screen === "fulfillment") setScreen("basket");
    else if (screen === "contact") setScreen("fulfillment");
    else if (screen === "checkout") setScreen(activeFlow === "ship" ? "basket" : "contact");
    else if (screen === "order-confirm") setScreen("checkout");
    else if (screen === "survey-experience") setScreen("order-confirm");
    else if (screen === "survey-associate-help") setScreen(surveyExperience === "positive" ? "survey-experience" : "survey-improve");
    else if (screen === "survey-associate-rating") setScreen("survey-associate-help");
    else if (screen === "survey-found-everything") setScreen(surveyAssociateHelp === "yes" ? "survey-associate-rating" : "survey-associate-help");
    else if (screen === "survey-improve") setScreen("survey-experience");
    else if (screen === "survey-missing-item") setScreen("survey-found-everything");
    else if (screen === "survey-email") {
      if (surveyFoundEverything === "no") setScreen("survey-missing-item");
      else setScreen("survey-found-everything");
    }
    else if (screen === "survey-discount-confirm") setScreen("survey-email");
    else if (screen === "inventory-error") setScreen("detail");
    else if (screen === "ticket-lead" || screen === "ticket-qr") setScreen("ticket-start");
    else if (screen === "ticket-confirm") setScreen("ticket-lead");
    else if (screen === "lost-demand") setScreen("feedback-start");
    else if (screen === "experience") setScreen("lost-demand");
    else if (screen === "associate") setScreen("experience");
    else if (screen === "feedback-confirm") setScreen("associate");
  };

  const addProductToCart = () => {
    if (!selectedSize) return;

    setCart((currentCart) => {
      const existing = currentCart.find(
        (line) => line.product.id === selectedProduct.id && line.size === selectedSize,
      );
      if (existing) {
        return currentCart.map((line) =>
          line.product.id === selectedProduct.id && line.size === selectedSize
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        );
      }
      return [...currentCart, { product: selectedProduct, size: selectedSize, quantity }];
    });
    setScreen("basket");
  };

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize("");
    setQuantity(1);
    setScreen("detail");
  };

  const submitCurrentStadiumOrder = async () => {
    if ((activeFlow !== "concierge" && activeFlow !== "suite") || isSubmittingStadiumOrder) return;

    const now = new Date().toISOString();
    const order: StadiumOrder = {
      version: 1,
      id: stadiumOrderId,
      reference: confirmationId,
      createdAt: now,
      updatedAt: now,
      kioskId: "Wrigley Field Kiosk 01",
      service: activeFlow,
      status: "new",
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
      },
      fulfillment: {
        location: selectedLocation,
        instructions: activeFlow === "suite"
          ? "Text when the order is on the way to the suite"
          : "Text when the order is ready for pickup",
      },
      items: cart.map((line) => ({
        id: line.product.id,
        name: line.product.name,
        image: line.product.image,
        size: line.size,
        quantity: line.quantity,
        unitPrice: line.product.price,
      })),
      itemCount: cart.reduce((count, line) => count + line.quantity, 0),
      subtotal,
      tax,
      total,
    };

    setIsSubmittingStadiumOrder(true);
    try {
      await submitStadiumOrder(order);
      setScreen("checkout");
    } finally {
      setIsSubmittingStadiumOrder(false);
    }
  };

  const renderContent = () => {
    switch (screen) {
      case "home":
        return <HomeScreen onStart={startFlow} />;
      case "category":
        return (
          <CategoryScreen
            activeFlow={merchFlow}
            cartCount={cart.length}
            categories={mainCategories}
            onSelectCategory={(nextCategory) => {
              setCategory(nextCategory);
              setSelectedDepartment(null);
              setScreen("products");
            }}
            onAllDepartments={() => setScreen("departments")}
          />
        );
      case "departments":
        return (
          <DepartmentsScreen
            departments={shopCatalog.departments}
            onSelectDepartment={(department) => {
              setSelectedDepartment(department);
              setScreen("products");
            }}
          />
        );
      case "products":
        return (
          <ProductsScreen
            category={category}
            department={selectedDepartment}
            products={visibleProducts}
            onSelectProduct={selectProduct}
            onBackToSelection={() => setScreen(selectedDepartment ? "departments" : "category")}
            onBasket={() => setScreen("basket")}
          />
        );
      case "detail":
        return (
          <DetailScreen
            activeFlow={merchFlow}
            product={selectedProduct}
            selectedSize={selectedSize}
            quantity={quantity}
            onSelectSize={(size) => {
              if (selectedProduct.inventory[size] === 0) setScreen("inventory-error");
              else setSelectedSize(size);
            }}
            onQuantityChange={setQuantity}
            onAdd={addProductToCart}
          />
        );
      case "basket":
        return (
          <BasketScreen
            activeFlow={merchFlow}
            cart={cart}
            subtotal={subtotal}
            total={total}
            deliveryFee={deliveryFee}
            onContinueShopping={() => setScreen("category")}
            onRemove={(index) => setCart((currentCart) => currentCart.filter((_, itemIndex) => itemIndex !== index))}
            onNext={() => setScreen(activeFlow === "ship" ? "checkout" : "fulfillment")}
          />
        );
      case "fulfillment":
        return (
          <FulfillmentScreen
            activeFlow={merchFlow}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
            onNext={() => setScreen("contact")}
          />
        );
      case "contact":
        return (
          <StadiumContactScreen
            activeFlow={merchFlow}
            name={customerName}
            phone={customerPhone}
            selectedLocation={selectedLocation}
            total={total}
            isSubmitting={isSubmittingStadiumOrder}
            onName={setCustomerName}
            onPhone={setCustomerPhone}
            onSubmit={submitCurrentStadiumOrder}
          />
        );
      case "checkout":
        return (
          <CheckoutHandoffScreen
            activeFlow={merchFlow}
            cart={cart}
            total={total}
            orderId={orderId}
            selectedLocation={selectedLocation}
            onComplete={() => setScreen("order-confirm")}
          />
        );
      case "order-confirm":
        return (
          <OrderConfirmationScreen
            activeFlow={merchFlow}
            cart={cart}
            total={total}
            orderId={orderId}
            selectedLocation={selectedLocation}
            onClose={goHome}
            onTakeSurvey={() => {
              setSurveyExperience("");
              setSurveyAssociateHelp("");
              setSurveyAssociateRating("");
              setSurveyFoundEverything("");
              setSurveyComment("");
              setSurveyMissingItem("");
              setSurveyEmail("");
              setScreen("survey-experience");
            }}
          />
        );
      case "survey-experience":
        return (
          <SurveyExperienceScreen
            selected={surveyExperience as SurveySentiment | ""}
            onSelect={setSurveyExperience}
            onContinue={() => {
              setSurveyComment("");
              setScreen(surveyExperience === "positive" ? "survey-associate-help" : "survey-improve");
            }}
          />
        );
      case "survey-associate-help":
        return (
          <SurveyAssociateHelpScreen
            onAnswer={(answer) => {
              setSurveyAssociateHelp(answer);
              setScreen(answer === "yes" ? "survey-associate-rating" : "survey-found-everything");
            }}
          />
        );
      case "survey-associate-rating":
        return (
          <SurveyAssociateRatingScreen
            selected={surveyAssociateRating as SurveySentiment | ""}
            onSelect={setSurveyAssociateRating}
            onContinue={() => setScreen("survey-found-everything")}
          />
        );
      case "survey-found-everything":
        return (
          <SurveyFoundEverythingScreen
            onAnswer={(answer) => {
              setSurveyFoundEverything(answer);
              setSurveyMissingItem("");
              setScreen(answer === "yes" ? "survey-email" : "survey-missing-item");
            }}
          />
        );
      case "survey-improve":
        return (
          <SurveyTextScreen
            kind="improve"
            value={surveyComment}
            onChange={setSurveyComment}
            onContinue={() => setScreen("survey-associate-help")}
          />
        );
      case "survey-missing-item":
        return (
          <SurveyTextScreen
            kind="missing"
            value={surveyMissingItem}
            onChange={setSurveyMissingItem}
            onContinue={() => setScreen("survey-email")}
          />
        );
      case "survey-email":
        return (
          <SurveyEmailScreen
            email={surveyEmail}
            onEmail={setSurveyEmail}
            onSubmit={() => setScreen("survey-discount-confirm")}
          />
        );
      case "survey-discount-confirm":
        return <SurveyDiscountConfirmScreen email={surveyEmail} onDone={goHome} />;
      case "inventory-error":
        return (
          <InventoryErrorScreen
            product={selectedProduct}
            onChooseAlternative={(product) => selectProduct(product)}
            onBackToBasket={() => setScreen(cart.length ? "basket" : "products")}
          />
        );
      case "ticket-start":
        return <TicketStartScreen onLead={() => setScreen("ticket-lead")} onQr={() => setScreen("ticket-qr")} />;
      case "ticket-lead":
        return (
          <TicketLeadScreen
            contactMethod={ticketContactMethod}
            onContactMethod={setTicketContactMethod}
            onSubmit={() => setScreen("ticket-confirm")}
          />
        );
      case "ticket-qr":
        return <TicketQrScreen onLead={() => setScreen("ticket-lead")} />;
      case "ticket-confirm":
        return <TicketConfirmScreen contactMethod={ticketContactMethod} />;
      case "feedback-start":
        return <FeedbackStartScreen onFound={() => setScreen("experience")} onMissing={() => setScreen("lost-demand")} />;
      case "lost-demand":
        return (
          <LostDemandScreen
            product={lostProduct}
            size={lostSize}
            onProduct={setLostProduct}
            onSize={setLostSize}
            onNext={() => setScreen("experience")}
          />
        );
      case "experience":
        return (
          <ExperienceScreen
            reason={feedbackReason}
            onReason={setFeedbackReason}
            onNext={() => setScreen("associate")}
          />
        );
      case "associate":
        return (
          <AssociateScreen
            associateHelp={associateHelp}
            onAssociateHelp={setAssociateHelp}
            onComplete={() => setScreen("feedback-confirm")}
          />
        );
      case "feedback-confirm":
        return (
          <FeedbackConfirmScreen
            product={lostProduct}
            size={lostSize}
            reason={feedbackReason}
            associateHelp={associateHelp}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="v2-shell">
      <div
        className="v2-stage-wrap"
        style={{ width: STAGE_WIDTH * stageScale, height: STAGE_HEIGHT * stageScale }}
      >
        <div
          className="v2-stage"
          style={{ transform: `scale(${stageScale})`, transformOrigin: "top left" }}
        >
          <KioskFrame
            activeFlow={activeFlow}
            screen={screen}
            cartCount={cart.reduce((count, line) => count + line.quantity, 0)}
            onBack={back}
            onHome={requestHome}
          >
            {renderContent()}
          </KioskFrame>
          {showStartOverDialog && (
            <StartOverDialog
              onCancel={() => setShowStartOverDialog(false)}
              onConfirm={goHome}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StartOverDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const { t } = useV2Language();

  return (
    <div className="start-over-overlay">
      <section
        className="start-over-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-over-title"
        aria-describedby="start-over-copy"
      >
        <div className="start-over-icon" aria-hidden="true">
          <AlertTriangle />
        </div>
        <p className="kicker">{t("Start over")}</p>
        <h2 id="start-over-title">{t("Your cart will be cleared")}</h2>
        <p id="start-over-copy">{t("Are you sure you want to start over?")}</p>
        <div className="start-over-actions">
          <button className="keep-cart-action" onClick={onCancel}>{t("Keep My Cart")}</button>
          <button className="clear-cart-action" onClick={onConfirm}>{t("Start Over")}</button>
        </div>
      </section>
    </div>
  );
}

function KioskFrame({
  activeFlow,
  screen,
  cartCount,
  onBack,
  onHome,
  children,
}: {
  activeFlow: Flow | null;
  screen: Screen;
  cartCount: number;
  onBack: () => void;
  onHome: () => void;
  children: ReactNode;
}) {
  const { t } = useV2Language();
  const isHome = screen === "home";
  const isPurchaseSurvey = screen.startsWith("survey-");


  return (
    <div className={isHome ? "kiosk-frame home-mode" : "kiosk-frame"}>
      <div className="cubs-ballpark-background" aria-hidden="true" />
      <div className="kiosk-scrim" />
      {!isHome && (
        <div className="top-nav">
          <button className="round-button" onClick={onBack} aria-label={t("Back")}>
            <ArrowLeft />
          </button>
          <div className="nav-title">
            <img src={logoSrc} alt="Chicago Cubs" />
            <span>{isPurchaseSurvey ? t("10% Fan Survey") : flowTitle(activeFlow, t)}</span>
          </div>
          <button className="round-button" onClick={onHome} aria-label={t("Home")}>
            <Home />
          </button>
        </div>
      )}
      {!isHome && !isPurchaseSurvey && activeFlow !== "tickets" && activeFlow !== "feedback" && (
        <div className="cart-pill">
          <ShoppingCart size={28} />
          <span>{cartCount}</span>
        </div>
      )}
      <main className={isHome ? "screen home-screen" : "screen"}>{children}</main>
    </div>
  );
}

function HomeScreen({ onStart }: { onStart: (flow: Flow) => void }) {
  const { language, setLanguage, t } = useV2Language();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [animationCycle, setAnimationCycle] = useState(0);
  const [isRewinding, setIsRewinding] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) {
      setIsRewinding(false);
      return;
    }

    const fadeTimer = window.setTimeout(() => setIsRewinding(true), 9600);
    const replayTimer = window.setTimeout(() => {
      setAnimationCycle((cycle) => cycle + 1);
      setIsRewinding(false);
    }, 9950);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(replayTimer);
    };
  }, [animationCycle, shouldReduceMotion]);

  return (
    <>
      <motion.div
        key={`cubs-home-content-${animationCycle}`}
        className={isRewinding ? "cubs-home-content is-rewinding" : "cubs-home-content"}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, 0, -10, 9, -5, 3, 0],
                y: [0, 0, 6, -4, 3, -1, 0],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: 4.4,
                times: [0, 0.8, 0.825, 0.855, 0.89, 0.94, 1],
                ease: "easeOut",
              }
        }
      >
      <motion.section
        key={`cubs-hero-${animationCycle}`}
        className="home-hero cubs-impact-hero"
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
      >
        <motion.div
          className="cubs-brand-lockup"
          initial={shouldReduceMotion ? false : { opacity: 0, y: -34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.55, ease: "easeOut" }}
        >
          <img src={logoSrc} alt="Chicago Cubs" />
          <div>
            <span>Chicago Cubs</span>
            <div className="home-venue">
              <MapPin size={24} />
              <span>Wrigley Field</span>
            </div>
          </div>
        </motion.div>
        <motion.p
          className="kicker cubs-impact-kicker"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: shouldReduceMotion ? 0 : 0.28 }}
        >
          <span className="cubs-kicker-line" aria-hidden="true" />
          <span>{t("Cubs Game Day")}</span>
        </motion.p>
        <h1 className="cubs-splash-title" aria-label="Step up to the plate. #THIS">
          <span className="cubs-step-up" aria-hidden="true">
            <motion.span
              initial={shouldReduceMotion ? false : { opacity: 0, x: '-145%', scale: 1.24, rotate: -2.5 }}
              animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.6, type: 'spring', stiffness: 245, damping: 16, mass: 0.76 }}>
              Step
            </motion.span>
            <motion.span className="cubs-up"
              initial={shouldReduceMotion ? false : { opacity: 0, x: '165%', scale: 1.28, rotate: 2.5 }}
              animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : { delay: 1.24, type: 'spring', stiffness: 255, damping: 15, mass: 0.72 }}>
              Up
            </motion.span>
          </span>
          <motion.span className="cubs-to-the" aria-hidden="true"
            initial={shouldReduceMotion ? false : { opacity: 0, x: '-58%', scale: 1.08 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { delay: 1.88, type: 'spring', stiffness: 230, damping: 17, mass: 0.72 }}>
            <span>To the</span><i />
          </motion.span>
          <motion.span className="cubs-plate" aria-hidden="true"
            initial={shouldReduceMotion ? false : { opacity: 0, y: '82%', scale: 1.22 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { delay: 2.36, type: 'spring', stiffness: 245, damping: 16, mass: 0.78 }}>
            Plate<span className="cubs-period">.</span>
          </motion.span>
          <motion.span className="cubs-this" aria-hidden="true"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 4.5, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: -3 }}
            transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 340, damping: 22, mass: 0.8, delay: 3.5 }}>
            #THIS
          </motion.span>
        </h1>
      </motion.section>
      <motion.section
        key={`cubs-services-${animationCycle}`}
        className="home-services"
        aria-label={t("Choose a Cubs game day service")}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 140, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 115, damping: 20, mass: 0.9, delay: 3.94 }
        }
      >
        <header>
          <strong>{t("What would you like to do?")}</strong>
          <div className="language-picker" role="group" aria-label={t("Language")}>
            <Languages aria-hidden="true" />
            <button
              className={language === "en" ? "selected" : ""}
              onClick={() => setLanguage("en")}
              aria-label={t("English")}
              aria-pressed={language === "en"}
            >
              EN
            </button>
            <button
              className={language === "es" ? "selected" : ""}
              onClick={() => setLanguage("es")}
              aria-label={t("Spanish")}
              aria-pressed={language === "es"}
            >
              ES
            </button>
          </div>
        </header>
        <div className="home-service-menu">
          {flowCards.map(({ flow, eyebrow, title, description, action, Icon }) => (
            <button key={flow} className={`home-service-option service-${flow}`} onClick={() => onStart(flow)}>
              <div className="service-icon">
                <Icon size={48} />
              </div>
              <div className="service-copy">
                <span>{t(eyebrow)}</span>
                <strong>{t(title)}</strong>
                <p>{t(description)}</p>
              </div>
              <div className="service-action">
                <span>{t(action)}</span>
                <ChevronRight size={34} />
              </div>
            </button>
          ))}
        </div>
      </motion.section>
      <motion.div
        key={`cubs-footer-${animationCycle}`}
        className="home-footer-strip"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 38 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.45, delay: shouldReduceMotion ? 0 : 4.24 }}
      >
        <BadgeCheck size={26} />
        <span>{t("Official Chicago Cubs game day services")}</span>
      </motion.div>
      </motion.div>

    </>
  );
}

function CategoryScreen({
  activeFlow,
  cartCount,
  categories,
  onSelectCategory,
  onAllDepartments,
}: {
  activeFlow: MerchFlow | null;
  cartCount: number;
  categories: Array<Department & { id: ProductCategory }>;
  onSelectCategory: (category: ProductCategory) => void;
  onAllDepartments: () => void;
}) {
  const { t } = useV2Language();
  // Explicit, visually checked product-only artwork, independent of catalog order.
  const featured: Record<ProductCategory, string> = {
    hats: categoryHat,
    jerseys: categoryJersey,
    sweatshirts: categoryHoodie,
    tshirts: categoryTshirt,
  };

  return (
    <div className="content-stack category-screen">
      <ScreenHeader
        kicker={fulfillmentLabel(activeFlow, t)}
        title={t("Find Your Cubs Gear")}
        copy={t("Featured categories from the MLB Shop Cubs Store.")}
      />
      <div className="catalog-toolbar">
        <div className="catalog-ready">
          <BadgeCheck />
          <div>
            <strong>{t("{count} products", { count: shopCatalog.catalogProductCount.toLocaleString() })}</strong>
            <span>{t("Ready to browse")}</span>
          </div>
        </div>
        <div className="catalog-toolbar-actions">
          <div className="catalog-cart-count" aria-label={t("{count} items in basket", { count: cartCount })}>
            <ShoppingCart />
            <span>{cartCount}</span>
          </div>
          <button className="departments-button" onClick={onAllDepartments}>
            <Grid3X3 />
            <span>{t("All Departments")}</span>
            <small>{shopCatalog.departments.length}</small>
            <ChevronRight />
          </button>
        </div>
      </div>
      <div className="category-grid">
        {categories.map((category) => (
          <button key={category.id} className="category-card" onClick={() => onSelectCategory(category.id)}>
            <img src={featured[category.id]} alt={t(category.label)} />
            <span>{t(category.label)}</span>
            <small>{t("{count} items", { count: products.filter((product) => product.categories.includes(category.id)).length.toLocaleString() })}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function DepartmentsScreen({
  departments,
  onSelectDepartment,
}: {
  departments: Department[];
  onSelectDepartment: (department: Department) => void;
}) {
  const { t } = useV2Language();

  return (
    <div className="content-stack departments-screen">
      <ScreenHeader
        kicker={t("All Departments")}
        title={t("Shop Every Department")}
        copy={t("All MLB Shop Cubs Store categories in one place.")}
      />
      <div className="department-grid">
        {departments.map((department) => {
          const availableCount = products.filter((product) => product.departments.includes(department.id)).length;
          const featuredProduct = products.find((product) => product.departments.includes(department.id));
          return (
            <button key={department.id} className="department-card" onClick={() => onSelectDepartment(department)}>
              {featuredProduct && <img src={featuredProduct.image || logoSrc} alt="" loading="lazy" decoding="async" />}
              <div>
                <strong>{t(department.label)}</strong>
                <span>{t("{count} items", { count: availableCount.toLocaleString() })}</span>
              </div>
              <ChevronRight />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductsScreen({
  category,
  department,
  products: productList,
  onSelectProduct,
  onBackToSelection,
  onBasket,
}: {
  category: ProductCategory;
  department: Department | null;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onBackToSelection: () => void;
  onBasket: () => void;
}) {
  const { t } = useV2Language();
  const title = t(department?.label ?? categoryLabels[category]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return productList;
    return productList.filter((product) =>
      [product.name, product.style, product.genderFit, ...product.departmentLabels, ...(product.badges ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [productList, query]);
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const pageProducts = filteredProducts.slice(page * pageSize, (page + 1) * pageSize);

  useEffect(() => {
    setQuery("");
    setPage(0);
  }, [category, department?.id]);

  useEffect(() => {
    setPage(0);
  }, [query]);

  return (
    <div className="content-stack products-screen">
      <ScreenHeader
        kicker={t("Browse merchandise")}
        title={title}
        copy={t("{count} products available to browse.", { count: productList.length.toLocaleString() })}
      />
      <div className="catalog-controls">
        <label className="search-bar">
          <Search size={30} />
          <input
            type="search"
            aria-label={t("Search {title}", { title })}
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Search player, product, brand or style")}
          />
          <span>{filteredProducts.length.toLocaleString()}</span>
        </label>
        <div className="page-controls" aria-label={t("Catalog pages")}>
          <button
            aria-label={t("Previous product page")}
            disabled={page === 0}
            onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
          >
            <ChevronLeft />
          </button>
          <span>{page + 1} / {pageCount}</span>
          <button
            aria-label={t("Next product page")}
            disabled={page + 1 >= pageCount}
            onClick={() => setPage((currentPage) => Math.min(pageCount - 1, currentPage + 1))}
          >
            <ChevronRight />
          </button>
        </div>
      </div>
      <div className="product-grid">
        {pageProducts.length ? (
          pageProducts.map((product) => (
            <button key={product.id} className="product-card" onClick={() => onSelectProduct(product)}>
              {product.badges?.[0] && <small className="product-badge">{merchandiseBadgeLabel(product.badges[0], t)}</small>}
              <img src={product.image || logoSrc} alt={product.name} loading="lazy" decoding="async" />
              <strong>{product.name}</strong>
              <div className="product-price">
                <span>{product.priceDisplay ?? formatPrice(product.price)}</span>
                {product.regularPrice && product.regularPrice > product.price && (
                  <del>{formatPrice(product.regularPrice)}</del>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="empty-state product-empty">
            <Search size={66} />
            <strong>{t("No matching products")}</strong>
            <span>{t("Try a player name, product type, brand or style.")}</span>
          </div>
        )}
      </div>
      <div className="product-actions">
        <button className="secondary-action" onClick={onBackToSelection}>
          {t("Back to Selection")}
        </button>
        <button className="primary-action" onClick={onBasket}>
          {t("Review Basket")}
        </button>
      </div>
    </div>
  );
}

function DetailScreen({
  activeFlow,
  product,
  selectedSize,
  quantity,
  onSelectSize,
  onQuantityChange,
  onAdd,
}: {
  activeFlow: MerchFlow | null;
  product: Product;
  selectedSize: string;
  quantity: number;
  onSelectSize: (size: string) => void;
  onQuantityChange: (quantity: number) => void;
  onAdd: () => void;
}) {
  const { t } = useV2Language();
  const optionLabel = t(product.optionLabel ?? "Size");

  return (
    <div className="detail-layout">
      <img className="detail-image" src={product.image || logoSrc} alt={product.name} />
      <section className="detail-panel">
        <p className="kicker">{product.style}</p>
        <h2>{product.name}</h2>
        <div className="price-row">
          <strong>{product.priceDisplay ?? formatPrice(product.price)}</strong>
          <span>{t(product.genderFit)}</span>
        </div>
        <label className="requested-option">
          <span>{t("Requested size or option")}</span>
          <input
            value={selectedSize === "Confirm on MLB Shop" ? "" : selectedSize}
            onChange={(event) => onSelectSize(event.target.value)}
            maxLength={40}
            placeholder={t("Enter your preferred size or option")}
          />
          <small>{t("Final sizes and availability are confirmed on MLB Shop.")}</small>
        </label>
        <div className="size-grid">
          {product.sizes.map((size) => {
            const available = product.inventory[size] > 0;
            return (
              <button
                key={size}
                className={size === selectedSize ? "size-chip selected" : "size-chip"}
                onClick={() => onSelectSize(size)}
                aria-pressed={size === selectedSize}
                disabled={!available}
              >
                <span>{size}</span>
                <small>{available ? t("Verify options at store") : t("Unavailable")}</small>
              </button>
            );
          })}
        </div>
        <div className="detail-controls">
          <button onClick={() => onQuantityChange(Math.max(1, quantity - 1))}>-</button>
          <span>{quantity}</span>
          <button onClick={() => onQuantityChange(Math.min(9, quantity + 1))}>+</button>
        </div>
        <div className={selectedSize ? "inventory-panel" : "inventory-panel pending"}>
          {selectedSize ? <BadgeCheck /> : <ShoppingBag />}
          <div>
            <strong>{selectedSize ? t("Selection confirmed") : t("Choose an option")}</strong>
            <span>
              {selectedSize
                ? t("{option}: {selection} · {fulfillment}.", {
                    option: optionLabel,
                    selection: selectedSize,
                    fulfillment: fulfillmentLabel(activeFlow, t),
                  })
                : t("Select an available option before adding this item.")}
            </span>
          </div>
        </div>
        <button className="primary-action" disabled={!selectedSize.trim()} onClick={onAdd}>
          {t("Add to Basket")}
        </button>
      </section>
    </div>
  );
}

function BasketScreen({
  activeFlow,
  cart,
  subtotal,
  total,
  deliveryFee,
  onContinueShopping,
  onRemove,
  onNext,
}: {
  activeFlow: MerchFlow | null;
  cart: CartLine[];
  subtotal: number;
  total: number;
  deliveryFee: number;
  onContinueShopping: () => void;
  onRemove: (index: number) => void;
  onNext: () => void;
}) {
  const { t } = useV2Language();

  return (
    <div className="content-stack basket-screen">
      <ScreenHeader
        kicker={t("Review order")}
        title={t("Your Basket")}
        copy={t("Review your items and fulfillment details before online checkout.")}
      />
      <div className="basket-list">
        {cart.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={56} />
            <strong>{t("No items yet")}</strong>
            <span>{t("Add merchandise to build this order.")}</span>
          </div>
        ) : (
          cart.map((line, index) => (
            <div key={`${line.product.id}-${line.size}-${index}`} className="basket-line">
              <img src={line.product.image || logoSrc} alt={line.product.name} />
              <div className="basket-line-copy">
                <strong>{line.product.name}</strong>
                <span>
                  {t("{option}: {selection} · Qty {quantity} · {fulfillment}", {
                    option: t(line.product.optionLabel ?? "Size"),
                    selection: line.size,
                    quantity: line.quantity,
                    fulfillment: fulfillmentLabel(activeFlow, t),
                  })}
                </span>
                <small>{t("Ready for checkout")}</small>
              </div>
              <div className="basket-line-price">
                <span>{t("Each")}</span>
                <strong>{formatPrice(line.product.price)}</strong>
                {line.quantity > 1 && (
                  <small>{t("{price} item total", { price: formatPrice(line.product.price * line.quantity) })}</small>
                )}
              </div>
              <button onClick={() => onRemove(index)}>{t("Remove")}</button>
            </div>
          ))
        )}
      </div>
      <div className="totals-panel">
        <Row label={t("Subtotal")} value={formatPrice(subtotal)} />
        <Row label={t("Shipping / delivery")} value={deliveryFee ? formatPrice(deliveryFee) : t("Included")} />
        <Row label={t("Estimated tax")} value={formatPrice(subtotal * 0.06625)} />
        <Row label={t("Estimated order total")} value={formatPrice(total)} strong />
      </div>
      <div className="dual-actions">
        <button className="secondary-action add-more-action" onClick={onContinueShopping}>
          {t("Add More")}
        </button>
        <button className="primary-action" disabled={!cart.length} onClick={onNext}>
          {t("Continue")}
        </button>
      </div>
    </div>
  );
}

function FulfillmentScreen({
  activeFlow,
  selectedLocation,
  onSelectLocation,
  onNext,
}: {
  activeFlow: MerchFlow | null;
  selectedLocation: string;
  onSelectLocation: (location: string) => void;
  onNext: () => void;
}) {
  const { t } = useV2Language();
  const options = activeFlow === "suite" ? suiteLocations : pickupLocations;

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker={t("Fulfillment")}
        title={
          activeFlow === "suite"
            ? t("Confirm Suite Delivery")
            : t("Choose Pickup Location")
        }
        copy={t("Choose the most convenient location for your order.")}
      />
      <div className="option-list">
        {options.map((option) => {
          const isSelected = selectedLocation === option;

          return (
            <button
              key={option}
              className={isSelected ? "option-row selected" : "option-row"}
              onClick={() => onSelectLocation(option)}
              aria-pressed={isSelected}
            >
              <MapPin />
              <span>{t(option)}</span>
              <SelectionMark selected={isSelected} />
            </button>
          );
        })}
      </div>
      <button className="primary-action bottom-action" disabled={!selectedLocation} onClick={onNext}>
        {t("Continue")}
      </button>
    </div>
  );
}

function StadiumContactScreen({
  activeFlow,
  name,
  phone,
  selectedLocation,
  total,
  isSubmitting,
  onName,
  onPhone,
  onSubmit,
}: {
  activeFlow: MerchFlow | null;
  name: string;
  phone: string;
  selectedLocation: string;
  total: number;
  isSubmitting: boolean;
  onName: (name: string) => void;
  onPhone: (phone: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useV2Language();
  const isSuiteDelivery = activeFlow === "suite";
  const phoneDigits = phone.replace(/\D/g, "");
  const canSubmit = name.trim().length >= 2 && phoneDigits.length >= 10 && !isSubmitting;

  return (
    <div className="content-stack stadium-contact-screen">
      <ScreenHeader
        kicker={t("Order notifications")}
        title={t("Stay Updated on Your Order")}
        copy={isSuiteDelivery
          ? t("We'll text you when your delivery is on the way to your suite.")
          : t("We'll text you when your order is ready for pickup.")}
      />

      <section className="notification-promise">
        <span><Bell /></span>
        <div>
          <strong>{t("Real-time order updates")}</strong>
          <p>{t("Enter the mobile number that should receive this order's status notification.")}</p>
        </div>
      </section>

      <form
        className="stadium-contact-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onSubmit();
        }}
      >
        <div className="stadium-contact-fields">
          <label>
            <span><UserRound /> {t("Full name")}</span>
            <input
              autoComplete="name"
              maxLength={80}
              value={name}
              onChange={(event) => onName(event.target.value)}
              placeholder={t("Enter your full name")}
            />
          </label>
          <label>
            <span><Phone /> {t("Mobile number")}</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={24}
              value={phone}
              onChange={(event) => onPhone(event.target.value)}
              placeholder={t("Enter a mobile number")}
            />
          </label>
        </div>

        <div className="contact-order-summary">
          <div>
            <span>{t("Service")}</span>
            <strong>{isSuiteDelivery ? t("Suite Delivery") : t("Concierge Pickup")}</strong>
          </div>
          <div>
            <span>{isSuiteDelivery ? t("Delivery location") : t("Pickup location")}</span>
            <strong>{t(selectedLocation)}</strong>
          </div>
          <div>
            <span>{t("Estimated total")}</span>
            <strong>{formatPrice(total)}</strong>
          </div>
        </div>

        <p className="sms-disclosure">
          {t("By continuing, you agree to receive order-status text messages. Message and data rates may apply.")}
        </p>

        <button className="primary-action contact-submit-action" type="submit" disabled={!canSubmit}>
          <Send />
          {isSubmitting ? t("Sending order...") : t("Continue to Phone Checkout")}
        </button>
      </form>
    </div>
  );
}

function CheckoutHandoffScreen({
  activeFlow,
  cart,
  total,
  orderId,
  selectedLocation,
  onComplete,
}: {
  activeFlow: MerchFlow | null;
  cart: CartLine[];
  total: number;
  orderId: string;
  selectedLocation: string;
  onComplete: () => void;
}) {
  const { t } = useV2Language();
  const [checkoutItem, setCheckoutItem] = useState(0);
  const itemCount = cart.reduce((count, line) => count + line.quantity, 0);
  const itemCountLabel = itemCount === 1 ? t("1 item") : t("{count} items", { count: itemCount });
  const checkoutUrl = new URL(cart[checkoutItem]?.product.sourceUrl ?? cubsShopCartUrl);
  checkoutUrl.searchParams.set("utm_source", "wrigley_field_kiosk");
  checkoutUrl.searchParams.set("utm_medium", "qr");
  checkoutUrl.searchParams.set("utm_campaign", "cubs_game_day_checkout");
  checkoutUrl.searchParams.set("utm_content", activeFlow ?? "retail");
  checkoutUrl.searchParams.set("kiosk_ref", orderId);
  const fulfillment = activeFlow === "ship"
    ? t("Shipping details entered on your phone")
    : t(selectedLocation);

  return (
    <div className="content-stack checkout-screen">
      <ScreenHeader
        kicker={t("Secure online checkout")}
        title={t("Scan to Complete Your Purchase")}
        copy={t("Open your selected merchandise on MLB Shop. Add your sizes there and complete payment on your phone.")}
      />
      <div className="checkout-layout">
        <section className="checkout-qr-card" aria-label={t("MLB Shop Cubs Store checkout QR code")}>
          <div className="checkout-qr-mark">
            <QrCode />
            <span>{t("Official Cubs Team Store")}</span>
          </div>
          {cart.length > 1 && (
            <label className="checkout-product-picker">
              <span>{t("Select an item to open on your phone")}</span>
              <select value={checkoutItem} onChange={(event) => setCheckoutItem(Number(event.target.value))}>
                {cart.map((line, index) => <option key={`${line.product.id}-${index}`} value={index}>{index + 1}. {line.product.name}</option>)}
              </select>
            </label>
          )}
          <div className="checkout-qr-shell">
            <QRCodeSVG
              value={checkoutUrl.toString()}
              size={352}
              level="M"
              bgColor="#ffffff"
              fgColor={cubsDeepSea}
            />
          </div>
          <strong>{t("Scan with your phone camera")}</strong>
          <span>{t("Opens www.mlbshop.com/chicago-cubs/o-7876+t-03665322+z-8647-1125435766")}</span>
        </section>
        <section className="checkout-instructions">
          <div className="checkout-secure-label">
            <ShieldCheck />
            <span>{t("Checkout stays on your phone")}</span>
          </div>
          <Smartphone size={82} />
          <h3>{t("Finish in three quick steps")}</h3>
          <div className="checkout-steps">
            <div className="checkout-step">
              <span>1</span>
              <div>
                <strong>{t("Scan the QR code")}</strong>
                <small>{t("Open it with your phone camera.")}</small>
              </div>
            </div>
            <div className="checkout-step">
              <span>2</span>
              <div>
                <strong>{t("Add your selections on MLB Shop")}</strong>
                <small>{t("Your kiosk basket does not transfer automatically. Confirm each item, size, and fulfillment on MLB Shop.")}</small>
              </div>
            </div>
            <div className="checkout-step">
              <span>3</span>
              <div>
                <strong>{t("Pay securely on your phone")}</strong>
                <small>{t("The MLB Shop Cubs Store handles all payment details.")}</small>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div className="checkout-order-strip">
        <div>
          <span>{t("Kiosk selection")}</span>
          <strong>{itemCountLabel}</strong>
        </div>
        <div>
          <span>{t("Estimated total")}</span>
          <strong>{formatPrice(total)}</strong>
        </div>
        <div>
          <span>{t("Fulfillment")}</span>
          <strong>{fulfillment}</strong>
        </div>
        <div>
          <span>{t("Reference")}</span>
          <strong>{orderId}</strong>
        </div>
      </div>
      <div className="checkout-trust-strip">
        <ShieldCheck />
        <span>{t("Prices, availability, taxes, and fulfillment are confirmed on the MLB Shop Cubs Store before purchase.")}</span>
      </div>
      <button className="primary-action checkout-done-action" onClick={onComplete}>
        <Check />
        {t("I've Completed Checkout")}
      </button>
    </div>
  );
}

function OrderConfirmationScreen({
  activeFlow,
  cart,
  total,
  orderId,
  selectedLocation,
  onClose,
  onTakeSurvey,
}: {
  activeFlow: MerchFlow | null;
  cart: CartLine[];
  total: number;
  orderId: string;
  selectedLocation: string;
  onClose: () => void;
  onTakeSurvey: () => void;
}) {
  const { t } = useV2Language();
  const itemCount = cart.reduce((count, line) => count + line.quantity, 0);
  const itemCountLabel = itemCount === 1 ? t("1 item") : t("{count} items", { count: itemCount });
  const service = activeFlow === "suite"
    ? t("Suite Delivery")
    : activeFlow === "ship"
      ? t("Ship to Home")
      : t("Concierge Pickup");
  const fulfillment = activeFlow === "ship" ? t("Ship to home") : t(selectedLocation);
  const notification = activeFlow === "suite"
    ? t("We'll text you when your order is on the way to your suite.")
    : activeFlow === "ship"
      ? t("Shipping and delivery updates will continue on your phone.")
      : t("We'll text you when your order is ready for pickup.");

  return (
    <div className="order-confirm-screen">
      <header className="order-confirm-hero">
        <div className="order-confirm-icon" aria-hidden="true">
          <BadgeCheck />
        </div>
        <p className="kicker">{t("Order received")}</p>
        <h2>{t("Order Confirmed")}</h2>
        <p>{t("Your order has been placed.")}</p>
      </header>

      <section className="order-confirm-card" aria-label={t("Order confirmation details")}>
        <div className="order-confirm-reference">
          <span>{t("Order reference")}</span>
          <strong>{orderId}</strong>
        </div>
        <div className="order-confirm-grid">
          <div>
            <span>{t("Service")}</span>
            <strong>{service}</strong>
          </div>
          <div>
            <span>{t("Fulfillment")}</span>
            <strong>{fulfillment}</strong>
          </div>
          <div>
            <span>{t("Kiosk selection")}</span>
            <strong>{itemCountLabel}</strong>
          </div>
          <div>
            <span>{t("Estimated total")}</span>
            <strong>{formatPrice(total)}</strong>
          </div>
        </div>
        <div className="order-confirm-notice">
          {activeFlow === "ship" ? <Truck /> : <Bell />}
          <div>
            <strong>{t("We'll keep you updated")}</strong>
            <span>{notification}</span>
          </div>
        </div>
      </section>

      <section className="confirmation-survey-offer" aria-label={t("10% off survey offer")}>
        <div className="confirmation-survey-copy">
          <span className="confirmation-survey-icon" aria-hidden="true"><Gift /></span>
          <div>
            <span>{t("A thank-you from the Cubs")}</span>
            <strong>{t("Unlock 10% off your next purchase")}</strong>
          </div>
        </div>
        <button className="primary-action confirmation-survey-action" onClick={onTakeSurvey}>
          <span>{t("Take our quick survey for 10% off your next purchase")}</span>
          <ChevronRight />
        </button>
        <button className="confirmation-close-action" onClick={onClose}>{t("No thanks, I'm finished")}</button>
      </section>
    </div>
  );
}

type SurveySentiment = "positive" | "neutral" | "negative";
type SurveyYesNo = "yes" | "no";

function SurveyProgress({ step }: { step: number }) {
  const { t } = useV2Language();
  const progress = step * 25;

  return (
    <div className="survey-progress" aria-label={t("Survey progress: {progress}%", { progress })}>
      <div>
        <span>{t("Quick fan survey")}</span>
        <strong>{t("10% reward")}</strong>
      </div>
      <span className="survey-progress-track" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </span>
    </div>
  );
}

function SurveyStage({ step, children }: { step: number; children: ReactNode }) {
  const shouldReduceMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      className="content-stack survey-screen"
      initial={shouldReduceMotion ? false : { opacity: 0, x: 46 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: "easeOut" }}
    >
      <SurveyProgress step={step} />
      {children}
    </motion.div>
  );
}

function SurveyExperienceScreen({
  selected,
  onSelect,
  onContinue,
}: {
  selected: SurveySentiment | "";
  onSelect: (answer: SurveySentiment) => void;
  onContinue: () => void;
}) {
  const { t } = useV2Language();

  return (
    <SurveyStage step={1}>
      <ScreenHeader
        kicker={t("Your Cubs experience")}
        title={t("How Was Your Shopping Experience?")}
        copy={t("Choose the answer that best matches your visit today.")}
      />
      <SurveySentimentChoices selected={selected} onSelect={onSelect} />
      <div className="survey-reward-strip">
        <Percent />
        <span>{t("Finish this quick survey to receive 10% off your next purchase.")}</span>
      </div>
      <button className="primary-action bottom-action survey-continue-action" disabled={!selected} onClick={onContinue}>
        {t("Continue")}
        <ChevronRight />
      </button>
    </SurveyStage>
  );
}

function SurveyAssociateHelpScreen({ onAnswer }: { onAnswer: (answer: SurveyYesNo) => void }) {
  const { t } = useV2Language();

  return (
    <SurveyStage step={2}>
      <ScreenHeader
        kicker={t("Team Store service")}
        title={t("Did an Associate Help You Today?")}
        copy={t("Your answer helps us recognize great service and improve every visit.")}
      />
      <div className="survey-binary-grid">
        <button onClick={() => onAnswer("yes")}>
          <span className="survey-choice-icon"><UserCheck /></span>
          <strong>{t("Yes")}</strong>
          <span>{t("An associate helped me")}</span>
          <ChevronRight />
        </button>
        <button onClick={() => onAnswer("no")}>
          <span className="survey-choice-icon"><UserRound /></span>
          <strong>{t("No")}</strong>
          <span>{t("I shopped on my own")}</span>
          <ChevronRight />
        </button>
      </div>
    </SurveyStage>
  );
}

function SurveyAssociateRatingScreen({
  selected,
  onSelect,
  onContinue,
}: {
  selected: SurveySentiment | "";
  onSelect: (answer: SurveySentiment) => void;
  onContinue: () => void;
}) {
  const { t } = useV2Language();

  return (
    <SurveyStage step={3}>
      <ScreenHeader
        kicker={t("Associate engagement")}
        title={t("How Would You Rate Your Engagement?")}
        copy={t("Think about how helpful, friendly, and attentive the associate was.")}
      />
      <SurveySentimentChoices selected={selected} onSelect={onSelect} />
      <button className="primary-action bottom-action survey-continue-action" disabled={!selected} onClick={onContinue}>
        {t("Continue")}
        <ChevronRight />
      </button>
    </SurveyStage>
  );
}

function SurveyFoundEverythingScreen({ onAnswer }: { onAnswer: (answer: SurveyYesNo) => void }) {
  const { t } = useV2Language();

  return (
    <SurveyStage step={3}>
      <ScreenHeader
        kicker={t("Merchandise selection")}
        title={t("Did You Find Everything You Were Looking For?")}
        copy={t("Let us know whether the right Cubs gear was available today.")}
      />
      <div className="survey-binary-grid">
        <button onClick={() => onAnswer("yes")}>
          <span className="survey-choice-icon"><Check /></span>
          <strong>{t("Yes")}</strong>
          <span>{t("I found everything")}</span>
          <ChevronRight />
        </button>
        <button onClick={() => onAnswer("no")}>
          <span className="survey-choice-icon"><Search /></span>
          <strong>{t("No")}</strong>
          <span>{t("Something was missing")}</span>
          <ChevronRight />
        </button>
      </div>
    </SurveyStage>
  );
}

function SurveyTextScreen({
  kind,
  value,
  onChange,
  onContinue,
}: {
  kind: "improve" | "missing";
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
}) {
  const { t } = useV2Language();
  const isImprove = kind === "improve";
  const title = isImprove ? t("Tell Us How We Can Improve") : t("What Were You Looking For?");
  const copy = isImprove
    ? t("A few details can help us make the next Cubs shopping experience better.")
    : t("Tell us the item, player, size, or style you hoped to find.");
  const placeholder = isImprove
    ? t("Share what would have made your experience better...")
    : t("Example: Women's Winter Classic jersey in medium...");

  return (
    <SurveyStage step={3}>
      <ScreenHeader kicker={t(isImprove ? "Help us improve" : "Help us stock better")} title={title} copy={copy} />
      <label className="survey-text-card">
        <span><MessageSquareText /> {t("Your feedback")}</span>
        <textarea
          value={value}
          maxLength={500}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoFocus
        />
        <small>{value.length}/500</small>
      </label>
      <button className="primary-action bottom-action survey-continue-action" disabled={!value.trim()} onClick={onContinue}>
        {t("Continue to Your Reward")}
        <ChevronRight />
      </button>
    </SurveyStage>
  );
}

function SurveyEmailScreen({
  email,
  onEmail,
  onSubmit,
}: {
  email: string;
  onEmail: (email: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useV2Language();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <SurveyStage step={4}>
      <ScreenHeader
        kicker={t("Your 10% reward")}
        title={t("Where Should We Send Your Discount?")}
        copy={t("Enter your email and we'll send your Cubs Team Store code.")}
      />
      <div className="survey-email-card">
        <div className="survey-email-badge" aria-hidden="true">
          <Gift />
          <strong>10%</strong>
          <span>{t("OFF")}</span>
        </div>
        <label>
          <span>{t("Email address")}</span>
          <div className="survey-email-input">
            <Mail />
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => onEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && isValid) onSubmit();
              }}
              placeholder={t("you@example.com")}
              autoFocus
            />
          </div>
          <small>{t("Your email is used to deliver this one-time discount.")}</small>
        </label>
      </div>
      <button className="primary-action bottom-action survey-continue-action" disabled={!isValid} onClick={onSubmit}>
        {t("Send My 10% Discount")}
        <Send />
      </button>
    </SurveyStage>
  );
}

function SurveyDiscountConfirmScreen({ email, onDone }: { email: string; onDone: () => void }) {
  const { t } = useV2Language();
  const shouldReduceMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      className="survey-discount-confirm"
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: "easeOut" }}
    >
      <div className="survey-discount-glow" aria-hidden="true" />
      <div className="survey-discount-icon" aria-hidden="true"><Mail /></div>
      <p className="kicker">{t("Survey complete")}</p>
      <h2>{t("Check Your Email for Your Discount Code")}</h2>
      <p>{t("Your 10% Cubs Team Store discount is headed to {email}.", { email })}</p>
      <div className="survey-code-preview" aria-hidden="true">
        <span>{t("YOUR CUBS REWARD")}</span>
        <strong>10% {t("OFF")}</strong>
      </div>
      <button className="primary-action survey-done-action" onClick={onDone}>
        <Check />
        {t("Done")}
      </button>
    </motion.div>
  );
}

function SurveySentimentChoices({
  selected,
  onSelect,
}: {
  selected: SurveySentiment | "";
  onSelect: (answer: SurveySentiment) => void;
}) {
  const { t } = useV2Language();
  const choices: Array<{ value: SurveySentiment; label: string; copy: string; Icon: LucideIcon }> = [
    { value: "positive", label: "Positive", copy: "Everything felt great", Icon: Smile },
    { value: "neutral", label: "Neutral", copy: "It was just okay", Icon: Meh },
    { value: "negative", label: "Negative", copy: "It missed the mark", Icon: Frown },
  ];

  return (
    <div className="survey-sentiment-grid">
      {choices.map(({ value, label, copy, Icon }) => (
        <button
          key={value}
          className={`survey-sentiment-card sentiment-${value}${selected === value ? " selected" : ""}`}
          onClick={() => onSelect(value)}
          aria-pressed={selected === value}
        >
          <span className="survey-sentiment-icon"><Icon /></span>
          <strong>{t(label)}</strong>
          <span>{t(copy)}</span>
          <ChevronRight />
        </button>
      ))}
    </div>
  );
}

function InventoryErrorScreen({
  product,
  onChooseAlternative,
  onBackToBasket,
}: {
  product: Product;
  onChooseAlternative: (product: Product) => void;
  onBackToBasket: () => void;
}) {
  const { t } = useV2Language();
  const alternatives = products
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        candidate.categories.some((category) => product.categories.includes(category)),
    )
    .slice(0, 2);

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker={t("Inventory issue")}
        title={t("Size Unavailable")}
        copy={t("{product} is unavailable in one requested size. The kiosk blocks checkout and offers alternatives before online checkout.", { product: product.name })}
      />
      <div className="alert-panel">
        <AlertTriangle size={72} />
        <div>
          <strong>{t("Unable to reserve selected item")}</strong>
          <span>{t("Size M now shows 0 available at this location.")}</span>
        </div>
      </div>
      <div className="alternative-grid">
        {alternatives.map((alternative) => (
          <button key={alternative.id} onClick={() => onChooseAlternative(alternative)}>
            <img src={alternative.image} alt={alternative.name} />
            <strong>{alternative.name}</strong>
            <span>{alternative.priceDisplay ?? formatPrice(alternative.price)}</span>
          </button>
        ))}
      </div>
      <button className="secondary-action bottom-action" onClick={onBackToBasket}>
        {t("Back to Basket")}
      </button>
    </div>
  );
}

function TicketStartScreen({ onLead, onQr }: { onLead: () => void; onQr: () => void }) {
  const { t } = useV2Language();

  return (
    <div className="content-stack ticket-screen">
      <ScreenHeader
        kicker={t("Cubs official ticketing")}
        title={t("Interested in Becoming a Season-Ticket Holder?")}
        copy={t("Explore season-ticket opportunities or ask a Cubs representative to contact you.")}
      />
      <button className="big-choice" onClick={onQr}>
        <Ticket />
        <span>{t("View season-ticket opportunities")}</span>
        <ChevronRight />
      </button>
      <button className="big-choice" onClick={onLead}>
        <Users />
        <span>{t("Request contact from a Cubs representative")}</span>
        <ChevronRight />
      </button>
    </div>
  );
}

function TicketQrScreen({ onLead }: { onLead: () => void }) {
  const { t } = useV2Language();

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker={t("Season tickets")}
        title={t("Scan to View Official Cubs Options")}
        copy={t("Fans can continue on the Cubs approved ticketing experience or request follow-up.")}
      />
      <div className="large-qr-card">
        <QRCodeSVG value={ticketUrl} size={360} bgColor="#ffffff" fgColor={cubsDeepSea} />
        <span>mlb.com/cubs/tickets</span>
      </div>
      <button className="primary-action bottom-action" onClick={onLead}>
        {t("Request Contact Instead")}
      </button>
    </div>
  );
}

function TicketLeadScreen({
  contactMethod,
  onContactMethod,
  onSubmit,
}: {
  contactMethod: string;
  onContactMethod: (method: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useV2Language();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const hasPreferredContact = contactMethod === "Email me" ? email.trim() : contactMethod ? mobile.trim() : "";
  const canSubmit = Boolean(contactMethod && name.trim() && hasPreferredContact);

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker={t("Season tickets")}
        title={t("How Should the Cubs Follow Up?")}
        copy={t("Share your contact information and choose your preferred response.")}
      />
      <div className="lead-form">
        <label>
          {t("Name")}
          <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder={t("Full name")} />
        </label>
        <label>
          {t("Mobile")}
          <input
            type="tel"
            autoComplete="tel"
            value={mobile}
            onChange={(event) => setMobile(event.target.value)}
            placeholder={t("Mobile number")}
          />
        </label>
        <label>
          {t("Email")}
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("Email address")}
          />
        </label>
      </div>
      <div className="segmented">
        {["Text me", "Email me", "Call me"].map((method) => (
          <button
            key={method}
            className={contactMethod === method ? "selected" : ""}
            onClick={() => onContactMethod(method)}
            aria-pressed={contactMethod === method}
          >
            {t(method)}
          </button>
        ))}
      </div>
      <button className="primary-action bottom-action" disabled={!canSubmit} onClick={onSubmit}>
        {t("Submit Interest")}
      </button>
    </div>
  );
}

function TicketConfirmScreen({ contactMethod }: { contactMethod: string }) {
  const { t } = useV2Language();

  return (
    <div className="confirm-screen">
      <BadgeCheck size={120} />
      <h2>{t("Interest Submitted")}</h2>
      <p>{t("A Cubs representative will follow up using the fan's preferred method: {method}.", { method: t(contactMethod) })}</p>
    </div>
  );
}

function FeedbackStartScreen({ onFound, onMissing }: { onFound: () => void; onMissing: () => void }) {
  const { t } = useV2Language();

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker={t("Team Store")}
        title={t("Did You Find the Merchandise You Were Looking For?")}
        copy={t("Tell us what worked and where we can help.")}
      />
      <div className="dual-choice">
        <button onClick={onFound}>
          <ThumbsUp />
          <strong>{t("Yes")}</strong>
          <span>{t("I found what I wanted")}</span>
        </button>
        <button onClick={onMissing}>
          <Search />
          <strong>{t("No")}</strong>
          <span>{t("Help identify what was missing")}</span>
        </button>
      </div>
    </div>
  );
}

function LostDemandScreen({
  product,
  size,
  onProduct,
  onSize,
  onNext,
}: {
  product: Product | null;
  size: string;
  onProduct: (product: Product) => void;
  onSize: (size: string) => void;
  onNext: () => void;
}) {
  const { t } = useV2Language();

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker={t("Merchandise search")}
        title={t("What Were You Looking For?")}
        copy={t("Choose the closest match, then tell us the size you needed.")}
      />
      <div className="lost-product-grid">
        {lostDemandProducts.map((candidate) => (
          <button
            key={candidate.id}
            className={product?.id === candidate.id ? "selected" : ""}
            onClick={() => onProduct(candidate)}
            aria-pressed={product?.id === candidate.id}
          >
            <img src={candidate.image || logoSrc} alt={candidate.name} />
            <span>{candidate.name}</span>
          </button>
        ))}
      </div>
      <div className="segmented">
        {["XS", "S", "M", "L", "XL", "XXL"].map((candidateSize) => (
          <button
            key={candidateSize}
            className={size === candidateSize ? "selected" : ""}
            onClick={() => onSize(candidateSize)}
            aria-pressed={size === candidateSize}
          >
            {candidateSize}
          </button>
        ))}
      </div>
      <button className="primary-action bottom-action" disabled={!product || !size} onClick={onNext}>
        {t("Continue")}
      </button>
    </div>
  );
}

function ExperienceScreen({
  reason,
  onReason,
  onNext,
}: {
  reason: string;
  onReason: (reason: string) => void;
  onNext: () => void;
}) {
  const { t } = useV2Language();
  const reasons = [
    "The checkout line was too long.",
    "The store was too crowded.",
    "I needed help but could not find an associate.",
    "I could not find the product or size I wanted.",
    "The merchandise selection was limited.",
    "Other.",
  ];

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker={t("Shopping experience")}
        title={t("Did We Make Shopping Easy?")}
        copy={t("Let us know what would have made your visit better.")}
      />
      <div className="reason-list">
        {reasons.map((candidate) => (
          <button
            key={candidate}
            className={reason === candidate ? "selected" : ""}
            onClick={() => onReason(candidate)}
            aria-pressed={reason === candidate}
          >
            {t(candidate)}
          </button>
        ))}
      </div>
      <button className="primary-action bottom-action" disabled={!reason} onClick={onNext}>
        {t("Continue")}
      </button>
    </div>
  );
}

function AssociateScreen({
  associateHelp,
  onAssociateHelp,
  onComplete,
}: {
  associateHelp: string;
  onAssociateHelp: (value: string) => void;
  onComplete: () => void;
}) {
  const { t } = useV2Language();
  const options = ["Satisfied with assistance", "No associate was available", "Not satisfied with assistance"];

  return (
    <div className="content-stack">
      <ScreenHeader
        kicker={t("Associate interaction")}
        title={t("Did You Interact with a Store Associate?")}
        copy={t("Your feedback helps us deliver better game day service.")}
      />
      <div className="option-list">
        {options.map((option) => {
          const isSelected = associateHelp === option;

          return (
            <button
              key={option}
              className={isSelected ? "option-row selected" : "option-row"}
              onClick={() => onAssociateHelp(option)}
              aria-pressed={isSelected}
            >
              <Users />
              <span>{t(option)}</span>
              <SelectionMark selected={isSelected} />
            </button>
          );
        })}
      </div>
      <button className="primary-action bottom-action" disabled={!associateHelp} onClick={onComplete}>
        {t("Submit Feedback")}
      </button>
    </div>
  );
}

function FeedbackConfirmScreen({
  product,
  size,
  reason,
  associateHelp,
}: {
  product: Product | null;
  size: string;
  reason: string;
  associateHelp: string;
}) {
  const { t } = useV2Language();

  return (
    <div className="confirm-screen">
      <BadgeCheck size={120} />
      <h2>{t("Thank You")}</h2>
      <p>{t("Your feedback helps the Cubs improve merchandise availability and the gameday store experience.")}</p>
      <div className="confirm-card">
        <Row label={t("Missing item")} value={product?.name ?? t("Not provided")} />
        <Row label={t("Requested size")} value={size} />
        <Row label={t("Experience issue")} value={reason ? t(reason) : ""} />
        <Row label={t("Associate response")} value={associateHelp ? t(associateHelp) : ""} />
      </div>
    </div>
  );
}

function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <span className="selection-mark" aria-hidden="true">
      {selected ? <Check size={24} strokeWidth={3} /> : null}
    </span>
  );
}

function ScreenHeader({ kicker, title, copy }: { kicker: string; title: string; copy: string }) {
  return (
    <header className="screen-header">
      <p className="kicker">{kicker}</p>
      <h2>{title}</h2>
      <p>{copy}</p>
    </header>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "row strong" : "row"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
