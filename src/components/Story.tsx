import RevealSection from "./RevealSection";

export default function Story() {
  return (
    <section id="story" className="relative overflow-hidden bg-bg py-20 md:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 md:grid-cols-2 md:px-10">
        <RevealSection className="order-2 md:order-1">
          <span className="text-xs uppercase tracking-[0.2em] text-gold-muted">قصتنا</span>
          <h2 className="mt-4 font-display text-4xl leading-[1.15] text-ivory sm:text-5xl">
            من حب الشاورما...
            <br />
            لصارت قصة كاملة.
          </h2>

          <div className="mt-8 space-y-5 text-base leading-8 text-ivory-dim">
            <p>بدينا بحب بسيط لطعم الشاورما الأصيلة. اليوم "المعلم" صارت طريقتنا الي نشتغل بيها كل يوم.</p>
            <p>نطبخ بروح الكرم العراقي، ونسويلك طلبك بسرعة تناسب وكتك.</p>
          </div>

          <div className="divider-gold mt-10 w-24" />
          <p className="mt-6 font-display text-lg text-ivory">كل لقمة، حكاية نار وصبر.</p>
        </RevealSection>

        <RevealSection delay={150} className="order-1 md:order-2">
          <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl">
            <img
              src="/images/story/craft-hands.jpg"
              alt="تقطيع الشاورما بحرفية داخل مطبخ معلم الشاورما"
              loading="lazy"
              className="h-[480px] w-full object-cover transition-transform duration-[1600ms] ease-out hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
