import { useState } from "react";
import type { MenuItem as MenuItemType } from "../data/menuData";
import { useOrder } from "../context/OrderContext";

export default function MenuItem({ item, featured = false }: { item: MenuItemType; featured?: boolean }) {
  const { addItem, lastAddedId } = useOrder();
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (variantId?: string, variantLabel?: string, variantPrice?: number) => {
    const id = variantId || item.id;
    const name = variantLabel ? `${item.name} (${variantLabel})` : item.name;
    const price = variantPrice ?? item.price;
    addItem({ id, name, price });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 900);
  };

  const isActive = justAdded || lastAddedId === item.id || (item.variants?.some((v) => lastAddedId === v.id) ?? false);
  const hasVariants = item.variants && item.variants.length > 0;

  return (
    <div
      className={`group flex items-center justify-between gap-4 py-4 transition-colors duration-200 ${
        featured
          ? "rounded-xl border border-gold-muted/25 bg-surface px-4"
          : "border-b border-white/[0.07] hover:border-gold-muted/30"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="truncate font-display text-lg text-ivory transition-colors duration-200 group-hover:text-gold sm:text-xl">
            {item.name}
          </h4>
          {item.tag && (
            <span className="shrink-0 rounded-full bg-red-deep/40 px-2 py-0.5 text-[10px] text-ivory-dim">
              {item.tag}
            </span>
          )}
          {item.popular && (
            <span className="shrink-0 rounded-full border border-gold-muted/40 px-2 py-0.5 text-[10px] text-gold">
              الأكثر طلباً
            </span>
          )}
        </div>
        {item.desc && <p className="mt-1 text-xs leading-5 text-ivory-mute">{item.desc}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <p className="numeric font-display text-lg text-gold">
          {item.price.toLocaleString("en-US")}
          <span className="mr-1 text-xs text-ivory-mute">د.ع</span>
        </p>

        {hasVariants ? (
          <div className="flex overflow-hidden rounded-full border border-white/15">
            {item.variants!.map((v, i) => (
              <button
                key={v.id}
                onClick={() => handleAdd(v.id, v.label, v.price)}
                aria-label={`أضف ${item.name} ${v.label}`}
                className={`px-3 py-2 text-xs transition-colors hover:bg-white/10 ${
                  lastAddedId === v.id ? "bg-gold text-bg font-bold" : "text-ivory-dim"
                } ${i > 0 ? "border-s border-white/15" : ""}`}
              >
                {lastAddedId === v.id ? "✓" : v.label}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => handleAdd()}
            aria-label={`أضف ${item.name} للطلب`}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold-muted/40 text-lg transition-all duration-200 active:scale-90 ${
              isActive ? "bg-gold text-bg" : "text-ivory hover:bg-white/10"
            }`}
          >
            {isActive ? "✓" : "+"}
          </button>
        )}
      </div>
    </div>
  );
}
