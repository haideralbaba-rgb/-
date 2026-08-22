import { useEffect, useState } from "react";
import { FiMenu, FiShoppingBag, FiUser, FiX } from "react-icons/fi";
import { useOrder } from "../context/OrderContext";
import { useAuth } from "../context/AuthContext";
import { restaurantConfig } from "../data/restaurantConfig";

const links = [
  { href: "#home", label: "الرئيسية" },
  { href: "#story", label: "قصتنا" },
  { href: "#signature", label: "الأطباق" },
  { href: "#menu", label: "القائمة" },
  { href: "#gallery", label: "الأجواء" },
  { href: "#location", label: "تواصل معنا" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { totalItems, openCart } = useOrder();
  const { user, profile, setShowLogin, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handlePrimaryCta = () => {
    if (totalItems > 0) openCart();
    else document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "border-b border-white/[0.06] bg-bg/90 py-2.5 shadow-lg shadow-black/40 backdrop-blur-xl" : "border-b border-transparent bg-gradient-to-b from-black/40 to-transparent py-4"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 md:px-8">
        {/* Logo */}
        <a href="#home" className="flex shrink-0 items-center gap-2.5">
          <img src={restaurantConfig.logo} alt={`شعار ${restaurantConfig.arabicName}`} className="h-10 w-10 rounded-full border border-gold-muted/40 bg-surface object-contain p-1" />
          <p className="font-display text-lg text-ivory">{restaurantConfig.arabicName}</p>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="relative text-sm text-ivory-dim transition-colors duration-200 hover:text-ivory after:absolute after:-bottom-1.5 after:right-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full">{l.label}</a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {/* Login / User */}
          {user ? (
            <div className="relative hidden sm:block">
              <button onClick={() => setUserMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-ivory-dim transition hover:border-white/20 hover:text-ivory" aria-label="حسابي">
                <FiUser size={15} />
                <span className="max-w-[80px] truncate">{profile?.name || "حسابي"}</span>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute left-0 top-full z-50 mt-2 w-44 rounded-xl border border-white/10 bg-surface-hi p-2 shadow-xl shadow-black/40">
                    <button onClick={() => { setUserMenuOpen(false); signOut(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-ivory-dim transition hover:bg-white/5 hover:text-ivory">تسجيل الخروج</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button onClick={() => setShowLogin(true)} className="hidden items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-sm text-ivory-dim transition hover:border-white/20 hover:text-ivory sm:flex" aria-label="تسجيل الدخول">
              <FiUser size={14} />
              تسجيل الدخول
            </button>
          )}

          {/* Cart CTA */}
          <button onClick={handlePrimaryCta} className="group relative hidden items-center gap-2 rounded-full border border-gold-muted/50 bg-red px-5 py-2.5 text-sm font-bold text-ivory shadow-md shadow-black/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-deep/40 sm:flex">
            {totalItems > 0 ? (
              <>
                <FiShoppingBag size={15} />
                <span>السلة</span>
                <span className="numeric grid h-5 w-5 place-items-center rounded-full bg-ivory text-[11px] font-black text-bg">{totalItems}</span>
              </>
            ) : (
              "اطلب هسه"
            )}
          </button>

          {/* Mobile menu toggle */}
          <button onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={menuOpen} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-ivory lg:hidden">
            {menuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-40 bg-bg/98 backdrop-blur-xl transition-all duration-500 lg:hidden ${menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} style={{ top: 0 }}>
        <div className="flex h-full flex-col px-8 pb-10 pt-28">
          <nav className="flex flex-1 flex-col justify-center gap-7">
            {links.map((l, i) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} style={{ transitionDelay: menuOpen ? `${i * 60}ms` : "0ms" }} className={`font-display text-3xl text-ivory transition-all duration-500 ${menuOpen ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"}`}>{l.label}</a>
            ))}
          </nav>

          <div className="flex flex-col gap-3">
            {user ? (
              <button onClick={() => { setMenuOpen(false); signOut(); }} className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 py-3 text-ivory-dim">
                <FiUser size={15} /> تسجيل الخروج
              </button>
            ) : (
              <button onClick={() => { setMenuOpen(false); setShowLogin(true); }} className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 py-3 text-ivory-dim">
                <FiUser size={15} /> تسجيل الدخول
              </button>
            )}
            <button onClick={() => { setMenuOpen(false); handlePrimaryCta(); }} className="flex w-full items-center justify-center gap-2 rounded-full border border-gold-muted/50 bg-red py-4 text-lg font-bold text-ivory">
              {totalItems > 0 ? `السلة (${totalItems})` : "اطلب هسه"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
