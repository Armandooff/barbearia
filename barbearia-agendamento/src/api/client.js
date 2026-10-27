const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    let msg = 'Erro na requisição';
    try { const j = await res.json(); msg = j.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  getServices: () => request('/api/services'),
  getBarbers: () => request('/api/barbers'),
  getAvailability: () => request('/api/availability'),
  createAppointment: (payload) =>
    request('/api/appointments', { method: 'POST', body: JSON.stringify(payload) }),
};