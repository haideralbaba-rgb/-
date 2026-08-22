import { motion } from "framer-motion";
import RevealSection from "./RevealSection";

export default function BrandStatement() {
  return (
    <section id="brand" className="relative overflow-hidden bg-bg-secondary py-24 md:py-36">
      <div className="pattern-babylon absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-4xl px-6 text-center md:px-10">
        <RevealSection>
          <p className="font-display text-3xl text-ivory-mute sm:text-4xl">مو مجرد شاورما.</p>
        </RevealSection>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          transition={{ staggerChildren: 0.15, delayChildren: 0.1 }}
          className="mt-8 font-display text-4xl leading-tight text-ivory sm:text-5xl md:text-6xl"
        >
          {["نختار المكونات.", "نضبط النار.", "نترك الطعم يحكي."].map((line) => (
            <motion.p
              key={line}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="text-gold-gradient"
            >
              {line}
            </motion.p>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
