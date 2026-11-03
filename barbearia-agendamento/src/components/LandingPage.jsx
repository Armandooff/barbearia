import { useState } from 'react';
import { BARBERSHOP_INFO, PLANS } from '../data/mocks';
import { ArrowUpRight, Calendar, Camera, MapPin, Phone, Scissors, User } from 'lucide-react';

export default function LandingPage({ onNameSubmit }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError('Informe seu nome.');
    if (trimmed.length < 3) return setError('Nome deve ter ao menos 3 caracteres.');
    setError('');
    onNameSubmit(trimmed);
  };

  return (
    <main className="site-shell min-h-screen">
      <header className="site-header sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="#top" className="flex items-center gap-3 text-white no-underline">
            <span className="flex h-9 w-9 items-center justify-center bg-[#c9684d] font-display text-xl font-bold">B</span>
            <span className="font-display text-xl font-bold uppercase tracking-wide">{BARBERSHOP_INFO.name}</span>
          </a>
          <nav className="hidden items-center gap-8 text-xs font-bold uppercase tracking-[.18em] text-[#c9c4b8] sm:flex">
            <a href="#servicos" className="transition hover:text-white">Serviços</a>
            <a href="#galeria" className="transition hover:text-white">Galeria</a>
            <a href="#agendamento" className="text-[#a7c1a0] transition hover:text-white">Agendar</a>
          </nav>
          <span className="hidden text-xs uppercase tracking-[.18em] text-[#777b72] md:block">Desde 2018 / Zona norte</span>
        </div>
      </header>

      <section id="top" className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 md:grid-cols-[.92fr_1.08fr] md:pb-28 md:pt-24">
        <div className="relative z-10">
          <p className="eyebrow mb-6">Barbearia de bairro · corte de respeito</p>
          <h1 className="display-title max-w-3xl">{BARBERSHOP_INFO.name.split(' ')[0]} <em>{BARBERSHOP_INFO.name.split(' ').slice(1).join(' ')}</em></h1>
          <p className="mt-8 max-w-md text-base leading-7 text-[#c9c4b8] sm:text-lg">{BARBERSHOP_INFO.welcome}</p>
          <a href="#agendamento" className="street-button mt-8 px-7 py-4 no-underline"><Calendar className="h-5 w-5" /> Agendar horário</a>
          <div className="mt-10 flex items-center gap-3 text-xs font-bold uppercase tracking-[.18em] text-[#777b72]"><span className="h-px w-10 bg-[#c9684d]" /> {BARBERSHOP_INFO.tagline}</div>
        </div>
        <div className="hero-art relative min-h-[26rem] overflow-hidden border border-white/20 md:min-h-[35rem]">
          <div className="absolute bottom-7 left-7 max-w-[14rem] paper-note px-4 py-3 font-display text-2xl font-bold uppercase leading-none">Feito na quebrada. Bem feito.</div>
          <div className="absolute right-7 top-7 border border-[#a7c1a0] px-3 py-2 text-xs font-bold uppercase tracking-[.18em] text-[#a7c1a0]">Na régua</div>
          <span className="absolute bottom-7 right-7 font-display text-7xl font-bold text-white/15">01</span>
        </div>
      </section>

      <section className="section-rule border-b px-5 py-6 sm:px-8"><p className="mx-auto max-w-7xl text-center font-display text-2xl uppercase tracking-wide text-[#e7c86e] sm:text-3xl">“{BARBERSHOP_INFO.quote}” <span className="text-sm text-[#777b72]">— {BARBERSHOP_INFO.author}</span></p></section>

      <section id="servicos" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
        <div className="mb-10 flex items-end justify-between gap-6"><div><p className="eyebrow mb-3">Escolha seu ritual</p><h2 className="font-display text-5xl font-bold uppercase leading-none sm:text-7xl">Serviços</h2></div><p className="hidden max-w-xs text-right text-sm leading-6 text-[#c9c4b8] sm:block">Técnica, conversa boa e acabamento preciso. Sem pressa, sem firula.</p></div>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan, index) => <article key={plan.id} className="street-card service-card relative p-6 sm:p-7">
            {index === 1 && <span className="absolute -top-3 right-5 bg-[#a7c1a0] px-3 py-1 font-display text-sm font-bold uppercase text-[#171816]">Mais pedido</span>}
            <div className="flex items-start justify-between"><Scissors className="h-6 w-6 text-[#c9684d]" /><span className="font-display text-5xl text-white/10">0{index + 1}</span></div>
            <h3 className="mt-8 font-display text-3xl font-bold uppercase">{plan.name}</h3>
            <p className="mt-3 min-h-12 text-sm leading-6 text-[#c9c4b8]">{plan.description}</p>
            <p className="mt-7 font-display text-4xl font-bold text-[#e7c86e]">R$ {plan.price}<small className="ml-1 text-base font-normal text-[#777b72]">/mês</small></p>
            <a href={`https://wa.me/${BARBERSHOP_INFO.whatsapp}?text=${encodeURIComponent('Olá! Tenho interesse no ' + plan.name + '.')}`} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center gap-2 font-display text-lg font-bold uppercase text-[#a7c1a0] no-underline hover:text-white">Quero este plano <ArrowUpRight className="h-5 w-5" /></a>
          </article>)}
        </div>
      </section>

      <section id="agendamento" className="section-rule mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 md:grid-cols-[1fr_25rem] md:py-28">
        <div><p className="eyebrow mb-3">Seu próximo corte começa aqui</p><h2 className="max-w-xl font-display text-6xl font-bold uppercase leading-[.86] sm:text-8xl">Cola com a gente.</h2><p className="mt-7 max-w-md text-[#c9c4b8]">Escreva seu nome e escolha o serviço e o melhor horário para você.</p></div>
        <form onSubmit={handleSubmit} className="street-card p-6 sm:p-8"><label htmlFor="landing-name" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#c9c4b8]"><User className="h-4 w-4 text-[#a7c1a0]" /> Nome completo</label><input id="landing-name" type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: João Silva" className="field mt-3 px-4 py-3" />{error && <p className="mt-2 text-sm text-[#c9684d]">{error}</p>}<button type="submit" className="street-button mt-5 w-full px-6 py-3">Confirmar agendamento</button></form>
      </section>

      <section id="galeria" className="mx-auto max-w-7xl px-5 py-20 sm:px-8"><div className="mb-8"><p className="eyebrow mb-3">Trabalho fala</p><h2 className="font-display text-5xl font-bold uppercase sm:text-7xl">Na régua.</h2></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="hover-lift overflow-hidden border border-white/10"><img src={`/gallery/corte${item}.svg`} alt={`Corte ${item}`} loading="lazy" className="aspect-square w-full object-cover" /></div>)}</div></section>

      <footer className="section-rule px-5 py-12 sm:px-8"><div className="mx-auto grid max-w-7xl gap-8 text-sm text-[#c9c4b8] md:grid-cols-3"><div><Scissors className="mb-3 h-5 w-5 text-[#c9684d]" /><p className="font-display text-2xl font-bold uppercase text-white">{BARBERSHOP_INFO.name}</p><p className="mt-2">{BARBERSHOP_INFO.tagline}</p></div><div><MapPin className="mb-3 h-5 w-5 text-[#a7c1a0]" /><p>{BARBERSHOP_INFO.address}</p><a href={`tel:+${BARBERSHOP_INFO.whatsapp}`} className="mt-2 flex items-center gap-2 text-[#c9c4b8] no-underline hover:text-white"><Phone className="h-4 w-4" /> {BARBERSHOP_INFO.phone}</a></div><div><Camera className="mb-3 h-5 w-5 text-[#e7c86e]" /><a href={BARBERSHOP_INFO.instagram} target="_blank" rel="noopener noreferrer" className="text-[#c9c4b8] no-underline hover:text-white">Abrir Instagram da barbearia</a></div></div><p className="mx-auto mt-10 max-w-7xl text-xs text-[#777b72]">© 2026 {BARBERSHOP_INFO.name}. Todos os direitos reservados.</p></footer>
    </main>
  );
}
