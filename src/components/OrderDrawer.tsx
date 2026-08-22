import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheck, FiMapPin, FiMinus, FiPlus, FiTrash2, FiX, FiNavigation } from "react-icons/fi";
import { useOrder } from "../context/OrderContext";
import { useAuth } from "../context/AuthContext";
import { useGeolocation, type GeoResult } from "../hooks/useGeolocation";
import { restaurantConfig } from "../data/restaurantConfig";
import { createOrder } from "../lib/orderService";

type Step = "cart" | "location" | "confirm" | "processing" | "success" | "error";
type Fulfillment = "delivery" | "pickup";

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

  // Reset when drawer closes
  useEffect(() => {
    if (!isCartOpen) {
      const t = setTimeout(() => {
        setStep("cart");
        setNotes("");
        setOrderError("");
        geo.reset();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isCartOpen]);

  // Pre-fill name from profile
  useEffect(() => {
    if (profile?.name) setCustomerName(profile.name);
  }, [profile]);

  // When user logs in after login redirect, continue to location step
  useEffect(() => {
    if (user && step === "cart" && isCartOpen && items.length > 0) {
      setStep("location");
    }
  }, [user]);

  const handleProceedFromCart = () => {
    if (items.length === 0) return;
    if (!user) {
      setLoginRedirectTo("checkout");
      setShowLogin(true);
      return;
    }
    setStep("location");
  };

  const handleUseGps = async () => {
    const result = await geo.requestLocation();
    if (result) {
      setSelectedAddress(result);
    }
  };

  const handleConfirmLocation = () => {
    setStep("confirm");
  };

  const handleSubmitOrder = async () => {
    if (!user) return;
    setStep("processing");
    setOrderError("");

    const phone = profile?.phone || user.phone || "";
    const addr = selectedAddress;

    const result = await createOrder({
      userId: user.id,
      items,
      subtotal: totalPrice,
      deliveryFee: 0,
      total: totalPrice,
      fulfillment,
      latitude: addr?.latitude ?? null,
      longitude: addr?.longitude ?? null,
      formattedAddress: addr?.formattedAddress || manualAddress || null,
      phone,
      customerName: customerName || profile?.name || null,
      notes: notes || null,
    });

    if (result.success && result.orderNumber) {
      setOrderNumber(result.orderNumber);
      // Save address for future use
      if (addr && fulfillment === "delivery") {
        saveAddress({
          label: "موقعي",
          latitude: addr.latitude,
          longitude: addr.longitude,
          formatted_address: addr.formattedAddress,
          city: addr.city || null,
          district: addr.district || null,
          street: addr.street || null,
          building: null,
          delivery_notes: notes || null,
          is_default: addresses.length === 0,
        });
      }
      clearCart();
      setStep("success");
    } else {
      setOrderError(result.error || "صار خطأ ما نعرفه");
      setStep("error");
    }
  };

  const handleWhatsApp = () => {
    if (!restaurantConfig.whatsapp) return;
    const msg = encodeURIComponent(`مرحباً، لدي طلب رقم ${orderNumber}`);
    window.open(`https://wa.me/${restaurantConfig.whatsapp}?text=${msg}`, "_blank");
  };

  const deliveryFee = 0;

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeCart} className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm" />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            role="dialog"
            aria-modal="true"
            aria-label="سلة الطلب"
            className="fixed inset-x-0 bottom-0 z-[95] flex max-h-[94svh] flex-col rounded-t-3xl border-t border-white/[0.08] bg-bg-secondary shadow-2xl shadow-black lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-full lg:max-w-md lg:rounded-none lg:border-t-0 lg:border-l"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <h3 className="font-display text-xl text-ivory">
                {step === "cart" && "السلة"}
                {step === "location" && "موقع التوصيل"}
                {step === "confirm" && "تأكيد الطلب"}
                {step === "processing" && "هسه نرسل..."}
                {step === "success" && "تم الطلب"}
                {step === "error" && "صار خطأ"}
              </h3>
              <button onClick={closeCart} aria-label="إغلاق" className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-ivory-dim transition hover:bg-white/10">
                <FiX size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* ───── CART STEP ───── */}
              {step === "cart" && (
                <div className="px-5 py-4">
                  {items.length === 0 ? (
                    <p className="mt-12 text-center text-ivory-mute">سلتك فاضية. شوف المنيو وزيد طبقك المفضل.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
                          {item.image && <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-ivory">{item.name}</p>
                            <p className="numeric mt-0.5 text-xs text-ivory-mute">{item.price.toLocaleString("en-US")} د.ع</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="إنقاص" className="grid h-7 w-7 place-items-center rounded-full border border-white/15 text-ivory"><FiMinus size={11} /></button>
                            <span className="numeric w-5 text-center text-sm text-ivory">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="زيادة" className="grid h-7 w-7 place-items-center rounded-full border border-white/15 text-ivory"><FiPlus size={11} /></button>
                          </div>
                          <p className="numeric w-16 shrink-0 text-left text-sm font-bold text-gold">{(item.price * item.quantity).toLocaleString("en-US")}</p>
                          <button onClick={() => removeItem(item.id)} aria-label="حذف" className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ivory-mute hover:text-red-accent"><FiTrash2 size={13} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ───── LOCATION STEP ───── */}
              {step === "location" && (
                <div className="px-5 py-5">
                  {/* Fulfillment choice */}
                  <div className="mb-6">
                    <p className="mb-3 text-sm font-bold text-ivory">طريقة الاستلام</p>
                    <div className="grid grid-cols-2 gap-3">
                      {restaurantConfig.deliveryAvailable && (
                        <button onClick={() => setFulfillment("delivery")} className={`rounded-xl border px-4 py-3 text-sm transition ${fulfillment === "delivery" ? "border-gold bg-gold/10 text-gold" : "border-white/15 text-ivory-dim"}`}>
                          توصيل
                        </button>
                      )}
                      {restaurantConfig.pickupAvailable && (
                        <button onClick={() => setFulfillment("pickup")} className={`rounded-xl border px-4 py-3 text-sm transition ${fulfillment === "pickup" ? "border-gold bg-gold/10 text-gold" : "border-white/15 text-ivory-dim"}`}>
                          استلام من الفرع
                        </button>
                      )}
                    </div>
                  </div>

                  {fulfillment === "delivery" && (
                    <>
                      {/* Saved addresses */}
                      {addresses.length > 0 && !selectedAddress && (
                        <div className="mb-5">
                          <p className="mb-2 text-sm font-bold text-ivory">عناوينك المحفوظة</p>
                          {addresses.map((a) => (
                            <button
                              key={a.id}
                              onClick={() => setSelectedAddress({ latitude: a.latitude, longitude: a.longitude, formattedAddress: a.formatted_address, city: a.city || "", district: a.district || "", street: a.street || "" })}
                              className="mb-2 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-surface px-4 py-3 text-right transition hover:border-gold-muted/40"
                            >
                              <FiMapPin className="shrink-0 text-gold" size={16} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-ivory">{a.label}</p>
                                <p className="truncate text-xs text-ivory-mute">{a.formatted_address}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* GPS */}
                      {!selectedAddress && (
                        <div className="rounded-xl border border-white/10 bg-surface p-5 text-center">
                          <FiNavigation className="mx-auto text-2xl text-gold" />
                          <p className="mt-3 font-display text-lg text-ivory">حدد موقعك بضغطة وحدة</p>
                          <p className="mt-1 text-sm text-ivory-mute">نحتاج موقعك حتى نوصلك الطلب بالمكان الصحيح.</p>
                          <button
                            onClick={handleUseGps}
                            disabled={geo.status === "requesting" || geo.status === "geocoding"}
                            className="mt-4 w-full rounded-full bg-red py-3 text-sm font-bold text-ivory transition disabled:opacity-50"
                          >
                            {geo.status === "requesting" ? "هسه نحدد موقعك..." : geo.status === "geocoding" ? "هسه نجهز عنوانك..." : "حدد موقعي"}
                          </button>
                          {(geo.status === "denied" || geo.status === "error") && (
                            <p className="mt-3 text-sm text-red-accent">{geo.errorMessage}</p>
                          )}
                        </div>
                      )}

                      {/* Manual fallback */}
                      {(geo.status === "denied" || geo.status === "error") && !selectedAddress && (
                        <label className="mt-5 block">
                          <span className="mb-2 block text-sm font-bold text-ivory">اكتب عنوانك بنفسك</span>
                          <input
                            value={manualAddress}
                            onChange={(e) => setManualAddress(e.target.value)}
                            placeholder="المنطقة، الشارع، أقرب نقطة دالة"
                            className="w-full rounded-xl border border-white/15 bg-surface px-4 py-3 text-ivory placeholder:text-ivory-mute focus:border-gold-muted"
                          />
                        </label>
                      )}

                      {/* Confirmed location preview */}
                      {selectedAddress && (
                        <div className="rounded-xl border border-gold-muted/30 bg-surface p-4">
                          <div className="flex items-start gap-3">
                            <FiMapPin className="mt-0.5 shrink-0 text-gold" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-ivory">موقع التوصيل</p>
                              <p className="mt-1 text-sm leading-6 text-ivory-dim">{selectedAddress.formattedAddress}</p>
                            </div>
                          </div>
                          {/* Map preview */}
                          <div className="mt-3 h-[180px] overflow-hidden rounded-lg border border-white/10">
                            <img
                              src={`https://static-maps.yandex.ru/v1?ll=${selectedAddress.longitude},${selectedAddress.latitude}&z=16&size=600,300&l=map&pt=${selectedAddress.longitude},${selectedAddress.latitude},pm2rdm`}
                              alt="خريطة الموقع"
                              className="h-full w-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button onClick={handleConfirmLocation} className="flex-1 rounded-full bg-gold py-2.5 text-sm font-bold text-bg">الموقع صحيح</button>
                            <button onClick={() => { setSelectedAddress(null); geo.reset(); }} className="rounded-full border border-white/15 px-4 py-2.5 text-sm text-ivory-dim">تغيير</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Pickup — just confirm */}
                  {fulfillment === "pickup" && (
                    <div className="rounded-xl border border-white/10 bg-surface p-5 text-center">
                      <FiMapPin className="mx-auto text-2xl text-gold" />
                      <p className="mt-3 font-display text-lg text-ivory">استلام من الفرع</p>
                      <p className="mt-1 text-sm text-ivory-mute">طلبك يصير جاهز للاستلام من المطعم.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ───── CONFIRM STEP ───── */}
              {step === "confirm" && (
                <div className="px-5 py-5">
                  {/* Order summary */}
                  <div className="mb-5 rounded-xl border border-white/[0.08] bg-surface p-4">
                    <p className="mb-3 text-sm font-bold text-ivory">ملخص الطلب</p>
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between py-1.5 text-sm">
                        <span className="text-ivory-dim">{item.name} × {item.quantity}</span>
                        <span className="numeric text-ivory">{(item.price * item.quantity).toLocaleString("en-US")}</span>
                      </div>
                    ))}
                    <div className="mt-3 border-t border-white/[0.08] pt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-ivory-dim">المجموع</span>
                        <span className="numeric text-ivory">{totalPrice.toLocaleString("en-US")}</span>
                      </div>
                      {deliveryFee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-ivory-dim">التوصيل</span>
                          <span className="numeric text-ivory">{deliveryFee.toLocaleString("en-US")}</span>
                        </div>
                      )}
                      <div className="mt-2 flex justify-between font-bold">
                        <span className="text-ivory">الإجمالي</span>
                        <span className="numeric text-gold">{(totalPrice + deliveryFee).toLocaleString("en-US")} د.ع</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer name */}
                  {!profile?.name && (
                    <label className="mb-4 block">
                      <span className="mb-2 block text-sm text-ivory-dim">اسمك (اختياري)</span>
                      <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="اسمك" className="w-full rounded-xl border border-white/15 bg-surface px-4 py-3 text-ivory placeholder:text-ivory-mute focus:border-gold-muted" />
                    </label>
                  )}

                  {/* Notes */}
                  <label className="mb-4 block">
                    <span className="mb-2 block text-sm text-ivory-dim">ملاحظات للسائق (اختياري)</span>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="مثال: مقابل الصيدلية / الباب الثاني" className="w-full resize-none rounded-xl border border-white/15 bg-surface px-4 py-3 text-ivory placeholder:text-ivory-mute focus:border-gold-muted" />
                  </label>

                  {/* Payment */}
                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-sm font-bold text-ivory">طريقة الدفع</p>
                    <p className="mt-1 text-sm text-ivory-mute">الدفع عند الاستلام</p>
                  </div>
                </div>
              )}

              {/* ───── PROCESSING ───── */}
              {step === "processing" && (
                <div className="flex flex-col items-center justify-center px-5 py-16">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold-muted/30 border-t-gold" />
                  <p className="mt-5 font-display text-lg text-ivory">هسه نجهز طلبك...</p>
                </div>
              )}

              {/* ───── SUCCESS ───── */}
              {step === "success" && (
                <div className="flex flex-col items-center px-5 py-10 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }} className="grid h-16 w-16 place-items-center rounded-full bg-gold text-bg">
                    <FiCheck size={30} />
                  </motion.div>
                  <h4 className="mt-5 font-display text-2xl text-ivory">تم تأكيد طلبك</h4>
                  <p className="numeric mt-3 rounded-xl border border-gold-muted/30 bg-surface px-6 py-3 font-display text-2xl text-gold">{orderNumber}</p>
                  <p className="mt-4 max-w-xs text-sm leading-7 text-ivory-dim">طلبك وصلنا وراح نجهزه بأسرع وقت.</p>

                  <div className="mt-8 flex w-full flex-col gap-3">
                    {restaurantConfig.whatsapp && (
                      <button onClick={handleWhatsApp} className="w-full rounded-full border border-green-600 bg-green-600/10 py-3 text-sm font-bold text-green-400 transition hover:bg-green-600/20">
                        تواصل عبر واتساب
                      </button>
                    )}
                    <button onClick={closeCart} className="w-full rounded-full border border-white/15 py-3 text-sm text-ivory transition hover:bg-white/5">
                      ارجع للمنيو
                    </button>
                  </div>
                </div>
              )}

              {/* ───── ERROR ───── */}
              {step === "error" && (
                <div className="flex flex-col items-center px-5 py-10 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-red-deep text-ivory">
                    <FiX size={30} />
                  </div>
                  <h4 className="mt-5 font-display text-xl text-ivory">ما گدرنا نرسل طلبك</h4>
                  <p className="mt-2 text-sm text-ivory-mute">{orderError}</p>
                  <button onClick={() => setStep("confirm")} className="mt-6 rounded-full border border-white/15 px-6 py-3 text-sm text-ivory">
                    جرب مرة ثانية
                  </button>
                </div>
              )}
            </div>

            {/* Bottom CTA */}
            {step === "cart" && items.length > 0 && (
              <div className="safe-bottom shrink-0 border-t border-white/[0.08] px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-ivory-dim">{totalItems} منتج</span>
                  <span className="numeric font-display text-xl text-gold">{totalPrice.toLocaleString("en-US")} <span className="text-xs text-ivory-mute">د.ع</span></span>
                </div>
                <button onClick={handleProceedFromCart} className="w-full rounded-full bg-red py-4 font-display text-lg text-ivory shadow-lg shadow-black/30 transition hover:-translate-y-0.5">
                  متابعة الطلب
                </button>
              </div>
            )}

            {step === "location" && (fulfillment === "pickup" || (fulfillment === "delivery" && (manualAddress || selectedAddress))) && (
              <div className="safe-bottom shrink-0 border-t border-white/[0.08] px-5 py-4">
                <button
                  onClick={() => {
                    if (fulfillment === "pickup" || manualAddress) setStep("confirm");
                    // If delivery with GPS, the "الموقع صحيح" button handles it
                  }}
                  disabled={fulfillment === "delivery" && !selectedAddress && !manualAddress}
                  className="w-full rounded-full bg-red py-4 font-display text-lg text-ivory shadow-lg shadow-black/30 transition disabled:opacity-40"
                >
                  متابعة
                </button>
              </div>
            )}

            {step === "confirm" && (
              <div className="safe-bottom shrink-0 border-t border-white/[0.08] px-5 py-4">
                <button onClick={handleSubmitOrder} className="w-full rounded-full bg-red py-4 font-display text-lg text-ivory shadow-lg shadow-black/30 transition hover:-translate-y-0.5">
                  تأكيد الطلب
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
