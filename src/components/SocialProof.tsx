import RevealSection from "./RevealSection";
import { restaurantConfig } from "../data/restaurantConfig";
import { FiStar } from "react-icons/fi";

export default function SocialProof() {
  if (!restaurantConfig.hasReviews || restaurantConfig.reviews.length === 0) return null;

  return (
    <section className="relative bg-bg-secondary py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <RevealSection className="max-w-xl">
          <span className="text-xs uppercase tracking-[0.2em] text-gold-muted">Reviews</span>
          <h2 className="mt-4 font-display text-4xl text-ivory sm:text-5xl">الطعم يحكي عن نفسه.</h2>
        </RevealSection>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {restaurantConfig.reviews.map((r, i) => (
            <RevealSection
              key={r.name}
              delay={i * 100}
              className="rounded-2xl border border-white/[0.07] bg-surface p-6"
            >
              <div className="flex gap-1 text-gold">
                {[...Array(5)].map((_, s) => (
                  <FiStar key={s} fill={s < r.rating ? "currentColor" : "none"} size={14} />
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-ivory-dim">{r.text}</p>
              <p className="mt-5 font-display text-ivory">{r.name}</p>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}
