import { AnimatePresence, motion } from "framer-motion";
import { FiShoppingBag } from "react-icons/fi";
import { useOrder } from "../context/OrderContext";

export default function CartBar() {
  const { items, totalItems, totalPrice, isCartOpen, openCart } = useOrder();

  return (
    <AnimatePresence>
      {items.length > 0 && !isCartOpen && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="safe-bottom fixed inset-x-0 bottom-0 z-40 px-4 pb-4 lg:hidden"
        >
          <button
            onClick={openCart}
            className="flex w-full items-center justify-between rounded-2xl border border-gold-muted/40 bg-surface-hi/95 px-5 py-4 shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
            <span className="flex items-center gap-3">
              <span className="relative grid h-9 w-9 place-items-center rounded-full bg-red">
                <FiShoppingBag size={16} className="text-ivory" />
                <span className="numeric absolute -left-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gold text-[10px] font-black text-bg">
                  {totalItems}
                </span>
              </span>
              <span className="text-sm font-bold text-ivory">السلة — {totalItems} منتج</span>
            </span>
            <span className="numeric font-display text-lg text-gold">
              {totalPrice.toLocaleString("en-US")} <span className="text-xs text-ivory-mute">د.ع</span>
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
