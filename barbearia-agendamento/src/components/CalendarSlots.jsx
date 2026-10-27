import { useState, useMemo } from 'react';
import { BARBERSHOP_INFO } from '../data/mocks';
import { Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import GraffitiWall from './GraffitiWall';
import BarberIllustration from './BarberIllustration';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatMonth(date) {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
function toISO(date) { return date.toISOString().split('T')[0]; }

export default function CalendarSlots({ availableDates, availableSlots, client, onSchedule, onBack }) {
  const dates = availableDates && availableDates.length ? availableDates : [];
  const slotsMap = availableSlots || {};
  const availableSet = useMemo(() => new Set(dates), [dates]);
  const minDate = useMemo(() => (dates.length ? new Date(dates[0]) : new Date()), [dates]);
  const maxDate = useMemo(() => (dates.length ? new Date(dates[dates.length - 1]) : new Date()), [dates]);

  const [viewDate, setViewDate] = useState(() => new Date(minDate.getFullYear(), minDate.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const slots = selectedDate ? slotsMap[selectedDate] || [] : [];

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const cells = [];
    for (let i = 0; i < firstDay.getDay(); i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));
    return cells;
  }, [viewDate]);

  const canPrev = viewDate > new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const canNext = viewDate < new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  const handleDayClick = (date) => {
    const iso = toISO(date);
    if (!availableSet.has(iso)) return;
    setSelectedDate(iso);
    setSelectedTime(null);
  };

  const openConfirm = () => {
    if (selectedDate && selectedTime) setShowConfirm(true);
  };

  const handleWhatsAppConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    try {
      await onSchedule({ date: selectedDate, time: selectedTime });

      const service = client?.service;
      const price = service ? Number(service.price).toFixed(2).replace('.', ',') : '0,00';
      const dateObj = new Date(selectedDate + 'T00:00:00');
      const dateStr = dateObj.toLocaleDateString('pt-BR');
      const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });

      const message = `NOVO AGENDAMENTO - ${BARBERSHOP_INFO.name.toUpperCase()}

Cliente: ${client?.name || ''}
Data: ${dateStr} (${weekday})
Horário: ${selectedTime}
Serviço: ${service?.name || ''}
Valor: R$ ${price}
Endereço: ${BARBERSHOP_INFO.address}

Aguardo confirmação!`;

      const url = `https://wa.me/${BARBERSHOP_INFO.whatsapp}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      setShowConfirm(false);
    } catch (e) {
      alert(e.message || 'Falha ao agendar');
    } finally {
      setConfirming(false);
    }
  };

  const formattedDate = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')
    : '';
  const weekday = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })
    : '';

  return (
    <section className="min-h-screen graffiti-wall text-white px-6 py-12 relative overflow-hidden">
      <GraffitiWall />
      <BarberIllustration className="absolute bottom-0 left-0 w-36 h-52 opacity-20 hidden lg:block" />
      <div className="spray-splatter w-72 h-72 -top-10 -right-10" />
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-white" />
            <div>
              <h2 className="font-display text-4xl">Data e horário</h2>
              <p className="text-zinc-400 text-sm mt-1">Selecione um dia disponível e um horário.</p>
            </div>
          </div>
          <button onClick={onBack}
            className="px-4 py-2.5 border-2 border-zinc-700 text-white font-bold hover:bg-zinc-900 transition">
            Voltar
          </button>
        </header>

        <div className="border-2 border-zinc-800 bg-black/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              disabled={!canPrev}
              className="w-10 h-10 flex items-center justify-center border-2 border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-900 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-display text-xl text-white">{formatMonth(viewDate)}</h3>
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              disabled={!canNext}
              className="w-10 h-10 flex items-center justify-center border-2 border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-900 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase text-zinc-500 mb-2">
            {WEEKDAYS.map((w) => <div key={w} className="py-2">{w}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {daysInMonth.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;
              const iso = toISO(date);
              const isAvailable = availableSet.has(iso);
              const isSelected = selectedDate === iso;
              return (
                <button
                  key={iso}
                  onClick={() => handleDayClick(date)}
                  disabled={!isAvailable}
                  className={[
                    'aspect-square text-sm font-bold border-2 transition-all',
                    isSelected
                      ? 'bg-white text-black border-white'
                      : isAvailable
                      ? 'border-zinc-700 text-zinc-200 hover:border-white'
                      : 'border-zinc-900 text-zinc-700 cursor-not-allowed',
                  ].join(' ')}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="space-y-4 pt-6 border-t-2 border-zinc-800 mt-6">
              <h4 className="flex items-center gap-2 font-bold text-white  text-lg">
                <Clock className="w-4 h-4" /> Horários — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
              </h4>
              {slots.length === 0 ? (
                <p className="text-zinc-500 text-sm">Sem horário nesse dia.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={[
                        'px-3 py-2.5 text-sm font-bold border-2 transition-all',
                        selectedTime === time
                          ? 'bg-white text-black border-white'
                          : 'border-zinc-700 text-zinc-200 hover:border-white',
                      ].join(' ')}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={openConfirm}
                disabled={!selectedTime}
                className="w-full mt-2 px-4 py-3.5 bg-white text-black font-bold font-display border-2 border-white hover:bg-black hover:text-white disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed transition"
              >
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Concluir agendamento
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showConfirm && selectedDate && selectedTime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6">
          <div className="w-full max-w-md border-2 border-zinc-700 bg-black p-6 space-y-4">
            <h3 className=" text-2xl text-white">Confirmar agendamento</h3>
            <p className="text-zinc-400 text-sm">
              Revise os dados e confirme enviando uma mensagem no WhatsApp do barbeiro.
            </p>
            <div className="border-2 border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-200 space-y-1">
              <p><span className="text-white font-bold">Cliente:</span> {client?.name}</p>
              <p><span className="text-white font-bold">Data:</span> {formattedDate} ({weekday})</p>
              <p><span className="text-white font-bold">Horário:</span> {selectedTime}</p>
              <p><span className="text-white font-bold">Serviço:</span> {client?.service?.name}</p>
              <p><span className="text-white font-bold">Valor:</span> R$ {client?.service ? Number(client.service.price).toFixed(2).replace('.', ',') : '0,00'}</p>
              <p><span className="text-white font-bold">Endereço:</span> {BARBERSHOP_INFO.address}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-3 border-2 border-zinc-700 text-white font-bold font-display hover:bg-zinc-900 transition"
              >
                Voltar
              </button>
              <button
                onClick={handleWhatsAppConfirm}
                disabled={confirming}
                className="flex-1 px-4 py-3 bg-green-600 text-white font-bold font-display border-2 border-green-600 hover:bg-black hover:text-green-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border-zinc-700 transition"
              >
                {confirming ? 'Enviando...' : 'Confirmar no WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}