import { useState } from "react";
import { menuData, allPopularItems } from "../data/menuData";
import RevealSection from "./RevealSection";
import MenuCategoryTabs from "./MenuCategoryTabs";
import MenuItem from "./MenuItem";
import { AnimatePresence, motion } from "framer-motion";

export default function MenuSection() {
  const [activeId, setActiveId] = useState(menuData[0].id);
  const active = menuData.find((c) => c.id === activeId)!;

  return (
    <section id="menu" className="relative bg-bg py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <RevealSection className="max-w-xl">
          <span className="text-xs uppercase tracking-[0.2em] text-gold-muted">Menu</span>
          <h2 className="mt-4 font-display text-4xl text-ivory sm:text-5xl">اختار نكهتك</h2>
          <p className="mt-3 text-ivory-mute">كل الأسعار بالدينار العراقي</p>
        </RevealSection>

        {allPopularItems.length > 0 && (
          <RevealSection delay={80} className="mt-12">
            <p className="mb-4 text-sm font-bold text-gold">الأكثر طلباً</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {allPopularItems.slice(0, 3).map((item) => (
                <MenuItem key={item.id} item={item} featured />
              ))}
            </div>
          </RevealSection>
        )}
      </div>

      <div className="mt-14">
        <div className="mx-auto max-w-6xl px-6">
          <MenuCategoryTabs categories={menuData} activeId={activeId} onChange={setActiveId} />
        </div>

        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="pt-8"
            >
              <p className="text-sm text-ivory-mute">{active.subtitle}</p>

              <div className="mt-6 grid gap-x-10 md:grid-cols-2">
                {active.items.map((item) => (
                  <MenuItem key={item.id} item={item} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
