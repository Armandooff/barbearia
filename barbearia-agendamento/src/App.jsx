import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Scissors } from 'lucide-react';
import LandingPage from './components/LandingPage';
import BookingFlow from './components/BookingFlow';
import { api } from './api/client';
import { BARBERSHOP_INFO } from './data/mocks';
import { WhatsappIcon } from './components/Icons';

const STEPS = {
  LANDING: 'landing',
  BOOKING: 'booking',
  SUCCESS: 'success',
};

function formatPrice(value) {
  return Number(value || 0).toFixed(2).replace('.', ',');
}

export default function App() {
  const [step, setStep] = useState(STEPS.LANDING);
  const [clientName, setClientName] = useState('');
  const [client, setClient] = useState(null);
  const [booking, setBooking] = useState(null);

  const [services, setServices] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState({});
  const [slotTemplate, setSlotTemplate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const [svc, avail] = await Promise.all([api.getServices(), api.getAvailability()]);
      setServices(svc);
      setAvailableDates(avail.dates || []);
      setAvailableSlots(avail.slots || {});
      setSlotTemplate(avail.template || []);
      if (silent) setError('');
    } catch (e) {
      if (!silent) setError(e.message || 'Falha ao carregar dados');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Atualização em tempo real da disponibilidade (polling)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const avail = await api.getAvailability();
        setAvailableDates(avail.dates || []);
        setAvailableSlots(avail.slots || {});
        setSlotTemplate(avail.template || []);
      } catch { /* mantém os dados atuais */ }
    }, 15000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadData(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const handleNameSubmit = (name) => {
    setClientName(name);
    setStep(STEPS.BOOKING);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const refreshAvailability = async () => {
    try {
      const avail = await api.getAvailability();
      setAvailableDates(avail.dates || []);
      setAvailableSlots(avail.slots || {});
      setSlotTemplate(avail.template || []);
    } catch { /* The booking is already created; keep the successful response. */ }
  };

  const handleSchedule = async ({ service, date, time, paymentMethod, requestId }) => {
    try {
      const appointment = await api.createAppointment({
        clientName,
        serviceId: service.id,
        date,
        time,
        paymentMethod,
        requestId,
      });
      setClient({ name: clientName, service });
      setBooking({ date: appointment.date, time: appointment.time });
      setStep(STEPS.SUCCESS);
      window.scrollTo({ top: 0, behavior: 'instant' });
      await refreshAvailability();
      return appointment;
    } catch (e) {
      await refreshAvailability();
      throw e;
    }
  };

  const handleReset = () => {
    setClient(null);
    setBooking(null);
    setStep(STEPS.LANDING);
    window.scrollTo({ top: 0, behavior: 'instant' });
    loadData();
  };

  if (loading) {
    return (
      <section className="ph-state-screen">
        <div className="relative z-10 flex flex-col items-center gap-5 text-center">
          <div className="ph-scissors-badge">
            <Scissors className="h-10 w-10" />
          </div>
          <div className="flex items-center gap-3 text-[color:var(--muted)]">
            <Loader2 className="ph-spinner text-[color:var(--brand-bright)]" />
            <p className="font-display text-xl uppercase tracking-[.2em]">Preparando a cadeira</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="ph-state-screen">
        <div className="ph-state-card">
          <div className="ph-status-icon">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-display text-3xl text-white">Não foi possível carregar</h1>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">{error}</p>
          <button type="button" onClick={() => loadData()} className="ph-btn-brand mt-6 w-full py-3.5">
            Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  if (step === STEPS.SUCCESS && client && booking) {
    const dateLabel = new Date(`${booking.date}T00:00:00`).toLocaleDateString('pt-BR');
    const weekdayRaw = new Date(`${booking.date}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'long' });
    const weekday = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1);
    const message = [
      '*NOVO AGENDAMENTO - G DOS CORTES*',
      '',
      `*Cliente:* ${client.name}`,
      `*Data:* ${dateLabel} (${weekday})`,
      `*Horário:* ${booking.time}`,
      `*Serviço:* ${client.service.name}`,
      `*Valor:* R$ ${formatPrice(client.service.price)}`,
      `*Endereço:* ${BARBERSHOP_INFO.address}`,
      '',
      'Aguardo confirmação!',
    ].join('\n');
    const whatsappHref = `https://wa.me/${BARBERSHOP_INFO.whatsapp}?text=${encodeURIComponent(message)}`;

    return (
      <section className="ph-state-screen">
        <div className="ph-state-card">
          <div className="ph-status-icon success">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-display text-3xl uppercase text-white sm:text-4xl">
            Agendamento confirmado
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Tudo pronto, {client.name.split(' ')[0]}. Te esperamos na G dos Cortes.
          </p>

          <dl className="ph-summary mt-6 !border-[color:var(--border)] !bg-black/25 text-left">
            <div className="ph-summary-row">
              <dt>Cliente</dt>
              <dd className="text-white">{client.name}</dd>
            </div>
            <div className="ph-summary-row">
              <dt>Serviço</dt>
              <dd className="text-white">{client.service.name}</dd>
            </div>
            <div className="ph-summary-row">
              <dt>Data</dt>
              <dd className="text-white">{dateLabel} · {weekday}</dd>
            </div>
            <div className="ph-summary-row">
              <dt>Horário</dt>
              <dd className="text-white">{booking.time}</dd>
            </div>
            <div className="ph-summary-row items-center">
              <dt>Valor</dt>
              <dd className="ph-summary-total"><span className="ph-currency">R$</span> {formatPrice(client.service.price)}</dd>
            </div>
          </dl>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="ph-btn-outline mt-4 w-full"
          >
            <WhatsappIcon className="h-5 w-5" /> Enviar no WhatsApp
          </a>
          <button type="button" onClick={handleReset} className="ph-btn-brand mt-3 w-full py-3.5">
            <Scissors className="h-5 w-5" /> Novo agendamento
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      {step === STEPS.LANDING && <LandingPage onNameSubmit={handleNameSubmit} />}

      {step === STEPS.BOOKING && (
        <BookingFlow
          services={services}
          availableDates={availableDates}
          availableSlots={availableSlots}
          slotTemplate={slotTemplate}
          clientName={clientName}
          onSchedule={handleSchedule}
          onBack={() => {
            setStep(STEPS.LANDING);
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
        />
      )}
    </>
  );
}
