import { useState } from "react";
import { menuData, allPopularItems } from "../data/menuData";
import RevealSection from "./RevealSection";
import MenuCategoryTabs from "./MenuCategoryTabs";
import MenuItem from "./MenuItem";
import { AnimatePresence, motion } from "framer-motion";

export default function MenuSection() {
  const [activeId, setActiveId] = useState(menuData[0].id);
  const active = menuData.find(c => c.id === activeId)!;
  return <section id="menu" className="relative overflow-hidden bg-bg py-20 md:py-28">
    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-red/5 to-transparent pointer-events-none"/>
    <div className="mx-auto max-w-6xl px-5 md:px-10">
      <RevealSection className="max-w-2xl">
        <div className="flex items-center gap-3"><span className="h-px w-8 bg-gold"/><span className="text-xs font-bold tracking-[.18em] text-gold">MENU</span></div>
        <h2 className="mt-3 font-display text-4xl leading-tight text-ivory sm:text-5xl">اختار شاورمتك</h2>
        <p className="mt-3 max-w-lg text-sm leading-7 text-ivory-mute">نكهة عراقية على أصولها. اختار وجبتك، عدّل الكمية، وخلي الباقي علينا.</p>
      </RevealSection>
      {allPopularItems.length>0&&<RevealSection delay={80} className="mt-9"><div className="mb-4 flex items-end justify-between"><div><p className="text-sm font-bold text-ivory">الأكثر طلباً</p><p className="mt-1 text-xs text-ivory-mute">الاختيارات اللي يرجعولها الزباين</p></div></div><div className="grid gap-3 sm:grid-cols-3">{allPopularItems.slice(0,3).map(item=><MenuItem key={item.id} item={item} featured/>)}</div></RevealSection>}
    </div>
    <div className="mx-auto mt-12 max-w-6xl px-5 md:px-10"><div className="rounded-2xl border border-white/7 bg-surface/60 p-2 backdrop-blur-sm"><MenuCategoryTabs categories={menuData} activeId={activeId} onChange={setActiveId}/></div></div>
    <div className="mx-auto max-w-6xl px-5 md:px-10"><AnimatePresence mode="wait"><motion.div key={activeId} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.25}} className="pt-6"><div className="mb-4 flex items-center justify-between"><p className="text-xs text-ivory-mute">{active.subtitle}</p><span className="rounded-full bg-gold/5 px-3 py-1 text-[10px] text-gold">{active.items.length} أصناف</span></div><div className="grid gap-3 md:grid-cols-2">{active.items.map(item=><MenuItem key={item.id} item={item}/>)}</div></motion.div></AnimatePresence></div>
  </section>;
}
