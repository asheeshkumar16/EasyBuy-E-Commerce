import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { MaskedLine, Reveal } from '@/components/Reveal';

const inputCls = 'w-full border border-line bg-white px-4 py-3.5 text-sm outline-none transition-colors duration-300 focus:border-ink';

const FAQS = [
  { q: 'How long does shipping take?', a: 'Standard delivery takes 3–5 business days. Express options appear at checkout once the backend ships. Orders over $150 ship free.' },
  { q: 'What is the return policy?', a: 'Free returns within 30 days of delivery. Pieces must be unworn with tags attached. Refunds land in 5–7 business days.' },
  { q: 'How do EasyBuy sizes run?', a: 'Our fits are true to size with a relaxed editorial cut. If you are between sizes, size down for tailoring and up for outerwear.' },
  { q: 'Where are the clothes made?', a: 'We work with audited mills and ateliers in Portugal, Italy and India, chosen for craft and fair working conditions.' },
];

const Faq = () => {
  const [open, setOpen] = useState(0);
  return (
    <div className="border-b border-line">
      {FAQS.map((f, i) => (
        <div key={i} className="border-t border-line">
          <button data-testid={`faq-question-${i}`} onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center justify-between py-6 text-left">
            <span className="font-display text-2xl italic md:text-3xl">{f.q}</span>
            <ChevronDown size={18} strokeWidth={1.5} className={`shrink-0 transition-transform duration-500 ${open === i ? 'rotate-180' : ''}`} />
          </button>
          <motion.div initial={false} animate={{ height: open === i ? 'auto' : 0, opacity: open === i ? 1 : 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <p data-testid={`faq-answer-${i}`} className="max-w-2xl pb-6 text-sm leading-relaxed text-neutral-500">{f.a}</p>
          </motion.div>
        </div>
      ))}
    </div>
  );
};

const ContactForm = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const submit = (e) => {
    e.preventDefault();
    toast.success('Message sent — we reply within one business day (demo)');
    setForm({ name: '', email: '', message: '' });
  };
  return (
    <form onSubmit={submit} className="max-w-xl space-y-4" data-testid="contact-form">
      <input data-testid="contact-name" required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
      <input data-testid="contact-email" required type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
      <textarea data-testid="contact-message" required rows={5} placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${inputCls} resize-none`} />
      <button data-testid="contact-submit-button" type="submit" className="bg-ink px-10 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
        Send Message
      </button>
    </form>
  );
};

const CONTENT = {
  about: {
    eyebrow: 'Our Story', title: <>About <span className="italic font-normal">EasyBuy</span></>,
    body: (
      <div className="max-w-2xl space-y-6 text-sm leading-relaxed text-neutral-500 md:text-base">
        <p>EasyBuy began with a simple frustration: great clothes were either beautiful or affordable, never both. We started in a small studio with six silhouettes and a promise — considered design, honest fabric, fair prices.</p>
        <p>Today we make full wardrobes for men and women: coats cut from double-faced wool, silk that drapes like water, knitwear you will reach for a decade from now. Every piece is designed to work with everything else we make.</p>
        <p>We release small, deliberate drops instead of chasing trends. Fewer, better things — worn hundreds of times.</p>
      </div>
    ),
  },
  contact: {
    eyebrow: 'Get In Touch', title: <>Contact <span className="italic font-normal">us</span></>,
    body: <ContactForm />,
  },
  faqs: {
    eyebrow: 'Help Centre', title: <>Common <span className="italic font-normal">questions</span></>,
    body: <Faq />,
  },
  privacy: {
    eyebrow: 'Legal', title: <>Privacy <span className="italic font-normal">policy</span></>,
    body: (
      <div className="max-w-2xl space-y-6 text-sm leading-relaxed text-neutral-500">
        <p>EasyBuy collects only the data needed to fulfil your order and improve your experience — contact details, delivery address and browsing preferences. We never sell your data.</p>
        <p>Cart and wishlist data in this demo is stored locally in your browser only. Analytics, when enabled, are aggregated and anonymised.</p>
        <p>You may request a copy or deletion of your data at any time by contacting privacy@easybuy.example.</p>
      </div>
    ),
  },
  terms: {
    eyebrow: 'Legal', title: <>Terms of <span className="italic font-normal">service</span></>,
    body: (
      <div className="max-w-2xl space-y-6 text-sm leading-relaxed text-neutral-500">
        <p>By using EasyBuy you agree to these terms. Product imagery and descriptions are representative; slight variations in colour and texture are natural to premium fibres.</p>
        <p>Orders are confirmed by email and may be cancelled before dispatch. Returns are accepted within 30 days as described in our FAQs.</p>
        <p>This storefront is currently a design demonstration; orders placed here are simulated and no payment is processed.</p>
      </div>
    ),
  },
};

export default function InfoPage() {
  const { page = 'about' } = useParams();
  const c = CONTENT[page] || CONTENT.about;
  return (
    <div className="pt-[104px]" data-testid="info-page">
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1800px] px-4 pb-10 pt-14 md:px-8 md:pt-20 lg:px-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-400">{c.eyebrow}</p>
          <h1 className="mt-3 font-display text-5xl font-medium tracking-tight md:text-7xl"><MaskedLine>{c.title}</MaskedLine></h1>
        </div>
      </section>
      <section className="mx-auto max-w-[1800px] px-4 py-14 md:px-8 md:py-20 lg:px-12">
        <Reveal>{c.body}</Reveal>
      </section>
    </div>
  );
}
