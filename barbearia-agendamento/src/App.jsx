import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import IdentificationForm from './components/IdentificationForm';
import CalendarSlots from './components/CalendarSlots';
import { api } from './api/client';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import GraffitiWall from './components/GraffitiWall';
import BarberIllustration from './components/BarberIllustration';

const STEPS = {
  LANDING: 'landing',
  IDENTIFY: 'identify',
  CALENDAR: 'calendar',
  SUCCESS: 'success',
};

export default function App() {
  const [step, setStep] = useState(STEPS.LANDING);
  const [clientName, setClientName] = useState('');
  const [client, setClient] = useState(null);
  const [booking, setBooking] = useState(null);

  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [svc, brb, avail] = await Promise.all([api.getServices(), api.getBarbers(), api.getAvailability()]);
      setServices(svc);
      setBarbers(brb);
      setAvailableDates(avail.dates);
      setAvailableSlots(avail.slots);
    } catch (e) {
      setError(e.message || 'Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleNameSubmit = (name) => {
    setClientName(name);
    setStep(STEPS.IDENTIFY);
  };

  const handleIdentifyConfirm = (data) => {
    setClient({ name: clientName, service: data.service });
    setStep(STEPS.CALENDAR);
  };

  const handleSchedule = async ({ date, time }) => {
    if (!client) return;
    try {
      await api.createAppointment({
        clientName: client.name,
        serviceId: client.service.id,
        barberId: client.barber?.id,
        date,
        time,
      });
      setBooking({ date, time });
      setStep(STEPS.SUCCESS);
      // refresh availability
      const avail = await api.getAvailability();
      setAvailableDates(avail.dates);
      setAvailableSlots(avail.slots);
    } catch (e) {
      alert(e.message || 'Falha ao agendar');
    }
  };

  const handleReset = () => {
    setClient(null);
    setBooking(null);
    setStep(STEPS.LANDING);
    loadData();
  };

  if (loading) {
    return (
      <section className="min-h-screen graffiti-wall flex items-center justify-center relative overflow-hidden">
        <GraffitiWall />
        <Loader2 className="w-8 h-8 text-white animate-spin relative z-10" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen graffiti-wall flex items-center justify-center px-6 relative overflow-hidden">
        <GraffitiWall />
        <div className="text-center space-y-3 relative z-10">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400 font-medium">{error}</p>
          </div>
          <button onClick={loadData} className="px-4 py-2.5 border-2 border-white text-white font-bold hover:bg-white hover:text-black transition">
            Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      {step === STEPS.LANDING && <LandingPage onNameSubmit={handleNameSubmit} />}

      {step === STEPS.IDENTIFY && (
        <IdentificationForm
          services={services}
          barbers={barbers}
          clientName={clientName}
          onConfirm={handleIdentifyConfirm}
          onBack={() => setStep(STEPS.LANDING)}
        />
      )}

      {step === STEPS.CALENDAR && (
        <CalendarSlots
          availableDates={availableDates}
          availableSlots={availableSlots}
          client={client}
          onSchedule={handleSchedule}
          onBack={() => setStep(STEPS.IDENTIFY)}
        />
      )}

      {step === STEPS.SUCCESS && client && booking && (
        <section className="min-h-screen graffiti-wall flex items-center justify-center px-6 py-12 text-white relative overflow-hidden">
          <GraffitiWall />
          <BarberIllustration className="absolute bottom-0 right-0 w-36 h-52 opacity-15 hidden lg:block" />
          <div className="max-w-md w-full border-2 border-zinc-700 bg-black/80 p-8 space-y-4 text-center relative z-10">
            <CheckCircle2 className="w-12 h-12 mx-auto text-white" />
            <h2 className="font-display text-3xl text-white">
              Agendamento confirmado
            </h2>
            <div className="text-zinc-300 space-y-1 text-sm">
              <p><span className="text-white font-bold">Cliente:</span> {client.name}</p>
              <p><span className="text-white font-bold">Serviço:</span> {client.service.name}</p>
              <p><span className="text-white font-bold">Data:</span> {new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
              <p><span className="text-white font-bold">Horário:</span> {booking.time}</p>
            </div>
            <button onClick={handleReset}
              className="mt-4 w-full px-4 py-3 bg-white text-black font-bold font-display border-2 border-white hover:bg-black hover:text-white transition">
              Novo agendamento
            </button>
          </div>
        </section>
      )}
    </>
  );
}