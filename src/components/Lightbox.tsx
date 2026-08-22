import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";

export default function Lightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: { src: string; alt: string }[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((index + 1) % images.length);
      if (e.key === "ArrowLeft") onNavigate((index - 1 + images.length) % images.length);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [index, images.length, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {index !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          onClick={onClose}
        >
          <button
            aria-label="إغلاق"
            onClick={onClose}
            className="absolute left-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-white/20 text-ivory transition hover:bg-white/10"
          >
            <FiX size={18} />
          </button>

          <button
            aria-label="السابق"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index - 1 + images.length) % images.length);
            }}
            className="absolute right-4 grid h-11 w-11 place-items-center rounded-full border border-white/20 text-ivory transition hover:bg-white/10 sm:right-8"
          >
            <FiChevronRight size={20} />
          </button>

          <motion.img
            key={index}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            src={images[index].src}
            alt={images[index].alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
          />

          <button
            aria-label="التالي"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index + 1) % images.length);
            }}
            className="absolute left-4 grid h-11 w-11 place-items-center rounded-full border border-white/20 text-ivory transition hover:bg-white/10 sm:left-8"
          >
            <FiChevronLeft size={20} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
