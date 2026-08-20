import Marquee from 'react-fast-marquee';

const items = ['The SS26 Neutral Edit', 'New Arrivals Weekly', 'Complimentary Shipping Over $150', 'EasyBuy Studio', 'Crafted To Last'];

export const EditorialMarquee = ({ dark = false }) => (
  <div data-testid="editorial-marquee" className={`overflow-hidden border-y py-5 md:py-7 ${dark ? 'border-white/10 bg-ink text-white' : 'border-line bg-white text-ink'}`}>
    <Marquee speed={35} gradient={false}>
      {items.map((t, i) => (
        <span key={i} className="mx-8 flex items-center gap-8 md:mx-12 md:gap-12">
          <span className="whitespace-nowrap font-display text-2xl italic md:text-4xl">{t}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" className={dark ? 'fill-white/40' : 'fill-ink/40'}>
            <rect x="2" y="2" width="6" height="6" transform="rotate(45 5 5)" />
          </svg>
        </span>
      ))}
    </Marquee>
  </div>
);
