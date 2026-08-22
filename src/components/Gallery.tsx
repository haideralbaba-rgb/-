import { useState } from "react";
import RevealSection from "./RevealSection";
import Lightbox from "./Lightbox";

const images = [
  { src: "/images/shawarma-meat.jpg", alt: "شاورما لحم تُقطّع طازجة", span: "sm:row-span-2 sm:col-span-2" },
  { src: "/images/story/craft-hands.jpg", alt: "تحضير الشاورما بحرفية", span: "" },
  { src: "/images/food/ingredients-macro.jpg", alt: "مكونات طازجة", span: "" },
  { src: "/images/broasted-chicken.jpg", alt: "بروستد مقرمش", span: "sm:col-span-2" },
  { src: "/images/food/plating-macro.jpg", alt: "تقديم الطبق النهائي", span: "" },
  { src: "/images/burger-deluxe.jpg", alt: "برغر المعلم الفاخر", span: "" },
];

export default function Gallery() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="gallery" className="relative bg-bg py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <RevealSection className="max-w-xl">
          <span className="text-xs uppercase tracking-[0.2em] text-gold-muted">Gallery</span>
          <h2 className="mt-4 font-display text-4xl text-ivory sm:text-5xl">عالم المعلم من الداخل</h2>
        </RevealSection>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:auto-rows-[200px] sm:grid-cols-4 md:gap-4">
          {images.map((img, i) => (
            <RevealSection
              key={img.src}
              delay={i * 80}
              className={`group relative overflow-hidden rounded-xl ${img.span}`}
            >
              <button
                onClick={() => setOpenIndex(i)}
                className="block h-full w-full text-right"
                aria-label={`عرض صورة: ${img.alt}`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="h-full min-h-[140px] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
              </button>
            </RevealSection>
          ))}
        </div>
      </div>

      <Lightbox images={images} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
    </section>
  );
}
