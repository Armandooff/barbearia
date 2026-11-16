import { useState } from 'react';
import { ArrowRight, Loader2, Lock } from 'lucide-react';
import { api } from '../api/client';

export default function Login({ onSuccess, notice = '', onNoticeDismiss }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (notice && onNoticeDismiss) onNoticeDismiss();
    setLoading(true);
    setError('');
    try {
      const { token } = await api.login(password);
      api.setToken(token);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Falha no login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-shell flex items-center justify-center px-5 py-10">
      <div className="admin-login-card">
        <div className="flex flex-col items-center text-center">
          <img
            src="/brand/gd-logo.jpg"
            alt="Logo G dos Cortes"
            className="admin-logo mb-4"
            style={{ width: '5rem', height: '5rem' }}
          />
          <span className="admin-kicker">Acesso restrito</span>
          <h1 className="font-display mt-2 text-4xl leading-none text-white">Painel do Barbeiro</h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            G dos Cortes • Estilo, qualidade e respeito.
          </p>
        </div>

        {notice && (
          <div className="mt-5 rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-center text-sm text-amber-300" role="status">
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label htmlFor="admin-password" className="admin-label">Senha</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha do painel"
                autoComplete="current-password"
                autoFocus
                className="admin-input with-icon"
              />
            </div>
          </div>

          {error && <p className="text-sm text-[color:var(--danger)]" role="alert">{error}</p>}

          <button type="submit" disabled={loading} className="admin-btn w-full py-3">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Entrando...</>
            ) : (
              <>Entrar <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-white/5 pt-5 text-center">
          <p className="text-xs text-[color:var(--muted)]">Acesso exclusivo do barbeiro.</p>
          <p className="mt-1 text-[0.65rem] uppercase tracking-[.14em] text-[color:var(--muted)]">
            Use a senha configurada no servidor.
          </p>
        </div>
      </div>
    </section>
  );
}
