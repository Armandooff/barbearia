import { useState, useEffect } from 'react';
import {
  Ban,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Hourglass,
  Loader2,
  LogOut,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { api } from '../api/client';

const TABS = [
  { id: 'appointments', label: 'Agendamentos' },
  { id: 'services', label: 'Serviços' },
  { id: 'availability', label: 'Disponibilidade' },
];

const paymentLabel = (status) => ({
  paid: 'Recebido',
  pending: 'Pendente',
  failed: 'Falhou',
  expired: 'Expirado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  charged_back: 'Contestado',
}[status] || 'Pendente');

const appointmentLabel = (status) => ({
  pending_payment: 'Aguardando pagamento',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  expired: 'Expirado',
}[status] || 'Confirmado');

const paymentTone = (status) => {
  if (status === 'paid') return 'success';
  if (status === 'pending') return 'warning';
  return 'danger';
};

const formatMoney = (value) => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
const formatDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR');

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function Dashboard({ onLogout }) {
  const [tab, setTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [slotTemplate, setSlotTemplate] = useState([]);
  const [blocked, setBlocked] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState(null);
  const [lastSeenIds, setLastSeenIds] = useState(new Set());

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadAll = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [appts, svcs, avail] = await Promise.all([
        api.getAppointments(),
        api.getServices(),
        api.getAvailability(),
      ]);
      setAppointments(appts);
      setServices(svcs);
      setAvailableDates(avail.dates || []);
      setSlotTemplate(avail.template || []);
      setBlocked(avail.blocked || {});
      setLastSeenIds(new Set(appts.map((a) => a.id)));
    } catch (e) {
      setMessage(e.message || 'Não foi possível carregar o painel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const appts = await api.getAppointments();
        const newOnes = appts.filter((a) => !lastSeenIds.has(a.id));
        if (newOnes.length > 0) {
          setToast({ type: 'success', text: `Novo agendamento: ${newOnes[0].clientName}` });
          setLastSeenIds(new Set(appts.map((a) => a.id)));
        }
        setAppointments(appts);
      } catch { /* mantém os dados atuais */ }
    }, 10000);
    return () => clearInterval(interval);
  }, [lastSeenIds]);

  const handleCancel = async (id) => {
    if (typeof window !== 'undefined' && !window.confirm('Cancelar este agendamento? O horário será liberado.')) return;
    try {
      await api.deleteAppointment(id);
      setAppointments((prev) => prev.map((a) => (
        a.id === id ? { ...a, status: 'cancelled', paymentStatus: 'cancelled' } : a
      )));
      setMessage('Agendamento cancelado.');
      setToast({ type: 'success', text: 'Agendamento cancelado.' });
    } catch (e) {
      setMessage(e.message);
      setToast({ type: 'error', text: e.message || 'Erro ao cancelar.' });
    }
  };

  const handleMarkPaymentReceived = async (id) => {
    try {
      const updated = await api.markPaymentReceived(id);
      setAppointments((prev) => prev.map((appointment) => (
        appointment.id === id ? updated : appointment
      )));
      setToast({ type: 'success', text: 'Pagamento marcado como recebido.' });
    } catch (e) {
      setMessage(e.message);
      setToast({ type: 'error', text: e.message || 'Erro ao atualizar pagamento.' });
    }
  };

  const handleSaveServices = async () => {
    setSaving(true);
    setMessage('');
    try {
      const updated = await api.putServices(services);
      setServices(updated);
      setMessage('Serviços salvos.');
      setToast({ type: 'success', text: 'Serviços salvos com sucesso!' });
    } catch (e) {
      setMessage(e.message);
      setToast({ type: 'error', text: e.message || 'Erro ao salvar serviços.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvailability = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await api.putAvailability({ dates: availableDates, template: slotTemplate, blocked });
      setAvailableDates(res.dates || []);
      setSlotTemplate(res.template || []);
      setMessage('Disponibilidade salva.');
      setToast({ type: 'success', text: 'Disponibilidade salva com sucesso!' });
    } catch (e) {
      setMessage(e.message);
      setToast({ type: 'error', text: e.message || 'Erro ao salvar disponibilidade.' });
    } finally {
      setSaving(false);
    }
  };

  const updateService = (id, field, value) => {
    setServices((prev) => prev.map((s) => (
      s.id === id ? { ...s, [field]: field === 'name' ? value : Number(value) || 0 } : s
    )));
  };

  const addService = () => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `servico-${Date.now()}`;
    setServices((prev) => [...prev, { id, name: 'Novo serviço', duration: 30, price: 0 }]);
  };
  const removeService = (id) => setServices((prev) => prev.filter((s) => s.id !== id));

  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const addDate = () => {
    if (!newDate || availableDates.includes(newDate)) return;
    setAvailableDates((prev) => [...prev, newDate].sort());
    setNewDate('');
  };
  const removeDate = (date) => setAvailableDates((prev) => prev.filter((x) => x !== date));
  const addTime = () => {
    if (!newTime || slotTemplate.includes(newTime)) return;
    setSlotTemplate((prev) => [...prev, newTime].sort());
    setNewTime('');
  };
  const removeTime = (time) => setSlotTemplate((prev) => prev.filter((x) => x !== time));

  const [blockDate, setBlockDate] = useState('');
  const [blockTime, setBlockTime] = useState('');

  const blockSlot = () => {
    if (!blockDate || !blockTime) return;
    setBlocked((prev) => {
      const next = { ...prev };
      if (!next[blockDate]) next[blockDate] = [];
      if (!next[blockDate].includes(blockTime)) next[blockDate] = [...next[blockDate], blockTime];
      return next;
    });
    setBlockDate('');
    setBlockTime('');
  };

  const unblockSlot = (date, time) => {
    setBlocked((prev) => {
      const next = { ...prev };
      if (next[date]) {
        next[date] = next[date].filter((t) => t !== time);
        if (next[date].length === 0) delete next[date];
      }
      return next;
    });
  };

  if (loading) {
    return (
      <section className="admin-shell flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img src="/brand/gd-logo.jpg" alt="G dos Cortes" className="admin-logo" style={{ width: '5rem', height: '5rem' }} />
          <div className="flex items-center gap-2 text-[color:var(--muted)]">
            <Loader2 className="h-5 w-5 animate-spin text-[color:var(--brand-bright)]" />
            <span className="admin-kicker">Carregando painel</span>
          </div>
        </div>
      </section>
    );
  }

  const todayStr = todayISO();
  const todayAppts = appointments
    .filter((a) => a.date === todayStr && !['cancelled', 'expired'].includes(a.status))
    .sort((a, b) => a.time.localeCompare(b.time));
  const revenue = todayAppts
    .filter((a) => a.paymentStatus === 'paid')
    .reduce((sum, a) => sum + (Number(a.service?.price) || 0), 0);
  const pendingPayments = appointments
    .filter((a) => a.paymentStatus === 'pending' && !['cancelled', 'expired'].includes(a.status))
    .length;
  const next = todayAppts[0];

  return (
    <section className="admin-shell">
      <div className="admin-container space-y-6">
        <header className="admin-header flex-wrap">
          <div className="flex items-center gap-3">
            <img src="/brand/gd-logo.jpg" alt="Logo G dos Cortes" className="admin-logo" />
            <div>
              <span className="admin-kicker">G dos Cortes • Painel</span>
              <h1 className="font-display text-3xl leading-none text-white sm:text-4xl">Painel do Barbeiro</h1>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                Agendamentos, serviços e disponibilidade.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { api.logout(); onLogout(); }}
            className="admin-btn-ghost"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[color:var(--muted)]">
            As alterações só são aplicadas após clicar em &quot;Salvar&quot;.
          </p>
          <p className="text-[0.68rem] uppercase tracking-[.14em] text-[color:var(--muted)]">
            Quinta, sábado e domingo • 08h às 18h
          </p>
        </div>

        {message && (
          <div className="admin-card text-sm text-[color:var(--muted)]" role="status">{message}</div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="admin-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="admin-stat-label">Agendamentos hoje</p>
                <p className="admin-stat-value">{todayAppts.length}</p>
              </div>
              <CalendarDays className="h-4 w-4 text-[color:var(--brand-bright)]" />
            </div>
          </div>
          <div className="admin-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="admin-stat-label">Aguardando pagamento</p>
                <p className="admin-stat-value text-[color:var(--warning)]">{pendingPayments}</p>
              </div>
              <Hourglass className="h-4 w-4 text-[color:var(--warning)]" />
            </div>
          </div>
          <div className="admin-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="admin-stat-label">Recebido hoje</p>
                <p className="admin-stat-value">{formatMoney(revenue)}</p>
              </div>
              <Banknote className="h-4 w-4 text-[color:var(--success)]" />
            </div>
          </div>
          <div className="admin-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="admin-stat-label">Próximo</p>
                <p className="mt-1 font-heading text-base leading-tight text-white">
                  {next ? `${next.time} — ${next.clientName}` : 'Nenhum'}
                </p>
              </div>
              <Clock3 className="h-4 w-4 text-[color:var(--brand-bright)]" />
            </div>
          </div>
        </div>

        <div className="admin-tabs" role="tablist" aria-label="Seções do painel">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`admin-tab ${tab === item.id ? 'active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="admin-panel">
          {tab === 'appointments' && (
            appointments.length === 0 ? (
              <p className="admin-empty">Nenhum agendamento registrado.</p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {appointments.map((appointment) => (
                    <article key={appointment.id} className="admin-row space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-heading text-base text-white">{appointment.clientName}</h3>
                          <p className="text-xs text-[color:var(--muted)]">{appointment.service?.name}</p>
                        </div>
                        <span className="font-display text-xl text-[color:var(--brand-bright)]">
                          {formatMoney(appointment.service?.price)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="admin-tag">{formatDate(appointment.date)} · {appointment.time}</span>
                        <span className="admin-tag brand">{appointment.paymentMethod === 'pix' ? 'PIX' : 'Presencial'}</span>
                        <span className={`admin-tag ${paymentTone(appointment.paymentStatus)}`}>
                          {paymentLabel(appointment.paymentStatus)}
                        </span>
                        <span className="admin-tag">{appointmentLabel(appointment.status)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {appointment.paymentMethod === 'onsite' && appointment.paymentStatus === 'pending' && appointment.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleMarkPaymentReceived(appointment.id)}
                            className="admin-btn-success admin-btn-sm"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Marcar como recebido
                          </button>
                        )}
                        {appointment.paymentStatus !== 'paid'
                          && !(appointment.paymentMethod === 'pix' && appointment.status === 'pending_payment')
                          && !['cancelled', 'expired'].includes(appointment.status) && (
                            <button
                              type="button"
                              onClick={() => handleCancel(appointment.id)}
                              className="admin-btn-danger admin-btn-sm"
                            >
                              <Ban className="h-3.5 w-3.5" /> Cancelar
                            </button>
                          )}
                      </div>
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Serviço</th>
                        <th>Data</th>
                        <th>Horário</th>
                        <th>Pagamento</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appointment) => (
                        <tr key={appointment.id}>
                          <td className="font-medium text-white">{appointment.clientName}</td>
                          <td>{appointment.service?.name}</td>
                          <td>{formatDate(appointment.date)}</td>
                          <td>{appointment.time}</td>
                          <td>
                            <span className="block text-sm">
                              {appointment.paymentMethod === 'pix' ? 'PIX' : 'Presencial'}
                            </span>
                            <span className={`admin-tag mt-1 ${paymentTone(appointment.paymentStatus)}`}>
                              {paymentLabel(appointment.paymentStatus)}
                            </span>
                          </td>
                          <td>{appointmentLabel(appointment.status)}</td>
                          <td>
                            <div className="flex flex-wrap gap-1.5">
                              {appointment.paymentMethod === 'onsite' && appointment.paymentStatus === 'pending' && appointment.status === 'confirmed' && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkPaymentReceived(appointment.id)}
                                  className="admin-btn-success admin-btn-sm"
                                >
                                  Recebido
                                </button>
                              )}
                              {appointment.paymentStatus !== 'paid'
                                && !(appointment.paymentMethod === 'pix' && appointment.status === 'pending_payment')
                                && !['cancelled', 'expired'].includes(appointment.status) && (
                                  <button
                                    type="button"
                                    onClick={() => handleCancel(appointment.id)}
                                    className="admin-btn-danger admin-btn-sm"
                                  >
                                    Cancelar
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )
          )}

          {tab === 'services' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button type="button" onClick={addService} className="admin-btn">
                  <Plus className="h-4 w-4" /> Adicionar serviço
                </button>
              </div>
              <div className="space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="admin-row grid grid-cols-1 gap-3 sm:grid-cols-[1fr_7rem_7rem_auto] sm:items-end">
                    <div>
                      <label className="admin-label" htmlFor={`name-${service.id}`}>Nome</label>
                      <input
                        id={`name-${service.id}`}
                        value={service.name}
                        onChange={(e) => updateService(service.id, 'name', e.target.value)}
                        className="admin-input"
                      />
                    </div>
                    <div>
                      <label className="admin-label" htmlFor={`duration-${service.id}`}>Duração (min)</label>
                      <input
                        id={`duration-${service.id}`}
                        type="number"
                        value={service.duration}
                        onChange={(e) => updateService(service.id, 'duration', e.target.value)}
                        className="admin-input"
                      />
                    </div>
                    <div>
                      <label className="admin-label" htmlFor={`price-${service.id}`}>Preço (R$)</label>
                      <input
                        id={`price-${service.id}`}
                        type="number"
                        value={service.price}
                        onChange={(e) => updateService(service.id, 'price', e.target.value)}
                        className="admin-input"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeService(service.id)}
                      className="admin-btn-danger"
                      aria-label={`Remover ${service.name}`}
                    >
                      <Trash2 className="h-4 w-4" /> Remover
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={handleSaveServices} disabled={saving} className="admin-btn">
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                  ) : (
                    <><Save className="h-4 w-4" /> Salvar serviços</>
                  )}
                </button>
              </div>
            </div>
          )}

          {tab === 'availability' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-display text-xl text-white">Horários padrão</h3>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="admin-input max-w-[10rem]"
                    aria-label="Novo horário padrão"
                  />
                  <button type="button" onClick={addTime} className="admin-btn">
                    <Plus className="h-4 w-4" /> Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {slotTemplate.map((time) => (
                    <span key={time} className="admin-tag brand">
                      {time}
                      <button
                        type="button"
                        onClick={() => removeTime(time)}
                        className="ml-1 text-[color:var(--brand-bright)] hover:text-white"
                        aria-label={`Remover horário ${time}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3 border-t border-[color:var(--border)] pt-5">
                <h3 className="font-display text-xl text-white">Dias disponíveis</h3>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="admin-input max-w-[12rem]"
                    aria-label="Novo dia disponível"
                  />
                  <button type="button" onClick={addDate} className="admin-btn">
                    <Plus className="h-4 w-4" /> Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableDates.map((date) => (
                    <span key={date} className="admin-tag brand">
                      {formatDate(date)}
                      <button
                        type="button"
                        onClick={() => removeDate(date)}
                        className="ml-1 text-[color:var(--brand-bright)] hover:text-white"
                        aria-label={`Remover dia ${formatDate(date)}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3 border-t border-[color:var(--border)] pt-5">
                <h3 className="font-display text-xl text-white">Bloquear horário específico</h3>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="date"
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="admin-input max-w-[12rem]"
                    aria-label="Data do bloqueio"
                  />
                  <select
                    value={blockTime}
                    onChange={(e) => setBlockTime(e.target.value)}
                    className="admin-select max-w-[10rem]"
                    aria-label="Horário do bloqueio"
                  >
                    <option value="">Horário</option>
                    {slotTemplate.map((time) => <option key={time} value={time}>{time}</option>)}
                  </select>
                  <button type="button" onClick={blockSlot} className="admin-btn">
                    <Ban className="h-4 w-4" /> Bloquear
                  </button>
                </div>
                {Object.keys(blocked).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(blocked).map(([date, times]) => (
                      times.map((time) => (
                        <span key={date + time} className="admin-tag danger">
                          {formatDate(date)} {time}
                          <button
                            type="button"
                            onClick={() => unblockSlot(date, time)}
                            className="ml-1 text-[color:var(--danger)] hover:text-white"
                            aria-label={`Desbloquear ${formatDate(date)} ${time}`}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={handleSaveAvailability} disabled={saving} className="admin-btn">
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                  ) : (
                    <><Save className="h-4 w-4" /> Salvar disponibilidade</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {toast && (
          <div className={`admin-toast ${toast.type === 'success' ? 'success' : 'error'}`} role="status">
            {toast.text}
          </div>
        )}
      </div>
    </section>
  );
}
