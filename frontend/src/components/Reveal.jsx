import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

export const Reveal = ({ children, delay = 0, className = '', y = 28 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.9, delay, ease: EASE }}
  >
    {children}
  </motion.div>
);

export const MaskedLine = ({ children, delay = 0, className = '' }) => (
  <span className={`block overflow-hidden ${className}`}>
    <motion.span
      className="block"
      initial={{ y: '110%' }}
      animate={{ y: 0 }}
      transition={{ duration: 1, delay, ease: EASE }}
    >
      {children}
    </motion.span>
  </span>
);

export const SectionHeading = ({ index, eyebrow, title, action }) => (
  <Reveal className="mb-10 flex items-end justify-between gap-6 md:mb-14">
    <div>
      <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
        {index && <span className="text-ink">{index}</span>}
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-4xl font-medium tracking-tight md:text-6xl">{title}</h2>
    </div>
    {action}
  </Reveal>
);
