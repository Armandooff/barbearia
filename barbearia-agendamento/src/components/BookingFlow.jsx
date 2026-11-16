import { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  QrCode,
  Scissors,
  Wallet,
} from 'lucide-react';
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPixNotice, setShowPixNotice] = useState(false);
  const requestIdRef = useRef(null);

  const newRequestId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

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

  const changeMonth = (delta) => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
    if (next < firstMonth || next > lastMonth) return;
    setViewDate(next);
  };

  const selectService = (item) => {
    setService(item);
    setSelectedDate(null);
    setSelectedTime(null);
    requestIdRef.current = null;
    setError('');
    setStep('date');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const selectDate = (date) => {
    const iso = toISO(date);
    if (!availableSet.has(iso)) return;
    setSelectedDate(iso);
    setSelectedTime(null);
    requestIdRef.current = null;
    setError('');
    setStep('time');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const changeStep = (next) => {
    setError('');
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const goBack = () => {
    if (step === 'service') return onBack();
    if (step === 'date') return changeStep('service');
    if (step === 'time') return changeStep('date');
    return changeStep('time');
  };

  const isPastTime = (time) => {
    if (selectedDate !== toISO(new Date())) return false;
    const [hour, minute] = time.split(':').map(Number);
    const now = new Date();
    return now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute);
  };

  const friendlyError = (err) => {
    const message = err?.message || '';
    if (/no longer available|não está mais disponível|já foi reservado/i.test(message)) {
      return 'Esse horário acabou de ser reservado. Escolha outro horário.';
    }
    if (/invalid service|serviço inválido/i.test(message)) {
      return 'O serviço selecionado foi atualizado. Volte e escolha novamente.';
    }
    if (!err?.status || err.status >= 500) {
      return 'Não foi possível concluir o agendamento agora. Tente novamente em instantes.';
    }
    return message || 'Não foi possível concluir o agendamento. Tente novamente.';
  };

  const handleConfirm = async () => {
    if (submitting || !service || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setError('');
    if (!requestIdRef.current) requestIdRef.current = newRequestId();
    const payload = {
      service,
      date: selectedDate,
      time: selectedTime,
      paymentMethod: 'onsite',
      requestId: requestIdRef.current,
    };

    try {
      let lastError;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          await onSchedule(payload);
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
          const retryable = !err?.status || err.status >= 500;
          if (!retryable || attempt === 1) break;
          await new Promise((resolve) => { setTimeout(resolve, 900); });
        }
      }
      if (lastError) throw lastError;
    } catch (err) {
      const message = err?.message || '';
      const conflict = err?.status === 409
        || /no longer available|não está mais disponível|já foi reservado/i.test(message);
      setError(friendlyError(err));
      if (conflict) {
        requestIdRef.current = null;
        setSelectedTime(null);
        setStep('time');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const today = toISO(new Date());

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
          <span className="w-8 shrink-0 sm:w-16" aria-hidden="true" />
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
                        isToday && isAvailable && !isPast ? 'today' : '',
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

            {error && (
              <p className="mx-auto mb-5 max-w-lg text-center text-sm text-[color:var(--danger)]" role="alert">
                {error}
              </p>
            )}

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
                            requestIdRef.current = null;
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
                  const isPix = method.id === 'pix';
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => { if (isPix) setShowPixNotice(true); }}
                      className={`ph-payment-option ${isPix ? '' : 'active'}`}
                      aria-pressed={!isPix}
                    >
                      <span className="flex w-full items-center gap-2">
                        {isPix
                          ? <QrCode className="h-4 w-4 text-[color:var(--brand-bright)]" />
                          : <Wallet className="h-4 w-4 text-[color:var(--brand-bright)]" />}
                        <strong>{method.label}</strong>
                        {isPix && <span className="ph-dev-badge">Em desenvolvimento</span>}
                      </span>
                      <small>{method.hint}</small>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[color:var(--muted)]">
                O pagamento presencial é feito na barbearia, no dia do atendimento. O PIX online ainda está em desenvolvimento.
              </p>
            </div>

            {error && (
              <p className="mx-auto mb-4 max-w-lg text-center text-sm text-[color:var(--danger)]" role="alert">
                {error}
              </p>
            )}

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
                    Confirmar Atendimento
                  </>
                )}
              </button>
              <div className="mt-5 flex justify-center">
                <button type="button" onClick={goBack} disabled={submitting} className="ph-btn-ghost">
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {showPixNotice && (
        <div
          className="ph-modal-backdrop"
          role="presentation"
          onClick={() => setShowPixNotice(false)}
        >
          <div
            className="ph-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pix-dev-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ph-status-icon">
              <QrCode className="h-8 w-8" />
            </div>
            <h3 id="pix-dev-title" className="text-display text-3xl uppercase text-white">
              Em desenvolvimento
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">
              O pagamento por QR Code / PIX ainda está em desenvolvimento. Escolha pagar presencialmente na barbearia.
            </p>
            <button
              type="button"
              onClick={() => setShowPixNotice(false)}
              className="ph-btn-brand mt-5 w-full py-3.5"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
