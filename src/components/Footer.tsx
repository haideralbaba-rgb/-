import { FiFacebook, FiInstagram } from "react-icons/fi";
import { restaurantConfig } from "../data/restaurantConfig";

const links = [
  { href: "#home", label: "الرئيسية" },
  { href: "#story", label: "قصتنا" },
  { href: "#menu", label: "القائمة" },
  { href: "#location", label: "تواصل معنا" },
];

export default function Footer() {
  const socials = [
    restaurantConfig.instagram ? { icon: FiInstagram, url: restaurantConfig.instagram, label: "انستغرام" } : null,
    restaurantConfig.facebook ? { icon: FiFacebook, url: restaurantConfig.facebook, label: "فيسبوك" } : null,
  ].filter(Boolean) as { icon: typeof FiInstagram; url: string; label: string }[];

  return (
    <footer className="relative border-t border-white/[0.06] bg-bg-secondary pb-10 pt-16">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <img
                src={restaurantConfig.logo}
                alt={`شعار ${restaurantConfig.arabicName}`}
                className="h-11 w-11 rounded-full border border-gold-muted/40 bg-surface object-contain p-1"
              />
              <p className="font-display text-xl text-ivory">{restaurantConfig.arabicName}</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-ivory-mute">{restaurantConfig.tagline}</p>

            {socials.length > 0 && (
              <div className="mt-5 flex gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-ivory-dim transition hover:border-gold-muted/40 hover:text-gold"
                  >
                    <s.icon size={16} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-ivory-dim transition hover:text-ivory">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="text-sm text-ivory-mute">
            {restaurantConfig.phone && (
              <p dir="ltr" className="numeric">
                {restaurantConfig.phone}
              </p>
            )}
            {restaurantConfig.openingHours && <p className="mt-2">{restaurantConfig.openingHours}</p>}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-ivory-mute sm:flex-row">
          <p>© {new Date().getFullYear()} {restaurantConfig.arabicName}</p>
        </div>
      </div>
    </footer>
  );
}
