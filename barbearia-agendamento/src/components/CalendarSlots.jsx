import { useState, useMemo, useEffect } from 'react';
import { BARBERSHOP_INFO } from '../data/mocks';
import { Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import GraffitiWall from './GraffitiWall';
import BarberIllustration from './BarberIllustration';
import { api } from '../api/client';
import { QRCodeSVG } from 'qrcode.react';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatMonth(date) {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
function toISO(date) { return date.toISOString().split('T')[0]; }

export default function CalendarSlots({ availableDates, availableSlots, client, onSchedule, onPaymentComplete, onBack }) {
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
  const [paymentMethod, setPaymentMethod] = useState('onsite');
  const [paymentAppointment, setPaymentAppointment] = useState(null);
  const [paymentState, setPaymentState] = useState('pending');
  const [copied, setCopied] = useState(false);

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

  const handleConfirmAppointment = async () => {
    if (confirming || !selectedDate || !selectedTime) return;
    setConfirming(true);
    try {
      const appointment = await onSchedule({
        date: selectedDate,
        time: selectedTime,
        paymentMethod,
      });
      if (paymentMethod === 'pix') {
        setPaymentAppointment(appointment);
        setPaymentState('pending');
      } else {
        setShowConfirm(false);
      }
    } catch (error) {
      alert(error.message || 'Could not create appointment');
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    if (!paymentAppointment?.id) return undefined;
    let active = true;
    const checkPayment = async () => {
      try {
        const result = await api.getPaymentStatus(paymentAppointment.id);
        if (!active) return;
        setPaymentState(result.paymentStatus);
        if (result.paymentStatus === 'paid') onPaymentComplete(paymentAppointment);
      } catch {}
    };
    checkPayment();
    const interval = setInterval(checkPayment, 5000);
    return () => { active = false; clearInterval(interval); };
  }, [paymentAppointment, onPaymentComplete]);
  const formattedDate = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')
    : '';
  const weekday = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })
    : '';

  return (
    <section className="min-h-screen graffiti-wall text-white px-4 sm:px-6 py-6 sm:py-12 relative overflow-hidden">
      <GraffitiWall />
      <BarberIllustration className="absolute bottom-0 left-0 w-36 h-52 opacity-20 hidden lg:block" />
      <div className="spray-splatter w-72 h-72 -top-10 -right-10" />
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8 relative z-10">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-[#f3d64e] shrink-0" />
            <div>
              <p className="text-[#12cdb2] uppercase tracking-[.2em] text-[10px] sm:text-xs font-bold">Etapa 3 de 3</p>
              <h2 className="font-display text-3xl sm:text-4xl uppercase">Data e horário</h2>
              <p className="text-zinc-400 text-sm mt-1">Selecione um dia disponível e um horário.</p>
            </div>
          </div>
          <button onClick={onBack}
            className="px-3 sm:px-4 py-2.5 border-2 border-zinc-700 text-white font-bold hover:bg-zinc-900 transition shrink-0">
            Voltar
          </button>
        </header>

        <div className="street-card border-2 bg-black/70 p-3 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              disabled={!canPrev}
              className="w-11 h-11 flex items-center justify-center border-2 border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-900 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-display text-xl text-white">{formatMonth(viewDate)}</h3>
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              disabled={!canNext}
              className="w-11 h-11 flex items-center justify-center border-2 border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-900 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase text-zinc-500 mb-2">
            {WEEKDAYS.map((w) => <div key={w} className="py-2">{w}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
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
                    'aspect-square min-h-10 sm:min-h-12 text-sm font-bold border transition-all rounded-sm',
                    isSelected
                      ? 'bg-[#f3d64e] text-black border-[#f3d64e] shadow-[2px_2px_0_#ed3658]'
                      : isAvailable
                      ? 'border-zinc-700 text-zinc-100 hover:border-[#12cdb2]'
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
                        'min-h-11 px-2 py-2.5 text-sm font-bold border-2 transition-all rounded-sm',
                        selectedTime === time
                          ? 'bg-[#f3d64e] text-black border-[#f3d64e] shadow-[2px_2px_0_#ed3658]'
                          : 'border-zinc-700 text-zinc-100 hover:border-[#12cdb2]',
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
                className="street-button w-full mt-2 px-4 py-3.5 font-bold font-display uppercase border-2 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border-zinc-700 disabled:shadow-none disabled:cursor-not-allowed transition"
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 px-0 sm:px-6">
          <div className="w-full max-w-md border-2 border-zinc-700 bg-[#151310] p-5 sm:p-6 pb-[calc(1.25rem_+_env(safe-area-inset-bottom))] sm:pb-6 space-y-4 rounded-t-2xl sm:rounded-none max-h-[92dvh] overflow-y-auto">
            {paymentAppointment ? (
              <>
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 grid place-items-center bg-[#12cdb2]/15 text-[#12cdb2] rounded-full text-2xl">PIX</div>
                  <h3 className="font-display text-3xl text-white uppercase">Pague com PIX</h3>
                  <p className="text-zinc-400 text-sm">Escaneie o QR Code ou copie o codigo. A confirmacao chega automaticamente apos o pagamento.</p>
                </div>
                {paymentAppointment.pix?.qrData && <div className="w-fit mx-auto bg-white p-3"><QRCodeSVG value={paymentAppointment.pix.qrData} size={216} level="M" /></div>}
                {paymentAppointment.pix?.qrData && (
                  <div className="space-y-2">
                    <textarea readOnly value={paymentAppointment.pix.qrData} className="w-full h-20 resize-none p-3 border-2 border-zinc-700 bg-black text-zinc-200 text-xs break-all" aria-label="Codigo PIX copia e cola" />
                    <button onClick={async () => { await navigator.clipboard.writeText(paymentAppointment.pix.qrData); setCopied(true); }} className="street-button w-full px-4 py-3 font-bold border-2">{copied ? 'Codigo copiado!' : 'Copiar codigo PIX'}</button>
                  </div>
                )}
                <p className="text-xs text-zinc-500 text-center">No celular, copie o codigo e use um app de pagamento compativel.</p>
                <div className="text-center text-sm text-zinc-300" aria-live="polite">{paymentState === 'paid' ? 'Pagamento confirmado!' : ['expired', 'failed', 'cancelled'].includes(paymentState) ? 'Este PIX expirou ou foi recusado. Escolha outro horario.' : 'Aguardando confirmacao do pagamento...'}</div>
                {['expired', 'failed', 'cancelled'].includes(paymentState) && <button onClick={() => { setPaymentAppointment(null); setShowConfirm(false); setSelectedTime(null); }} className="street-button w-full px-4 py-3 font-bold border-2">Escolher outro horario</button>}
              </>
            ) : (
              <>
                <h3 className="font-display text-3xl text-white uppercase">Como prefere pagar?</h3>
                <p className="text-zinc-400 text-sm">{formattedDate} ({weekday}) as {selectedTime} · {client?.service?.name} · R$ {client?.service ? Number(client.service.price).toFixed(2).replace('.', ',') : '0,00'}</p>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setPaymentMethod('pix')} className={`p-4 min-h-24 text-left border-2 ${paymentMethod === 'pix' ? 'border-[#12cdb2] bg-[#12cdb2]/10' : 'border-zinc-700 bg-black/40'}`}>
                    <span className="block text-[#12cdb2] font-black text-lg">PIX</span><span className="text-xs text-zinc-300">Pagar agora online</span>
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('onsite')} className={`p-4 min-h-24 text-left border-2 ${paymentMethod === 'onsite' ? 'border-[#f3d64e] bg-[#f3d64e]/10' : 'border-zinc-700 bg-black/40'}`}>
                    <span className="block text-[#f3d64e] font-black text-lg">Presencial</span><span className="text-xs text-zinc-300">Pagar na barbearia</span>
                  </button>
                </div>
                {paymentMethod === 'pix' && <p className="text-sm text-zinc-400">Vamos gerar um QR Code unico para este horario. Voce nao precisa informar dados de pagamento.</p>}
                <p className="text-xs text-zinc-500">O horario fica reservado por 30 minutos enquanto o PIX e pago.</p>
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                  <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-3 border-2 border-zinc-700 text-white font-bold">Voltar</button>
                  <button onClick={handleConfirmAppointment} disabled={confirming} className="street-button flex-1 px-4 py-3 border-2 font-bold disabled:opacity-50">{confirming ? 'Processando...' : paymentMethod === 'pix' ? 'Gerar PIX' : 'Confirmar horario'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
