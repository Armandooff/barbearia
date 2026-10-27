import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Loader2 } from 'lucide-react';

const TABS = [
  { id: 'appointments', label: 'Agendamentos' },
  { id: 'services', label: 'Serviços' },
  { id: 'barbers', label: 'Barbeiros' },
  { id: 'availability', label: 'Disponibilidade' },
];

export default function Dashboard({ onLogout }) {
  const [tab, setTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [slotTemplate, setSlotTemplate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success'|'error', text }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadAll = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [appts, svcs, brb, avail] = await Promise.all([
        api.getAppointments(),
        api.getServices(),
        api.getBarbers(),
        api.getAvailability(),
      ]);
      setAppointments(appts);
      setServices(svcs);
      setBarbers(brb);
      setAvailableDates(avail.dates);
      setSlotTemplate(avail.template);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleCancel = async (id) => {
    try {
      await api.deleteAppointment(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      setMessage('Agendamento cancelado.');
      setToast({ type: 'success', text: 'Agendamento cancelado.' });
    } catch (e) {
      setMessage(e.message);
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
      const res = await api.putAvailability({ dates: availableDates, template: slotTemplate });
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

  const handleSaveBarbers = async () => {
    setSaving(true);
    setMessage('');
    try {
      const updated = await api.putBarbers(barbers);
      setBarbers(updated);
      setMessage('Barbeiros salvos.');
      setToast({ type: 'success', text: 'Barbeiros salvos com sucesso!' });
    } catch (e) {
      setMessage(e.message);
      setToast({ type: 'error', text: e.message || 'Erro ao salvar barbeiros.' });
    } finally {
      setSaving(false);
    }
  };

  const updateBarber = (id, field, value) => {
    setBarbers((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };
  const addBarber = () => setBarbers((prev) => [...prev, { id: crypto.randomUUID(), name: 'Novo barbeiro', specialty: '' }]);
  const removeBarber = (id) => setBarbers((prev) => prev.filter((b) => b.id !== id));

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

        {message && <p className="text-sm text-zinc-300">{message}</p>}
        <p className="text-xs text-zinc-500">As alterações só são aplicadas após clicar em "Salvar".</p>

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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-500 border-b border-zinc-800">
                      <th className="py-2 pr-4 font-display">Cliente</th>
                      <th className="py-2 pr-4 font-display">Serviço</th>
                      <th className="py-2 pr-4 font-display">Data</th>
                      <th className="py-2 pr-4 font-display">Horário</th>
                      <th className="py-2 pr-4 font-display">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr key={a.id} className="border-b border-zinc-800">
                        <td className="py-2 pr-4 text-white">{a.clientName}</td>
                        <td className="py-2 pr-4 text-zinc-300">{a.service?.name}</td>
                        <td className="py-2 pr-4 text-zinc-300">{new Date(a.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                        <td className="py-2 pr-4 text-zinc-300">{a.time}</td>
                        <td className="py-2 pr-4">
                          <button onClick={() => handleCancel(a.id)}
                            className="px-3 py-1 border-2 border-red-500 text-red-400 font-bold font-display hover:bg-red-500 hover:text-white transition">
                            Cancelar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

          {tab === 'barbers' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={addBarber}
                  className="px-4 py-2 bg-white text-black font-bold font-display border-2 border-white hover:bg-black hover:text-white transition">
                  + Adicionar barbeiro
                </button>
              </div>
              <div className="space-y-3">
                {barbers.map((b) => (
                  <div key={b.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end border-2 border-zinc-800 p-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Nome</label>
                      <input value={b.name} onChange={(e) => updateBarber(b.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-zinc-700 bg-black text-white text-sm focus:outline-none focus:border-white transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Especialidade</label>
                      <input value={b.specialty} onChange={(e) => updateBarber(b.id, 'specialty', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-zinc-700 bg-black text-white text-sm focus:outline-none focus:border-white transition" />
                    </div>
                    <div>
                      <button onClick={() => removeBarber(b.id)}
                        className="w-full px-3 py-2 border-2 border-red-500 text-red-400 font-bold font-display hover:bg-red-500 hover:text-white transition">
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveBarbers} disabled={saving}
                  className="px-4 py-2 bg-white text-black font-bold font-display border-2 border-white hover:bg-black hover:text-white disabled:bg-zinc-800 disabled:text-zinc-500 transition">
                  {saving ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</span> : 'Salvar barbeiros'}
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

              <div className="flex justify-end">
                <button onClick={handleSaveAvailability} disabled={saving}
                  className="px-4 py-2 bg-white text-black font-bold font-display border-2 border-white hover:bg-black hover:text-white disabled:bg-zinc-800 disabled:text-zinc-500 transition">
                  {saving ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</span> : 'Salvar disponibilidade'}
                </button>
              </div>
            </div>
          )}
        </div>
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
    </section>
  );
}