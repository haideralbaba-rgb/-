import { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowRight, FiCheck, FiClock, FiLogOut, FiPackage, FiRefreshCw, FiTruck, FiX } from "react-icons/fi";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { OrderStatus } from "../lib/database.types";

interface DashboardOrder {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  fulfillment: "delivery" | "pickup";
  formatted_address: string | null;
  phone: string;
  customer_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: Array<{ id: string; product_name: string; quantity: number; unit_price: number; total: number }>;
}

type Filter = "all" | "pending" | "preparing" | "ready" | "out_for_delivery" | "delivered";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "جديد",
  confirmed: "مؤكد",
  preparing: "قيد التحضير",
  ready: "جاهز",
  out_for_delivery: "بالطريق",
  delivered: "مكتمل",
  cancelled: "ملغي",
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "out_for_delivery",
  out_for_delivery: "delivered",
};

function money(value: number) {
  return `${Number(value || 0).toLocaleString("ar-IQ")} د.ع`;
}

function statusClass(status: OrderStatus) {
  if (status === "pending") return "border-red/30 bg-red/10 text-red-200";
  if (status === "preparing" || status === "confirmed") return "border-gold/30 bg-gold/10 text-gold";
  if (status === "ready" || status === "out_for_delivery") return "border-blue-400/30 bg-blue-400/10 text-blue-200";
  if (status === "delivered") return "border-green-400/30 bg-green-400/10 text-green-300";
  return "border-white/10 bg-white/5 text-ivory-mute";
}

export default function RestaurantDashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const checkAccess = useCallback(async () => {
    if (!user) {
      setAuthorized(false);
      return;
    }
    const { data, error: accessError } = await supabase
      .from("restaurant_staff")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();
    setAuthorized(!accessError && !!data);
  }, [user]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: queryError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (queryError) setError(queryError.message);
    else setOrders((data || []) as DashboardOrder[]);
    setLoading(false);
  }, []);

  useEffect(() => { checkAccess(); }, [checkAccess]);

  useEffect(() => {
    if (!authorized) return;
    loadOrders();
    const channel = supabase
      .channel("restaurant-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authorized, loadOrders]);

  const updateStatus = async (order: DashboardOrder, status: OrderStatus) => {
    setBusyId(order.id);
    setError("");
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() } as never)
      .eq("id", order.id);
    if (updateError) setError(updateError.message);
    else setOrders((prev) => prev.map((item) => item.id === order.id ? { ...item, status } : item));
    setBusyId(null);
  };

  const visibleOrders = useMemo(() => filter === "all" ? orders : orders.filter((o) => o.status === filter), [orders, filter]);
  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === today && o.status !== "cancelled");
  const revenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const activeCount = orders.filter((o) => ["pending", "confirmed", "preparing", "ready", "out_for_delivery"].includes(o.status)).length;

  if (authLoading || authorized === null) {
    return <div className="grid min-h-screen place-items-center bg-bg text-ivory"><FiRefreshCw className="animate-spin" size={22} /></div>;
  }

  if (!user) {
    return <AccessScreen title="سجّل الدخول أولاً" description="لوحة المطعم مخصصة لصاحب المطعم والموظفين المصرح لهم." />;
  }

  if (!authorized) {
    return <AccessScreen title="لا يوجد تصريح" description="هذا الحساب ليس ضمن موظفي المطعم. أضف user_id إلى restaurant_staff من Supabase ثم أعد المحاولة." userId={user.id} />;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-bg text-ivory">
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-gold text-bg"><FiPackage size={21} /></div><div><p className="font-display text-lg">معلم الشاورما</p><p className="text-xs text-ivory-mute">Restaurant Command Center</p></div></div>
          <div className="flex items-center gap-2"><button onClick={loadOrders} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-ivory-mute hover:text-ivory"><FiRefreshCw size={16} /></button><button onClick={() => signOut()} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-ivory-mute hover:text-ivory"><FiLogOut /> خروج</button></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
        {error && <div className="flex items-center justify-between rounded-2xl border border-red/30 bg-red/10 px-4 py-3 text-sm text-red-100"><span>{error}</span><button onClick={() => setError("")}><FiX /></button></div>}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric icon={<FiPackage />} label="طلبات اليوم" value={String(todayOrders.length)} />
          <Metric icon={<FiClock />} label="طلبات نشطة" value={String(activeCount)} />
          <Metric icon={<FiCheck />} label="مكتملة" value={String(todayOrders.filter((o) => o.status === "delivered").length)} />
          <Metric icon={<FiTruck />} label="مبيعات اليوم" value={money(revenue)} />
        </section>

        <section className="rounded-3xl border border-white/[0.08] bg-surface/70 p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="font-display text-xl">الطلبات</h1><p className="text-xs text-ivory-mute">تتحدث تلقائياً عند وصول طلب جديد</p></div><div className="flex gap-2 overflow-x-auto pb-1">{(["all", "pending", "preparing", "ready", "out_for_delivery", "delivered"] as Filter[]).map((key) => <button key={key} onClick={() => setFilter(key)} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs transition ${filter === key ? "bg-gold text-bg" : "bg-white/5 text-ivory-mute hover:text-ivory"}`}>{key === "all" ? "الكل" : STATUS_LABELS[key as OrderStatus]}</button>)}</div></div>

          {loading ? <div className="grid min-h-52 place-items-center"><FiRefreshCw className="animate-spin text-gold" /></div> : visibleOrders.length === 0 ? <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-white/10 text-sm text-ivory-mute">ماكو طلبات بهالحالة</div> : <div className="grid gap-3 lg:grid-cols-2">{visibleOrders.map((order) => <OrderCard key={order.id} order={order} busy={busyId === order.id} onStatus={updateStatus} />)}</div>}
        </section>
      </main>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/[0.08] bg-surface/70 p-4"><div className="mb-3 flex items-center gap-2 text-gold">{icon}<span className="text-xs text-ivory-mute">{label}</span></div><p className="font-display text-xl sm:text-2xl">{value}</p></div>;
}

function OrderCard({ order, busy, onStatus }: { order: DashboardOrder; busy: boolean; onStatus: (order: DashboardOrder, status: OrderStatus) => void }) {
  const next = NEXT_STATUS[order.status];
  return <article className="rounded-2xl border border-white/[0.08] bg-bg/60 p-4 transition hover:border-gold/20">
    <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="font-display text-base">#{order.order_number}</span><span className={`rounded-full border px-2 py-1 text-[10px] ${statusClass(order.status)}`}>{STATUS_LABELS[order.status]}</span></div><p className="mt-1 text-xs text-ivory-mute">{new Date(order.created_at).toLocaleString("ar-IQ", { dateStyle: "short", timeStyle: "short" })}</p></div><strong className="text-gold">{money(order.total)}</strong></div>
    <div className="my-4 space-y-2 border-y border-white/[0.06] py-3">{(order.order_items || []).map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span>{item.quantity}× {item.product_name}</span><span className="text-ivory-mute">{money(item.total)}</span></div>)}</div>
    <div className="space-y-1 text-xs text-ivory-mute"><p>الزبون: <span className="text-ivory">{order.customer_name || "زبون"}</span> · {order.phone}</p><p>الاستلام: <span className="text-ivory">{order.fulfillment === "delivery" ? "توصيل" : "استلام من المطعم"}</span></p>{order.formatted_address && <p>العنوان: <span className="text-ivory">{order.formatted_address}</span></p>}{order.notes && <p>ملاحظة: <span className="text-ivory">{order.notes}</span></p>}</div>
    {next && <button disabled={busy} onClick={() => onStatus(order, next)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-bold text-bg transition hover:brightness-110 disabled:opacity-50">{busy ? <FiRefreshCw className="animate-spin" /> : <FiCheck />} {STATUS_LABELS[next]}</button>}
    {order.status === "pending" && <button disabled={busy} onClick={() => onStatus(order, "cancelled")} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red/20 px-4 py-2 text-xs text-red-200 hover:bg-red/10"><FiX /> رفض الطلب</button>}
  </article>;
}

function AccessScreen({ title, description, userId }: { title: string; description: string; userId?: string }) {
  return <div dir="rtl" className="grid min-h-screen place-items-center bg-bg px-5 text-center text-ivory"><div className="max-w-md rounded-3xl border border-white/[0.08] bg-surface p-7 shadow-2xl"><div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gold text-bg"><FiPackage size={24} /></div><h1 className="font-display text-2xl">{title}</h1><p className="mt-2 text-sm leading-6 text-ivory-mute">{description}</p>{userId && <p className="mt-4 break-all rounded-xl bg-bg p-3 text-[10px] text-ivory-mute">User ID: {userId}</p>}<a href="/" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-bold text-bg">العودة للموقع <FiArrowRight /></a></div></div>;
}
