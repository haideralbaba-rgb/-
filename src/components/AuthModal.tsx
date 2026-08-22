import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiPhone, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useOrder } from "../context/OrderContext";

export default function AuthModal() {
  const {
    showLogin,
    setShowLogin,
    register,
    isConfigured,
    loginRedirectTo,
    setLoginRedirectTo,
  } = useAuth();

  const { openCart } = useOrder();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (cleanName.length < 2) {
      setError("اكتب اسمك عيوني");
      return;
    }

    if (cleanPhone.length < 10) {
      setError("لازم تدخل رقم هاتف صحيح");
      return;
    }

    setLoading(true);
    setError("");

    if (!isConfigured) {
      setError("النظام غير مُهيّأ حالياً");
      setLoading(false);
      return;
    }

    const { error: registerError } = await register(
      cleanName,
      cleanPhone
    );

    setLoading(false);

    if (registerError) {
      setError(registerError);
      return;
    }

    handleClose();
  };

  const handleClose = () => {
    const wasCheckout = loginRedirectTo === "checkout";

    setShowLogin(false);
    setName("");
    setPhone("");
    setError("");
    setLoginRedirectTo(null);

    if (wasCheckout) {
      setTimeout(() => openCart(), 100);
    }
  };

  const handleDismiss = () => {
    setShowLogin(false);
    setName("");
    setPhone("");
    setError("");
    setLoginRedirectTo(null);
  };

  return (
    <AnimatePresence>
      {showLogin && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 280,
            }}
            role="dialog"
            aria-modal="true"
            aria-label="تسجيل الدخول"
            className="fixed inset-x-0 bottom-0 z-[105] mx-auto max-w-md rounded-t-3xl border-t border-white/[0.08] bg-bg-secondary p-6 shadow-2xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border"
          >
            {/* Header */}
            <div className="flex items-center justify-end">
              <button
                onClick={handleDismiss}
                aria-label="إغلاق"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-ivory-dim transition hover:bg-white/10"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Title */}
            <div className="mt-4 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-hi text-gold">
                <FiUser size={22} />
              </div>

              <h3 className="mt-4 font-display text-2xl text-ivory">
                خلينا نعرفك
              </h3>

              <p className="mt-2 text-sm text-ivory-mute">
                سجل بياناتك مرة وحدة وخلي طلباتك أسرع.
              </p>
            </div>

            {/* Form */}
            <div className="mt-8 space-y-4">

              {/* Name */}
              <label className="block">
                <span className="mb-2 block text-sm text-ivory-dim">
                  الاسم
                </span>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً: حيدر"
                  autoFocus
                  className="w-full rounded-xl border border-white/15 bg-surface px-4 py-3.5 text-lg text-ivory placeholder:text-ivory-mute focus:border-gold-muted"
                />
              </label>

              {/* Phone */}
              <label className="block">
                <span className="mb-2 block text-sm text-ivory-dim">
                  رقم الهاتف
                </span>

                <div className="relative">
                  <FiPhone
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory-mute"
                  />

                  <input
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value.replace(/[^\d+]/g, "")
                      )
                    }
                    placeholder="07xxxxxxxxx"
                    className="numeric w-full rounded-xl border border-white/15 bg-surface py-3.5 pl-12 pr-4 text-lg text-ivory placeholder:text-ivory-mute focus:border-gold-muted"
                  />
                </div>
              </label>

              {error && (
                <p className="text-sm text-red-accent">
                  {error}
                </p>
              )}

              <button
                onClick={handleRegister}
                disabled={
                  loading ||
                  name.trim().length < 2 ||
                  phone.length < 10
                }
                className="mt-2 w-full rounded-full bg-red py-4 font-display text-lg text-ivory shadow-lg shadow-black/30 transition disabled:opacity-50"
              >
                {loading ? "لحظات عيوني..." : "متابعة"}
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-ivory-mute">
              بياناتك محفوظة لتسهيل طلباتك القادمة.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
