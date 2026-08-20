import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Youtube } from 'lucide-react';

const cols = [
  { title: 'Shop', links: [
    { label: 'Women', to: '/shop/women' }, { label: 'Men', to: '/shop/men' }, { label: 'New In', to: '/shop/all' }, { label: 'Wishlist', to: '/wishlist' },
  ]},
  { title: 'Company', links: [
    { label: 'About', to: '/info/about' }, { label: 'Contact', to: '/info/contact' }, { label: 'FAQs', to: '/info/faqs' },
  ]},
  { title: 'Legal', links: [
    { label: 'Privacy Policy', to: '/info/privacy' }, { label: 'Terms of Service', to: '/info/terms' },
  ]},
];

const socials = [
  { icon: Instagram, label: 'Instagram' },
  { icon: Facebook, label: 'Facebook' },
  { icon: Twitter, label: 'Twitter' },
  { icon: Youtube, label: 'YouTube' },
];

export const Footer = () => (
  <footer data-testid="footer" className="border-t border-line bg-white">
    <div className="mx-auto grid max-w-[1800px] grid-cols-1 gap-12 px-4 py-16 md:grid-cols-12 md:px-8 md:py-24 lg:px-12">
      <div className="md:col-span-5">
        <Link to="/" className="text-2xl font-extrabold uppercase tracking-[0.45em]">EasyBuy</Link>
        <p className="mt-6 max-w-sm font-display text-2xl italic leading-snug text-neutral-500">
          Considered clothing for men and women — cut clean, made to last, priced honestly.
        </p>
        <div className="mt-8 flex gap-3">
          {socials.map(({ icon: Icon, label }) => (
            <a key={label} href="#" data-testid={`footer-social-${label.toLowerCase()}`} aria-label={label}
              className="flex h-10 w-10 items-center justify-center border border-line transition-all duration-300 hover:border-ink hover:bg-ink hover:text-white">
              <Icon size={16} strokeWidth={1.5} />
            </a>
          ))}
        </div>
      </div>
      {cols.map((c) => (
        <div key={c.title} className="md:col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">{c.title}</p>
          <ul className="mt-5 space-y-3">
            {c.links.map((l) => (
              <li key={l.label}>
                <Link to={l.to} data-testid={`footer-link-${l.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sm text-neutral-600 transition-colors duration-300 hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="md:col-span-1" />
    </div>
    <div className="border-t border-line">
      <div className="mx-auto flex max-w-[1800px] flex-col items-center justify-between gap-3 px-4 py-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 md:flex-row md:px-8 lg:px-12">
        <span>© 2026 EasyBuy Studio</span>
        <span>Designed for the everyday uniform</span>
      </div>
    </div>
  </footer>
);
