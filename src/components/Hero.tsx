import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useOrder } from "../context/OrderContext";
import { restaurantConfig } from "../data/restaurantConfig";

export default function Hero() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const { totalItems, openCart } = useOrder();

  const handleOrder = () => {
    if (totalItems > 0) {
      openCart();
    } else {
      document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="home" ref={ref} className="relative flex h-[100svh] min-h-[600px] items-center overflow-hidden bg-bg">
      <motion.div style={{ y }} className="absolute inset-0 overflow-hidden">
        {/* Still image background — subtle, slow Ken Burns zoom, never distracting */}
        <motion.img
          src={restaurantConfig.heroBackground}
          alt=""
          initial={{ scale: 1 }}
          animate={{ scale: 1.08 }}
          transition={{ duration: 26, ease: "linear", repeat: Infinity, repeatType: "mirror" }}
          className="h-full w-full object-cover"
        />

        {/* cinematic controlled overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/55 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/20" />
        <div
          className="absolute inset-0"
          style={{ boxShadow: "inset 0 0 220px 70px rgba(6,5,4,0.85)" }}
        />
        <div className="noise-overlay pointer-events-none absolute inset-0" />
      </motion.div>

      <motion.div style={{ opacity }} className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-10">
        <div className="max-w-2xl">
          <img
            src={restaurantConfig.logo}
            alt={`شعار ${restaurantConfig.arabicName}`}
            className="mb-6 h-20 w-20 rounded-full border-2 border-gold-muted/50 shadow-xl shadow-black/50 sm:h-24 sm:w-24"
          />

          <span className="inline-block rounded-full border border-gold-muted/40 bg-black/30 px-4 py-1.5 text-xs tracking-widest text-ivory-dim backdrop-blur">
            نكهة عراقية... بطريقتنا احنا.
          </span>

          <h1 className="mt-6 font-display text-[13vw] leading-[0.98] text-ivory sm:text-6xl md:text-[5.2rem] lg:text-8xl">
            الشاورما،
            <br />
            <span className="text-gold-gradient">هيچي لازم تكون.</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-8 text-ivory-dim sm:text-lg">
            لحم ودجاج يشتوي قدامك، برغر بلمسة شيف، وبروستد مقرمش... الطعم نفسه يحچيلك عنه.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              onClick={handleOrder}
              className="rounded-full border border-gold-muted/50 bg-red px-8 py-4 font-display text-lg text-ivory shadow-xl shadow-black/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-red-deep/40 active:translate-y-0"
            >
              اطلب هسه
            </button>
            <a
              href="#menu"
              className="rounded-full border border-white/15 px-7 py-4 text-ivory transition-colors duration-200 hover:border-white/35 hover:bg-white/5"
            >
              شوف المنيو
            </a>
          </div>

          <p className="mt-8 text-sm text-ivory-mute">شوف المنيو • اختار وجبتك • اطلب</p>
        </div>
      </motion.div>

      <a
        href="#brand"
        aria-label="انزل تشوف اكثر"
        className="absolute bottom-9 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 text-ivory-mute"
      >
        <span className="text-[11px] tracking-[0.2em]">انزل تحت</span>
        <span className="scroll-indicator-line" />
      </a>
    </section>
  );
}
