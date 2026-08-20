import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { MaskedLine, Reveal, SectionHeading } from '@/components/Reveal';
import { EditorialMarquee } from '@/components/EditorialMarquee';
import { ProductCard } from '@/components/ProductCard';
import { byTag } from '@/data/products';

const IntroCurtain = ({ onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 1900);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div data-testid="intro-curtain" className="fixed inset-0 z-[100] flex items-center justify-center bg-ink"
      exit={{ y: '-100%' }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
      <div className="overflow-hidden">
        <motion.p className="text-2xl font-extrabold uppercase tracking-[0.6em] text-white md:text-4xl"
          initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
          EasyBuy
        </motion.p>
      </div>
      <motion.div className="absolute bottom-10 h-px bg-white/30" initial={{ width: 0 }} animate={{ width: 120 }} transition={{ duration: 1.4, ease: 'easeInOut' }} />
    </motion.div>
  );
};

const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} data-testid="hero-section" className="relative overflow-hidden pt-[104px]">
      <div className="mx-auto grid max-w-[1800px] grid-cols-1 items-end gap-10 px-4 pb-10 pt-8 md:px-8 lg:min-h-[calc(100vh-104px)] lg:grid-cols-12 lg:px-12">
        <motion.div style={{ opacity: textOpacity }} className="lg:col-span-7">
          <Reveal delay={0.1}>
            <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-400">
              <span className="h-px w-10 bg-ink" /> SS26 — The Neutral Edit
            </p>
          </Reveal>
          <h1 className="mt-6 font-display text-[17vw] font-medium uppercase leading-[0.9] tracking-tight sm:text-[13vw] lg:text-[8.5vw]">
            <MaskedLine delay={0.2}>Wear</MaskedLine>
            <MaskedLine delay={0.35}><span className="italic font-normal">the</span></MaskedLine>
            <MaskedLine delay={0.5}>Moment</MaskedLine>
          </h1>
          <Reveal delay={0.75} className="mt-8 max-w-md">
            <p className="text-sm leading-relaxed text-neutral-500 md:text-base">
              Elevated essentials for men and women. Clean cuts, honest fabrics, and silhouettes designed to outlast the season.
            </p>
          </Reveal>
          <Reveal delay={0.9} className="mt-10 flex flex-wrap gap-4">
            <Link to="/shop/women" data-testid="hero-shop-women-button"
              className="group flex items-center gap-3 bg-ink px-8 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
              Shop Women <ArrowRight size={15} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link to="/shop/men" data-testid="hero-shop-men-button"
              className="group flex items-center gap-3 border border-ink px-8 py-4 text-xs font-semibold uppercase tracking-[0.25em] transition-colors duration-300 hover:bg-ink hover:text-white">
              Shop Men <ArrowRight size={15} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </motion.div>
        <div className="relative lg:col-span-5">
          <Reveal delay={0.45} y={50}>
            <div className="relative aspect-[3/4] overflow-hidden bg-paper" data-testid="hero-image-frame">
              <motion.img src="/images/hero.jpg" alt="EasyBuy SS26 hero look" style={{ y: imgY, scale: 1.15 }}
                className="h-full w-full object-cover object-[72%_center]" />
            </div>
          </Reveal>
          <Reveal delay={0.8} className="mt-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
            <span>01 — Featured Collection</span>
            <span>Scroll</span>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const CategoryTile = ({ to, img, index, title, testid }) => (
  <Reveal>
    <Link to={to} data-testid={testid} className="group relative block aspect-[4/5] overflow-hidden bg-paper md:aspect-[4/3]">
      <img src={img} alt={title} loading="lazy"
        className="h-full w-full object-cover transition-transform duration-[1200ms] ease-editorial group-hover:scale-[1.06]" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 md:p-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">{index}</p>
          <h3 className="mt-2 font-display text-4xl italic text-white md:text-6xl">{title}</h3>
        </div>
        <span className="flex h-12 w-12 items-center justify-center border border-white/50 text-white transition-all duration-500 group-hover:bg-white group-hover:text-ink">
          <ArrowUpRight size={18} strokeWidth={1.5} />
        </span>
      </div>
    </Link>
  </Reveal>
);

const Manifesto = () => {
  const chapters = [
    { n: '01', title: 'Cut', text: 'Every silhouette starts on the body, not the moodboard. We drape, pin, and refine until the line is exactly right.' },
    { n: '02', title: 'Cloth', text: 'Wool, silk, linen and cashmere from audited mills. Fabric you feel before you see the label.' },
    { n: '03', title: 'Conscience', text: 'Small runs, honest pricing, and pieces designed to be worn hundreds of times — not twice.' },
  ];
  return (
    <section data-testid="manifesto-section" className="bg-ink text-white">
      <div className="mx-auto grid max-w-[1800px] grid-cols-1 gap-12 px-4 py-20 md:grid-cols-2 md:px-8 md:py-32 lg:px-12">
        <div className="md:sticky md:top-32 md:self-start">
          <Reveal>
            <div className="aspect-[4/5] overflow-hidden">
              <img src="/images/editorial.jpg" alt="EasyBuy atelier" loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1400ms] ease-editorial hover:scale-[1.05]" />
            </div>
          </Reveal>
        </div>
        <div>
          <Reveal>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/40">The EasyBuy Manifesto</p>
            <h2 className="mt-4 font-display text-4xl font-medium tracking-tight md:text-6xl">
              Fewer, better <span className="italic font-normal">things.</span>
            </h2>
          </Reveal>
          <div className="mt-12">
            {chapters.map((c, i) => (
              <Reveal key={c.n} delay={i * 0.1} className="border-t border-white/15 py-8 md:py-10">
                <div className="flex gap-6 md:gap-10">
                  <span className="font-display text-2xl italic text-white/40">{c.n}</span>
                  <div>
                    <h3 className="font-display text-3xl italic md:text-4xl">{c.title}</h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">{c.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const PromoBanner = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-12%', '12%']);
  return (
    <section ref={ref} data-testid="promo-banner" className="relative flex h-[70vh] items-center justify-center overflow-hidden">
      <motion.img src="/images/cat-women.jpg" alt="Mid-season edit" style={{ y, scale: 1.25 }}
        className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-ink/35" />
      <div className="relative text-center text-white">
        <MaskedLine delay={0.1}><p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/70">Limited Time</p></MaskedLine>
        <h2 className="mt-4 font-display text-5xl font-medium uppercase tracking-tight md:text-8xl">
          <MaskedLine delay={0.2}>Mid-Season</MaskedLine>
          <MaskedLine delay={0.35}><span className="italic font-normal">edit</span></MaskedLine>
        </h2>
        <Reveal delay={0.5}>
          <p className="mt-4 text-sm tracking-wide text-white/80">Up to 25% off selected icons</p>
          <Link to="/shop/all" data-testid="promo-shop-button"
            className="mt-8 inline-block bg-white px-10 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-ink transition-colors duration-300 hover:bg-ink hover:text-white">
            Shop the Edit
          </Link>
        </Reveal>
      </div>
    </section>
  );
};

const NewArrivalsRail = () => (
  <section data-testid="new-arrivals-section" className="py-20 md:py-28">
    <div className="mx-auto max-w-[1800px] px-4 md:px-8 lg:px-12">
      <SectionHeading index="03" eyebrow="Just Landed" title={<>New <span className="italic font-normal">arrivals</span></>}
        action={<Link to="/shop/all" data-testid="new-arrivals-view-all" className="group hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] md:flex">
          View All <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>} />
    </div>
    <div className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 md:gap-8 md:px-8 lg:px-12">
      {byTag('new').map((p, i) => (
        <div key={p.id} className="w-[240px] shrink-0 snap-start md:w-[320px]">
          <ProductCard product={p} index={i} />
        </div>
      ))}
    </div>
  </section>
);

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const submit = (e) => {
    e.preventDefault();
    toast.success('Welcome to the list — 10% off your first order (demo)');
    setEmail('');
  };
  return (
    <section data-testid="newsletter-section" className="border-t border-line bg-paper">
      <div className="mx-auto max-w-[1800px] px-4 py-20 text-center md:px-8 md:py-32 lg:px-12">
        <Reveal>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-400">The EasyBuy List</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-medium tracking-tight md:text-6xl">
            First looks, private edits, <span className="italic font-normal">no noise.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <form onSubmit={submit} className="mx-auto mt-10 flex max-w-lg border border-ink">
            <input data-testid="newsletter-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address" className="w-full bg-white px-5 py-4 text-sm outline-none" />
            <button data-testid="newsletter-submit-button" type="submit"
              className="shrink-0 bg-ink px-8 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
              Join
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
};

export default function Home() {
  const [introDone, setIntroDone] = useState(false);
  return (
    <>
      <AnimatePresence>{!introDone && <IntroCurtain onDone={() => setIntroDone(true)} />}</AnimatePresence>
      <Hero />
      <EditorialMarquee />
      <section className="mx-auto max-w-[1800px] px-4 py-20 md:px-8 md:py-28 lg:px-12">
        <SectionHeading index="02" eyebrow="Shop By Category" title={<>Choose your <span className="italic font-normal">uniform</span></>} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
          <CategoryTile to="/shop/women" img="/images/cat-women.jpg" index="01 — Women" title="Women" testid="category-women" />
          <CategoryTile to="/shop/men" img="/images/cat-men.jpg" index="02 — Men" title="Men" testid="category-men" />
        </div>
      </section>
      <section data-testid="featured-section" className="mx-auto max-w-[1800px] px-4 pb-20 md:px-8 md:pb-28 lg:px-12">
        <SectionHeading index="" eyebrow="Editor's Selection" title={<>Featured <span className="italic font-normal">pieces</span></>}
          action={<Link to="/shop/all" data-testid="featured-view-all" className="group hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] md:flex">
            View All <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>} />
        <div className="grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:grid-cols-4">
          {byTag('featured').slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>
      <Manifesto />
      <NewArrivalsRail />
      <PromoBanner />
      <section data-testid="trending-section" className="mx-auto max-w-[1800px] px-4 py-20 md:px-8 md:py-28 lg:px-12">
        <SectionHeading index="04" eyebrow="Most Wanted" title={<>Trending <span className="italic font-normal">now</span></>} />
        <div className="grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:grid-cols-4">
          {byTag('trending').slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>
      <EditorialMarquee dark />
      <Newsletter />
    </>
  );
}
