import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiPhone, FiArrowLeft } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useOrder } from "../context/OrderContext";

type Step = "phone" | "otp";

export default function AuthModal() {
  const { showLogin, setShowLogin, sendOtp, verifyOtp, isConfigured, loginRedirectTo, setLoginRedirectTo } = useAuth();
  const { openCart } = useOrder();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formattedPhone = phone.startsWith("+") ? phone : phone.startsWith("07") ? `+964${phone.slice(1)}` : phone.startsWith("964") ? `+${phone}` : `+964${phone}`;

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setError("لازم تدخل رقم هاتف صحيح");
      return;
    }
    setLoading(true);
    setError("");

    if (!isConfigured) {
      // Demo mode: skip real OTP
      await new Promise((r) => setTimeout(r, 800));
      setStep("otp");
      setLoading(false);
      return;
    }

    const { error: otpError } = await sendOtp(formattedPhone);
    setLoading(false);
    if (otpError) {
      setError(otpError);
    } else {
      setStep("otp");
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      setError("لازم تدخل رمز التحقق");
      return;
    }
    setLoading(true);
    setError("");

    if (!isConfigured) {
      // Demo mode: auto-login
      await new Promise((r) => setTimeout(r, 800));
      setLoading(false);
      handleClose();
      return;
    }

    const { error: verifyError } = await verifyOtp(formattedPhone, otp);
    setLoading(false);
    if (verifyError) {
      setError(verifyError);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    const wasCheckout = loginRedirectTo === "checkout";
    setShowLogin(false);
    setStep("phone");
    setOtp("");
    setError("");
    setLoginRedirectTo(null);
    if (wasCheckout) {
      // Re-open cart so the checkout flow continues
      setTimeout(() => openCart(), 100);
    }
  };

  const handleDismiss = () => {
    setShowLogin(false);
    setStep("phone");
    setOtp("");
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
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            role="dialog"
            aria-modal="true"
            aria-label="تسجيل الدخول"
            className="fixed inset-x-0 bottom-0 z-[105] mx-auto max-w-md rounded-t-3xl border-t border-white/[0.08] bg-bg-secondary p-6 shadow-2xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border"
          >
            <div className="flex items-center justify-between">
              {step === "otp" ? (
                <button onClick={() => { setStep("phone"); setError(""); }} aria-label="رجوع" className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-ivory-dim">
                  <FiArrowLeft size={16} />
                </button>
              ) : (
                <div />
              )}
              <button onClick={handleDismiss} aria-label="إغلاق" className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-ivory-dim transition hover:bg-white/10">
                <FiX size={16} />
              </button>
            </div>

            <div className="mt-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-hi text-gold">
                <FiPhone size={22} />
              </div>
              <h3 className="mt-4 font-display text-2xl text-ivory">
                {step === "phone" ? "خلينا نعرفك" : "رمز التحقق"}
              </h3>
              <p className="mt-2 text-sm text-ivory-mute">
                {step === "phone"
                  ? "عطينا رقم هاتفك حتى نكمل طلبك."
                  : `بعتنالك رمز التحقق على ${phone}`}
              </p>
            </div>

            <div className="mt-8">
              {step === "phone" ? (
                <div>
                  <label className="block">
                    <span className="mb-2 block text-sm text-ivory-dim">رقم الهاتف</span>
                    <input
                      type="tel"
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
                      placeholder="07xxxxxxxxx"
                      autoFocus
                      className="numeric w-full rounded-xl border border-white/15 bg-surface px-4 py-3.5 text-lg text-ivory placeholder:text-ivory-mute focus:border-gold-muted"
                    />
                  </label>
                  {error && <p className="mt-3 text-sm text-red-accent">{error}</p>}
                  <button
                    onClick={handleSendOtp}
                    disabled={loading || phone.length < 10}
                    className="mt-5 w-full rounded-full bg-red py-4 font-display text-lg text-ivory shadow-lg shadow-black/30 transition disabled:opacity-50"
                  >
                    {loading ? "لحظات وبعتنالك الرمز..." : "ابعث رمز التحقق"}
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block">
                    <span className="mb-2 block text-sm text-ivory-dim">رمز التحقق</span>
                    <input
                      type="text"
                      dir="ltr"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      autoFocus
                      maxLength={6}
                      className="numeric w-full rounded-xl border border-white/15 bg-surface px-4 py-3.5 text-center text-2xl tracking-[0.5em] text-ivory placeholder:text-ivory-mute focus:border-gold-muted"
                    />
                  </label>
                  {error && <p className="mt-3 text-sm text-red-accent">{error}</p>}
                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length < 4}
                    className="mt-5 w-full rounded-full bg-red py-4 font-display text-lg text-ivory shadow-lg shadow-black/30 transition disabled:opacity-50"
                  >
                    {loading ? "هسه نتحقق..." : "تأكيد"}
                  </button>
                </div>
              )}
            </div>

            {!isConfigured && (
              <p className="mt-4 text-center text-xs text-ivory-mute">
                وضع تجريبي — أي رقم يشتغل
              </p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
