import { useState, useEffect } from 'react';
import { BARBERSHOP_INFO } from '../data/mocks';
import { api } from '../api/client';
import { Scissors, MapPin, Phone, Camera, Calendar, ArrowDown, User, Star } from 'lucide-react';
import GraffitiWall from './GraffitiWall';
import BarberIllustration from './BarberIllustration';

export default function LandingPage({ onNameSubmit }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    api.getReviews().then(setReviews).catch(() => {});
  }, []);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewName.trim()) return;
    try {
      const r = await api.createReview({ name: reviewName.trim(), rating: reviewRating, comment: reviewComment.trim() });
      setReviews((prev) => [r, ...prev]);
      setReviewName('');
      setReviewComment('');
      setReviewRating(5);
    } catch {}
  };

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

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center space-y-6">
        <div className="animate-fade-in-up">
          <Scissors className="w-14 h-14 mx-auto text-white mb-4 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
        </div>
        <h1 className="font-display text-6xl md:text-9xl animate-fade-in-up -rotate-2" style={{ animationDelay: '0.1s' }}>
          {BARBERSHOP_INFO.name.toUpperCase().replace(' ', '')}
        </h1>
        <p className="text-zinc-300 uppercase tracking-[0.4em] text-sm font-semibold animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {BARBERSHOP_INFO.tagline}
        </p>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {BARBERSHOP_INFO.welcome}
        </p>
        <div className="pt-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <button
            onClick={scrollToBooking}
            className="inline-flex items-center gap-2 px-10 py-4 bg-white text-black font-bold font-display border-2 border-white hover:bg-black hover:text-white transition-all hover:scale-[1.03] shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <Calendar className="w-5 h-5" />
            Agendar Horário
          </button>
        </div>
        <div className="pt-10 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <ArrowDown className="w-5 h-5 mx-auto text-zinc-500 animate-bounce" />
        </div>
      </div>

      {/* Quote */}
      <div className="border-y border-zinc-800 bg-black/60 relative overflow-hidden">
        <div className="spray-splatter w-96 h-96 -left-20 top-0 opacity-40" />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center space-y-4 relative z-10">
          <p className="font-display text-3xl md:text-5xl text-white animate-fade-in-up rotate-1">
            "{BARBERSHOP_INFO.quote}"
          </p>
          <p className="text-zinc-400 uppercase tracking-widest text-sm font-semibold animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            — {BARBERSHOP_INFO.author}
          </p>
        </div>
      </div>

      {/* Agendamento */}
      <div id="agendamento" className="max-w-3xl mx-auto px-6 py-16 space-y-6 relative">
        <div className="spray-splatter w-72 h-72 -right-10 -top-10" />
        <div className="text-center space-y-2 relative z-10">
          <h2 className="font-display text-4xl">Agendamento Online</h2>
          <h3 className="text-xl font-semibold text-zinc-200">
            DESEJA MARCAR UM HORÁRIO COM {BARBERSHOP_INFO.name.toUpperCase()}?
          </h3>
          <p className="text-zinc-400">
            Escreva seu nome abaixo e clique em confirmar para escolher o serviço e horário.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4 relative z-10">
          <div className="space-y-2">
            <label htmlFor="landing-name" className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <User className="w-4 h-4 text-white" /> Nome completo
            </label>
            <input
              id="landing-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full px-4 py-3 border-2 border-zinc-700 bg-black/80 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full px-8 py-3 bg-white text-black font-bold font-display border-2 border-white hover:bg-black hover:text-white transition-all"
          >
            Confirmar
          </button>
        </form>
      </div>

      {/* Galeria de cortes */}
      <section className="max-w-5xl mx-auto px-6 py-16 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-display text-3xl text-white">Galeria de cortes</h2>
          <p className="text-zinc-400 text-sm">Exemplos de trabalhos realizados (fotos ilustrativas).</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="group relative overflow-hidden border-2 border-zinc-800 bg-black">
              <img
                src={`/gallery/corte${i}.svg`}
                alt={`Corte ${i}`}
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                <span className="text-white text-sm font-display">Corte {i}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Depoimentos */}
      <section className="border-y border-zinc-800 bg-zinc-900/40">
        <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
          <h2 className="font-display text-3xl text-white text-center">O que dizem os clientes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'João', text: 'Corte impecável, atendimento top!' },
              { name: 'Pedro', text: 'Melhor barbearia da região, recomendo.' },
              { name: 'Lucas', text: 'Pontual, limpo e profissional.' },
            ].map((t) => (
              <div key={t.name} className="border-2 border-zinc-800 bg-black/60 p-5 space-y-2">
                <p className="text-zinc-300 text-sm italic">"{t.text}"</p>
                <p className="text-white font-display text-sm">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mapa */}
      <section className="max-w-4xl mx-auto px-6 py-16 space-y-4">
        <h2 className="font-display text-3xl text-white text-center">Como chegar</h2>
        <div className="border-2 border-zinc-800 overflow-hidden">
          <iframe
            title="Mapa"
            src="https://www.google.com/maps?q=AV.+Sabino+Monte,+4306&output=embed"
            className="w-full h-64"
            loading="lazy"
          />
        </div>
        <p className="text-center text-zinc-400 text-sm">{BARBERSHOP_INFO.address}</p>
      </section>

      {/* Avaliações */}
      <section className="max-w-4xl mx-auto px-6 py-16 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-display text-3xl text-white">Avaliações</h2>
          <p className="text-zinc-400 text-sm">O que os clientes dizem.</p>
        </div>
        {reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.slice(0, 6).map((r) => (
              <div key={r.id} className="border-2 border-zinc-800 bg-black/60 p-5 space-y-2">
                <div className="flex items-center gap-1 text-white">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-white' : 'opacity-30'}`} />
                  ))}
                </div>
                <p className="text-zinc-300 text-sm italic">"{r.comment || 'Sem comentário.'}"</p>
                <p className="text-white font-display text-sm">— {r.name}</p>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={submitReview} className="max-w-md mx-auto space-y-3 border-2 border-zinc-800 p-5">
          <p className="font-display text-lg text-white">Deixe sua avaliação</p>
          <input
            value={reviewName}
            onChange={(e) => setReviewName(e.target.value)}
            placeholder="Seu nome"
            className="w-full px-3 py-2 border-2 border-zinc-700 bg-black text-white text-sm focus:outline-none focus:border-white transition"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Nota:</span>
            {[1,2,3,4,5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setReviewRating(n)}
                className={`w-8 h-8 border-2 font-bold ${reviewRating >= n ? 'bg-white text-black border-white' : 'border-zinc-700 text-zinc-400'}`}
              >
                {n}
              </button>
            ))}
          </div>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Comentário (opcional)"
            className="w-full px-3 py-2 border-2 border-zinc-700 bg-black text-white text-sm focus:outline-none focus:border-white transition"
            rows={3}
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-white text-black font-bold font-display border-2 border-white hover:bg-black hover:text-white transition"
          >
            Enviar avaliação
          </button>
        </form>
      </section>

      {/* Contato */}
      <footer className="border-t border-zinc-800 bg-black/60 relative overflow-hidden">
        <div className="spray-splatter w-64 h-64 -right-10 top-0" />
        <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm relative z-10">
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