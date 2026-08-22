import { featuredDishes } from "../data/menuData";
import RevealSection from "./RevealSection";
import { useOrder } from "../context/OrderContext";

export default function FeaturedDishes() {
  const { addItem, lastAddedId } = useOrder();

  return (
    <section id="signature" className="relative bg-bg py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <RevealSection className="max-w-xl">
          <span className="text-xs uppercase tracking-[0.2em] text-gold-muted">Signature</span>
          <h2 className="mt-4 font-display text-4xl text-ivory sm:text-5xl">أطباقنا المميزة</h2>
        </RevealSection>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {featuredDishes.map((dish, i) => {
            const isLarge = dish.size === "large";
            return (
              <RevealSection
                key={dish.id}
                delay={i * 100}
                className={`group relative overflow-hidden rounded-2xl bg-surface ${
                  isLarge ? "md:row-span-1" : ""
                }`}
              >
                <div className={`relative ${isLarge ? "aspect-[4/3]" : "aspect-[16/10]"} overflow-hidden`}>
                  <img
                    src={dish.image}
                    alt={dish.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {dish.badge && (
                    <span className="absolute right-4 top-4 rounded-full border border-gold-muted/40 bg-black/50 px-3 py-1 text-[11px] text-ivory-dim backdrop-blur">
                      {dish.badge}
                    </span>
                  )}

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
                    <div className="min-w-0">
                      <h3 className="font-display text-2xl text-ivory sm:text-3xl">{dish.name}</h3>
                      <p className="mt-1.5 max-w-xs text-sm leading-6 text-ivory-dim">{dish.tagline}</p>
                      <p className="numeric mt-3 font-display text-xl text-gold">
                        {dish.price.toLocaleString("en-US")} <span className="text-xs text-ivory-mute">د.ع</span>
                      </p>
                    </div>
                    <button
                      onClick={() => addItem({ id: dish.id, name: dish.name, price: dish.price, image: dish.image })}
                      className={`shrink-0 rounded-full border border-gold-muted/50 px-5 py-2.5 text-sm font-bold text-ivory transition-all duration-200 hover:-translate-y-0.5 ${
                        lastAddedId === dish.id ? "bg-gold text-bg" : "bg-white/10 backdrop-blur hover:bg-white/20"
                      }`}
                    >
                      {lastAddedId === dish.id ? "زادت ✓" : "زيدها للطلب"}
                    </button>
                  </div>
                </div>
              </RevealSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
