import type { MenuCategory } from "../data/menuData";

export default function MenuCategoryTabs({
  categories,
  activeId,
  onChange,
}: {
  categories: MenuCategory[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="sticky top-[64px] z-30 -mx-6 border-y border-white/[0.06] bg-bg/95 px-6 py-3 backdrop-blur-md md:top-[72px]">
      <div className="scrollbar-none flex gap-2 overflow-x-auto md:justify-center" style={{ scrollbarWidth: "none" }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            aria-current={activeId === cat.id}
            className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
              activeId === cat.id
                ? "border-gold bg-gold text-bg font-bold"
                : "border-white/15 text-ivory-dim hover:border-white/30 hover:text-ivory"
            }`}
          >
            {cat.title}
          </button>
        ))}
      </div>
    </div>
  );
}
