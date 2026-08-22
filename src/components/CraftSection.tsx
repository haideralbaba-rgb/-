import RevealSection from "./RevealSection";

const steps = [
  {
    n: "01",
    title: "اختيار المكونات",
    text: "لحم ودجاج طازة، خضار نقطعها يومي. ما نساوم على النوعية.",
    image: "/images/food/ingredients-macro.jpg",
  },
  {
    n: "02",
    title: "التتبيلة",
    text: "تتبيلة المعلم الخاصة تندخل باللحم ساعات گبل ما نشويه.",
    image: "/images/shawarma-meat.jpg",
  },
  {
    n: "03",
    title: "النار",
    text: "شي بطيء على نار مضبوطة، يعطينا القرمشة والنكهة الأصيلة.",
    image: "/images/about-texture.jpg",
  },
  {
    n: "04",
    title: "التقديم",
    text: "يوصلك طازة وحار، جاهز لأول لقمة.",
    image: "/images/food/plating-macro.jpg",
  },
];

export default function CraftSection() {
  return (
    <section className="relative bg-bg-secondary py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <RevealSection className="max-w-xl">
          <span className="text-xs uppercase tracking-[0.2em] text-gold-muted">The Craft</span>
          <h2 className="mt-4 font-display text-4xl text-ivory sm:text-5xl">السر بالتفاصيل.</h2>
        </RevealSection>

        <div className="mt-16 grid gap-10 md:grid-cols-2 lg:gap-x-14 lg:gap-y-20">
          {steps.map((step, i) => (
            <RevealSection key={step.n} delay={i * 120} className="group">
              <div className="relative overflow-hidden rounded-2xl">
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={step.image}
                    alt={step.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-105"
                  />
                </div>
                <span className="absolute -top-2 right-4 font-display text-7xl text-bg [-webkit-text-stroke:1.5px_rgba(212,165,55,0.6)] sm:text-8xl">
                  {step.n}
                </span>
              </div>
              <h3 className="mt-5 font-display text-2xl text-ivory">{step.title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-7 text-ivory-dim">{step.text}</p>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}
