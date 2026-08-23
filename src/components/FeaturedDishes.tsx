import { featuredDishes } from "../data/menuData";
import RevealSection from "./RevealSection";
import { useOrder } from "../context/OrderContext";

export default function FeaturedDishes() {
  const { addItem, lastAddedId } = useOrder();
  return <section id="signature" className="relative bg-bg py-20 md:py-32">
    <div className="mx-auto max-w-7xl px-5 md:px-10">
      <RevealSection className="max-w-2xl">
        <div className="flex items-center gap-3"><span className="h-px w-10 bg-red-accent"/><span className="text-xs font-bold tracking-[.18em] text-red-accent">SIGNATURE</span></div>
        <h2 className="mt-4 font-display text-4xl leading-tight text-ivory sm:text-5xl">الأطباق اللي <span className="text-appetite-gradient">تفتح النفس.</span></h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-ivory-mute">اختياراتنا الأقوى — متحمّرة، طازجة، ومجهزة حتى توصل لطلبك بأفضل شكل.</p>
      </RevealSection>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {featuredDishes.map((dish,i)=>{
          const isLarge=dish.size==="large";
          return <RevealSection key={dish.id} delay={i*100} className={`group relative overflow-hidden rounded-[1.4rem] bg-surface ${isLarge?"md:row-span-1":""}`}>
            <div className={`relative ${isLarge?"aspect-[4/3]":"aspect-[16/10]"} overflow-hidden`}>
              <img src={dish.image} alt={dish.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent"/>
              <div className="absolute right-4 top-4 flex items-center gap-2">
                {dish.badge&&<span className="badge-appetite rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur">{dish.badge}</span>}
                <span className="badge-gold rounded-full px-3 py-1 text-[10px] font-bold backdrop-blur">الأكثر طلباً</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl text-ivory sm:text-3xl">{dish.name}</h3>
                    <p className="mt-1.5 max-w-sm text-sm leading-6 text-ivory-dim">{dish.tagline}</p>
                    <p className="price-appetite numeric mt-3 font-display text-xl">{dish.price.toLocaleString("en-US")} <span className="text-xs text-ivory-mute">د.ع</span></p>
                  </div>
                  <button onClick={()=>addItem({id:dish.id,name:dish.name,price:dish.price,image:dish.image})} className={`shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 ${lastAddedId===dish.id?"bg-gold text-bg":"cta-red"}`}>{lastAddedId===dish.id?"تمت الإضافة ✓":"زيدها للطلب"}</button>
                </div>
              </div>
            </div>
          </RevealSection>;
        })}
      </div>
    </div>
  </section>;
}
