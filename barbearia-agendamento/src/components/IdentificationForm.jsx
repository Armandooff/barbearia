import { useState } from 'react';
import { Scissors } from 'lucide-react';

export default function IdentificationForm({ services, clientName, onConfirm, onBack }) {
  const list = services && services.length ? services : [];
  const [serviceId, setServiceId] = useState(list.length ? list[0].id : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const service = list.find((s) => s.id === serviceId);
    if (!service) return;
    onConfirm({ service });
  };

  return (
    <section className="min-h-screen graffiti-wall text-white px-5 sm:px-6 py-8 sm:py-12 flex items-center justify-center relative overflow-hidden">
      <div className="spray-splatter w-72 h-72 -top-10 -right-10" />
      <div className="w-full max-w-3xl space-y-6 sm:space-y-8 relative z-10">
        <header className="space-y-2">
          <p className="text-[#12cdb2] uppercase tracking-[.25em] text-xs font-bold">Etapa 2 de 3</p>
          <h2 className="font-display text-4xl sm:text-5xl uppercase">Escolha o serviço</h2>
          <p className="text-zinc-400">
            {clientName ? `Fala, ${clientName}! ` : ''}Selecione o serviço desejado.
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
                    'text-left p-4 sm:p-5 min-h-28 border-2 transition-all active:scale-[.99] rounded-sm',
                    selected
                      ? 'border-[#f3d64e] bg-[#f3d64e] text-black shadow-[4px_4px_0_#ed3658]'
                      : 'border-white/15 bg-black/60 text-white hover:border-[#12cdb2]',
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

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button type="button" onClick={onBack}
              className="flex-1 px-4 py-3 border-2 border-zinc-700 text-white font-bold hover:bg-zinc-900 transition">
              Voltar
            </button>
            <button type="submit"
              className="street-button flex-1 px-4 py-3 font-bold border-2 transition">
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
