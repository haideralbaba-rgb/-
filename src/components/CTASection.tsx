import RevealSection from "./RevealSection";
import { useOrder } from "../context/OrderContext";

export default function CTASection() {
  const { totalItems, openCart } = useOrder();

  const handleOrder = () => {
    if (totalItems > 0) {
      openCart();
    } else {
      document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden bg-bg py-24 md:py-36">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/images/about-texture.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/92 to-bg/70" />

      <div className="relative mx-auto max-w-3xl px-6 text-center md:px-10">
        <RevealSection>
          <h2 className="font-display text-4xl leading-tight text-ivory sm:text-6xl">جاهز لأول لقمة؟</h2>
          <p className="mx-auto mt-5 max-w-md text-ivory-dim">اختار طبقك وخلّي الباقي علينا.</p>

          <button
            onClick={handleOrder}
            className="mt-9 rounded-full border border-gold-muted/50 bg-red px-10 py-4 font-display text-lg text-ivory shadow-xl shadow-black/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-red-deep/40"
          >
            اطلب هسه
          </button>
        </RevealSection>
      </div>
    </section>
  );
}
