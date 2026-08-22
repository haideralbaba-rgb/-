import RevealSection from "./RevealSection";
import { restaurantConfig } from "../data/restaurantConfig";
import { FiClock, FiMapPin, FiNavigation, FiPhone, FiTruck } from "react-icons/fi";

export default function LocationSection() {
  const hasBranches = restaurantConfig.branches.length > 0;
  const hasAnyContactInfo =
    restaurantConfig.address || restaurantConfig.phone || restaurantConfig.openingHours || restaurantConfig.googleMapsUrl;

  return (
    <section id="location" className="relative overflow-hidden bg-bg-secondary py-20 md:py-32">
      <div className="pattern-babylon absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-6xl px-6 md:px-10">
        <RevealSection className="max-w-xl">
          <span className="text-xs uppercase tracking-[0.2em] text-gold-muted">Visit Us</span>
          <h2 className="mt-4 font-display text-4xl text-ivory sm:text-5xl">تعال علينا.</h2>
        </RevealSection>

        {hasBranches ? (
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {restaurantConfig.branches.map((branch) => (
              <RevealSection key={branch.name} className="rounded-2xl border border-white/[0.08] bg-surface p-6">
                <h3 className="font-display text-xl text-ivory">{branch.name}</h3>
                <p className="mt-3 flex items-start gap-2 text-sm text-ivory-dim">
                  <FiMapPin className="mt-0.5 shrink-0 text-gold" /> {branch.address}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-ivory-dim">
                  <FiClock className="shrink-0 text-gold" /> {branch.hours}
                </p>
                {branch.mapsUrl && (
                  <a
                    href={branch.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold-muted/40 px-4 py-2 text-sm text-ivory transition hover:bg-white/5"
                  >
                    <FiNavigation size={14} /> افتح الموقع
                  </a>
                )}
              </RevealSection>
            ))}
          </div>
        ) : hasAnyContactInfo ? (
          <RevealSection className="mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
            {restaurantConfig.address && (
              <div className="rounded-2xl border border-white/[0.08] bg-surface p-6">
                <FiMapPin className="text-xl text-gold" />
                <p className="mt-3 font-display text-lg text-ivory">العنوان</p>
                <p className="mt-1 text-sm text-ivory-dim">{restaurantConfig.address}</p>
              </div>
            )}
            {restaurantConfig.openingHours && (
              <div className="rounded-2xl border border-white/[0.08] bg-surface p-6">
                <FiClock className="text-xl text-gold" />
                <p className="mt-3 font-display text-lg text-ivory">الدوام</p>
                <p className="mt-1 text-sm text-ivory-dim">{restaurantConfig.openingHours}</p>
              </div>
            )}
            {restaurantConfig.phone && (
              <a
                href={`tel:${restaurantConfig.phone}`}
                className="rounded-2xl border border-white/[0.08] bg-surface p-6 transition hover:border-gold-muted/40"
              >
                <FiPhone className="text-xl text-gold" />
                <p className="mt-3 font-display text-lg text-ivory">اتصل بنا</p>
                <p dir="ltr" className="numeric mt-1 text-sm text-ivory-dim">
                  {restaurantConfig.phone}
                </p>
              </a>
            )}
            {restaurantConfig.googleMapsUrl && (
              <a
                href={restaurantConfig.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/[0.08] bg-surface p-6 transition hover:border-gold-muted/40"
              >
                <FiNavigation className="text-xl text-gold" />
                <p className="mt-3 font-display text-lg text-ivory">الموقع على الخريطة</p>
                <p className="mt-1 text-sm text-ivory-dim">افتح Google Maps</p>
              </a>
            )}
          </RevealSection>
        ) : (
          <RevealSection className="mt-12 max-w-md rounded-2xl border border-white/[0.08] bg-surface p-8 text-ivory-dim">
            معلومات العنوان والدوام هسه تحت التحديث، تابعونا قريب.
          </RevealSection>
        )}

        {restaurantConfig.deliveryAvailable && (
          <RevealSection delay={150} className="mt-14 flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <FiTruck className="mt-1 shrink-0 text-xl text-gold" />
              <div>
                <p className="font-display text-lg text-ivory">وين ما كنت، نوصلك.</p>
                <p className="mt-1 max-w-md text-sm text-ivory-dim">
                  {restaurantConfig.deliveryAreas.length > 0
                    ? `نوصلك لـ: ${restaurantConfig.deliveryAreas.join("، ")}`
                    : "خدمة التوصيل موجودة — خابرنا تعرف المناطق والوقت المتوقع."}
                </p>
              </div>
            </div>
          </RevealSection>
        )}
      </div>
    </section>
  );
}
