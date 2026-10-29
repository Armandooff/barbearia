import { useState } from 'react';
import { BARBERSHOP_INFO, PLANS } from '../data/mocks';
import { Scissors, MapPin, Phone, Camera, Calendar, ArrowDown, User } from 'lucide-react';
import GraffitiWall from './GraffitiWall';
import BarberIllustration from './BarberIllustration';

export default function LandingPage({ onNameSubmit }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const scrollToBooking = () => {
    const el = document.getElementById('agendamento');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Informe seu nome.'); return; }
    if (trimmed.length < 3) { setError('Nome deve ter ao menos 3 caracteres.'); return; }
    setError('');
    onNameSubmit(trimmed);
  };

  return (
    <section className="min-h-screen graffiti-wall text-white overflow-hidden relative">
      <GraffitiWall />
      <BarberIllustration className="absolute bottom-0 right-0 w-48 h-64 opacity-30 hidden md:block" />
      {/* Spray splatters */}
      <div className="spray-splatter w-64 h-64 -top-10 -left-10 animate-spray" />
      <div className="spray-splatter w-80 h-80 top-1/3 -right-20 animate-spray" style={{ animationDelay: '2s' }} />
      <div className="spray-splatter w-48 h-48 bottom-20 left-1/4 animate-spray" style={{ animationDelay: '3.5s' }} />

      {/* Drips */}
      <div className="drip left-12 top-0" style={{ animationDelay: '0.5s' }} />
      <div className="drip right-24 top-0" style={{ animationDelay: '1.2s', height: '40px' }} />
      <div className="drip left-1/2 top-0" style={{ animationDelay: '2.1s', height: '80px' }} />

      <div className="relative z-10 min-h-[auto] md:min-h-[680px] max-w-7xl mx-auto px-5 sm:px-6 py-10 md:py-24 grid md:grid-cols-[1fr_1.02fr] gap-8 md:gap-12 items-center">
        <div className="text-left space-y-4 md:space-y-6 md:pl-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#f3d64e]/50 bg-black/40 text-[#f3d64e] uppercase tracking-[.22em] text-xs font-bold animate-fade-in-up"><Scissors className="w-4 h-4" /> Barbearia de atitude</div>
          <h1 className="graffiti-text street-title text-[3.6rem] sm:text-8xl md:text-[8.5rem] leading-[.82] animate-fade-in-up -rotate-2 origin-left" style={{ animationDelay: '0.1s' }}>{BARBERSHOP_INFO.name.toUpperCase().replace(' ', '')}</h1>
          <p className="text-[#f3d64e] uppercase tracking-[0.3em] text-xs sm:text-sm font-bold animate-fade-in-up" style={{ animationDelay: '0.2s' }}>{BARBERSHOP_INFO.tagline}</p>
          <p className="text-zinc-300 text-lg max-w-lg animate-fade-in-up" style={{ animationDelay: '0.3s' }}>{BARBERSHOP_INFO.welcome}</p>
          <div className="pt-2 animate-fade-in-up" style={{ animationDelay: '0.4s' }}><button onClick={scrollToBooking} className="street-button inline-flex items-center gap-2 px-8 py-4 font-bold font-display uppercase tracking-wide border-2 transition-all hover:-translate-y-1"><Calendar className="w-5 h-5" /> Agendar Horário</button></div>
          <div className="flex items-center gap-3 pt-4 text-zinc-500 text-xs uppercase tracking-[.2em] font-bold animate-fade-in-up" style={{ animationDelay: '0.5s' }}><span className="w-10 h-px bg-[#ed3658]" /> Corte limpo. Rua viva.</div>
        </div>
        <div className="relative min-h-[210px] sm:min-h-[280px] md:min-h-[470px] mx-1 md:mx-0 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <div className="absolute -inset-3 border-2 border-[#12cdb2] rotate-2" />
          <div role="img" aria-label="Mural de grafite colorido em uma rua urbana" className="spray-photo absolute inset-0 border-2 border-white/20 -rotate-2" />
          <div className="absolute bottom-5 left-5 bg-[#ed3658] px-4 py-2 text-white font-display font-bold text-xl uppercase -rotate-3 shadow-lg">Feito na quebrada</div>
          <div className="absolute -top-5 right-2 sm:right-8 text-[#f3d64e] graffiti-text text-3xl sm:text-4xl rotate-6">Na régua!</div>
          <ArrowDown className="absolute -bottom-12 right-3 w-6 h-6 text-[#12cdb2] animate-bounce md:hidden" />
        </div>
      </div>
      {/* Quote */}
      <div className="border-y border-zinc-800 bg-black/60 relative overflow-hidden">
        <div className="spray-splatter w-96 h-96 -left-20 top-0 opacity-40" />
        <div className="max-w-3xl mx-auto px-6 py-3 text-center space-y-4 relative z-10">
          <p className="font-display text-3xl md:text-5xl text-[#f3d64e] animate-fade-in-up rotate-1">
            "{BARBERSHOP_INFO.quote}"
          </p>
          <p className="text-zinc-400 uppercase tracking-widest text-sm font-semibold animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            — {BARBERSHOP_INFO.author}
          </p>
        </div>
      </div>

      {/* Agendamento */}
      <div id="agendamento" className="max-w-3xl mx-auto px-5 sm:px-6 py-12 md:py-16 space-y-6 relative scroll-mt-4">
        <div className="spray-splatter w-72 h-72 -right-10 -top-10" />
        <div className="text-center space-y-2 relative z-10">
          <p className="text-[#12cdb2] uppercase tracking-[.28em] text-xs font-bold">Seu proximo corte comeca aqui</p>
          <h2 className="font-display text-5xl md:text-6xl uppercase">Agendamento Online</h2>
          <h3 className="hidden sm:block text-xl font-semibold text-zinc-200">
            DESEJA MARCAR UM HORÁRIO COM {BARBERSHOP_INFO.name.toUpperCase()}?
          </h3>
          <p className="text-zinc-400 text-sm sm:text-base">
            Escreva seu nome abaixo e clique em confirmar para escolher o serviço e horário.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="street-card max-w-md mx-auto p-5 sm:p-6 space-y-4 relative z-10 border-2">
          <div className="space-y-2">
            <label htmlFor="landing-name" className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <User className="w-4 h-4 text-white" /> Nome completo
            </label>
            <input
              id="landing-name"
              type="text"
              autoComplete="name"
              enterKeyHint="go"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full px-4 py-3 border-2 border-zinc-700 bg-black/80 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="street-button w-full px-8 py-3 font-bold font-display uppercase border-2 transition-all"
          >
            Confirmar
          </button>
        </form>
      </div>

      {/* Galeria de cortes */}
      <section className="max-w-5xl mx-auto px-5 sm:px-6 py-10 md:py-12 space-y-5 md:space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-display text-4xl md:text-5xl uppercase text-white">Galeria de cortes</h2>
          <p className="text-zinc-400 text-sm">Exemplos de trabalhos realizados (fotos ilustrativas).</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="group relative overflow-hidden border-2 border-zinc-800 bg-black hover-lift">
              <img
                src={`/gallery/corte${i}.svg`}
                alt={`Corte ${i}`}
                className="w-full h-36 sm:h-52 object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition flex items-end p-4">
                <span className="text-white font-display text-lg">Corte {i}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Planos mensais */}
      <section className="max-w-5xl mx-auto px-5 sm:px-6 py-10 md:py-12 space-y-5 md:space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-display text-4xl md:text-5xl uppercase text-white">Planos mensais</h2>
          <p className="text-zinc-400 text-sm">Economize com um plano fixo mensal (exemplo ilustrativo).</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((p, idx) => (
            <div key={p.id} className="street-card relative border-2 p-5 sm:p-6 space-y-4 hover-lift">
              {idx === 1 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold font-display px-3 py-1 border-2 border-white">
                  MAIS POPULAR
                </span>
              )}
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-[#12cdb2]" />
                <h3 className="font-display text-2xl text-white">{p.name}</h3>
              </div>
              <p className="text-zinc-400 text-sm">{p.description}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-[#f3d64e]">R$ {p.price}</span>
                <span className="text-sm text-zinc-500">,00/mês</span>
              </div>
              <a
                href={`https://wa.me/${BARBERSHOP_INFO.whatsapp}?text=${encodeURIComponent('Olá! Tenho interesse no ' + p.name + '.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="street-button block text-center px-4 py-3 font-bold font-display uppercase border-2 transition"
              >
                Quero este plano
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Contato */}
      <footer className="border-t border-zinc-800 bg-black/60 relative overflow-hidden">
        <div className="spray-splatter w-64 h-64 -right-10 top-0" />
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-10 md:py-12 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-sm relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white">
              <MapPin className="w-4 h-4" />
              <p className="text-xs font-semibold uppercase tracking-widest">Endereço</p>
            </div>
            <p className="text-zinc-200">{BARBERSHOP_INFO.address}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white">
              <Scissors className="w-4 h-4" />
              <p className="text-xs font-semibold uppercase tracking-widest">{BARBERSHOP_INFO.name.toUpperCase()}</p>
            </div>
            <p className="text-zinc-200">{BARBERSHOP_INFO.tagline}</p>
            <a href={`tel:+${BARBERSHOP_INFO.whatsapp}`} className="flex items-center gap-2 text-zinc-200 hover:text-white transition mt-1">
              <Phone className="w-4 h-4" />
              {BARBERSHOP_INFO.phone}
            </a>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white">
              <Camera className="w-4 h-4" />
              <p className="text-xs font-semibold uppercase tracking-widest">Instagram</p>
            </div>
            <a
              href={BARBERSHOP_INFO.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-200 hover:text-white transition"
            >
              Abrir Instagram da barbearia
            </a>
          </div>
        </div>
        <div className="text-center text-zinc-500 text-xs pb-6 relative z-10">
          © 2026 {BARBERSHOP_INFO.name}. Todos os direitos reservados.
        </div>
      </footer>
    </section>
  );
}
