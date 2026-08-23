import { useEffect, useMemo, useState } from "react";
import { FiClock, FiRefreshCw, FiXCircle } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { cancelOrder } from "../lib/orderService";
import type { OrderStatus } from "../lib/database.types";

const statusText: Record<OrderStatus, string> = {
  pending: "بانتظار المطعم",
  confirmed: "تم قبول الطلب",
  preparing: "قيد التحضير",
  ready: "جاهز للاستلام",
  out_for_delivery: "بالطريق إليك",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

const statusSteps: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"];

function statusIndex(status: OrderStatus) {
  const index = statusSteps.indexOf(status);
  return index < 0 ? -1 : index;
}

export default function OrderHistory() {
  const { user, orders, loadOrders } = useAuth();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(() => loadOrders(), 15000);
    return () => window.clearInterval(timer);
  }, [user, loadOrders]);

  const activeOrders = useMemo(() => orders.filter((o) => ["pending", "confirmed", "preparing", "ready", "out_for_delivery"].includes(o.status)), [orders]);

  if (!user || orders.length === 0) return null;

  const handleCancel = async (orderId: string) => {
    if (!window.confirm("متأكد تريد إلغاء هذا الطلب؟")) return;
    setBusyId(orderId);
    setMessage("");
    const result = await cancelOrder(orderId);
    setBusyId(null);
    if (!result.success) {
      setMessage(result.error || "تعذر إلغاء الطلب");
      return;
    }
    setMessage("تم إلغاء الطلب");
    await loadOrders();
  };

  return (
    <section id="orders" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-gold">MY ORDERS</p>
          <h2 className="mt-2 font-display text-3xl text-ivory">طلباتي</h2>
          <p className="mt-2 text-sm text-ivory-mute">تابع طلبك وألغيه إذا ما دخل التحضير بعد.</p>
        </div>
        <button onClick={() => loadOrders()} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-ivory-dim hover:bg-white/5" aria-label="تحديث الطلبات"><FiRefreshCw size={15} /></button>
      </div>

      {message && <div className="mb-4 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 text-sm text-gold">{message}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        {orders.map((order) => {
          const current = statusIndex(order.status);
          const canCancel = order.status === "pending" || order.status === "confirmed";
          return (
            <article key={order.id} className={`rounded-2xl border p-5 ${activeOrders.some((o) => o.id === order.id) ? "border-gold/25 bg-surface" : "border-white/[0.08] bg-surface/60"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-ivory-mute">رقم الطلب</p>
                  <p className="mt-1 font-display text-lg text-ivory">{order.order_number}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${order.status === "cancelled" ? "bg-red-deep/20 text-red-accent" : "bg-gold/10 text-gold"}`}>{statusText[order.status]}</span>
              </div>

              {order.status !== "cancelled" && (
                <div className="mt-6">
                  <div className="flex items-center gap-1">
                    {statusSteps.map((step, index) => <span key={step} className={`h-1.5 flex-1 rounded-full ${current >= index ? "bg-gold" : "bg-white/10"}`} />)}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-ivory-mute"><FiClock size={12} />{new Date(order.created_at).toLocaleString("ar-IQ")}</div>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                <div><p className="text-xs text-ivory-mute">المجموع</p><p className="mt-1 numeric font-bold text-gold">{order.total.toLocaleString("en-US")} د.ع</p></div>
                {canCancel && <button disabled={busyId === order.id} onClick={() => handleCancel(order.id)} className="flex items-center gap-2 rounded-full border border-red-accent/25 px-3 py-2 text-xs text-red-accent transition hover:bg-red-accent/10 disabled:opacity-50"><FiXCircle size={14} />{busyId === order.id ? "جاري الإلغاء..." : "إلغاء الطلب"}</button>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
