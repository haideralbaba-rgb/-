import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiArrowRight, FiCheck, FiMapPin, FiMinus, FiPlus, FiTrash2, FiX, FiNavigation } from "react-icons/fi";
import { useOrder } from "../context/OrderContext";
import { useAuth } from "../context/AuthContext";
import { useGeolocation, type GeoResult } from "../hooks/useGeolocation";
import { restaurantConfig } from "../data/restaurantConfig";
import { createOrder } from "../lib/orderService";

type Step = "cart" | "location" | "confirm" | "processing" | "success" | "error";
type Fulfillment = "delivery" | "pickup";
const DELIVERY_FEE = 3000;
const MINIMUM_DELIVERY = 10000;
const titles: Record<Step, string> = { cart: "سلتك", location: "طريقة الاستلام", confirm: "مراجعة الطلب", processing: "هسه نرسل...", success: "تم الطلب", error: "صار خطأ" };

export default function OrderDrawer() {
  const { items, isCartOpen, closeCart, updateQuantity, removeItem, totalPrice, totalItems, clearCart } = useOrder();
  const { user, profile, addresses, setShowLogin, setLoginRedirectTo, saveAddress } = useAuth();
  const geo = useGeolocation();
  const [step, setStep] = useState<Step>("cart");
  const [fulfillment, setFulfillment] = useState<Fulfillment>(restaurantConfig.deliveryAvailable ? "delivery" : "pickup");
  const [selectedAddress, setSelectedAddress] = useState<GeoResult | null>(null);
  const [manualAddress, setManualAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderError, setOrderError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isCartOpen) {
      const t = window.setTimeout(() => {
        setStep("cart"); setSelectedAddress(null); setManualAddress(""); setNotes("");
        setOrderNumber(""); setOrderError(""); setSubmitting(false); geo.reset();
      }, 250);
      return () => window.clearTimeout(t);
    }
  }, [isCartOpen]);

  useEffect(() => { if (profile?.name) setCustomerName(profile.name); }, [profile]);

  const back = () => {
    if (submitting || step === "processing" || step === "success") return;
    setOrderError("");
    if (step === "location") setStep("cart");
    else if (step === "confirm") setStep("location");
    else if (step === "error") setStep("confirm");
  };

  const proceed = () => {
    if (!items.length) return;
    if (!user) { setLoginRedirectTo("checkout"); setShowLogin(true); return; }
    setOrderError(""); setStep("location");
  };

  const useGps = async () => { setOrderError(""); const r = await geo.requestLocation(); if (r) setSelectedAddress(r); };
  const confirmLocation = () => {
    if (fulfillment === "delivery" && !selectedAddress && !manualAddress.trim()) return setOrderError("حدد موقع التوصيل أولاً");
    if (fulfillment === "delivery" && totalPrice < MINIMUM_DELIVERY) return setOrderError(`الحد الأدنى للتوصيل ${MINIMUM_DELIVERY.toLocaleString("en-US")} د.ع`);
    setOrderError(""); setStep("confirm");
  };
  const deliveryFee = fulfillment === "delivery" ? DELIVERY_FEE : 0;
  const grandTotal = totalPrice + deliveryFee;

  const submit = async () => {
    if (submitting || !user || !items.length) return;
    setSubmitting(true); setOrderError(""); setStep("processing");
    const a = selectedAddress;
    const result = await createOrder({
      customerId: profile?.id || user.id, items, subtotal: totalPrice, deliveryFee, total: grandTotal, fulfillment,
      latitude: fulfillment === "delivery" ? a?.latitude ?? null : null,
      longitude: fulfillment === "delivery" ? a?.longitude ?? null : null,
      formattedAddress: fulfillment === "delivery" ? a?.formattedAddress || manualAddress.trim() || null : null,
      phone: profile?.phone || "", customerName: customerName || profile?.name || null, notes: notes.trim() || null,
    });
    if (result.success && result.orderNumber) {
      setOrderNumber(result.orderNumber);
      if (fulfillment === "delivery" && a) {
        try { await saveAddress({ label: "موقعي", latitude: a.latitude, longitude: a.longitude, formatted_address: a.formattedAddress || "", city: a.city || null, district: a.district || null, street: a.street || null, building: null, delivery_notes: notes.trim() || null, is_default: addresses.length === 0 }); } catch {}
      }
      clearCart(); setSubmitting(false); setStep("success"); return;
    }
    setSubmitting(false); setOrderError(result.error || "صار خطأ أثناء إنشاء الطلب"); setStep("error");
  };

  const progress = step === "cart" ? 1 : step === "location" ? 2 : step === "confirm" ? 3 : 3;

  return <AnimatePresence>{isCartOpen && <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeCart} className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm" />
    <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 280 }} role="dialog" aria-modal="true" className="fixed inset-x-0 bottom-0 z-[95] flex max-h-[94svh] flex-col overflow-hidden rounded-t-[1.75rem] border-t border-gold/10 bg-bg-secondary shadow-2xl shadow-black lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-full lg:max-w-md lg:rounded-none lg:border-t-0 lg:border-l">
      <header className="shrink-0 border-b border-white/[.07] bg-gradient-to-b from-surface-hi/90 to-bg-secondary/90 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {step !== "cart" && step !== "processing" && step !== "success" && <button onClick={back} aria-label="رجوع" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.03] text-ivory-dim transition hover:border-gold/50 hover:text-gold"><FiArrowRight size={17} /></button>}
          <div className="min-w-0"><h3 className="font-display text-xl text-ivory">{titles[step]}</h3>{step !== "success" && step !== "processing" && <p className="mt-0.5 text-[10px] text-ivory-mute">{totalItems} منتجات · {progress}/3</p>}</div>
          <button onClick={closeCart} aria-label="إغلاق" className="mr-auto grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-ivory-dim transition hover:bg-white/5"><FiX size={16} /></button>
        </div>
        {step !== "success" && step !== "processing" && <div className="mt-4 flex gap-1.5">{[1,2,3].map(n => <div key={n} className={`h-1.5 flex-1 rounded-full transition ${n <= progress ? "bg-gold" : "bg-white/10"}`} />)}</div>}
      </header>

      <div className="flex-1 overflow-y-auto">
        {step === "cart" && <div className="px-5 py-5">
          {!items.length ? <div className="py-16 text-center"><p className="font-display text-xl text-ivory">السلة فاضية</p><p className="mt-2 text-sm text-ivory-mute">ارجع للقائمة واختار اللي يعجبك.</p><button onClick={() => { closeCart(); document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); }} className="mt-5 rounded-xl border border-gold/30 bg-gold/10 px-5 py-3 text-sm font-bold text-gold">رجوع للقائمة</button></div> :
          <div className="space-y-3">{items.map(i => <div key={i.id} className="food-surface rounded-2xl p-3">
            <div className="flex items-center gap-3">{i.image && <img src={i.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />}<div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-ivory">{i.name}</p>{i.variant && <p className="text-xs text-gold">{i.variant}</p>}<p className="numeric mt-1 text-xs text-ivory-mute">{i.price.toLocaleString("en-US")} د.ع</p></div><button onClick={() => removeItem(i.id)} aria-label="حذف" className="grid h-8 w-8 place-items-center rounded-lg text-ivory-mute transition hover:bg-red/10 hover:text-red-accent"><FiTrash2 size={14} /></button></div>
            <div className="mt-3 flex items-center justify-between"><span className="text-[11px] text-ivory-mute">الكمية</span><div className="flex items-center gap-1 rounded-xl border border-white/10 bg-bg/70 p-1"><button onClick={() => updateQuantity(i.id, i.quantity - 1)} className="grid h-8 w-8 place-items-center rounded-lg text-ivory-dim hover:bg-white/5"><FiMinus size={11} /></button><span className="numeric w-7 text-center text-sm font-bold text-ivory">{i.quantity}</span><button onClick={() => updateQuantity(i.id, i.quantity + 1)} className="grid h-8 w-8 place-items-center rounded-lg bg-gold/10 text-gold hover:bg-gold hover:text-bg"><FiPlus size={11} /></button></div><p className="numeric font-display text-base text-gold">{(i.price * i.quantity).toLocaleString("en-US")} د.ع</p></div>
          </div>)}</div>}
        </div>}

        {step === "location" && <div className="px-5 py-5"><p className="mb-3 text-sm font-bold text-ivory">طريقة الاستلام</p><div className="mb-6 grid grid-cols-2 gap-3">
          {restaurantConfig.deliveryAvailable && <button onClick={() => setFulfillment("delivery")} className={`rounded-2xl border p-4 text-right transition ${fulfillment === "delivery" ? "border-gold bg-gold/10 text-gold" : "border-white/10 bg-surface text-ivory-dim"}`}><b className="block">توصيل</b><span className="mt-1 block text-[10px] opacity-70">لباب البيت</span></button>}
          {restaurantConfig.pickupAvailable && <button onClick={() => setFulfillment("pickup")} className={`rounded-2xl border p-4 text-right transition ${fulfillment === "pickup" ? "border-gold bg-gold/10 text-gold" : "border-white/10 bg-surface text-ivory-dim"}`}><b className="block">استلام</b><span className="mt-1 block text-[10px] opacity-70">من المطعم</span></button>}
        </div>
        {fulfillment === "delivery" ? <><p className="mb-2 text-sm font-bold text-ivory">وين نوصلها؟</p>{addresses.length > 0 && !selectedAddress && <div className="mb-4 space-y-2">{addresses.map(a => <button key={a.id} onClick={() => setSelectedAddress({ latitude: a.latitude, longitude: a.longitude, formattedAddress: a.formatted_address, city: a.city || "", district: a.district || "", street: a.street || "" })} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-surface p-4 text-right hover:border-gold/30"><FiMapPin className="text-gold" /><div className="min-w-0 flex-1"><p className="truncate text-sm text-ivory">{a.label}</p><p className="truncate text-xs text-ivory-mute">{a.formatted_address}</p></div></button>)}</div>}
          {!selectedAddress && <div className="food-surface rounded-2xl p-5 text-center"><FiNavigation className="mx-auto text-2xl text-gold" /><p className="mt-3 font-display text-lg text-ivory">حدد موقعك</p><button onClick={useGps} disabled={geo.status === "requesting" || geo.status === "geocoding"} className="cta-red mt-4 w-full rounded-xl py-3 text-sm font-bold disabled:opacity-50">{geo.status === "requesting" ? "هسه نحدد موقعك..." : geo.status === "geocoding" ? "هسه نجهز عنوانك..." : "حدد موقعي"}</button>{(geo.status === "denied" || geo.status === "error") && <input value={manualAddress} onChange={e => setManualAddress(e.target.value)} placeholder="المنطقة، الشارع، أقرب نقطة دالة" className="mt-3 w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-sm text-ivory" />}</div>}
          {selectedAddress && <div className="food-surface rounded-2xl p-4"><div className="flex gap-3"><FiMapPin className="mt-1 text-gold" /><div><p className="text-sm font-bold text-ivory">موقع التوصيل</p><p className="mt-1 text-sm leading-6 text-ivory-dim">{selectedAddress.formattedAddress}</p></div></div><button onClick={() => { setSelectedAddress(null); geo.reset(); }} className="mt-3 text-xs font-bold text-gold">تغيير الموقع</button></div>}
          <div className="mt-4 food-surface rounded-2xl p-4"><div className="flex justify-between text-sm"><span className="text-ivory-dim">قيمة الطلب</span><span className="numeric">{totalPrice.toLocaleString("en-US")} د.ع</span></div><div className="mt-2 flex justify-between text-sm"><span className="text-ivory-dim">التوصيل</span><span className="numeric">{DELIVERY_FEE.toLocaleString("en-US")} د.ع</span></div></div>
        </> : <div className="food-surface rounded-2xl p-5 text-center"><FiMapPin className="mx-auto text-2xl text-gold" /><p className="mt-3 font-display text-lg text-ivory">استلام من الفرع</p><p className="mt-1 text-sm text-ivory-mute">طلبك يصير جاهز للاستلام من المطعم.</p></div>}
        {orderError && <p className="mt-4 rounded-xl bg-red/10 p-3 text-sm text-red-accent">{orderError}</p>}</div>}

        {step === "confirm" && <div className="px-5 py-5"><div className="food-surface mb-5 rounded-2xl p-4"><p className="mb-3 text-sm font-bold text-ivory">مراجعة طلبك</p>{items.map(i => <div key={i.id} className="flex justify-between py-2 text-sm"><span className="text-ivory-dim">{i.name} × {i.quantity}</span><span className="numeric">{(i.price * i.quantity).toLocaleString("en-US")}</span></div>)}<div className="mt-3 border-t border-white/[.08] pt-3"><div className="flex justify-between font-bold"><span>الإجمالي</span><span className="numeric text-gold">{grandTotal.toLocaleString("en-US")} د.ع</span></div></div></div>{!profile?.name && <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="اسمك" className="mb-4 w-full rounded-xl border border-white/10 bg-surface px-4 py-3 text-ivory" />}<textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="ملاحظات للسائق (اختياري)" className="mb-4 w-full resize-none rounded-xl border border-white/10 bg-surface px-4 py-3 text-ivory" />{fulfillment === "delivery" && <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 text-sm text-gold">التوصيل إلى: {selectedAddress?.formattedAddress || manualAddress || "الموقع المحدد"}</div>}</div>}

        {step === "processing" && <div className="flex flex-col items-center justify-center px-5 py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-gold-muted/30 border-t-gold" /><p className="mt-5 font-display text-lg text-ivory">هسه نجهز طلبك...</p><p className="mt-2 text-sm text-ivory-mute">لحظات، لا تسكر الصفحة.</p></div>}
        {step === "success" && <div className="flex flex-col items-center px-5 py-12 text-center"><motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="grid h-20 w-20 place-items-center rounded-full bg-gold text-bg"><FiCheck size={34} /></motion.div><h4 className="mt-5 font-display text-2xl text-ivory">تم تأكيد طلبك</h4><p className="numeric mt-5 rounded-xl border border-gold-muted/30 bg-surface px-6 py-3 font-display text-2xl text-gold">{orderNumber}</p><p className="mt-5 text-sm leading-7 text-ivory-dim">طلبك وصل للمطعم وراح نبدأ بتجهيزه.</p></div>}
        {step === "error" && <div className="flex flex-col items-center px-5 py-16 text-center"><div className="grid h-16 w-16 place-items-center rounded-full bg-red/10 text-red-accent"><FiX size={28} /></div><h4 className="mt-5 font-display text-xl text-ivory">ما قدرنا نكمل الطلب</h4><p className="mt-2 max-w-sm text-sm leading-6 text-ivory-mute">{orderError}</p><button onClick={back} className="mt-5 rounded-xl bg-gold px-6 py-3 text-sm font-bold text-bg">رجوع ومراجعة</button></div>}
      </div>

      {step === "cart" && items.length > 0 && <footer className="safe-bottom shrink-0 border-t border-white/[.08] bg-surface/95 p-4 backdrop-blur-xl"><div className="mb-3 flex items-center justify-between"><span className="text-sm text-ivory-dim">المجموع</span><strong className="numeric font-display text-xl text-gold">{totalPrice.toLocaleString("en-US")} د.ع</strong></div><button onClick={proceed} className="cta-food flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold">متابعة الطلب <FiArrowRight /></button></footer>}
      {step === "location" && <footer className="safe-bottom shrink-0 border-t border-white/[.08] bg-surface/95 p-4 backdrop-blur-xl"><button onClick={confirmLocation} className="cta-food flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold">التالي <FiArrowRight /></button></footer>}
      {step === "confirm" && <footer className="safe-bottom shrink-0 border-t border-white/[.08] bg-surface/95 p-4 backdrop-blur-xl"><button disabled={submitting} onClick={submit} className="cta-red flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold disabled:opacity-50">{submitting ? "هسه نرسل..." : "تأكيد وإرسال الطلب"} <FiCheck /></button></footer>}
    </motion.div>
  </>}</AnimatePresence>;
}
