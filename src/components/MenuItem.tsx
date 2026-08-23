import type { MenuItem as MenuItemType } from "../data/menuData";
import { useOrder } from "../context/OrderContext";

export default function MenuItem({ item, featured = false }: { item: MenuItemType; featured?: boolean }) {
  const { addItem, lastAddedId } = useOrder();
  const handleAdd = (variantId?: string, variantLabel?: string, variantPrice?: number) => {
    const id = variantId || item.id;
    const name = variantLabel ? `${item.name} (${variantLabel})` : item.name;
    const price = variantPrice ?? item.price;
    addItem({ id, name, price, image: item.image });
  };
  const hasVariants = !!item.variants?.length;
  const isActive = lastAddedId === item.id || (item.variants?.some(v => lastAddedId === v.id) ?? false);

  return <article className={`food-card group rounded-2xl p-3 sm:p-4 ${featured ? "ring-1 ring-gold/10" : ""}`}>
    <div className="flex gap-3 sm:gap-4">
      {item.image && <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-black/20 sm:h-28 sm:w-28"><img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent"/></div>}
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <div className="flex flex-wrap items-start gap-1.5">
            <h4 className="font-display text-base leading-6 text-ivory transition-colors group-hover:text-gold sm:text-lg">{item.name}</h4>
            {item.popular && <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[9px] font-bold text-gold">الأكثر طلباً</span>}
            {item.tag && <span className="rounded-full bg-red/10 px-2 py-0.5 text-[9px] text-red-accent">{item.tag}</span>}
          </div>
          {item.desc && <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-ivory-mute sm:text-xs">{item.desc}</p>}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="numeric whitespace-nowrap font-display text-base text-gold sm:text-lg">{item.price.toLocaleString("en-US")} <span className="text-[10px] font-body text-ivory-mute">د.ع</span></p>
          {hasVariants ? <div className="flex overflow-hidden rounded-xl border border-white/10 bg-black/10">{item.variants!.map((v,i)=><button key={v.id} onClick={()=>handleAdd(v.id,v.label,v.price)} className={`min-h-9 px-2.5 text-[10px] transition ${lastAddedId===v.id?"bg-gold font-bold text-bg":"text-ivory-dim hover:bg-gold/10 hover:text-gold"} ${i>0?"border-s border-white/10":""}`}>{lastAddedId===v.id?"✓ تمت":"+ "+v.label}</button>)}</div> : <button onClick={()=>handleAdd()} aria-label={`أضف ${item.name} للطلب`} className={`flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition active:scale-95 ${isActive?"bg-gold text-bg":"border border-gold-muted/50 bg-gold/5 text-gold hover:bg-gold hover:text-bg"}`}>{isActive?"✓ تمت":"+ أضف"}</button>}
        </div>
      </div>
    </div>
  </article>;
}
