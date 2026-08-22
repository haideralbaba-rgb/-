import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiCheck,
  FiMapPin,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiX,
  FiNavigation,
} from "react-icons/fi";

import { useOrder } from "../context/OrderContext";
import { useAuth } from "../context/AuthContext";
import { useGeolocation, type GeoResult } from "../hooks/useGeolocation";
import { restaurantConfig } from "../data/restaurantConfig";
import { createOrder } from "../lib/orderService";

type Step =
  | "cart"
  | "location"
  | "confirm"
  | "processing"
  | "success"
  | "error";

type Fulfillment = "delivery" | "pickup";

export default function OrderDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    totalPrice,
    totalItems,
    clearCart,
  } = useOrder();

  const {
    user,
    profile,
    addresses,
    setShowLogin,
    setLoginRedirectTo,
    saveAddress,

    // مهم:
    // سنستخدم customerId من AuthContext
    customerId,
  } = useAuth();

  const geo = useGeolocation();

  const [step, setStep] = useState<Step>("cart");

  const [fulfillment, setFulfillment] = useState<Fulfillment>(
    restaurantConfig.deliveryAvailable ? "delivery" : "pickup"
  );

  const [selectedAddress, setSelectedAddress] =
    useState<GeoResult | null>(null);

  const [manualAddress, setManualAddress] = useState("");

  const [notes, setNotes] = useState("");

  const [customerName, setCustomerName] = useState("");

  const [orderNumber, setOrderNumber] = useState("");

  const [orderError, setOrderError] = useState("");

  // ============================================================
  // RESET WHEN DRAWER CLOSES
  // ============================================================

  useEffect(() => {
    if (!isCartOpen) {
      const timer = setTimeout(() => {
        setStep("cart");
        setNotes("");
        setOrderError("");
        setSelectedAddress(null);
        setManualAddress("");
        geo.reset();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isCartOpen]);

  // ============================================================
  // PRE-FILL CUSTOMER NAME
  // ============================================================

  useEffect(() => {
    if (profile?.name) {
      setCustomerName(profile.name);
    }
  }, [profile]);

  // ============================================================
  // AFTER LOGIN
  // ============================================================

  useEffect(() => {
    if (
      user &&
      customerId &&
      step === "cart" &&
      isCartOpen &&
      items.length > 0
    ) {
      setStep("location");
    }
  }, [user, customerId, step, isCartOpen, items.length]);

  // ============================================================
  // PROCEED FROM CART
  // ============================================================

  const handleProceedFromCart = () => {
    if (items.length === 0) return;

    if (!user) {
      setLoginRedirectTo("checkout");
      setShowLogin(true);
      return;
    }

    if (!customerId) {
      setOrderError(
        "ما قدرنا نحدد حسابك. حاول تسجيل الدخول مرة ثانية."
      );
      return;
    }

    setStep("location");
  };

  // ============================================================
  // GPS
  // ============================================================

  const handleUseGps = async () => {
    const result = await geo.requestLocation();

    if (result) {
      setSelectedAddress(result);
    }
  };

  // ============================================================
  // CONFIRM LOCATION
  // ============================================================

  const handleConfirmLocation = () => {
    if (fulfillment === "delivery" && !selectedAddress && !manualAddress) {
      setOrderError("حدد موقع التوصيل أولاً");
      return;
    }

    setOrderError("");
    setStep("confirm");
  };

  // ============================================================
  // CREATE ORDER
  // ============================================================

  const handleSubmitOrder = async () => {
    if (!user) {
      setOrderError("لازم تسجل الدخول أولاً");
      return;
    }

    if (!customerId) {
      setOrderError(
        "حساب العميل غير موجود. سجل الدخول مرة ثانية."
      );
      return;
    }

    if (items.length === 0) {
      setOrderError("السلة فارغة");
      return;
    }

    setStep("processing");
    setOrderError("");

    const phone = profile?.phone || user.phone || "";

    const addr = selectedAddress;

    const result = await createOrder({
      // ========================================================
      // التغيير الأساسي:
      // userId ❌
      // customerId ✅
      // ========================================================
      customerId,

      items,

      subtotal: totalPrice,

      deliveryFee: 0,

      total: totalPrice,

      fulfillment,

      latitude:
        fulfillment === "delivery"
          ? addr?.latitude ?? null
          : null,

      longitude:
        fulfillment === "delivery"
          ? addr?.longitude ?? null
          : null,

      formattedAddress:
        fulfillment === "delivery"
          ? addr?.formattedAddress ||
            manualAddress ||
            null
          : null,

      phone,

      customerName:
        customerName ||
        profile?.name ||
        null,

      notes: notes || null,
    });

    // ============================================================
    // SUCCESS
    // ============================================================

    if (result.success && result.orderNumber) {
      setOrderNumber(result.orderNumber);

      // حفظ الموقع للمرة القادمة
      if (
        addr &&
        fulfillment === "delivery"
      ) {
        await saveAddress({
          label: "موقعي",

          latitude: addr.latitude,

          longitude: addr.longitude,

          formatted_address:
            addr.formattedAddress,

          city: addr.city || null,

          district: addr.district || null,

          street: addr.street || null,

          building: null,

          delivery_notes:
            notes || null,

          is_default:
            addresses.length === 0,
        });
      }

      clearCart();

      setStep("success");

      return;
    }

    // ============================================================
    // ERROR
    // ============================================================

    setOrderError(
      result.error ||
        "صار خطأ أثناء إنشاء الطلب"
    );

    setStep("error");
  };

  // ============================================================
  // WHATSAPP
  // ============================================================

  const handleWhatsApp = () => {
    if (!restaurantConfig.whatsapp) return;

    const message = encodeURIComponent(
      `مرحباً، لدي طلب رقم ${orderNumber}`
    );

    window.open(
      `https://wa.me/${restaurantConfig.whatsapp}?text=${message}`,
      "_blank"
    );
  };

  const deliveryFee = 0;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* BACKDROP */}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm"
          />

          {/* DRAWER */}

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 280,
            }}
            role="dialog"
            aria-modal="true"
            aria-label="سلة الطلب"
            className="fixed inset-x-0 bottom-0 z-[95] flex max-h-[94svh] flex-col rounded-t-3xl border-t border-white/[0.08] bg-bg-secondary shadow-2xl shadow-black lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-full lg:max-w-md lg:rounded-none lg:border-t-0 lg:border-l"
          >
            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <h3 className="font-display text-xl text-ivory">
                {step === "cart" && "السلة"}
                {step === "location" && "موقع التوصيل"}
                {step === "confirm" && "تأكيد الطلب"}
                {step === "processing" && "هسه نرسل..."}
                {step === "success" && "تم الطلب"}
                {step === "error" && "صار خطأ"}
              </h3>

              <button
                onClick={closeCart}
                aria-label="إغلاق"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-ivory-dim transition hover:bg-white/10"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* CONTENT */}

            <div className="flex-1 overflow-y-auto">

              {/* ==================================================
                  CART
              ================================================== */}

              {step === "cart" && (
                <div className="px-5 py-4">
                  {items.length === 0 ? (
                    <p className="mt-12 text-center text-ivory-mute">
                      سلتك فاضية. شوف المنيو وزيد طبقك المفضل.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 border-b border-white/[0.06] pb-3"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-lg object-cover"
                            />
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-ivory">
                              {item.name}
                            </p>

                            <p className="numeric mt-0.5 text-xs text-ivory-mute">
                              {item.price.toLocaleString("en-US")} د.ع
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.quantity - 1
                                )
                              }
                              className="grid h-7 w-7 place-items-center rounded-full border border-white/15 text-ivory"
                            >
                              <FiMinus size={11} />
                            </button>

                            <span className="numeric w-5 text-center text-sm text-ivory">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.quantity + 1
                                )
                              }
                              className="grid h-7 w-7 place-items-center rounded-full border border-white/15 text-ivory"
                            >
                              <FiPlus size={11} />
                            </button>
                          </div>

                          <p className="numeric w-16 shrink-0 text-left text-sm font-bold text-gold">
                            {(
                              item.price *
                              item.quantity
                            ).toLocaleString("en-US")}
                          </p>

                          <button
                            onClick={() =>
                              removeItem(item.id)
                            }
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ivory-mute hover:text-red-accent"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ==================================================
                  LOCATION
              ================================================== */}

              {step === "location" && (
                <div className="px-5 py-5">

                  <div className="mb-6">
                    <p className="mb-3 text-sm font-bold text-ivory">
                      طريقة الاستلام
                    </p>

                    <div className="grid grid-cols-2 gap-3">

                      {restaurantConfig.deliveryAvailable && (
                        <button
                          onClick={() =>
                            setFulfillment("delivery")
                          }
                          className={`rounded-xl border px-4 py-3 text-sm transition ${
                            fulfillment === "delivery"
                              ? "border-gold bg-gold/10 text-gold"
                              : "border-white/15 text-ivory-dim"
                          }`}
                        >
                          توصيل
                        </button>
                      )}

                      {restaurantConfig.pickupAvailable && (
                        <button
                          onClick={() =>
                            setFulfillment("pickup")
                          }
                          className={`rounded-xl border px-4 py-3 text-sm transition ${
                            fulfillment === "pickup"
                              ? "border-gold bg-gold/10 text-gold"
                              : "border-white/15 text-ivory-dim"
                          }`}
                        >
                          استلام من الفرع
                        </button>
                      )}

                    </div>
                  </div>

                  {fulfillment === "delivery" && (
                    <>
                      {/* SAVED ADDRESSES */}

                      {addresses.length > 0 &&
                        !selectedAddress && (
                          <div className="mb-5">
                            <p className="mb-2 text-sm font-bold text-ivory">
                              عناوينك المحفوظة
                            </p>

                            {addresses.map((a) => (
                              <button
                                key={a.id}
                                onClick={() =>
                                  setSelectedAddress({
                                    latitude: a.latitude,
                                    longitude: a.longitude,
                                    formattedAddress:
                                      a.formatted_address,
                                    city:
                                      a.city || "",
                                    district:
                                      a.district || "",
                                    street:
                                      a.street || "",
                                  })
                                }
                                className="mb-2 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-surface px-4 py-3 text-right transition hover:border-gold-muted/40"
                              >
                                <FiMapPin
                                  className="shrink-0 text-gold"
                                  size={16}
                                />

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm text-ivory">
                                    {a.label}
                                  </p>

                                  <p className="truncate text-xs text-ivory-mute">
                                    {a.formatted_address}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                      {/* GPS */}

                      {!selectedAddress && (
                        <div className="rounded-xl border border-white/10 bg-surface p-5 text-center">
                          <FiNavigation className="mx-auto text-2xl text-gold" />

                          <p className="mt-3 font-display text-lg text-ivory">
                            حدد موقعك بضغطة وحدة
                          </p>

                          <p className="mt-1 text-sm text-ivory-mute">
                            نحتاج موقعك حتى نوصلك الطلب بالمكان الصحيح.
                          </p>

                          <button
                            onClick={handleUseGps}
                            disabled={
                              geo.status === "requesting" ||
                              geo.status === "geocoding"
                            }
                            className="mt-4 w-full rounded-full bg-red py-3 text-sm font-bold text-ivory transition disabled:opacity-50"
                          >
                            {geo.status === "requesting"
                              ? "هسه نحدد موقعك..."
                              : geo.status === "geocoding"
                              ? "هسه نجهز عنوانك..."
                              : "حدد موقعي"}
                          </button>

                          {(geo.status === "denied" ||
                            geo.status === "error") && (
                            <p className="mt-3 text-sm text-red-accent">
                              {geo.errorMessage}
                            </p>
                          )}
                        </div>
                      )}

                      {/* MANUAL ADDRESS */}

                      {(geo.status === "denied" ||
                        geo.status === "error") &&
                        !selectedAddress && (
                          <label className="mt-5 block">
                            <span className="mb-2 block text-sm font-bold text-ivory">
                              اكتب عنوانك بنفسك
                            </span>

                            <input
                              value={manualAddress}
                              onChange={(e) =>
                                setManualAddress(
                                  e.target.value
                                )
                              }
                              placeholder="المنطقة، الشارع، أقرب نقطة دالة"
                              className="w-full rounded-xl border border-white/15 bg-surface px-4 py-3 text-ivory placeholder:text-ivory-mute focus:border-gold-muted"
                            />
                          </label>
                        )}

                      {/* LOCATION PREVIEW */}

                      {selectedAddress && (
                        <div className="rounded-xl border border-gold-muted/30 bg-surface p-4">

                          <div className="flex items-start gap-3">
                            <FiMapPin className="mt-0.5 shrink-0 text-gold" />

      
