import { useState } from 'react';
import { ArrowRight, MapPin, Phone, Scissors } from 'lucide-react';
import { BARBERSHOP_INFO } from '../data/mocks';
import Reveal from './Reveal';

const CURRENT_YEAR = new Date().getFullYear();

function InstagramIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function QuoteSection() {
  const [before, after] = BARBERSHOP_INFO.quote.split('cuidado masculino');
  return (
    <section className="ph-quote-section">
      <div className="ph-quote-pattern" aria-hidden="true" />
      <div className="ph-quote-halo" aria-hidden="true" />
      <div className="absolute left-0 top-1/2 h-px w-1/4 -translate-y-1/2 bg-gradient-to-r from-transparent via-red-600/50 to-red-600" aria-hidden="true" />
      <div className="absolute right-0 top-1/2 h-px w-1/4 -translate-y-1/2 bg-gradient-to-l from-transparent via-red-600/50 to-red-600" aria-hidden="true" />
      <div className="ph-container relative z-10">
        <Reveal className="relative mx-auto max-w-4xl text-center">
          <span className="ph-quote-mark" aria-hidden="true">&ldquo;</span>
          <h2 className="text-quote text-[clamp(1.85rem,5vw,3.6rem)] leading-tight text-white">
            &ldquo;{before}<span className="text-[color:var(--red)]">cuidado masculino</span>{after}&rdquo;
          </h2>
          <div className="ph-quote-divider" aria-hidden="true">
            <span className="line" />
            <span className="diamond" />
            <span className="line" />
          </div>
          <p className="font-display mt-8 text-xl tracking-[.22em] text-[color:var(--red)]">— {BARBERSHOP_INFO.author}</p>
        </Reveal>
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

  return (
    <section id="agendamento" className="ph-booking-section">
      <div className="ph-booking-glow" aria-hidden="true" />
      <Scissors className="absolute right-10 top-16 h-32 w-32 rotate-45 text-red-600/10" aria-hidden="true" />
      <Scissors className="absolute bottom-16 left-10 h-24 w-24 -rotate-45 text-red-600/10" aria-hidden="true" />
      <div className="ph-container relative z-10">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="ph-kicker">Agendamento Online</span>
          <h2 className="text-display mt-4 text-[clamp(2.2rem,6vw,3.8rem)] text-white">
            DESEJA MARCAR UM HORÁRIO COM{' '}
            <span className="text-[color:var(--red)]">{BARBERSHOP_INFO.nickname}</span>?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[color:var(--muted)]">
            Escreva seu nome abaixo e clique em OK para escolher o serviço e horário
          </p>

          <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-lg" noValidate>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="booking-name" className="sr-only">Seu nome</label>
              <input
                id="booking-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => { setName(event.target.value); setError(''); }}
                placeholder="Digite seu nome..."
                className="ph-input flex-1"
                required
              />
              <button type="submit" className="ph-btn-red h-14 shrink-0 px-8 text-lg">
                OK <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-[color:var(--danger)]" role="alert">{error}</p>}
          </form>

          <div className="ph-address-card mx-auto mt-12 max-w-lg text-left">
            <p className="mb-2 flex items-center gap-2 text-sm text-[color:var(--muted)]">
              <MapPin className="h-4 w-4 text-[color:var(--red)]" /> Endereço
            </p>
            <p className="font-heading text-lg text-white">{BARBERSHOP_INFO.address}</p>
          </div>
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
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-red shadow-[var(--shadow-red)]">
              <Scissors className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-display text-2xl tracking-wide text-white">
                PH <span className="text-[color:var(--red)]">BARBEARIA</span>
              </h3>
              <p className="text-xs uppercase tracking-[.15em] text-[color:var(--muted)]">Estilo &amp; Precisão</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-[color:var(--muted)]">
            <a href={`tel:+${BARBERSHOP_INFO.whatsapp}`} className="flex items-center gap-2 transition-colors hover:text-[color:var(--red)]">
              <Phone className="h-4 w-4" /> {BARBERSHOP_INFO.phone}
            </a>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {BARBERSHOP_INFO.address}
            </span>
          </div>

          <a
            href={BARBERSHOP_INFO.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir Instagram da barbearia"
            className="ph-social"
          >
            <InstagramIcon className="h-5 w-5" />
          </a>
        </div>

        <div className="mt-8 border-t border-white/5 pt-8 text-center">
          <p className="text-sm text-[color:var(--muted)]">
            © {CURRENT_YEAR} PH Barbearia. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage({ onNameSubmit }) {
  const [welcomeBefore, welcomeAfter] = BARBERSHOP_INFO.welcome.split(BARBERSHOP_INFO.name);

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
            <div className="ph-scissors-badge">
              <Scissors className="h-10 w-10" />
            </div>
          </div>

          <h1 className="text-display ph-hero-title anim-rise mt-6 text-white" style={{ animationDelay: '250ms' }}>
            PH <span className="text-gradient-red">BARBEARIA</span>
          </h1>

          <p
            className="font-heading anim-rise mt-5 text-[clamp(1.05rem,3vw,1.5rem)] uppercase tracking-[.12em] text-[color:var(--muted)]"
            style={{ animationDelay: '400ms' }}
          >
            {BARBERSHOP_INFO.tagline}
          </p>

          <p
            className="anim-rise mx-auto mt-8 max-w-2xl text-[clamp(1rem,2.3vw,1.2rem)] leading-relaxed text-white/80"
            style={{ animationDelay: '550ms' }}
          >
            {welcomeBefore}
            <span className="font-semibold text-[color:var(--red)]">{BARBERSHOP_INFO.name}</span>
            {welcomeAfter}
          </p>

          <div className="anim-pop mt-12 inline-flex" style={{ animationDelay: '750ms' }}>
            <a href="#agendamento" className="ph-btn-red">
              <Scissors className="h-5 w-5" /> Agendar Horário
            </a>
          </div>
        </div>

        <a href="#agendamento" className="ph-scroll-indicator" aria-label="Role para o agendamento">
          <span>Role para baixo</span>
          <span className="ph-mouse" aria-hidden="true"><span /></span>
        </a>
      </section>

      <QuoteSection />
      <BookingSection onNameSubmit={onNameSubmit} />
      <Footer />
    </main>
  );
}
