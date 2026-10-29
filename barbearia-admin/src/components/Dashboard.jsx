import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Loader2 } from 'lucide-react';

const TABS = [
  { id: 'appointments', label: 'Agendamentos' },
  { id: 'services', label: 'Serviços' },
  { id: 'availability', label: 'Disponibilidade' },
];

const paymentLabel = (status) => ({
  paid: 'Recebido', pending: 'Aguardando pagamento', failed: 'Falhou', expired: 'Expirado',
  cancelled: 'Cancelado', refunded: 'Reembolsado', charged_back: 'Contestado',
}[status] || 'Aguardando pagamento');
const appointmentLabel = (status) => ({ pending_payment: 'Aguardando PIX', confirmed: 'Confirmado', cancelled: 'Cancelado', expired: 'Expirado' }[status] || 'Confirmado');
const paymentTone = (status) => status === 'paid' ? 'text-[#12cdb2] border-[#12cdb2]' : status === 'pending' ? 'text-[#f3d64e] border-[#f3d64e]' : 'text-zinc-400 border-zinc-700';
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
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
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
      setAvailableDates(avail.dates);
      setSlotTemplate(avail.template);
      setBlocked(avail.blocked || {});
      setLastSeenIds(new Set(appts.map((a) => a.id)));
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // Notificações automáticas: polling de novos agendamentos
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
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [lastSeenIds]);

  const handleCancel = async (id) => {
    try {
      await api.deleteAppointment(id);
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: 'cancelled', paymentStatus: 'cancelled' } : a));
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
      setAppointments((prev) => prev.map((appointment) => appointment.id === id ? updated : appointment));
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
      setAvailableDates(res.dates);
      setSlotTemplate(res.template);
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
    setServices((prev) => prev.map((s) =>
      s.id === id ? { ...s, [field]: field === 'name' ? value : Number(value) || 0 } : s
    ));
  };

  const addService = () => setServices((prev) => [...prev, { id: crypto.randomUUID(), name: 'Novo serviço', duration: 30, price: 0 }]);
  const removeService = (id) => setServices((prev) => prev.filter((s) => s.id !== id));

  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const addDate = () => {
    if (!newDate || availableDates.includes(newDate)) return;
    setAvailableDates((prev) => [...prev, newDate].sort());
    setNewDate('');
  };
  const removeDate = (d) => setAvailableDates((prev) => prev.filter((x) => x !== d));
  const addTime = () => {
    if (!newTime || slotTemplate.includes(newTime)) return;
    setSlotTemplate((prev) => [...prev, newTime].sort());
    setNewTime('');
  };
  const removeTime = (t) => setSlotTemplate((prev) => prev.filter((x) => x !== t));

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
      <section className="min-h-screen graffiti-wall flex items-center justify-center">
        <p className="text-zinc-400 font-medium">Carregando...</p>
      </section>
    );
  }

  return (
    <section className="min-h-screen graffiti-wall px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-3xl text-white">Painel do Barbeiro</h2>
            <p className="text-zinc-400 text-sm">Gerencie agendamentos, serviços e disponibilidade.</p>
          </div>
          <button onClick={() => { api.logout(); onLogout(); }}
            className="px-4 py-2 border-2 border-zinc-700 text-white font-bold font-display hover:bg-zinc-900 transition">
            Sair
          </button>
        </header>

        <p className="text-xs text-zinc-500">As alterações só são aplicadas após clicar em "Salvar".</p>
        {message && <p className="text-sm text-zinc-300">{message}</p>}

        {/* Painel do dia */}
        {(() => {
          const todayStr = new Date().toISOString().split('T')[0];
          const todayAppts = appointments
            .filter((a) => a.date === todayStr && !['cancelled', 'expired'].includes(a.status))
            .sort((a, b) => a.time.localeCompare(b.time));
          const revenue = todayAppts.filter((a) => a.paymentStatus === 'paid').reduce((sum, a) => sum + (Number(a.service?.price) || 0), 0);
          const pendingPayments = appointments.filter((a) => a.paymentStatus === 'pending' && !['cancelled', 'expired'].includes(a.status)).length;
          const next = todayAppts[0];
          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="border-2 border-zinc-800 bg-black/60 p-4">
                <p className="text-xs font-display uppercase text-zinc-400">Agendamentos hoje</p>
                <p className="text-2xl font-bold text-white mt-1">{todayAppts.length}</p>
              </div>
              <div className="border-2 border-zinc-800 bg-black/60 p-4">
                <p className="text-xs font-display uppercase text-zinc-400">Aguardando pagamento</p>
                <p className="text-2xl font-bold text-[#f3d64e] mt-1">{pendingPayments}</p>
              </div>
              <div className="border-2 border-zinc-800 bg-black/60 p-4">
                <p className="text-xs font-display uppercase text-zinc-400">Recebido hoje</p>
                <p className="text-2xl font-bold text-white mt-1">R$ {revenue.toFixed(2).replace('.', ',')}</p>
              </div>
              <div className="border-2 border-zinc-800 bg-black/60 p-4">
                <p className="text-xs font-display uppercase text-zinc-400">Próximo</p>
                <p className="text-lg font-bold text-white mt-1">
                  {next ? `${next.time} — ${next.clientName}` : 'Nenhum'}
                </p>
              </div>
            </div>
          );
        })()}

        <div className="flex gap-2 border-b border-zinc-800">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={[
                'px-4 py-2 text-sm font-bold font-display border-b-2 transition',
                tab === t.id ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300',
              ].join(' ')}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="border-2 border-zinc-800 bg-black/60 p-6 space-y-4">
          {tab === 'appointments' && (
            appointments.length === 0 ? (
              <p className="text-zinc-500 text-sm">Nenhum agendamento registrado.</p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {appointments.map((appointment) => (
                    <article key={appointment.id} className="border-2 border-zinc-800 bg-black/50 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div><h3 className="font-bold text-white">{appointment.clientName}</h3><p className="text-sm text-zinc-400">{appointment.service?.name}</p></div>
                        <span className="text-xs text-[#f3d64e]">R$ {Number(appointment.service?.price || 0).toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 border border-zinc-700 text-zinc-300">{new Date(appointment.date + 'T00:00:00').toLocaleDateString('pt-BR')} · {appointment.time}</span>
                        <span className="px-2 py-1 border border-zinc-700 text-zinc-300">{appointment.paymentMethod === 'pix' ? 'PIX' : 'Presencial'}</span>
                        <span className={`px-2 py-1 border ${paymentTone(appointment.paymentStatus)}`}>{paymentLabel(appointment.paymentStatus)}</span>
                        <span className="px-2 py-1 border border-zinc-700 text-zinc-400">{appointmentLabel(appointment.status)}</span>
                      </div>
                      {appointment.paymentMethod === 'onsite' && appointment.paymentStatus === 'pending' && appointment.status === 'confirmed' && <button onClick={() => handleMarkPaymentReceived(appointment.id)} className="w-full px-3 py-2 border-2 border-[#12cdb2] text-[#12cdb2] font-bold">Marcar como recebido</button>}
                      {appointment.paymentStatus !== 'paid' && !(appointment.paymentMethod === 'pix' && appointment.status === 'pending_payment') && !['cancelled', 'expired'].includes(appointment.status) && <button onClick={() => handleCancel(appointment.id)} className="w-full px-3 py-2 border-2 border-red-500 text-red-400 font-bold">Cancelar agendamento</button>}
                    </article>
                  ))}
                </div>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-zinc-500 border-b border-zinc-800">
                      <th className="py-2 pr-4 font-display">Cliente</th><th className="py-2 pr-4 font-display">Servico</th><th className="py-2 pr-4 font-display">Data</th><th className="py-2 pr-4 font-display">Horario</th><th className="py-2 pr-4 font-display">Pagamento</th><th className="py-2 pr-4 font-display">Status</th><th className="py-2 pr-4 font-display">Acoes</th>
                    </tr></thead>
                    <tbody>{appointments.map((appointment) => (
                      <tr key={appointment.id} className="border-b border-zinc-800">
                        <td className="py-3 pr-4 text-white">{appointment.clientName}</td><td className="py-3 pr-4 text-zinc-300">{appointment.service?.name}</td><td className="py-3 pr-4 text-zinc-300">{new Date(appointment.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td><td className="py-3 pr-4 text-zinc-300">{appointment.time}</td>
                        <td className="py-3 pr-4"><span className="text-zinc-300">{appointment.paymentMethod === 'pix' ? 'PIX' : 'Presencial'}</span><span className={`block text-xs ${paymentTone(appointment.paymentStatus).split(' ')[0]}`}>{paymentLabel(appointment.paymentStatus)}</span></td><td className="py-3 pr-4 text-zinc-300">{appointmentLabel(appointment.status)}</td>
                        <td className="py-3 pr-4 whitespace-nowrap">{appointment.paymentMethod === 'onsite' && appointment.paymentStatus === 'pending' && appointment.status === 'confirmed' && <button onClick={() => handleMarkPaymentReceived(appointment.id)} className="mr-2 px-2 py-1 border border-[#12cdb2] text-[#12cdb2] font-bold">Recebido</button>}{appointment.paymentStatus !== 'paid' && !(appointment.paymentMethod === 'pix' && appointment.status === 'pending_payment') && !['cancelled', 'expired'].includes(appointment.status) && <button onClick={() => handleCancel(appointment.id)} className="px-2 py-1 border border-red-500 text-red-400 font-bold">Cancelar</button>}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            )
          )}
          {tab === 'services' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={addService}
                  className="px-4 py-2 bg-white text-black font-bold font-display border-2 border-white hover:bg-black hover:text-white transition">
                  + Adicionar serviço
                </button>
              </div>
              <div className="space-y-3">
                {services.map((s) => (
                  <div key={s.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end border-2 border-zinc-800 p-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Nome</label>
                      <input value={s.name} onChange={(e) => updateService(s.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-zinc-700 bg-black text-white text-sm focus:outline-none focus:border-white transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Duração (min)</label>
                      <input type="number" value={s.duration} onChange={(e) => updateService(s.id, 'duration', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-zinc-700 bg-black text-white text-sm focus:outline-none focus:border-white transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Preço (R$)</label>
                      <input type="number" value={s.price} onChange={(e) => updateService(s.id, 'price', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-zinc-700 bg-black text-white text-sm focus:outline-none focus:border-white transition" />
                    </div>
                    <div>
                      <button onClick={() => removeService(s.id)}
                        className="w-full px-3 py-2 border-2 border-red-500 text-red-400 font-bold font-display hover:bg-red-500 hover:text-white transition">
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveServices} disabled={saving}
                  className="px-4 py-2 bg-white text-black font-bold font-display border-2 border-white hover:bg-black hover:text-white disabled:bg-zinc-800 disabled:text-zinc-500 transition">
                  {saving ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</span> : 'Salvar serviços'}
                </button>
              </div>
            </div>
          )}

          {tab === 'availability' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-display text-lg text-white">Horários padrão</h3>
                <div className="flex gap-2">
                  <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
                    className="px-3 py-2 border-2 border-zinc-700 bg-black text-white text-sm focus:outline-none focus:border-white transition" />
                  <button onClick={addTime}
                    className="px-4 py-2 bg-white text-black font-bold font-display border-2 border-white hover:bg-black hover:text-white transition">
                    Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {slotTemplate.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 px-3 py-1 border-2 border-zinc-700 text-zinc-200 text-sm">
                      {t}
                      <button onClick={() => removeTime(t)} className="text-zinc-400 hover:text-red-400 font-bold">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-lg text-white">Dias disponíveis</h3>
                <div className="flex gap-2">
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                    className="px-3 py-2 border-2 border-zinc-700 bg-black text-white text-sm focus:outline-none focus:border-white transition" />
                  <button onClick={addDate}
                    className="px-4 py-2 bg-white text-black font-bold font-display border-2 border-white hover:bg-black hover:text-white transition">
                    Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {availableDates.map((d) => (
                    <span key={d} className="inline-flex items-center gap-1 px-3 py-1 border-2 border-zinc-700 text-zinc-200 text-sm">
                      {new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')}
                      <button onClick={() => removeDate(d)} className="text-zinc-400 hover:text-red-400 font-bold">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-t border-zinc-800 pt-4">
                <h3 className="font-display text-lg text-white">Bloquear horário específico</h3>
                <div className="flex gap-2 flex-wrap">
                  <input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)}
                    className="px-3 py-2 border-2 border-zinc-700 bg-black text-white text-sm focus:outline-none focus:border-white transition" />
                  <select value={blockTime} onChange={(e) => setBlockTime(e.target.value)}
                    className="px-3 py-2 border-2 border-zinc-700 bg-black text-white text-sm focus:outline-none focus:border-white transition">
                    <option value="">Horário</option>
                    {slotTemplate.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={blockSlot}
                    className="px-4 py-2 bg-white text-black font-bold font-display border-2 border-white hover:bg-black hover:text-white transition">
                    Bloquear
                  </button>
                </div>
                {Object.keys(blocked).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {Object.entries(blocked).map(([date, times]) =>
                      times.map((t) => (
                        <span key={date + t} className="inline-flex items-center gap-1 px-3 py-1 border-2 border-red-500 text-red-400 text-sm">
                          {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')} {t}
                          <button onClick={() => unblockSlot(date, t)} className="text-red-400 hover:text-white font-bold">×</button>
                        </span>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button onClick={handleSaveAvailability} disabled={saving}
                  className="px-4 py-2 bg-white text-black font-bold font-display border-2 border-white hover:bg-black hover:text-white disabled:bg-zinc-800 disabled:text-zinc-500 transition">
                  {saving ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</span> : 'Salvar disponibilidade'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-4 py-3 border-2 font-bold font-display text-sm shadow-lg transition-all ${
            toast.type === 'success'
              ? 'bg-white text-black border-white'
              : 'bg-red-600 text-white border-red-600'
          }`}>
            {toast.text}
          </div>
        )}
      </div>
    </section>
  );
}
