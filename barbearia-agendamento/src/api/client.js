const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  let res;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    res = await fetch(BASE + path, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
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

  if (!res.ok) {
    let msg = res.status >= 500
      ? 'Não foi possível concluir a solicitação. Tente novamente em instantes.'
      : 'Erro na requisição';
    try {
      const body = await res.json();
      msg = body.error || msg;
    } catch {
      /* resposta sem JSON (ex.: erro do proxy) */
    }
    const error = new Error(msg);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export const api = {
  getServices: () => request('/api/services'),
  getAvailability: () => request('/api/availability'),
  createAppointment: (payload) =>
    request('/api/appointments', { method: 'POST', body: JSON.stringify(payload) }),
  getPaymentStatus: (id) => request(`/api/appointments/${encodeURIComponent(id)}/payment-status`),
};
