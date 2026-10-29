import { useState } from 'react';
import { api } from '../api/client';

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { token } = await api.login(password);
      api.setToken(token);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen graffiti-wall flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm border-2 border-zinc-800 bg-black/70 p-8 space-y-6">
        <header className="space-y-1">
          <h2 className="font-display text-3xl text-white">Área do Barbeiro</h2>
          <p className="text-zinc-400 text-sm">Acesso restrito.</p>
        </header>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full px-4 py-3 border-2 border-zinc-700 bg-black text-white placeholder-zinc-600 focus:outline-none focus:border-white transition"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-white text-black font-bold font-display border-2 border-white hover:bg-black hover:text-white disabled:bg-zinc-800 disabled:text-zinc-500 transition"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-xs text-zinc-500 text-center">Use a senha configurada no servidor.</p>
      </div>
    </section>
  );
}
