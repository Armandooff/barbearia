const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() { return localStorage.getItem('admin_token'); }
function setToken(t) { if (t) localStorage.setItem('admin_token', t); else localStorage.removeItem('admin_token'); }

async function request(path, options = {}) {
  const token = getToken();
  let res;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    res = await fetch(BASE + path, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(options.headers || {}),
      },
      ...options,
      signal: controller.signal,
    });
  } catch {
    const error = new Error('Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.');
    error.status = 0;
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401) {
    if (path === '/api/auth/login') {
      let msg = 'Senha incorreta.';
      try {
        const body = await res.json();
        msg = body.error || msg;
      } catch { /* resposta sem JSON */ }
      const error = new Error(msg);
      error.status = 401;
      throw error;
    }
    const hadToken = Boolean(token);
    setToken(null);
    const error = new Error('Sessão expirada. Entre novamente.');
    error.status = 401;
    if (hadToken) window.dispatchEvent(new Event('admin:unauthorized'));
    throw error;
  }
  if (!res.ok) {
    let msg = res.status >= 500
      ? 'Não foi possível concluir a solicitação. Tente novamente em instantes.'
      : 'Erro na requisição';
    try {
      const body = await res.json();
      msg = body.error || msg;
    } catch {
      /* resposta sem JSON */
    }
    const error = new Error(msg);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export const api = {
  login: (password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => setToken(null),
  getToken,
  setToken,
  getServices: () => request('/api/services'),
  putServices: (services) => request('/api/services', { method: 'PUT', body: JSON.stringify({ services }) }),
  getAvailability: () => request('/api/availability'),
  putAvailability: (payload) => request('/api/availability', { method: 'PUT', body: JSON.stringify(payload) }),
  getAppointments: () => request('/api/appointments'),
  deleteAppointment: (id) => request('/api/appointments/' + id, { method: 'DELETE' }),
  markPaymentReceived: (id) => request('/api/appointments/' + id + '/payment', { method: 'PATCH' }),
};
