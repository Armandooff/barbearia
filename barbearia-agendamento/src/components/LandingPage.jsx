import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  MapPin,
  Phone,
  Scissors,
} from 'lucide-react';
import { BARBERSHOP_INFO, GALLERY } from '../data/mocks';
import Reveal from './Reveal';
import { InstagramIcon, WhatsappIcon } from './Icons';

const CURRENT_YEAR = new Date().getFullYear();

function QuoteSection() {
  const [before, after] = BARBERSHOP_INFO.quote.split(BARBERSHOP_INFO.quoteHighlight);
  return (
    <section className="ph-quote-section">
      <div className="ph-quote-pattern" aria-hidden="true" />
      <div className="ph-quote-halo" aria-hidden="true" />
      <div className="absolute left-0 top-1/2 h-px w-1/4 -translate-y-1/2 bg-gradient-to-r from-transparent via-blue-500/50 to-blue-500" aria-hidden="true" />
      <div className="absolute right-0 top-1/2 h-px w-1/4 -translate-y-1/2 bg-gradient-to-l from-transparent via-blue-500/50 to-blue-500" aria-hidden="true" />
      <div className="ph-container relative z-10">
        <Reveal className="relative mx-auto max-w-4xl text-center">
          <span className="ph-quote-mark" aria-hidden="true">&ldquo;</span>
          <h2 className="text-quote text-[clamp(1.85rem,5vw,3.6rem)] leading-tight text-white">
            &ldquo;{before}<span className="text-[color:var(--brand-bright)]">{BARBERSHOP_INFO.quoteHighlight}</span>{after}&rdquo;
          </h2>
          <div className="ph-quote-divider" aria-hidden="true">
            <span className="line" />
            <span className="diamond" />
            <span className="line" />
          </div>
          <p className="font-display mt-8 text-xl tracking-[.22em] text-[color:var(--brand-bright)]">
            — {BARBERSHOP_INFO.quoteAuthor}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function GallerySection() {
  return (
    <section className="ph-gallery-section">
      <div className="ph-gallery-glow" aria-hidden="true" />
      <div className="ph-container relative z-10">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="ph-kicker">Direto do Instagram</span>
          <h2 className="text-display mt-4 text-[clamp(2.2rem,6vw,3.8rem)] text-white">
            CORTES & <span className="text-gradient-brand">ESTILO</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[color:var(--muted)]">
            Acompanhe os trabalhos, a tabela de preços e os horários no perfil{' '}
            <a
              href={BARBERSHOP_INFO.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[color:var(--brand-bright)] hover:text-white"
            >
              {BARBERSHOP_INFO.instagramHandle}
            </a>.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {BARBERSHOP_INFO.highlights.map((highlight) => (
              <a
                key={highlight.label}
                href={highlight.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[.12em] text-[color:var(--muted)] transition hover:border-[color:var(--brand-bright)] hover:text-white"
              >
                {highlight.label}
              </a>
            ))}
          </div>
        </Reveal>

        <div className="ph-gallery-grid">
          {GALLERY.map((item, index) => (
            <Reveal
              key={item.src}
              delay={index * 90}
              className={item.featured ? 'ph-gallery-featured' : ''}
            >
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="ph-gallery-card block"
                aria-label={`${item.label} — abrir no Instagram`}
              >
                <img src={item.src} alt={item.alt} loading="lazy" />
                <span className="ph-gallery-caption">
                  <strong>{item.label}</strong>
                  <span>{item.caption}</span>
                </span>
              </a>
            </Reveal>
          ))}

          <Reveal delay={GALLERY.length * 90}>
            <a
              href={BARBERSHOP_INFO.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="ph-gallery-card ph-gallery-cta"
            >
              <span className="ig-badge"><InstagramIcon className="h-6 w-6" /></span>
              <span className="font-heading text-lg text-white">{BARBERSHOP_INFO.instagramHandle}</span>
              <span className="text-xs uppercase tracking-[.16em] text-[color:var(--muted)]">Ver perfil completo</span>
              <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--brand-bright)]">
                Abrir Instagram <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function BookingSection({ onNameSubmit }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError('Digite seu nome para continuar.');
    if (trimmed.length < 3) return setError('O nome deve ter ao menos 3 caracteres.');
    setError('');
    onNameSubmit(trimmed);
  };

  const whatsappHref = `https://wa.me/${BARBERSHOP_INFO.whatsapp}?text=${encodeURIComponent(
    'Olá, Guilherme! Gostaria de agendar um horário na G dos Cortes.',
  )}`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${BARBERSHOP_INFO.addressShort}, ${BARBERSHOP_INFO.neighborhood}`,
  )}`;

  return (
    <section id="agendamento" className="ph-booking-section">
      <div className="ph-booking-glow" aria-hidden="true" />
      <Scissors className="absolute right-10 top-16 h-32 w-32 rotate-45 text-blue-500/10" aria-hidden="true" />
      <Scissors className="absolute bottom-16 left-10 h-24 w-24 -rotate-45 text-blue-500/10" aria-hidden="true" />
      <div className="ph-container relative z-10">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="ph-kicker">Agendamento Online</span>
          <h2 className="text-display mt-4 text-[clamp(2.2rem,6vw,3.8rem)] text-white">
            RESERVE SEU <span className="text-[color:var(--brand-bright)]">HORÁRIO</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[color:var(--muted)]">
            Escolha o serviço, a data e o horário do seu atendimento. Atendimento aos fins de semana,
            com estilo, qualidade e respeito.
          </p>

          <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-lg" noValidate>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="booking-name" className="sr-only">Seu nome</label>
              <input
                id="booking-name"
                type="text"
                autoComplete="name"
                autoCapitalize="words"
                value={name}
                onChange={(event) => { setName(event.target.value); setError(''); }}
                placeholder="Digite seu nome..."
                className="ph-input flex-1"
                required
              />
              <button type="submit" className="ph-btn-brand h-14 shrink-0 px-8 text-lg">
                OK <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-[color:var(--danger)]" role="alert">{error}</p>}
          </form>

          <div className="ph-info-grid">
            <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="ph-info-card">
              <dt><MapPin className="h-3.5 w-3.5" /> Endereço</dt>
              <dd>{BARBERSHOP_INFO.addressShort}<br />{BARBERSHOP_INFO.neighborhood}</dd>
            </a>
            <div className="ph-info-card">
              <dt><Clock3 className="h-3.5 w-3.5" /> Horários</dt>
              <dd>{BARBERSHOP_INFO.scheduleDays}<br />{BARBERSHOP_INFO.scheduleHours}</dd>
            </div>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="ph-info-card">
              <dt><WhatsappIcon className="h-3.5 w-3.5" /> WhatsApp</dt>
              <dd>{BARBERSHOP_INFO.phone}<br />Falar com Guilherme</dd>
            </a>
          </div>
          <p className="mt-4 text-xs uppercase tracking-[.16em] text-[color:var(--muted)]">
            {BARBERSHOP_INFO.slotDuration}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="ph-footer">
      <div className="ph-container">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-3">
            <img src={BARBERSHOP_INFO.logo} alt="Logo G dos Cortes" className="h-14 w-14 rounded-full border border-blue-500/40 object-cover shadow-[0_0_22px_rgba(29,92,255,0.25)]" />
            <div>
              <h3 className="font-display text-2xl tracking-wide text-white">
                G DOS <span className="text-[color:var(--brand-bright)]">CORTES</span>
              </h3>
              <p className="text-xs uppercase tracking-[.15em] text-[color:var(--muted)]">
                {BARBERSHOP_INFO.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 text-sm text-[color:var(--muted)]">
            <a href={`tel:+${BARBERSHOP_INFO.whatsapp}`} className="flex items-center gap-2 transition-colors hover:text-[color:var(--brand-bright)]">
              <Phone className="h-4 w-4" /> {BARBERSHOP_INFO.phone}
            </a>
            <span className="flex items-center gap-2 text-center">
              <MapPin className="h-4 w-4 shrink-0" /> {BARBERSHOP_INFO.address}
            </span>
            <span className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" /> {BARBERSHOP_INFO.hours}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={BARBERSHOP_INFO.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir Instagram da barbearia"
              className="ph-social"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href={`https://wa.me/${BARBERSHOP_INFO.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar no WhatsApp"
              className="ph-social"
            >
              <WhatsappIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 border-t border-white/5 pt-8 text-center">
          <p className="font-display text-lg tracking-[.12em] text-[color:var(--brand-bright)]">
            {BARBERSHOP_INFO.slogan.toUpperCase()}
          </p>
          <p className="text-sm text-[color:var(--muted)]">
            © {CURRENT_YEAR} G dos Cortes. Todos os direitos reservados.
          </p>
          <p className="text-xs text-[color:var(--muted)]">Sempre cuidando de você.</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage({ onNameSubmit }) {
  return (
    <main className="min-h-screen bg-[color:var(--bg)]">
      <section className="ph-hero">
        <div className="ph-barber-stripe ph-side-stripe left" aria-hidden="true" />
        <div className="ph-barber-stripe ph-side-stripe right" aria-hidden="true" />
        <div className="ph-hero-ring one" aria-hidden="true" />
        <div className="ph-hero-ring two" aria-hidden="true" />
        <div className="ph-hero-glow" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-4xl text-center">
          <div className="anim-pop inline-flex" style={{ animationDelay: '120ms' }}>
            <img src={BARBERSHOP_INFO.logo} alt="Logo G dos Cortes" className="ph-brand-logo" />
          </div>

          <h1 className="text-display ph-hero-title anim-rise mt-6" style={{ animationDelay: '250ms' }} aria-label="G dos Cortes">
            <span className="text-chrome">G DOS</span>
            <span className="text-gradient-brand word-accent">CORTES</span>
          </h1>

          <p
            className="font-heading ph-hero-tagline anim-rise mt-5 text-[clamp(1.05rem,3vw,1.5rem)] uppercase tracking-[.12em] text-[color:var(--muted)]"
            style={{ animationDelay: '400ms' }}
          >
            {BARBERSHOP_INFO.tagline}
          </p>
          <p
            className="font-heading ph-hero-subtitle anim-rise mt-2 text-xs uppercase tracking-[.24em] text-[color:var(--brand-bright)] sm:text-sm"
            style={{ animationDelay: '480ms' }}
          >
            {BARBERSHOP_INFO.subtitle}
          </p>

          <p
            className="ph-hero-copy anim-rise mx-auto mt-8 max-w-2xl text-[clamp(1rem,2.3vw,1.2rem)] leading-relaxed text-white/80"
            style={{ animationDelay: '550ms' }}
          >
            {BARBERSHOP_INFO.welcome}
          </p>

          <div className="ph-hero-cta anim-pop mt-10 inline-flex" style={{ animationDelay: '750ms' }}>
            <a href="#agendamento" className="ph-btn-brand">
              <Scissors className="h-5 w-5" /> Agendar Meu Corte
            </a>
          </div>

          <div
            className="ph-hero-meta anim-fade mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.68rem] uppercase tracking-[.18em] text-[color:var(--muted)]"
            style={{ animationDelay: '900ms' }}
          >
            <span>{BARBERSHOP_INFO.scheduleDays}</span>
            <span className="hidden h-1 w-1 rounded-full bg-[color:var(--brand)] sm:block" aria-hidden="true" />
            <span>{BARBERSHOP_INFO.scheduleHours}</span>
            <span className="hidden h-1 w-1 rounded-full bg-[color:var(--brand)] sm:block" aria-hidden="true" />
            <span>50 min por atendimento</span>
          </div>
        </div>

        <a href="#agendamento" className="ph-scroll-indicator" aria-label="Role para o agendamento">
          <span>Role para baixo</span>
          <span className="ph-mouse" aria-hidden="true"><span /></span>
        </a>
      </section>

      <QuoteSection />
      <GallerySection />
      <BookingSection onNameSubmit={onNameSubmit} />
      <Footer />
    </main>
  );
}
