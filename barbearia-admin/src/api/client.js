const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() { return localStorage.getItem('admin_token'); }
function setToken(t) { if (t) localStorage.setItem('admin_token', t); else localStorage.removeItem('admin_token'); }

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  if (res.status === 401) { setToken(null); throw new Error('Não autorizado'); }
  if (!res.ok) {
    let msg = 'Erro na requisição';
    try { const j = await res.json(); msg = j.error || msg; } catch {}
    throw new Error(msg);
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
  getBarbers: () => request('/api/barbers'),
  putBarbers: (barbers) => request('/api/barbers', { method: 'PUT', body: JSON.stringify({ barbers }) }),
  getAvailability: () => request('/api/availability'),
  putAvailability: (payload) => request('/api/availability', { method: 'PUT', body: JSON.stringify(payload) }),
  getAppointments: () => request('/api/appointments'),
  deleteAppointment: (id) => request('/api/appointments/' + id, { method: 'DELETE' }),
  getReviews: () => request('/api/reviews'),
  deleteReview: (id) => request('/api/reviews/' + id, { method: 'DELETE' }),
};