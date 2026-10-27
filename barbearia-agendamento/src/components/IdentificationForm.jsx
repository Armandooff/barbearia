import { useState } from 'react';
import { Scissors, User } from 'lucide-react';

export default function IdentificationForm({ services, barbers, clientName, onConfirm, onBack }) {
  const list = services && services.length ? services : [];
  const barberList = barbers && barbers.length ? barbers : [];
  const [serviceId, setServiceId] = useState(list.length ? list[0].id : '');
  const [barberId, setBarberId] = useState(barberList.length ? barberList[0].id : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const service = list.find((s) => s.id === serviceId);
    const barber = barberList.find((b) => b.id === barberId) || barberList[0];
    if (!service) return;
    onConfirm({ service, barber });
  };

  return (
    <section className="min-h-screen graffiti-wall text-white px-6 py-12 flex items-center justify-center relative overflow-hidden">
      <div className="spray-splatter w-72 h-72 -top-10 -right-10" />
      <div className="w-full max-w-3xl space-y-8 relative z-10">
        <header className="space-y-2">
          <h2 className="font-display text-4xl">Escolha o serviço</h2>
          <p className="text-zinc-400">
            {clientName ? `Fala, ${clientName}! ` : ''}Selecione o serviço e o barbeiro.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {list.map((s) => {
              const selected = serviceId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServiceId(s.id)}
                  className={[
                    'text-left p-5 border-2 transition-all hover-lift',
                    selected
                      ? 'border-white bg-white text-black'
                      : 'border-zinc-700 bg-black/60 text-white hover:border-white',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4" />
                    <p className="font-bold text-lg">{s.name}</p>
                  </div>
                  <p className="text-sm mt-1 opacity-80">{s.duration} min</p>
                  <p className="text-xl font-black mt-2">R$ {s.price},00</p>
                </button>
              );
            })}
          </div>

          {barberList.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <User className="w-4 h-4 text-white" /> Barbeiro
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {barberList.map((b) => {
                  const selected = barberId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBarberId(b.id)}
                      className={[
                        'text-left p-4 border-2 transition-all hover-lift',
                        selected
                          ? 'border-white bg-white text-black'
                          : 'border-zinc-700 bg-black/60 text-white hover:border-white',
                      ].join(' ')}
                    >
                      <p className="font-bold">{b.name}</p>
                      <p className="text-xs mt-1 opacity-80">{b.specialty}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onBack}
              className="flex-1 px-4 py-3 border-2 border-zinc-700 text-white font-bold hover:bg-zinc-900 transition">
              Voltar
            </button>
            <button type="submit"
              className="flex-1 px-4 py-3 bg-white text-black font-bold border-2 border-white hover:bg-black hover:text-white transition">
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}