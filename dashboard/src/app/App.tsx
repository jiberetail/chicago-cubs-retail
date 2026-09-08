import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  BadgeDollarSign,
  Calculator,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  Clock3,
  Download,
  ExternalLink,
  GitBranch,
  Languages,
  LayoutDashboard,
  MapPin,
  MousePointerClick,
  PackageCheck,
  PackageSearch,
  Percent,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  SmilePlus,
  Store,
  Target,
  ThumbsUp,
  Ticket,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import cubsLogo from "../imports/Chicago-Cubs-Logo.svg";
import { StadiumOrdersView } from "./StadiumOrdersView";
import { useStadiumOrders } from "./stadiumOrders";

type ViewId = "overview" | "orders" | "roi" | "funnel" | "services" | "merchandise" | "experience";
type PeriodKey = "game" | "four" | "season";

type GamePoint = {
  opponent: string;
  date: string;
  revenue: number;
  orders: number;
  sessions: number;
  satisfaction: number;
  ticketLeads: number;
};

type DashboardStats = {
  games: number;
  revenue: number;
  incrementalRevenue: number;
  grossProfit: number;
  programCost: number;
  netContribution: number;
  roi: number;
  orders: number;
  sessions: number;
  productViews: number;
  cartAdds: number;
  checkoutStarts: number;
  conversion: number;
  aov: number;
  ticketLeads: number;
  qualifiedLeads: number;
  ticketPipeline: number;
  satisfaction: number;
  feedbackResponses: number;
  assistedOrders: number;
};

const gameData: GamePoint[] = [
  { opponent: "STL", date: "Apr 8", revenue: 118400, orders: 758, sessions: 3690, satisfaction: 89, ticketLeads: 148 },
  { opponent: "MIL", date: "Apr 14", revenue: 123900, orders: 791, sessions: 3812, satisfaction: 91, ticketLeads: 159 },
  { opponent: "PIT", date: "May 2", revenue: 115800, orders: 744, sessions: 3654, satisfaction: 88, ticketLeads: 141 },
  { opponent: "CIN", date: "May 16", revenue: 127600, orders: 818, sessions: 3908, satisfaction: 92, ticketLeads: 172 },
  { opponent: "LAD", date: "Jun 6", revenue: 131200, orders: 842, sessions: 4022, satisfaction: 93, ticketLeads: 164 },
  { opponent: "NYM", date: "Jun 20", revenue: 119700, orders: 768, sessions: 3734, satisfaction: 90, ticketLeads: 153 },
  { opponent: "ATL", date: "Jul 11", revenue: 134900, orders: 862, sessions: 4112, satisfaction: 94, ticketLeads: 181 },
  { opponent: "PHI", date: "Aug 8", revenue: 128300, orders: 827, sessions: 3975, satisfaction: 92, ticketLeads: 168 },
  { opponent: "SD", date: "Sep 4", revenue: 129500, orders: 839, sessions: 4054, satisfaction: 93, ticketLeads: 174 },
];

const periodOptions: Array<{ key: PeriodKey; label: string; games: number }> = [
  { key: "game", label: "Latest Game", games: 1 },
  { key: "four", label: "Last 4 Games", games: 4 },
  { key: "season", label: "Season to Date", games: 9 },
];

const navItems: Array<{ id: ViewId; label: string; description: string; icon: LucideIcon }> = [
  { id: "overview", label: "Executive Overview", description: "Revenue and operating pulse", icon: LayoutDashboard },
  { id: "orders", label: "Ballpark Orders", description: "Live pickup and suite queue", icon: ShoppingCart },
  { id: "roi", label: "Revenue & ROI", description: "Contribution and payback", icon: BadgeDollarSign },
  { id: "funnel", label: "Commerce Funnel", description: "Engagement to purchase", icon: GitBranch },
  { id: "services", label: "Service Performance", description: "Four kiosk journeys", icon: PackageCheck },
  { id: "merchandise", label: "Merchandise Demand", description: "Category and product signals", icon: PackageSearch },
  { id: "experience", label: "Guest Experience", description: "Feedback and satisfaction", icon: SmilePlus },
];

const colors = {
  green: "#0E3386",
  steel: "#CC3433",
  charcoal: "#0E3386",
  cyan: "#005CC8",
  blue: "#234C9C",
  amber: "#CC3433",
  red: "#CC3433",
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const wholeNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function sum(points: GamePoint[], key: keyof Pick<GamePoint, "revenue" | "orders" | "sessions" | "ticketLeads">) {
  return points.reduce((total, point) => total + point[key], 0);
}

function calculateStats(points: GamePoint[]): DashboardStats {
  const revenue = sum(points, "revenue");
  const orders = sum(points, "orders");
  const sessions = sum(points, "sessions");
  const ticketLeads = sum(points, "ticketLeads");
  const incrementalRevenue = Math.round(revenue * 0.697);
  const grossProfit = Math.round(incrementalRevenue * 0.46);
  const programCost = points.length * 5200;
  const productViews = Math.round(sessions * 0.832);
  const cartAdds = Math.round(sessions * 0.351);
  const checkoutStarts = Math.round(sessions * 0.268);
  const qualifiedLeads = Math.round(ticketLeads * 0.82);

  return {
    games: points.length,
    revenue,
    incrementalRevenue,
    grossProfit,
    programCost,
    netContribution: grossProfit - programCost,
    roi: grossProfit / programCost,
    orders,
    sessions,
    productViews,
    cartAdds,
    checkoutStarts,
    conversion: (orders / sessions) * 100,
    aov: revenue / orders,
    ticketLeads,
    qualifiedLeads,
    ticketPipeline: qualifiedLeads * 3100,
    satisfaction: Math.round(points.reduce((total, point) => total + point.satisfaction, 0) / points.length),
    feedbackResponses: Math.round(sessions * 0.167),
    assistedOrders: Math.round(orders * 0.74),
  };
}

function MetricCard({
  label,
  value,
  detail,
  change,
  icon: Icon,
  tone = "green",
}: {
  label: string;
  value: string;
  detail: string;
  change: string;
  icon: LucideIcon;
  tone?: "green" | "blue" | "amber" | "charcoal";
}) {
  const isPositive = !change.startsWith("-");

  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-card-top">
        <span className="metric-icon"><Icon size={20} /></span>
        <span className={`delta ${isPositive ? "positive" : "negative"}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </span>
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: string }) {
  return (
    <div className="section-heading">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action && <p>{action}</p>}
    </div>
  );
}

function App() {
  const [view, setView] = useState<ViewId>("overview");
  const [period, setPeriod] = useState<PeriodKey>("season");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [kioskCount, setKioskCount] = useState(6);
  const [projectedGames, setProjectedGames] = useState(9);
  const [conversionLift, setConversionLift] = useState(12);
  const [merchMetric, setMerchMetric] = useState<"revenue" | "demand">("revenue");
  const stadiumOrders = useStadiumOrders();

  const selectedPoints = useMemo(() => {
    const gameCount = periodOptions.find((option) => option.key === period)?.games ?? 9;
    return gameData.slice(-gameCount);
  }, [period]);

  const stats = useMemo(() => calculateStats(selectedPoints), [selectedPoints]);

  const serviceData = useMemo(() => {
    const definitions = [
      { name: "Concierge Pickup", share: 0.29, orderShare: 0.31, color: colors.green, icon: PackageCheck, time: "6m 18s" },
      { name: "Suite Delivery", share: 0.25, orderShare: 0.28, color: colors.cyan, icon: Store, time: "11m 42s" },
      { name: "Ship It Home", share: 0.46, orderShare: 0.41, color: colors.blue, icon: Truck, time: "2m 09s" },
    ];

    return definitions.map((service) => {
      const serviceSessions = Math.round(stats.sessions * service.share);
      const serviceOrders = Math.round(stats.orders * service.orderShare);
      return {
        ...service,
        sessions: serviceSessions,
        orders: serviceOrders,
        revenue: Math.round(stats.revenue * service.orderShare),
        conversion: (serviceOrders / serviceSessions) * 100,
      };
    });
  }, [stats]);

  const merchandiseData = useMemo(() => [
    { category: "Jerseys", share: 0.34, aov: 184, demand: 96, color: colors.green },
    { category: "Sweatshirts", share: 0.23, aov: 112, demand: 88, color: colors.cyan },
    { category: "Hats", share: 0.20, aov: 43, demand: 92, color: colors.blue },
    { category: "T-Shirts", share: 0.15, aov: 38, demand: 79, color: colors.amber },
    { category: "All Departments", share: 0.08, aov: 71, demand: 67, color: "#005CC8" },
  ].map((item) => {
    const revenue = Math.round(stats.revenue * item.share);
    return { ...item, revenue, units: Math.round(revenue / item.aov) };
  }), [stats]);

  const topProducts = useMemo(() => [
    { name: "Men's Chicago Cubs Pete Crow-Armstrong Nike White Home Replica Jersey", category: "Jerseys", revenue: stats.revenue * 0.082, conversion: 27.8, demand: "Very high", risk: "Low" },
    { name: "Men's Chicago Cubs Nike Light Blue Alternate Club Fleece Hoodie", category: "Hoodies", revenue: stats.revenue * 0.064, conversion: 24.1, demand: "High", risk: "Medium" },
    { name: "Men's Chicago Cubs New Era Royal Authentic Collection On Field 59FIFTY Fitted Hat", category: "Hats", revenue: stats.revenue * 0.052, conversion: 29.4, demand: "Very high", risk: "High" },
    { name: "Chicago Cubs Pete Crow-Armstrong Nike Light Blue Name & Number T-Shirt", category: "T-Shirts", revenue: stats.revenue * 0.039, conversion: 22.7, demand: "High", risk: "Low" },
    { name: "Chicago Cubs WinCraft Clear Tote Bag", category: "Accessories", revenue: stats.revenue * 0.034, conversion: 18.9, demand: "Growing", risk: "Medium" },
  ], [stats]);

  const funnelData = [
    { label: "Kiosk sessions", value: stats.sessions, rate: 100, color: colors.charcoal },
    { label: "Product views", value: stats.productViews, rate: (stats.productViews / stats.sessions) * 100, color: colors.green },
    { label: "Added to cart", value: stats.cartAdds, rate: (stats.cartAdds / stats.sessions) * 100, color: colors.steel },
    { label: "Checkout started", value: stats.checkoutStarts, rate: (stats.checkoutStarts / stats.sessions) * 100, color: colors.cyan },
    { label: "Order confirmed", value: stats.orders, rate: (stats.orders / stats.sessions) * 100, color: colors.blue },
  ];

  const projection = useMemo(() => {
    const projectedOrders = Math.round(135 * kioskCount * projectedGames * (1 + conversionLift / 100));
    const revenue = projectedOrders * stats.aov;
    const incremental = revenue * 0.697;
    const grossProfit = incremental * 0.46;
    const cost = kioskCount * projectedGames * 900;
    return {
      orders: projectedOrders,
      revenue,
      incremental,
      grossProfit,
      cost,
      net: grossProfit - cost,
      roi: grossProfit / cost,
    };
  }, [conversionLift, kioskCount, projectedGames, stats.aov]);

  const activeNav = navItems.find((item) => item.id === view) ?? navItems[0];
  const activePeriod = periodOptions.find((item) => item.key === period) ?? periodOptions[2];

  const exportSummary = () => {
    const rows = [
      ["Metric", "Value"],
      ["Period", activePeriod.label],
      ["Kiosk sessions", stats.sessions],
      ["Orders", stats.orders],
      ["Attributed GMV", stats.revenue],
      ["Incremental GMV", stats.incrementalRevenue],
      ["Gross profit", stats.grossProfit],
      ["Program cost", stats.programCost],
      ["Net contribution", stats.netContribution],
      ["Gross return multiple", stats.roi.toFixed(2)],
      ["Season ticket pipeline", stats.ticketPipeline],
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = `cubs-kiosk-impact-${period}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const renderOverview = () => (
    <>
      <section className="impact-band">
        <div className="impact-primary">
          <span className="eyebrow">Kiosk-attributed merchandise GMV</span>
          <strong>{compactCurrency.format(stats.revenue)}</strong>
          <p>{currency.format(Math.round(stats.revenue / stats.games))} generated per home game across pickup, suite delivery, and ship-to-home.</p>
        </div>
        <div className="impact-facts">
          <div><span>Net contribution</span><strong>{compactCurrency.format(stats.netContribution)}</strong><small>After program costs</small></div>
          <div><span>Gross return</span><strong>{stats.roi.toFixed(1)}x</strong><small>Gross profit ÷ cost</small></div>
          <div><span>Ticket pipeline</span><strong>{compactCurrency.format(stats.ticketPipeline)}</strong><small>Tracked separately</small></div>
        </div>
      </section>

      <section className="metric-grid" aria-label="Key performance indicators">
        <MetricCard label="Orders completed" value={wholeNumber.format(stats.orders)} detail={`${stats.assistedOrders.toLocaleString()} kiosk-assisted`} change="+18.4%" icon={ShoppingCart} />
        <MetricCard label="Average order value" value={currency.format(stats.aov)} detail="Across all merchandise" change="+9.7%" icon={ShoppingBag} tone="blue" />
        <MetricCard label="Kiosk conversion" value={`${stats.conversion.toFixed(1)}%`} detail="Sessions to confirmed order" change="+4.2 pts" icon={Target} tone="charcoal" />
        <MetricCard label="Guest satisfaction" value={`${stats.satisfaction}%`} detail={`${stats.feedbackResponses.toLocaleString()} responses`} change="+6.1%" icon={ThumbsUp} tone="amber" />
      </section>

      <section className="dashboard-grid overview-grid">
        <article className="panel revenue-panel">
          <SectionHeading eyebrow="Commerce trend" title="Revenue influenced by game" action={`${stats.games} home game${stats.games === 1 ? "" : "s"}`} />
          <div className="chart chart-large">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={selectedPoints} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.green} stopOpacity={0.34} />
                    <stop offset="100%" stopColor={colors.green} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#DAE4F8" vertical={false} />
                <XAxis dataKey="opponent" axisLine={false} tickLine={false} tick={{ fill: "#234C9C", fontSize: 12, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`} tick={{ fill: "#005CC8", fontSize: 11 }} width={48} />
                <Tooltip formatter={(value) => [currency.format(Number(value)), "Attributed GMV"]} labelFormatter={(label) => `vs. ${label}`} contentStyle={{ borderRadius: 8, border: "1px solid #DAE4F8", boxShadow: "0 10px 24px rgba(0,22,40,.12)" }} />
                <Area type="monotone" dataKey="revenue" stroke={colors.green} strokeWidth={3} fill="url(#revenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel executive-readout">
          <SectionHeading eyebrow="Executive readout" title="What the kiosk changed" />
          <div className="readout-list">
            <div>
              <span className="readout-icon green"><Zap size={18} /></span>
              <p><strong>{currency.format(stats.incrementalRevenue)}</strong> in modeled incremental merchandise demand was captured instead of walking out of the ballpark.</p>
            </div>
            <div>
              <span className="readout-icon blue"><Clock3 size={18} /></span>
              <p><strong>9.4 minutes</strong> saved per assisted order by moving search, checkout, and fulfillment away from store lines.</p>
            </div>
            <div>
              <span className="readout-icon amber"><Ticket size={18} /></span>
              <p><strong>{stats.qualifiedLeads.toLocaleString()} qualified ticket leads</strong> were created without counting pipeline value as retail revenue.</p>
            </div>
          </div>
          <button className="text-action" onClick={() => setView("roi")}>Open the ROI model <ChevronRight size={17} /></button>
        </article>

        <article className="panel service-mix-panel">
          <SectionHeading eyebrow="Service mix" title="Where revenue is coming from" />
          <div className="service-bars">
            {serviceData.map((service) => (
              <div className="service-bar-row" key={service.name}>
                <div><strong>{service.name}</strong><span>{service.orders.toLocaleString()} orders</span></div>
                <div className="service-track"><span style={{ width: `${service.orderShare * 100}%`, background: service.color }} /></div>
                <strong>{compactCurrency.format(service.revenue)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel action-panel">
          <SectionHeading eyebrow="Next best actions" title="Protect the upside" />
          <div className="action-list">
            <button onClick={() => setView("merchandise")}><CircleAlert size={18} /><span><strong>Rebalance sideline hats</strong><small>High demand and elevated stock risk</small></span><ChevronRight size={18} /></button>
            <button onClick={() => setView("funnel")}><MousePointerClick size={18} /><span><strong>Recover checkout exits</strong><small>{compactCurrency.format(stats.revenue * 0.066)} modeled opportunity</small></span><ChevronRight size={18} /></button>
            <button onClick={() => setView("services")}><Truck size={18} /><span><strong>Expand ship-to-home prompts</strong><small>Highest revenue share across services</small></span><ChevronRight size={18} /></button>
          </div>
        </article>
      </section>
    </>
  );

  const renderROI = () => {
    const roiBridge = [
      { name: "Attributed GMV", value: stats.revenue, color: colors.charcoal },
      { name: "Incremental GMV", value: stats.incrementalRevenue, color: colors.green },
      { name: "Gross profit", value: stats.grossProfit, color: colors.cyan },
      { name: "Program cost", value: stats.programCost, color: colors.red },
      { name: "Net contribution", value: stats.netContribution, color: colors.blue },
    ];

    return (
      <>
        <section className="roi-statement">
          <div>
            <span className="eyebrow">Gross return on program cost</span>
            <h2>Every $1 invested returns <strong>${stats.roi.toFixed(2)}</strong> in incremental gross profit.</h2>
            <p>The model applies a 69.7% incrementality rate and a 46% merchandise gross margin. Season-ticket pipeline is excluded.</p>
          </div>
          <div className="roi-statement-value"><span>Net contribution</span><strong>{currency.format(stats.netContribution)}</strong><small>{stats.games} home game{stats.games === 1 ? "" : "s"}</small></div>
        </section>

        <section className="dashboard-grid roi-grid">
          <article className="panel roi-bridge-panel">
            <SectionHeading eyebrow="Value bridge" title="From transaction to contribution" action="Transparent model" />
            <div className="chart chart-large">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roiBridge} margin={{ top: 20, right: 8, left: 8, bottom: 16 }}>
                  <CartesianGrid stroke="#DAE4F8" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#234C9C", fontSize: 11, fontWeight: 700 }} interval={0} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => compactCurrency.format(Number(value))} tick={{ fill: "#005CC8", fontSize: 11 }} width={56} />
                  <Tooltip formatter={(value) => currency.format(Number(value))} contentStyle={{ borderRadius: 8, border: "1px solid #DAE4F8" }} />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                    {roiBridge.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="panel assumptions-panel">
            <SectionHeading eyebrow="Scenario planner" title="Scale the business case" />
            <label className="range-control"><span><strong>Kiosks deployed</strong><b>{kioskCount}</b></span><input type="range" min="1" max="12" value={kioskCount} onChange={(event) => setKioskCount(Number(event.target.value))} /></label>
            <label className="range-control"><span><strong>Home games</strong><b>{projectedGames}</b></span><input type="range" min="1" max="20" value={projectedGames} onChange={(event) => setProjectedGames(Number(event.target.value))} /></label>
            <label className="range-control"><span><strong>Conversion lift</strong><b>{conversionLift}%</b></span><input type="range" min="0" max="25" value={conversionLift} onChange={(event) => setConversionLift(Number(event.target.value))} /></label>
            <div className="projection-results">
              <div><span>Projected GMV</span><strong>{compactCurrency.format(projection.revenue)}</strong></div>
              <div><span>Net contribution</span><strong>{compactCurrency.format(projection.net)}</strong></div>
              <div><span>Gross return</span><strong>{projection.roi.toFixed(1)}x</strong></div>
            </div>
          </article>

          <article className="panel roi-proof-panel">
            <SectionHeading eyebrow="ROI proof points" title="Why the return is durable" />
            <div className="proof-grid">
              <div><ShoppingBag size={22} /><strong>{currency.format(stats.aov)}</strong><span>Average order value</span></div>
              <div><Percent size={22} /><strong>69.7%</strong><span>Modeled incrementality</span></div>
              <div><CircleDollarSign size={22} /><strong>46.0%</strong><span>Merchandise gross margin</span></div>
              <div><Calculator size={22} /><strong>{currency.format(stats.programCost)}</strong><span>Program cost in period</span></div>
            </div>
            <p className="method-note"><BadgeCheck size={16} /> Gross return = incremental GMV × gross margin ÷ kiosk program cost.</p>
          </article>

          <article className="panel pipeline-panel">
            <SectionHeading eyebrow="Additional enterprise value" title="Season-ticket demand created" action="Excluded from retail ROI" />
            <div className="pipeline-value"><Ticket size={28} /><div><strong>{compactCurrency.format(stats.ticketPipeline)}</strong><span>Qualified pipeline</span></div></div>
            <div className="pipeline-stages">
              <div><span>Interest captured</span><strong>{stats.ticketLeads.toLocaleString()}</strong></div>
              <ChevronRight size={18} />
              <div><span>Qualified leads</span><strong>{stats.qualifiedLeads.toLocaleString()}</strong></div>
              <ChevronRight size={18} />
              <div><span>Modeled pipeline</span><strong>{compactCurrency.format(stats.ticketPipeline)}</strong></div>
            </div>
          </article>
        </section>
      </>
    );
  };

  const renderFunnel = () => {
    const recoveryOpportunity = stats.revenue * 0.066;
    const reasons = [
      { reason: "Size or variant unavailable", value: 32 },
      { reason: "Deferred purchase", value: 24 },
      { reason: "Checkout hesitation", value: 18 },
      { reason: "Product comparison", value: 16 },
      { reason: "Other", value: 10 },
    ];

    return (
      <section className="dashboard-grid funnel-grid">
        <article className="panel funnel-panel">
          <SectionHeading eyebrow="Purchase journey" title="Kiosk session to confirmed order" action={`${stats.conversion.toFixed(1)}% end-to-end conversion`} />
          <div className="funnel-list">
            {funnelData.map((stage, index) => (
              <div className="funnel-stage" key={stage.label}>
                <div className="funnel-label"><span>{index + 1}</span><div><strong>{stage.label}</strong><small>{stage.rate.toFixed(1)}% of sessions</small></div></div>
                <div className="funnel-track"><span style={{ width: `${stage.rate}%`, background: stage.color }} /></div>
                <strong>{stage.value.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel recovery-panel">
          <SectionHeading eyebrow="Recoverable demand" title="Next conversion opportunity" />
          <div className="recovery-value"><span>Modeled GMV available</span><strong>{currency.format(recoveryOpportunity)}</strong><small>With a 10% recovery of checkout exits</small></div>
          <div className="recovery-actions">
            <p><BadgeCheck size={17} /> Preserve cart contents when a guest changes fulfillment method.</p>
            <p><BadgeCheck size={17} /> Surface size alternatives before checkout abandonment.</p>
            <p><BadgeCheck size={17} /> Trigger associate help after 45 seconds of inactivity.</p>
          </div>
        </article>

        <article className="panel funnel-trend-panel">
          <SectionHeading eyebrow="Conversion trend" title="Orders and sessions by game" />
          <div className="chart chart-medium">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedPoints} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#DAE4F8" vertical={false} />
                <XAxis dataKey="opponent" axisLine={false} tickLine={false} tick={{ fill: "#234C9C", fontSize: 11, fontWeight: 700 }} />
                <YAxis yAxisId="sessions" axisLine={false} tickLine={false} tick={{ fill: "#005CC8", fontSize: 11 }} width={42} />
                <YAxis yAxisId="orders" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "#005CC8", fontSize: 11 }} width={42} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #DAE4F8" }} />
                <Line yAxisId="sessions" type="monotone" dataKey="sessions" name="Sessions" stroke={colors.green} strokeWidth={3} dot={{ r: 3 }} />
                <Line yAxisId="orders" type="monotone" dataKey="orders" name="Orders" stroke={colors.blue} strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel exit-panel">
          <SectionHeading eyebrow="Exit signals" title="Why guests leave the funnel" />
          <div className="exit-reasons">
            {reasons.map((item) => (
              <div key={item.reason}><span>{item.reason}</span><div><i style={{ width: `${item.value}%` }} /></div><strong>{item.value}%</strong></div>
            ))}
          </div>
        </article>
      </section>
    );
  };

  const renderServices = () => (
    <>
      <section className="service-card-grid">
        {serviceData.map((service) => {
          const Icon = service.icon;
          return (
            <article className="service-card" key={service.name} style={{ borderTopColor: service.color }}>
              <div className="service-card-header"><span style={{ background: `${service.color}18`, color: service.color }}><Icon size={23} /></span><small>{service.time} avg completion</small></div>
              <h3>{service.name}</h3>
              <strong>{compactCurrency.format(service.revenue)}</strong>
              <p>Attributed merchandise GMV</p>
              <div className="service-card-stats"><span><b>{service.orders.toLocaleString()}</b> orders</span><span><b>{service.conversion.toFixed(1)}%</b> conversion</span></div>
            </article>
          );
        })}
        <article className="service-card ticket-card">
          <div className="service-card-header"><span><Ticket size={23} /></span><small>Enterprise lead engine</small></div>
          <h3>Season Tickets</h3>
          <strong>{compactCurrency.format(stats.ticketPipeline)}</strong>
          <p>Qualified pipeline, excluded from retail ROI</p>
          <div className="service-card-stats"><span><b>{stats.ticketLeads.toLocaleString()}</b> leads</span><span><b>82%</b> qualified</span></div>
        </article>
      </section>

      <section className="dashboard-grid services-grid">
        <article className="panel service-performance-panel">
          <SectionHeading eyebrow="Service economics" title="Revenue and conversion by journey" />
          <div className="chart chart-large">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceData} layout="vertical" margin={{ top: 4, right: 24, left: 18, bottom: 4 }}>
                <CartesianGrid stroke="#DAE4F8" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => compactCurrency.format(Number(value))} tick={{ fill: "#005CC8", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#234C9C", fontSize: 11, fontWeight: 700 }} width={112} />
                <Tooltip formatter={(value) => currency.format(Number(value))} contentStyle={{ borderRadius: 8, border: "1px solid #DAE4F8" }} />
                <Bar dataKey="revenue" radius={[0, 5, 5, 0]}>
                  {serviceData.map((service) => <Cell key={service.name} fill={service.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel operations-panel">
          <SectionHeading eyebrow="Operating health" title="Fulfillment quality" />
          <div className="operations-list">
            <div><span><BadgeCheck size={18} /> Orders fulfilled on time</span><strong>96.8%</strong></div>
            <div><span><Clock3 size={18} /> Median concierge handoff</span><strong>6m 18s</strong></div>
            <div><span><Store size={18} /> Suite delivery SLA</span><strong>94.2%</strong></div>
            <div><span><Truck size={18} /> Ship-to-home validation</span><strong>98.6%</strong></div>
            <div><span><CircleAlert size={18} /> Orders requiring intervention</span><strong>2.7%</strong></div>
          </div>
        </article>

        <article className="panel service-table-panel">
          <SectionHeading eyebrow="Journey detail" title="Full performance table" action="Retail services only" />
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Service</th><th>Sessions</th><th>Orders</th><th>Conversion</th><th>Attributed GMV</th><th>Avg. completion</th></tr></thead>
              <tbody>{serviceData.map((service) => <tr key={service.name}><td><span className="table-dot" style={{ background: service.color }} />{service.name}</td><td>{service.sessions.toLocaleString()}</td><td>{service.orders.toLocaleString()}</td><td>{service.conversion.toFixed(1)}%</td><td>{currency.format(service.revenue)}</td><td>{service.time}</td></tr>)}</tbody>
            </table>
          </div>
        </article>
      </section>
    </>
  );

  const renderMerchandise = () => (
    <section className="dashboard-grid merchandise-grid">
      <article className="panel category-panel">
        <div className="section-heading with-control">
          <div><span>Category intelligence</span><h2>Merchandise performance</h2></div>
          <div className="mini-segmented" aria-label="Merchandise metric">
            <button className={merchMetric === "revenue" ? "active" : ""} onClick={() => setMerchMetric("revenue")}>Revenue</button>
            <button className={merchMetric === "demand" ? "active" : ""} onClick={() => setMerchMetric("demand")}>Demand</button>
          </div>
        </div>
        <div className="chart chart-large">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={merchandiseData} margin={{ top: 18, right: 8, left: 0, bottom: 10 }}>
              <CartesianGrid stroke="#DAE4F8" vertical={false} />
              <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: "#234C9C", fontSize: 11, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => merchMetric === "revenue" ? compactCurrency.format(Number(value)) : `${value}`} tick={{ fill: "#005CC8", fontSize: 11 }} width={52} />
              <Tooltip formatter={(value) => merchMetric === "revenue" ? currency.format(Number(value)) : `${value} demand index`} contentStyle={{ borderRadius: 8, border: "1px solid #DAE4F8" }} />
              <Bar dataKey={merchMetric} radius={[5, 5, 0, 0]}>
                {merchandiseData.map((entry) => <Cell key={entry.category} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="panel demand-panel">
        <SectionHeading eyebrow="Demand capture" title="Inventory value protected" />
        <div className="demand-hero"><PackageSearch size={27} /><div><strong>{compactCurrency.format(stats.revenue * 0.114)}</strong><span>Demand surfaced beyond ballpark stock</span></div></div>
        <div className="demand-stats">
          <div><span>Ship-to-home saves</span><strong>{Math.round(stats.orders * 0.22).toLocaleString()}</strong></div>
          <div><span>Substitutions accepted</span><strong>71%</strong></div>
          <div><span>Back-in-stock requests</span><strong>{Math.round(stats.sessions * 0.024).toLocaleString()}</strong></div>
        </div>
      </article>

      <article className="panel top-products-panel">
        <SectionHeading eyebrow="Product leaderboard" title="Top merchandise signals" action="Ranked by attributed GMV" />
        <div className="data-table-wrap">
          <table className="data-table products-table">
            <thead><tr><th>Product</th><th>Category</th><th>Attributed GMV</th><th>Conversion</th><th>Demand</th><th>Stock risk</th></tr></thead>
            <tbody>{topProducts.map((product, index) => <tr key={product.name}><td><span className="rank">{index + 1}</span><strong>{product.name}</strong></td><td>{product.category}</td><td>{currency.format(product.revenue)}</td><td>{product.conversion}%</td><td><span className="status-pill demand-status">{product.demand}</span></td><td><span className={`status-pill risk-${product.risk.toLowerCase()}`}>{product.risk}</span></td></tr>)}</tbody>
          </table>
        </div>
      </article>

      <article className="panel category-summary-panel">
        <SectionHeading eyebrow="Category detail" title="Sales mix and unit demand" />
        <div className="category-summary-list">
          {merchandiseData.map((item) => <div key={item.category}><span className="category-color" style={{ background: item.color }} /><strong>{item.category}</strong><span>{item.units.toLocaleString()} units</span><b>{currency.format(item.revenue)}</b></div>)}
        </div>
      </article>
    </section>
  );

  const renderExperience = () => {
    const ratingData = [
      { name: "Satisfied", value: 78, color: colors.green },
      { name: "Neutral", value: 15, color: colors.amber },
      { name: "Dissatisfied", value: 7, color: colors.red },
    ];
    const languageData = [
      { name: "English", value: 82, color: colors.green },
      { name: "Spanish", value: 11, color: colors.cyan },
      { name: "Portuguese", value: 4, color: colors.blue },
      { name: "Other", value: 3, color: colors.amber },
    ];

    return (
      <>
        <section className="metric-grid experience-metrics">
          <MetricCard label="Overall satisfaction" value={`${stats.satisfaction}%`} detail="Across all four journeys" change="+6.1%" icon={ThumbsUp} />
          <MetricCard label="Experience score" value="4.6 / 5" detail="Post-service feedback" change="+0.4" icon={SmilePlus} tone="blue" />
          <MetricCard label="Associate interaction" value="88%" detail="Rated satisfied" change="+8.3%" icon={Users} tone="charcoal" />
          <MetricCard label="Multilingual usage" value="18%" detail="Sessions outside English" change="+3.8%" icon={Languages} tone="amber" />
        </section>

        <section className="dashboard-grid experience-grid">
          <article className="panel sentiment-panel">
            <SectionHeading eyebrow="Guest sentiment" title="Associate interaction rating" />
            <div className="sentiment-layout">
              <div className="pie-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={ratingData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3}>{ratingData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip formatter={(value) => `${value}%`} /></PieChart>
                </ResponsiveContainer>
                <div className="pie-center"><strong>93%</strong><span>positive or neutral</span></div>
              </div>
              <div className="legend-list">{ratingData.map((item) => <div key={item.name}><span style={{ background: item.color }} /><strong>{item.name}</strong><b>{item.value}%</b></div>)}</div>
            </div>
          </article>

          <article className="panel language-panel">
            <SectionHeading eyebrow="Accessibility" title="Language usage" />
            <div className="language-list">{languageData.map((item) => <div key={item.name}><div><span style={{ background: item.color }} /><strong>{item.name}</strong></div><div className="language-track"><i style={{ width: `${item.value}%`, background: item.color }} /></div><b>{item.value}%</b></div>)}</div>
          </article>

          <article className="panel feedback-panel">
            <SectionHeading eyebrow="Feedback themes" title="What guests are telling us" action={`${stats.feedbackResponses.toLocaleString()} responses`} />
            <div className="feedback-themes">
              <div><span className="feedback-score positive">+42%</span><p><strong>Fast product discovery</strong><small>Guests value seeing the MLB Shop Cubs Store assortment in one place.</small></p></div>
              <div><span className="feedback-score positive">+31%</span><p><strong>Convenient fulfillment</strong><small>Ship-to-home removes the need to carry merchandise during the game.</small></p></div>
              <div><span className="feedback-score positive">+18%</span><p><strong>Helpful associates</strong><small>Concierge handoffs are improving confidence and completion.</small></p></div>
              <div><span className="feedback-score negative">-9%</span><p><strong>Variant availability</strong><small>Size and color gaps remain the leading source of friction.</small></p></div>
            </div>
          </article>

          <article className="panel satisfaction-trend-panel">
            <SectionHeading eyebrow="Experience trend" title="Satisfaction by game" />
            <div className="chart chart-medium">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedPoints} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#DAE4F8" vertical={false} />
                  <XAxis dataKey="opponent" axisLine={false} tickLine={false} tick={{ fill: "#234C9C", fontSize: 11, fontWeight: 700 }} />
                  <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} tick={{ fill: "#005CC8", fontSize: 11 }} width={42} />
                  <Tooltip formatter={(value) => `${value}%`} contentStyle={{ borderRadius: 8, border: "1px solid #DAE4F8" }} />
                  <Line type="monotone" dataKey="satisfaction" name="Satisfaction" stroke={colors.green} strokeWidth={3} dot={{ r: 4, fill: colors.green }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>
      </>
    );
  };

  const renderOrders = () => (
    <StadiumOrdersView
      orders={stadiumOrders.orders}
      linkStatus={stadiumOrders.linkStatus}
      lastReceivedOrderId={stadiumOrders.lastReceivedOrderId}
      onStatus={stadiumOrders.updateOrderStatus}
      onDelete={stadiumOrders.deleteOrder}
    />
  );

  const viewContent: Record<ViewId, () => React.ReactNode> = {
    overview: renderOverview,
    orders: renderOrders,
    roi: renderROI,
    funnel: renderFunnel,
    services: renderServices,
    merchandise: renderMerchandise,
    experience: renderExperience,
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-logo">
              <img src={cubsLogo} alt="Chicago Cubs" />
          </div>
          <div className="brand-copy"><strong>Chicago Cubs Retail</strong><span>Jibe Kiosk Intelligence</span></div>
        </div>

        <nav aria-label="Dashboard views">
          {navItems.map(({ id, label, description, icon: Icon }) => (
            <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)} aria-current={view === id ? "page" : undefined}>
              <Icon size={20} />
              <span><strong>{label}</strong><small>{description}</small></span>
              {id === "orders" && stadiumOrders.orders.filter((order) => order.status !== "fulfilled").length > 0
                ? <b className="nav-order-count">{stadiumOrders.orders.filter((order) => order.status !== "fulfilled").length}</b>
                : <ChevronRight size={16} />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="live-status"><i /> <span><strong>Demo analytics</strong><small>Updated {lastUpdated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small></span></div>
          <a href="../survey/" target="_blank" rel="noreferrer"><ExternalLink size={17} /> Open kiosk experience</a>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-title">
            <span>{activeNav.description}</span>
            <h1>{activeNav.label}</h1>
            <p><MapPin size={15} /> Wrigley Field <i /> {view === "orders" ? "Device-local orders" : `${activePeriod.label} · Demo data`}</p>
          </div>
          <div className="topbar-actions">
            {view === "orders" ? (
              <div className={`orders-topbar-link status-${stadiumOrders.linkStatus}`}>
                <i />
                <span><strong>{stadiumOrders.linkStatus === "live" ? "Shared order feed live" : stadiumOrders.linkStatus === "offline" ? "Order feed offline" : "Connecting order feed"}</strong><small>{stadiumOrders.orders.length} synced order{stadiumOrders.orders.length === 1 ? "" : "s"}</small></span>
              </div>
            ) : (
              <>
                <div className="period-control" aria-label="Reporting period">
                  {periodOptions.map((option) => <button key={option.key} className={period === option.key ? "active" : ""} onClick={() => setPeriod(option.key)}>{option.label}</button>)}
                </div>
                <button className="icon-button" title="Refresh data" aria-label="Refresh data" onClick={() => setLastUpdated(new Date())}><RefreshCw size={19} /></button>
                <button className="export-button" onClick={exportSummary}><Download size={18} /> Export</button>
              </>
            )}
          </div>
        </header>

        <div className="content-area">
          {viewContent[view]()}
        </div>
      </main>
    </div>
  );
}

export default App;
