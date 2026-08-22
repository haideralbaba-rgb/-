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
import {
  useGeolocation,
  type GeoResult,
} from "../hooks/useGeolocation";
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

const DELIVERY_FEE = 3000;
const MINIMUM_DELIVERY = 10000;

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
  } = useAuth();

  const geo = useGeolocation();

  const [step, setStep] = useState<Step>("cart");

  const [fulfillment, setFulfillment] =
    useState<Fulfillment>(
      restaurantConfig.deliveryAvailable
        ? "delivery"
        : "pickup"
    );

  const [selectedAddress, setSelectedAddress] =
    useState<GeoResult | null>(null);

  const [manualAddress, setManualAddress] =
    useState("");

  const [notes, setNotes] = useState("");

  const [customerName, setCustomerName] =
    useState("");

  const [orderNumber, setOrderNumber] =
    useState("");

  const [orderError, setOrderError] =
    useState("");

  // ============================================================
  // RESET WHEN DRAWER CLOSES
  // ============================================================

  useEffect(() => {
    if (!isCartOpen) {
      const timer = window.setTimeout(() => {
        setStep("cart");
        setSelectedAddress(null);
        setManualAddress("");
        setNotes("");
        setOrderNumber("");
        setOrderError("");
        geo.reset();
      }, 300);

      return () => window.clearTimeout(timer);
    }
  }, [isCartOpen]);

  // ============================================================
  // CUSTOMER NAME
  // ============================================================

  useEffect(() => {
    if (profile?.name) {
      setCustomerName(profile.name);
    }
  }, [profile]);

  // ============================================================
  // CONTINUE AFTER LOGIN
  // ============================================================

  useEffect(() => {
    if (
      user &&
      isCartOpen &&
      items.length > 0 &&
      step === "cart"
    ) {
      setStep("location");
    }
  }, [
    user,
    isCartOpen,
    items.length,
    step,
  ]);

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

    setOrderError("");
    setStep("location");
  };

  // ============================================================
  // GPS
  // ============================================================

  const handleUseGps = async () => {
    setOrderError("");

    const result = await geo.requestLocation();

    if (result) {
      setSelectedAddress(result);
    }
  };

  // ============================================================
  // CONFIRM LOCATION
  // ============================================================

  const handleConfirmLocation = () => {
    if (
      fulfillment === "delivery" &&
      !selectedAddress &&
      !manualAddress.trim()
    ) {
      setOrderError(
        "حدد موقع التوصيل أولاً"
      );
      return;
    }

    if (
      fulfillment === "delivery" &&
      totalPrice < MINIMUM_DELIVERY
    ) {
      setOrderError(
        `الحد الأدنى للتوصيل ${MINIMUM_DELIVERY.toLocaleString(
          "en-US"
        )} د.ع`
      );
      return;
    }

    setOrderError("");
    setStep("confirm");
  };

  // ============================================================
  // TOTALS
  // ============================================================

  const deliveryFee =
    fulfillment === "delivery"
      ? DELIVERY_FEE
      : 0;

  const grandTotal =
    totalPrice + deliveryFee;

  // ============================================================
  // CREATE ORDER
  // ============================================================

  const handleSubmitOrder = async () => {
    if (!user) {
      setOrderError(
        "لازم تسجل دخول أولاً"
      );
      return;
    }

    if (items.length === 0) {
      setOrderError(
        "السلة فاضية"
      );
      return;
    }

    setStep("processing");
    setOrderError("");

    /*
     * نظامنا الحالي التجريبي يستخدم:
     *
     * customers.id = Anonymous Auth User ID
     *
     * لذلك نستخدم user.id كـ customer_id.
     */
    const customerId =
      profile?.id || user.id;

    const phone =
      profile?.phone || "";

    const name =
      customerName ||
      profile?.name ||
      null;

    const addr =
      selectedAddress;

    const result =
      await createOrder({
        customerId,

        items,

        subtotal: totalPrice,

        deliveryFee,

        total: grandTotal,

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
              manualAddress.trim() ||
              null
            : null,

        phone,

        customerName: name,

        notes:
          notes.trim() || null,
      });

    // ==========================================================
    // SUCCESS
    // ==========================================================

    if (
      result.success &&
      result.orderNumber
    ) {
      setOrderNumber(
        result.orderNumber
      );

      // حفظ العنوان للمرة القادمة
      if (
        fulfillment === "delivery" &&
        addr
      ) {
        try {
          await saveAddress({
            label: "موقعي",
            latitude: addr.latitude,
            longitude: addr.longitude,
            formatted_address:
              addr.formattedAddress || "",
            city: addr.city || null,
            district:
              addr.district || null,
            street:
              addr.street || null,
            building: null,
            delivery_notes:
              notes.trim() || null,
            is_default:
              addresses.length === 0,
          });
        } catch (error) {
          console.error(
            "Save address error:",
            error
          );
        }
      }

      clearCart();

      setStep("success");

      return;
    }

    // ==========================================================
    // ERROR
    // ==========================================================

    setOrderError(
      result.error ||
        "صار خطأ أثناء إنشاء الطلب"
    );

    setStep("error");
  };

  // ============================================================
  // RESET & RETRY
  // ============================================================

  const handleRetry = () => {
    setOrderError("");
    setStep("confirm");
  };

  // ============================================================
  // WHATSAPP
  // ============================================================

  const handleWhatsApp = () => {
    if (!restaurantConfig.whatsapp) {
      return;
    }

    const message =
      encodeURIComponent(
        `مرحباً، لدي طلب رقم ${orderNumber}`
      );

    window.open(
      `https://wa.me/${restaurantConfig.whatsapp}?text=${message}`,
      "_blank"
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* BACKDROP */}

          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={closeCart}
            className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm"
          />

          {/* DRAWER */}

          <motion.div
            initial={{
              y: "100%",
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: "100%",
              opacity: 0,
            }}
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
            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <h3 className="font-display text-xl text-ivory">
                {step === "cart" &&
                  "السلة"}

                {step === "location" &&
                  "موقع التوصيل"}

                {step === "confirm" &&
                  "تأكيد الطلب"}

                {step ===
                  "processing" &&
                  "هسه نرسل..."}

                {step === "success" &&
                  "تم الطلب"}

                {step === "error" &&
                  "صار خطأ"}
              </h3>

              <button
                onClick={closeCart}
                aria-label="إغلاق"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-ivory-dim transition hover:bg-white/10"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* ==================================================
                CONTENT
            ================================================== */}

            <div className="flex-1 overflow-y-auto">

              {/* ==================================================
                  CART
              ================================================== */}

              {step === "cart" && (
                <div className="px-5 py-4">
                  {items.length === 0 ? (
                    <p className="mt-12 text-center text-ivory-mute">
                      سلتك فاضية. شوف
                      المنيو وزيد طبقك
                      المفضل.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {items.map(
                        (item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 border-b border-white/[0.06] pb-3"
                          >
                            {item.image && (
                              <img
                                src={
                                  item.image
                                }
                                alt=""
                                className="h-12 w-12 shrink-0 rounded-lg object-cover"
                              />
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-ivory">
                                {
                                  item.name
                                }
                              </p>

                              {item.variant && (
                                <p className="mt-0.5 text-xs text-gold">
                                  {
                                    item.variant
                                  }
                                </p>
                              )}

                              <p className="numeric mt-0.5 text-xs text-ivory-mute">
                                {item.price.toLocaleString(
                                  "en-US"
                                )}{" "}
                                د.ع
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    item.quantity -
                                      1
                                  )
                                }
                                aria-label="إنقاص"
                                className="grid h-7 w-7 place-items-center rounded-full border border-white/15 text-ivory"
                              >
                                <FiMinus
                                  size={
                                    11
                                  }
                                />
                              </button>

                              <span className="numeric w-5 text-center text-sm text-ivory">
                                {
                                  item.quantity
                                }
                              </span>

                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    item.quantity +
                                      1
                                  )
                                }
                                aria-label="زيادة"
                                className="grid h-7 w-7 place-items-center rounded-full border border-white/15 text-ivory"
                              >
                                <FiPlus
                                  size={
                                    11
                                  }
                                />
                              </button>
                            </div>

                            <p className="numeric w-16 shrink-0 text-left text-sm font-bold text-gold">
                              {(
                                item.price *
                                item.quantity
                              ).toLocaleString(
                                "en-US"
                              )}
                            </p>

                            <button
                              onClick={() =>
                                removeItem(
                                  item.id
                                )
                              }
                              aria-label="حذف"
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ivory-mute hover:text-red-accent"
                            >
                              <FiTrash2
                                size={
                                  13
                                }
                              />
                            </button>
                          </div>
                        )
                      )}
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
                            setFulfillment(
                              "delivery"
                            )
                          }
                          className={`rounded-xl border px-4 py-3 text-sm transition ${
                            fulfillment ===
                            "delivery"
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
                            setFulfillment(
                              "pickup"
                            )
                          }
                          className={`rounded-xl border px-4 py-3 text-sm transition ${
                            fulfillment ===
                            "pickup"
                              ? "border-gold bg-gold/10 text-gold"
                              : "border-white/15 text-ivory-dim"
                          }`}
                        >
                          استلام من الفرع
                        </button>
                      )}

                    </div>
                  </div>

                  {/* DELIVERY */}

                  {fulfillment ===
                    "delivery" && (
                    <>
                      {addresses.length >
                        0 &&
                        !selectedAddress && (
                          <div className="mb-5">
                            <p className="mb-2 text-sm font-bold text-ivory">
                              عناوينك
                              المحفوظة
                            </p>

                            {addresses.map(
                              (address) => (
                                <button
                                  key={
                                    address.id
                                  }
                                  onClick={() =>
                                    setSelectedAddress(
                                      {
                                        latitude:
                                          address.latitude,
                                        longitude:
                                          address.longitude,
                                        formattedAddress:
                                          address.formatted_address,
                                        city:
                                          address.city ||
                                          "",
                                        district:
                                          address.district ||
                                          "",
                                        street:
                                          address.street ||
                                          "",
                                      }
                                    )
                                  }
                                  className="mb-2 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-surface px-4 py-3 text-right transition hover:border-gold-muted/40"
                                >
                                  <FiMapPin
                                    className="shrink-0 text-gold"
                                    size={
                                      16
                                    }
                                  />

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm text-ivory">
                                      {
                                        address.label
                                      }
                                    </p>

                                    <p className="truncate text-xs text-ivory-mute">
                                      {
                                        address.formatted_address
                                      }
                                    </p>
                                  </div>
                                </button>
                              )
                            )}
                          </div>
                        )}

                      {!selectedAddress && (
                        <div className="rounded-xl border border-white/10 bg-surface p-5 text-center">
                          <FiNavigation className="mx-auto text-2xl text-gold" />

                          <p className="mt-3 font-display text-lg text-ivory">
                            حدد موقعك بضغطة وحدة
                          </p>

                          <p className="mt-1 text-sm text-ivory-mute">
                            نحتاج موقعك حتى
                            نوصلك الطلب
                            بالمكان الصحيح.
                          </p>

                          <button
                            onClick={
                              handleUseGps
                            }
                            disabled={
                              geo.status ===
                                "requesting" ||
                              geo.status ===
                                "geocoding"
                            }
                            className="mt-4 w-full rounded-full bg-red py-3 text-sm font-bold text-ivory transition disabled:opacity-50"
                          >
                            {geo.status ===
                            "requesting"
                              ? "هسه نحدد موقعك..."
                              : geo.status ===
                                "geocoding"
                              ? "هسه نجهز عنوانك..."
                              : "حدد موقعي"}
                          </button>

                          {(geo.status ===
                            "denied" ||
                            geo.status ===
                              "error") && (
                            <p className="mt-3 text-sm text-red-accent">
                              {
                                geo.errorMessage
                              }
                            </p>
                          )}
                        </div>
                      )}

                      {(geo.status ===
                        "denied" ||
                        geo.status ===
                          "error") &&
                        !selectedAddress && (
                          <label className="mt-5 block">
                            <span className="mb-2 block text-sm font-bold text-ivory">
                              اكتب عنوانك
                              بنفسك
                            </span>

                            <input
                              value={
                                manualAddress
                              }
                              onChange={(
                                event
                              ) =>
                                setManualAddress(
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder="المنطقة، الشارع، أقرب نقطة دالة"
                              className="w-full rounded-xl border border-white/15 bg-surface px-4 py-3 text-ivory placeholder:text-ivory-mute focus:border-gold-muted"
                            />
                          </label>
                        )}

                      {selectedAddress && (
                        <div className="rounded-xl border border-gold-muted/30 bg-surface p-4">
                          <div className="flex items-start gap-3">
                            <FiMapPin className="mt-0.5 shrink-0 text-gold" />

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-ivory">
                                موقع التوصيل
                              </p>

                              <p className="mt-1 text-sm leading-6 text-ivory-dim">
                                {
                                  selectedAddress.formattedAddress
                                }
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 rounded-lg border border-white/10 bg-black/10 p-3 text-xs text-ivory-mute">
                            <div>
                              Latitude:{" "}
                              {
                                selectedAddress.latitude
                              }
                            </div>

                            <div>
                              Longitude:{" "}
                              {
                                selectedAddress.longitude
                              }
                            </div>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={
                                handleConfirmLocation
                              }
                              className="flex-1 rounded-full bg-gold py-2.5 text-sm font-bold text-bg"
                            >
                              الموقع صحيح
                            </button>

                            <button
                              onClick={() => {
                                setSelectedAddress(
                                  null
                                );
                                geo.reset();
                              }}
                              className="rounded-full border border-white/15 px-4 py-2.5 text-sm text-ivory-dim"
                            >
                              تغيير
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 rounded-xl border border-white/10 bg-surface p-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-ivory-dim">
                            قيمة الطلب
                          </span>

                          <span className="numeric text-ivory">
                            {totalPrice.toLocaleString(
                              "en-US"
                            )}{" "}
                            د.ع
                          </span>
                        </div>

                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-ivory-dim">
                            التوصيل
                          </span>

                          <span className="numeric text-ivory">
                            {DELIVERY_FEE.toLocaleString(
                              "en-US"
                            )}{" "}
                            د.ع
                          </span>
                        </div>
                      </div>

                      {orderError && (
                        <p className="mt-4 text-sm text-red-accent">
                          {orderError}
                        </p>
                      )}
                    </>
                  )}

                  {/* PICKUP */}

                  {fulfillment ===
                    "pickup" && (
                    <div className="rounded-xl border border-white/10 bg-surface p-5 text-center">
                      <FiMapPin className="mx-auto text-2xl text-gold" />

                      <p className="mt-3 font-display text-lg text-ivory">
                        استلام من الفرع
                      </p>

                      <p className="mt-1 text-sm text-ivory-mute">
                        طلبك يصير جاهز
                        للاستلام من
                        المطعم.
                      </p>
                    </div>
                  )}

                  {orderError &&
                    fulfillment ===
                      "pickup" && (
                      <p className="mt-4 text-sm text-red-accent">
                        {orderError}
                      </p>
                    )}
                </div>
              )}

              {/* ==================================================
                  CONFIRM
              ================================================== */}

              {step === "confirm" && (
                <div className="px-5 py-5">
                  <div className="mb-5 rounded-xl border border-white/[0.08] bg-surface p-4">
                    <p className="mb-3 text-sm font-bold text-ivory">
                      ملخص الطلب
                    </p>

                    {items.map(
                      (item) => (
                        <div
                          key={item.id}
                          className="flex justify-between py-1.5 text-sm"
                        >
                          <span className="text-ivory-dim">
                            {item.name} ×{" "}
                            {
                              item.quantity
                            }
                          </span>

                          <span className="numeric text-ivory">
                            {(
                              item.price *
                              item.quantity
                            ).toLocaleString(
                              "en-US"
                            )}
                          </span>
                        </div>
                      )
                    )}

                    <div className="mt-3 border-t border-white/[0.08] pt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-ivory-dim">
                          المجموع
                        </span>

                        <span className="numeric text-ivory">
                          {totalPrice.toLocaleString(
                            "en-US"
                          )}{" "}
                          د.ع
                        </span>
                      </div>

                      {deliveryFee >
                        0 && (
                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-ivory-dim">
                            التوصيل
                          </span>

                          <span className="numeric text-ivory">
                            {deliveryFee.toLocaleString(
                              "en-US"
                            )}{" "}
                            د.ع
                          </span>
                        </div>
                      )}

                      <div className="mt-3 flex justify-between font-bold">
                        <span className="text-ivory">
                          الإجمالي
                        </span>

                        <span className="numeric text-gold">
                          {grandTotal.toLocaleString(
                            "en-US"
                          )}{" "}
                          د.ع
                        </span>
                      </div>
                    </div>
                  </div>

                  {!profile?.name && (
                    <label className="mb-4 block">
                      <span className="mb-2 block text-sm text-ivory-dim">
                        اسمك
                      </span>

                      <input
                        value={
                          customerName
                        }
                        onChange={(event) =>
                          setCustomerName(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="اسمك"
                        className="w-full rounded-xl border border-white/15 bg-surface px-4 py-3 text-ivory placeholder:text-ivory-mute focus:border-gold-muted"
                      />
                    </label>
                  )}

                  <label className="mb-4 block">
                    <span className="mb-2 block text-sm text-ivory-dim">
                      ملاحظات للسائق
                      (اختياري)
                    </span>

                    <textarea
                      value={notes}
                      onChange={(event) =>
                        setNotes(
                          event.target
                            .value
                        )
                      }
                      rows={3}
                      placeholder="مثال: مقابل الصيدلية / الباب الثاني"
                      className="w-full resize-none rounded-xl border border-white/15 bg-surface px-4 py-3 text-ivory placeholder:text-ivory-mute focus:border-gold-muted"
                    />
                  </label>

                  <div className="rounded-xl border border-white/10 bg-surface p-4">
                    <p className="text-sm font-bold text-ivory">
                      طريقة الدفع
                    </p>

                    <p className="mt-1 text-sm text-ivory-mute">
                      💵 الدفع عند الاستلام
                    </p>
                  </div>

                  {fulfillment ===
                    "delivery" && (
                    <div className="mt-4 rounded-xl border border-gold-muted/20 bg-gold/5 p-4">
                      <div className="flex items-center gap-2 text-sm text-gold">
                        <FiMapPin
                          size={16}
                        />
                        التوصيل إلى
                        موقعك المحدد
                      </div>

                      <p className="mt-2 text-xs leading-6 text-ivory-mute">
                        {
                          selectedAddress?.formattedAddress ||
                            manualAddress ||
                            "تم تحديد الموقع"
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ==================================================
                  PROCESSING
              ================================================== */}

              {step ===
                "processing" && (
                <div className="flex flex-col items-center justify-center px-5 py-20">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold-muted/30 border-t-gold" />

                  <p className="mt-5 font-display text-lg text-ivory">
                    هسه نجهز طلبك...
                  </p>

                  <p className="mt-2 text-sm text-ivory-mute">
                    لحظات عيوني
                  </p>
                </div>
              )}

              {/* ==================================================
                  SUCCESS
              ================================================== */}

              {step === "success" && (
                <div className="flex flex-col items-center px-5 py-12 text-center">
                  <motion.div
                    initial={{
                      scale: 0,
                    }}
                    animate={{
                      scale: 1,
                    }}
                    transition={{
                      type: "spring",
                      damping: 12,
                    }}
                    className="grid h-20 w-20 place-items-center rounded-full bg-gold text-bg shadow-lg"
                  >
                    <FiCheck
                      size={34}
                    />
                  </motion.div>

                  <h4 className="mt-5 font-display text-2xl text-ivory">
                    تم تأكيد طلبك
                  </h4>

                  <p className="mt-2 text-sm text-ivory-dim">
                    هلا{" "}
                    {customerName ||
                      "عيوني"}{" "}
                    ❤️
                  </p>

                  <p className="numeric mt-5 rounded-xl border border-gold-muted/30 bg-surface px-6 py-3 font-display text-2xl text-gold">
                    {orderNumber}
                  </p>

                  <p className="mt-5 max-w-xs text-sm leading-7 text-ivory-dim">
                    طلبك وصل للمطعم
                    وراح نبدأ
                    بتجهيزه بأسرع
                    وقت.
                  </p>

                  <div className="mt-4 rounded-xl border border-white/10 bg-surface px-5 py-4 text-sm">
                    <p className="text-ivory-dim">
                      الإجمالي
                    </p>

                    <p className="numeric mt-1 text-xl font-bold text-gold">
                      {grandTotal.toLocaleString(
                        "en-US"
                      )}{" "}
                      د.ع
                    </p>
                  </div>

                  {restaurantConfig.whatsapp && (
                    <button
                      onClick={
                        handleWhatsApp
                      }
                      className="mt-7 w-full rounded-full border border-green-600 bg-green-600/10 py-3 text-sm font-bold text-green-400 transition hover:bg-green-600/20"
                    >
                      تواصل عبر واتساب
                    </button>
                  )}
                </div>
              )}

              {/* ==================================================
                  ERROR
              ================================================== */}

              {step === "error" && (
                <div className="flex flex-col items-center px-5 py-16 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-red/20 text-red-accent">
                    <FiX size={30} />
                  </div>

                  <h4 className="mt-5 font-display text-2xl text-ivory">
                    ما اكتمل الطلب
                  </h4>

                  <p className="mt-3 max-w-sm text-sm leading-7 text-red-accent">
                    {orderError ||
                      "حدث خطأ غير متوقع"}
                  </p>

                  <button
                    onClick={
                      handleRetry
                    }
                    className="mt-7 rounded-full bg-gold px-8 py-3 font-bold text-bg"
                  >
                    حاول مرة ثانية
                  </button>
                </div>
              )}
            </div>

            {/* ====================================================
                FOOTER
            ==================================================== */}

            {step === "cart" &&
              items.length > 0 && (
                <div className="shrink-0 border-t border-white/[0.08] bg-bg-secondary p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-ivory-dim">
                      {totalItems} عناصر
                    </span>

                    <span className="numeric text-lg font-bold text-gold">
                      {totalPrice.toLocaleString(
                        "en-US"
                      )}{" "}
                      د.ع
                    </span>
                  </div>

                  {restaurantConfig.deliveryAvailable &&
                    totalPrice <
                      MINIMUM_DELIVERY && (
                      <p className="mb-3 text-center text-xs text-ivory-mute">
                        الحد الأدنى
                        للتوصيل{" "}
                        {MINIMUM_DELIVERY.toLocaleString(
                          "en-US"
                        )}{" "}
                        د.ع
                      </p>
                    )}

                  <button
                    onClick={
                      handleProceedFromCart
                    }
                    className="w-full rounded-full bg-red py-4 font-display text-lg text-ivory shadow-lg shadow-black/30"
                  >
                    متابعة الطلب
                  </button>
                </div>
              )}

            {step === "location" && (
              <div className="shrink-0 border-t border-white/[0.08] bg-bg-secondary p-5">
                {fulfillment ===
                "pickup" ? (
                  <button
                    onClick={() => {
                      setOrderError(
                        ""
                      );
                      setStep(
                        "confirm"
                      );
                    }}
                    className="w-full rounded-full bg-red py-4 font-display text-lg text-ivory"
                  >
                    متابعة
                  </button>
                ) : (
                  <button
                    onClick={
                      handleConfirmLocation
                    }
                    disabled={
                      !selectedAddress &&
                      !manualAddress.trim()
                    }
                    className="w-full rounded-full bg-red py-4 font-display text-lg text-ivory transition disabled:opacity-50"
                  >
                    متابعة لتأكيد الطلب
                  </button>
                )}
              </div>
            )}

            {step === "confirm" && (
              <div className="shrink-0 border-t border-white/[0.08] bg-bg-secondary p-5">
                <button
                  onClick={
                    handleSubmitOrder
                  }
                  className="w-full rounded-full bg-red py-4 font-display text-lg text-ivory shadow-lg shadow-black/30"
                >
                  تأكيد وإرسال الطلب
                </button>
              </div>
            )}

            {step === "success" && (
              <div className="shrink-0 border-t border-white/[0.08] bg-bg-secondary p-5">
                <button
                  onClick={closeCart}
                  className="w-full rounded-full bg-gold py-4 font-display text-lg font-bold text-bg"
                >
                  تمام
                </button>
              </div>
            )}

            {step === "error" && (
              <div className="shrink-0 border-t border-white/[0.08] bg-bg-secondary p-5">
                <button
                  onClick={
                    handleRetry
                  }
                  className="w-full rounded-full bg-red py-4 font-display text-lg text-ivory"
                >
                  رجوع للمراجعة
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
