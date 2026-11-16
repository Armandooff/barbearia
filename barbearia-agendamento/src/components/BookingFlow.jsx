import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  QrCode,
  Scissors,
  Wallet,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api/client';
import { BARBERSHOP_INFO, PAYMENT_METHODS, WEEKDAYS } from '../data/mocks';

const STEPS = ['service', 'date', 'time', 'confirm'];
const STEP_LABELS = {
  service: 'Serviço',
  date: 'Data',
  time: 'Horário',
  confirm: 'Confirmação',
};

const pad = (value) => String(value).padStart(2, '0');
const toISO = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseISO = (iso) => new Date(`${iso}T00:00:00`);
const formatPrice = (value) => Number(value || 0).toFixed(2).replace('.', ',');
const sentenceCase = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);
const formatMonth = (date) =>
  sentenceCase(date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
const formatDate = (iso) => parseISO(iso).toLocaleDateString('pt-BR');
const formatLongDate = (iso) =>
  sentenceCase(
    parseISO(iso).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    }),
  );

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default function BookingFlow({
  services,
  availableDates,
  availableSlots,
  slotTemplate,
  clientName,
  onSchedule,
  onPaymentComplete,
  onBack,
}) {
  const dates = useMemo(
    () => [...(availableDates || [])].filter(Boolean).sort(),
    [availableDates],
  );
  const availableSet = useMemo(() => new Set(dates), [dates]);
  const slotsMap = useMemo(() => availableSlots || {}, [availableSlots]);

  const firstMonth = useMemo(() => {
    const base = dates.length ? parseISO(dates[0]) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  }, [dates]);
  const lastMonth = useMemo(() => {
    const base = dates.length ? parseISO(dates[dates.length - 1]) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  }, [dates]);

  const [step, setStep] = useState('service');
  const [service, setService] = useState(null);
  const [viewDate, setViewDate] = useState(firstMonth);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('onsite');
  const [paymentAppointment, setPaymentAppointment] = useState(null);
  const [paymentState, setPaymentState] = useState('pending');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const stepIndex = STEPS.indexOf(step);

  const monthDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    const cells = Array.from({ length: firstDay }, () => null);
    for (let day = 1; day <= total; day += 1) cells.push(new Date(year, month, day));
    return cells;
  }, [viewDate]);

  const canPrev = viewDate > firstMonth;
  const canNext = viewDate < lastMonth;

  const template = useMemo(() => {
    if (Array.isArray(slotTemplate) && slotTemplate.length) return slotTemplate;
    return [...new Set(Object.values(slotsMap).flat())].sort();
  }, [slotTemplate, slotsMap]);

  const daySlots = selectedDate ? slotsMap[selectedDate] || [] : [];

  useEffect(() => {
    if (!paymentAppointment?.id) return undefined;
    let active = true;
    const checkPayment = async () => {
      try {
        const result = await api.getPaymentStatus(paymentAppointment.id);
        if (!active) return;
        setPaymentState(result.paymentStatus || 'pending');
        if (result.paymentStatus === 'paid') onPaymentComplete(paymentAppointment);
      } catch {
        /* Keep polling: the payment may still be confirmed by the webhook. */
      }
    };
    checkPayment();
    const interval = setInterval(checkPayment, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [paymentAppointment, onPaymentComplete]);

  const changeMonth = (delta) => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
    if (next < firstMonth || next > lastMonth) return;
    setViewDate(next);
  };

  const selectService = (item) => {
    setService(item);
    setSelectedDate(null);
    setSelectedTime(null);
    setPaymentAppointment(null);
    setPaymentState('pending');
    setError('');
    setStep('date');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectDate = (date) => {
    const iso = toISO(date);
    if (!availableSet.has(iso)) return;
    setSelectedDate(iso);
    setSelectedTime(null);
    setPaymentAppointment(null);
    setPaymentState('pending');
    setError('');
    setStep('time');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changeStep = (next) => {
    setError('');
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (step === 'service') return onBack();
    if (step === 'date') return changeStep('service');
    if (step === 'time') return changeStep('date');
    setPaymentAppointment(null);
    setPaymentState('pending');
    return changeStep('time');
  };

  const isPastTime = (time) => {
    if (selectedDate !== toISO(new Date())) return false;
    const [hour, minute] = time.split(':').map(Number);
    const now = new Date();
    return now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute);
  };

  const handleConfirm = async () => {
    if (submitting || !service || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setError('');
    try {
      const appointment = await onSchedule({
        service,
        date: selectedDate,
        time: selectedTime,
        paymentMethod,
      });
      if (paymentMethod === 'pix') {
        setPaymentAppointment(appointment);
        setPaymentState('pending');
      }
    } catch (err) {
      const message = err.message || '';
      setError(
        message.includes('Online PIX is not configured')
          ? 'O pagamento online por PIX não está disponível agora. Escolha pagar na barbearia.'
          : message.includes('no longer available')
            ? 'Esse horário acabou de ser reservado. Escolha outro horário.'
            : message || 'Não foi possível concluir o agendamento. Tente novamente.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetPix = () => {
    setPaymentAppointment(null);
    setPaymentState('pending');
    setSelectedTime(null);
    changeStep('time');
  };

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(paymentAppointment.pix.qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError('Não foi possível copiar o código. Selecione o texto manualmente.');
    }
  };

  const today = toISO(new Date());
  const pixFailed = ['expired', 'failed', 'cancelled'].includes(paymentState);

  return (
    <div className="ph-wizard">
      <header className="ph-wizard-header">
        <div className="ph-container flex items-center justify-between gap-2 py-3.5">
          <button type="button" onClick={goBack} className="ph-btn-ghost shrink-0">
            <ArrowLeft className="h-5 w-5" /> Voltar
          </button>
          <button type="button" onClick={onBack} className="ph-wordmark text-white" aria-label="Voltar para a página inicial">
            <img src={BARBERSHOP_INFO.logo} alt="" />
            <span>G DOS <span className="text-[color:var(--brand-bright)]">CORTES</span></span>
          </button>
          <span className="w-16 shrink-0" aria-hidden="true" />
        </div>
      </header>

      <main className="ph-wizard-main">
        <div className="ph-greeting mb-10 text-center">
          <h1 className="text-display text-white">
            Olá, <span className="text-[color:var(--brand-bright)]">{clientName}</span>!
          </h1>
          <p className="mt-2 text-lg text-[color:var(--muted)]">
            Escolha o serviço, data e horário do seu atendimento
          </p>
        </div>

        <div className="ph-steps" role="list" aria-label="Etapas do agendamento">
          {STEPS.map((name, index) => {
            const done = index < stepIndex;
            const active = index === stepIndex;
            return (
              <div key={name} className="flex items-center gap-2" role="listitem">
                <div
                  className={`ph-step-dot ${active ? 'active' : ''} ${done ? 'done' : ''}`}
                  aria-label={`${index + 1}. ${STEP_LABELS[name]}`}
                  aria-current={active ? 'step' : undefined}
                  title={STEP_LABELS[name]}
                >
                  {done ? <Check className="h-5 w-5" /> : index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`ph-step-line ${done ? 'done' : ''}`} aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>

        {step === 'service' && (
          <section className="step-enter" key="service">
            <h2 className="text-display ph-step-title text-white">
              Escolha o <span className="text-[color:var(--brand-bright)]">Serviço</span>
            </h2>

            {services.length === 0 ? (
              <p className="py-12 text-center text-[color:var(--muted)]">
                Nenhum serviço disponível no momento.
              </p>
            ) : (
              <div className="ph-service-grid">
                {services.map((item) => {
                  const active = service?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectService(item)}
                      className={`ph-service-card ${active ? 'selected' : ''}`}
                      aria-pressed={active}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <Scissors className="h-6 w-6 text-[color:var(--brand-bright)]" />
                        <span className="font-heading text-lg text-[color:var(--brand-bright)]">
                          R$ {formatPrice(item.price)}
                        </span>
                      </div>
                      <h3 className="font-heading mb-1 text-lg text-white">{item.name}</h3>
                      <p className="flex items-center gap-1.5 text-sm text-[color:var(--muted)]">
                        <Clock3 className="h-4 w-4" /> {item.duration} min
                      </p>
                      {item.note && (
                        <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">{item.note}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {step === 'date' && (
          <section className="step-enter" key="date">
            <h2 className="text-display ph-step-title text-white">
              Escolha a <span className="text-[color:var(--brand-bright)]">Data</span>
            </h2>
            <p className="ph-step-subtitle">
              Serviço selecionado:{' '}
              <span className="font-heading text-[color:var(--brand-bright)]">{service?.name}</span>
            </p>

            <div className="ph-panel">
              <div className="ph-cal-head">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  disabled={!canPrev}
                  className="ph-cal-nav"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="font-heading text-xl text-white">{formatMonth(viewDate)}</h3>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  disabled={!canNext}
                  className="ph-cal-nav"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="ph-cal-weekdays" aria-hidden="true">
                {WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
              </div>

              <div className="ph-cal-grid">
                {monthDays.map((date, index) => {
                  if (!date) return <span key={`empty-${index}`} aria-hidden="true" />;
                  const iso = toISO(date);
                  const isAvailable = availableSet.has(iso);
                  const isPast = date < startOfDay(new Date());
                  const isDisabled = !isAvailable || isPast;
                  const isSelected = selectedDate === iso;
                  const isToday = iso === today;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => selectDate(date)}
                      disabled={isDisabled}
                      aria-pressed={isSelected}
                      className={[
                        'ph-cal-day',
                        isAvailable && !isPast ? 'available' : '',
                        isSelected ? 'selected' : '',
                        isToday ? 'today' : '',
                      ].join(' ')}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="ph-legend">
                <span><span className="swatch" /> Disponível</span>
                <span><span className="swatch brand" /> Selecionado</span>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button type="button" onClick={goBack} className="ph-btn-ghost">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
            </div>
          </section>
        )}

        {step === 'time' && selectedDate && (
          <section className="step-enter" key="time">
            <h2 className="text-display ph-step-title text-white">
              Escolha o <span className="text-[color:var(--brand-bright)]">Horário</span>
            </h2>
            <p className="ph-step-subtitle">
              <span>{formatLongDate(selectedDate)}</span> •{' '}
              <span className="font-heading text-[color:var(--brand-bright)]">{service?.name}</span>
            </p>

            {template.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-lg text-[color:var(--muted)]">
                  Não há horários disponíveis nesta data para este serviço.
                </p>
                <p className="mt-2 text-sm text-[color:var(--muted)]">Por favor, escolha outra data.</p>
              </div>
            ) : (
              <>
                <div className="ph-slot-grid">
                  {template.map((time) => {
                    const isAvailable = daySlots.includes(time);
                    const isPast = isPastTime(time);
                    if (isAvailable && !isPast) {
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => {
                            setSelectedTime(time);
                            setPaymentAppointment(null);
                            setPaymentState('pending');
                            changeStep('confirm');
                          }}
                          className={`ph-slot available ${selectedTime === time ? 'selected' : ''}`}
                          aria-pressed={selectedTime === time}
                        >
                          {time}
                        </button>
                      );
                    }
                    return (
                      <div
                        key={time}
                        className={`ph-slot ${isPast ? 'past' : 'occupied'}`}
                        aria-label={`${time} indisponível`}
                      >
                        {time}
                      </div>
                    );
                  })}
                </div>

                <div className="ph-legend">
                  <span><span className="swatch" /> Disponível</span>
                  <span><span className="swatch occupied" /> Ocupado</span>
                </div>
              </>
            )}

            <div className="mt-8 flex justify-center">
              <button type="button" onClick={goBack} className="ph-btn-ghost">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
            </div>
          </section>
        )}

        {step === 'confirm' && selectedDate && selectedTime && service && (
          <section className="step-enter" key="confirm">
            <h2 className="text-display ph-step-title text-white">
              Confirme seu <span className="text-[color:var(--brand-bright)]">Agendamento</span>
            </h2>

            {paymentAppointment ? (
              <div className="ph-summary space-y-4">
                <div className="text-center">
                  <div className="ph-status-icon !mb-3 !h-14 !w-14">
                    <QrCode className="h-7 w-7" />
                  </div>
                  <h3 className="text-display text-2xl text-white">Pague com PIX</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[color:var(--muted)]">
                    Escaneie o QR Code ou copie o código. A confirmação chega automaticamente após o pagamento.
                  </p>
                </div>

                {paymentAppointment.pix?.qrData && (
                  <div className="ph-pix-box">
                    <QRCodeSVG value={paymentAppointment.pix.qrData} size={200} level="M" />
                  </div>
                )}

                {paymentAppointment.pix?.qrData && (
                  <div className="space-y-2">
                    <textarea
                      readOnly
                      value={paymentAppointment.pix.qrData}
                      className="ph-pix-code"
                      aria-label="Código PIX copia e cola"
                    />
                    <button type="button" onClick={copyPix} className="ph-btn-outline w-full">
                      <Copy className="h-4 w-4" /> {copied ? 'Código copiado!' : 'Copiar código PIX'}
                    </button>
                  </div>
                )}

                <p className="text-center text-xs text-[color:var(--muted)]">
                  No celular, copie o código e use um app de pagamento compatível.
                </p>

                <p
                  className={`ph-pix-status ${paymentState === 'paid' ? 'paid' : pixFailed ? 'error' : ''}`}
                  aria-live="polite"
                >
                  {paymentState === 'paid'
                    ? 'Pagamento confirmado!'
                    : pixFailed
                      ? 'Este PIX expirou ou foi recusado. Escolha outro horário.'
                      : 'Aguardando confirmação do pagamento...'}
                </p>

                {pixFailed && (
                  <button type="button" onClick={resetPix} className="ph-btn-outline w-full">
                    Escolher outro horário
                  </button>
                )}
              </div>
            ) : (
              <>
                <dl className="ph-summary">
                  <div className="ph-summary-row">
                    <dt>Cliente</dt>
                    <dd className="text-white">{clientName}</dd>
                  </div>
                  <div className="ph-summary-row">
                    <dt>Serviço</dt>
                    <dd className="max-w-[60%] text-white">
                      {service.name}
                      {service.note && (
                        <span className="mt-1 block text-xs font-normal leading-4 text-[color:var(--muted)]">
                          {service.note}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="ph-summary-row">
                    <dt>Data</dt>
                    <dd className="text-white">{formatDate(selectedDate)}</dd>
                  </div>
                  <div className="ph-summary-row">
                    <dt>Horário</dt>
                    <dd className="text-white">{selectedTime}</dd>
                  </div>
                  <div className="ph-summary-row">
                    <dt>Duração</dt>
                    <dd className="text-white">{service.duration} min</dd>
                  </div>
                  <div className="ph-summary-row">
                    <dt>Endereço</dt>
                    <dd className="max-w-[55%] text-sm text-white">{BARBERSHOP_INFO.address}</dd>
                  </div>
                  <div className="ph-summary-row items-center">
                    <dt>Valor</dt>
                    <dd className="ph-summary-total">R$ {formatPrice(service.price)}</dd>
                  </div>
                </dl>

                <div className="ph-summary !py-4">
                  <p className="font-heading mb-3 text-sm uppercase tracking-wider text-[color:var(--muted)]">
                    Como prefere pagar?
                  </p>
                  <div className="ph-payment-grid">
                    {PAYMENT_METHODS.map((method) => {
                      const active = paymentMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
                          className={`ph-payment-option ${active ? 'active' : ''}`}
                          aria-pressed={active}
                        >
                          <span className="flex items-center gap-2">
                            {method.id === 'pix'
                              ? <QrCode className="h-4 w-4 text-[color:var(--brand-bright)]" />
                              : <Wallet className="h-4 w-4 text-[color:var(--brand-bright)]" />}
                            <strong>{method.label}</strong>
                          </span>
                          <small>{method.hint}</small>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-[color:var(--muted)]">
                    {paymentMethod === 'pix'
                      ? 'O horário fica reservado por 30 minutos enquanto o PIX é pago.'
                      : 'O pagamento é feito na barbearia, no dia do atendimento.'}
                  </p>
                </div>
              </>
            )}

            {error && (
              <p className="mx-auto mb-4 max-w-lg text-center text-sm text-[color:var(--danger)]" role="alert">
                {error}
              </p>
            )}

            {!paymentAppointment && (
              <div className="mx-auto max-w-lg">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="ph-btn-brand w-full py-4 text-lg"
                >
                  {submitting ? (
                    <>Salvando...</>
                  ) : (
                    <>
                      <CheckCircle2 className="h-6 w-6" />
                      {paymentMethod === 'pix' ? 'Gerar PIX' : 'Confirmar Atendimento'}
                    </>
                  )}
                </button>
                <div className="mt-5 flex justify-center">
                  <button type="button" onClick={goBack} disabled={submitting} className="ph-btn-ghost">
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
