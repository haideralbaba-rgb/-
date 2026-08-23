import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FiArrowDown, FiClock, FiMapPin, FiStar, FiTruck } from "react-icons/fi";
import { useOrder } from "../context/OrderContext";
import { restaurantConfig } from "../data/restaurantConfig";

const highlights = [
  { icon: FiStar, title: "تقييم عالي", text: "طعم يرجعلك" },
  { icon: FiClock, title: "تحضير سريع", text: "على قد الطلب" },
  { icon: FiTruck, title: "توصيل", text: "لباب البيت" },
  { icon: FiMapPin, title: "كربلاء", text: "نكهة عراقية" },
];

export default function Hero() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.78], [1, 0]);
  const { totalItems, openCart } = useOrder();
  const handleOrder = () => totalItems > 0 ? openCart() : document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });

  return <section id="home" ref={ref} className="relative flex min-h-[720px] h-[100svh] items-center overflow-hidden bg-bg">
    <motion.div style={{ y }} className="absolute inset-0 overflow-hidden">
      <motion.img src={restaurantConfig.heroBackground} alt="" initial={{scale:1.02}} animate={{scale:1.08}} transition={{duration:28,ease:"linear",repeat:Infinity,repeatType:"mirror"}} className="h-full w-full object-cover saturate-[1.08] contrast-[1.05]" />
      <div className="hero-food-glow absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/45 to-black/45" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/28 to-transparent" />
      <div className="hero-vignette absolute inset-0" />
      <div className="noise-overlay pointer-events-none absolute inset-0" />
    </motion.div>

    <motion.div style={{opacity}} className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-16 sm:px-8 md:px-10">
      <div className="max-w-2xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="fire-glow rounded-2xl p-[1px] bg-gradient-to-br from-gold via-ember to-red"><img src={restaurantConfig.logo} alt={`شعار ${restaurantConfig.arabicName}`} className="h-12 w-12 rounded-[15px] bg-black/70 object-contain p-1.5 sm:h-14 sm:w-14" /></div>
          <div><p className="font-display text-lg text-ivory">{restaurantConfig.arabicName}</p><p className="text-[10px] text-gold">كربلاء • شاورما على أصولها</p></div>
        </div>

        <span className="badge-appetite inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold shadow-lg backdrop-blur-xl"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-accent" /> اليوم شنو نفسك؟ خلّيها علينا.</span>

        <h1 className="mt-5 font-display text-[15vw] leading-[.88] tracking-tight text-ivory sm:text-6xl md:text-[5.8rem] lg:text-[7.2rem]">معلم<br/><span className="text-gold-gradient">الشاورما.</span></h1>
        <p className="mt-6 max-w-lg text-sm leading-7 text-ivory-dim sm:text-base sm:leading-8">دجاج ولحم متحمّر، خبز طازج، صوصات موزونة، وطلب يوصل مرتب مثل ما اخترته.</p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button onClick={handleOrder} className="cta-food min-h-12 rounded-xl px-7 font-display text-base shadow-2xl sm:px-9 sm:text-lg appetite-pulse">{totalItems > 0 ? `افتح السلة (${totalItems})` : "اطلب هسه"}</button>
          <a href="#menu" className="min-h-12 rounded-xl border border-white/15 bg-black/25 px-7 py-3 text-sm font-bold text-ivory backdrop-blur-md transition hover:border-red-accent/40 hover:bg-red/10">شوف القائمة</a>
        </div>

        <div className="mt-8 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
          {highlights.map(({icon:Icon,title,text})=><div key={title} className="rounded-xl border border-gold/10 bg-black/35 p-3 backdrop-blur-md transition hover:-translate-y-1 hover:border-red-accent/25 hover:bg-red-dark/35"><Icon className="mb-2 text-gold" size={15}/><p className="text-[11px] font-bold text-ivory">{title}</p><p className="mt-0.5 text-[9px] text-ivory-mute">{text}</p></div>)}
        </div>
      </div>
    </motion.div>

    <a href="#menu" aria-label="انزل للقائمة" className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-gold/10 bg-black/30 px-4 py-2 text-[10px] text-ivory-mute backdrop-blur-md sm:flex"><FiArrowDown size={13}/> شوف القائمة</a>
  </section>;
}
