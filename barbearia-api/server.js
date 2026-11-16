const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { AsyncLocalStorage } = require('node:async_hooks');
const { Pool } = require('pg');

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !Object.hasOwn(process.env, match[1])) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'barber123';
const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;
const MP_EXTERNAL_POS_ID = process.env.MERCADOPAGO_EXTERNAL_POS_ID;
const PAYMENT_HOLD_MINUTES = 30;
const DATA_FILE = path.join(__dirname, 'data.json');
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const db = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL, max: 2, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000 }) : null;
const dbContext = new AsyncLocalStorage();

// Catálogo extraído da tabela de preços e do link da bio de @gduscortes_.
const defaultServices = [
  { id: 'degrade', name: 'Corte Degradê', duration: 40, price: 25 },
  { id: 'social', name: 'Corte Social', duration: 30, price: 15 },
  { id: 'tesoura', name: 'Corte na Tesoura', duration: 45, price: 30 },
  { id: 'barba', name: 'Barba', duration: 30, price: 35 },
  { id: 'corte-barba', name: 'Corte + Barba', duration: 60, price: 55 },
  { id: 'sobrancelha', name: 'Sobrancelha', duration: 15, price: 5 },
  { id: 'pezinho', name: 'Pezinho', duration: 15, price: 5 },
  { id: 'limpeza-pele', name: 'Limpeza de Pele', duration: 20, price: 15 },
  { id: 'completo', name: 'Atendimento Completo', duration: 60, price: 40, note: 'Cabelo + sobrancelha + bigode + limpeza de pele' },
];

// Atendimento apenas quinta, sábado e domingo (08h às 18h).
function defaultDates() {
  const today = new Date();
  const dates = [];
  for (let i = 1; i <= 56; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if ([0, 4, 6].includes(d.getDay())) {
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dates.push(iso);
    }
  }
  return [...new Set(dates)].sort();
}

// Intervalos de 50 minutos: 08:00 até 18:00.
const defaultTemplate = ['08:00','08:50','09:40','10:30','11:20','12:10','13:00','13:50','14:40','15:30','16:20','17:10'];

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Se todas as datas salvas já passaram, renova a agenda para as próximas semanas.
function refreshStaleDates(current) {
  const dates = Array.isArray(current.availableDates) ? current.availableDates : [];
  if (!dates.length || dates.some((date) => date >= todayISO())) return false;
  current.availableDates = defaultDates();
  current.blocked = {};
  return true;
}

// Estado antigo (antes do perfil atual): troca apenas quando ninguém personalizou o catálogo.
const legacyDefaultServices = [
  { id: 'cut', name: 'Corte de Cabelo' },
  { id: 'beard', name: 'Barba' },
  { id: 'eyebrow', name: 'Sobrancelha' },
  { id: 'combo', name: 'Corte + Barba' },
];

function migrateLegacyCatalog(current) {
  const services = current.services;
  if (!Array.isArray(services) || services.length !== legacyDefaultServices.length) return false;
  const isLegacy = legacyDefaultServices.every((legacy) =>
    services.some((service) => service.id === legacy.id && service.name === legacy.name)
  );
  if (!isLegacy) return false;
  current.services = defaultServices.map((service) => ({ ...service }));
  current.slotTemplate = [...defaultTemplate];
  return true;
}
let stateData = {
  services: defaultServices,
  availableDates: defaultDates(),
  slotTemplate: defaultTemplate,
  blocked: {},
  availableSlots: {},
  appointments: [],
};
const state = new Proxy({}, {
  get(_target, key) {
    const requestState = dbContext.getStore()?.state;
    const current = requestState || stateData;
    return key === 'toJSON' ? () => current : current[key];
  },
  set(_target, key, value) {
    const requestState = dbContext.getStore()?.state;
    (requestState || stateData)[key] = value;
    return true;
  },
});

// Never copy local appointment data into a remote database implicitly.
if (!DATABASE_URL && fs.existsSync(DATA_FILE)) {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    stateData = { ...stateData, ...raw };
  } catch (error) {
    console.error('Failed to load data.json', error);
  }
}

stateData.blocked ||= {};
stateData.appointments = (stateData.appointments || []).map((appointment) => ({
  ...appointment,
  paymentMethod: appointment.paymentMethod || 'onsite',
  paymentStatus: appointment.paymentStatus || 'pending',
}));
refreshStaleDates(stateData);
migrateLegacyCatalog(stateData);

async function persist() {
  if (db) {
    const client = dbContext.getStore();
    const connection = client || db;
    await connection.query('UPDATE barbearia_state SET payload = $1::jsonb WHERE id = 1', [JSON.stringify(state)]);
    return;
  }
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Failed to persist data', error);
  }
}

function isActive(appointment) {
  return appointment.status !== 'cancelled' && appointment.status !== 'expired';
}

function rebuildSlots(current = state) {
  const activeBookings = new Set(current.appointments.filter(isActive).map((a) => `${a.date}|${a.time}`));
  current.availableSlots = Object.fromEntries(current.availableDates.map((date) => {
    const blockedTimes = current.blocked[date] || [];
    const slots = (current.slotTemplate || []).filter((time) =>
      !blockedTimes.includes(time) && !activeBookings.has(`${date}|${time}`)
    );
    return [date, slots];
  }));
}

async function releaseSlot(appointment) {
  appointment.status = 'expired';
  if (appointment.paymentStatus === 'paid') appointment.paymentStatus = 'refunded';
  else if (appointment.paymentStatus === 'pending') appointment.paymentStatus = 'expired';
  appointment.updatedAt = new Date().toISOString();
  rebuildSlots();
  await persist();
}

async function expirePendingPayments() {
  const now = Date.now();
  let changed = false;
  for (const appointment of state.appointments) {
    if (appointment.status === 'pending_payment' && appointment.paymentExpiresAt && Date.parse(appointment.paymentExpiresAt) <= now) {
      appointment.status = 'expired';
      appointment.paymentStatus = 'expired';
      appointment.updatedAt = new Date().toISOString();
      changed = true;
    }
  }
  if (changed) {
    rebuildSlots();
    await persist();
  }
}

rebuildSlots();

function hydrateState(payload) {
  const saved = typeof payload === 'string' ? JSON.parse(payload) : payload;
  const next = { ...stateData, ...(saved || {}) };
  next.blocked ||= {};
  next.appointments = (next.appointments || []).map((appointment) => ({
    ...appointment,
    paymentMethod: appointment.paymentMethod || 'onsite',
    paymentStatus: appointment.paymentStatus || 'pending',
  }));
  refreshStaleDates(next);
  migrateLegacyCatalog(next);
  rebuildSlots(next);
  return next;
}

app.use(async (req, res, next) => {
  if (!db) return next();
  let client;
  try {
    await databaseReady;
    const needsTransaction = req.method !== 'GET'
      || req.path === '/api/availability'
      || req.path === '/api/appointments'
      || /^\/api\/appointments\/[^/]+\/payment-status$/.test(req.path);

    if (!needsTransaction) {
      const result = await db.query('SELECT payload FROM barbearia_state WHERE id = 1');
      const requestState = hydrateState(result.rows[0]?.payload);
      return dbContext.run({ state: requestState }, next);
    }

    client = await db.connect();
    await client.query('BEGIN');
    const result = await client.query('SELECT payload FROM barbearia_state WHERE id = 1 FOR UPDATE');
    const requestState = hydrateState(result.rows[0]?.payload);
    let finalizePromise;
    const originalEnd = res.end;
    res.end = function (...args) {
      if (!finalizePromise) {
        finalizePromise = (async () => {
          try {
            if (res.statusCode >= 400) await client.query('ROLLBACK');
            else await client.query('COMMIT');
          } catch (error) {
            console.error('Could not finalize database transaction', error);
            await client.query('ROLLBACK').catch(() => {});
            res.statusCode = 503;
            res.removeHeader('Content-Length');
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            args = [JSON.stringify({ error: 'Não foi possível salvar o agendamento. Tente novamente.' })];
          } finally {
            client.release();
          }
          return originalEnd.apply(this, args);
        })();
      }
      return this;
    };
    dbContext.run({ client, state: requestState }, next);
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
      client.release();
    }
    next(error);
  }
});

const adminHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão inválida. Entre novamente.' });
  }
}

async function getMercadoPagoOrder(orderId) {
  const response = await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  const order = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(order.message || 'Could not verify PIX order');
  return order;
}

async function applyProviderOrderStatus(appointment, order) {
  if (!appointment || !order || String(order.external_reference) !== appointment.id) return false;
  appointment.providerOrderId = String(order.id);
  appointment.providerStatus = order.status;
  appointment.providerStatusDetail = order.status_detail || null;
  appointment.updatedAt = new Date().toISOString();
  const transactionStatus = order.transactions?.payments?.[0]?.status;
  if (order.status === 'processed' || transactionStatus === 'processed') {
    appointment.paymentStatus = 'paid';
    appointment.status = 'confirmed';
    appointment.paidAt = order.last_updated_date || appointment.updatedAt;
  } else if (['canceled', 'expired'].includes(order.status)) {
    appointment.paymentStatus = order.status;
    await releaseSlot(appointment);
    return true;
  } else if (order.status === 'refunded') {
    appointment.paymentStatus = 'refunded';
    appointment.status = 'cancelled';
    rebuildSlots();
  }
  await persist();
  return true;
}

function validateWebhookSignature(req) {
  if (!MP_WEBHOOK_SECRET) return false;
  const signature = req.headers['x-signature'] || '';
  const requestId = req.headers['x-request-id'] || '';
  const dataId = String(req.query['data.id'] || req.query.id || req.body?.data?.id || '').toLowerCase();
  const fields = Object.fromEntries(signature.split(',').map((part) => part.trim().split('=')));
  if (!fields.ts || !fields.v1 || !dataId) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${fields.ts};`;
  const expected = crypto.createHmac('sha256', MP_WEBHOOK_SECRET).update(manifest).digest();
  let received;
  try { received = Buffer.from(fields.v1, 'hex'); } catch { return false; }
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

app.get('/api/services', (req, res) => res.json(state.services));

app.get('/api/availability', async (req, res) => {
  await expirePendingPayments();
  res.json({ dates: state.availableDates, slots: state.availableSlots, template: state.slotTemplate, blocked: state.blocked });
});

app.post('/api/appointments', async (req, res) => {
  await expirePendingPayments();
  const { clientName, serviceId, date, time, paymentMethod, requestId } = req.body || {};
  const normalizedRequestId = typeof requestId === 'string' && requestId.length <= 120 ? requestId : null;

  // Repetição segura da mesma solicitação (evita duplicar ao tentar novamente).
  if (normalizedRequestId) {
    const existing = state.appointments.find((item) => item.requestId === normalizedRequestId);
    if (existing) return res.status(200).json(existing);
  }

  if (!clientName || !serviceId || !date || !time || !['pix', 'onsite'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Dados do agendamento incompletos.' });
  }
  const legacyServiceIds = { cut: 'degrade', beard: 'barba', eyebrow: 'sobrancelha', combo: 'corte-barba' };
  const normalizedServiceId = legacyServiceIds[serviceId] || serviceId;
  const service = state.services.find((item) => item.id === normalizedServiceId);
  if (!service) return res.status(400).json({ error: 'Serviço inválido. Atualize a página e escolha novamente.' });
  if (!state.availableDates.includes(date) || !(state.availableSlots[date] || []).includes(time)) {
    return res.status(409).json({ error: 'Este horário não está mais disponível. Escolha outro.' });
  }
  if (paymentMethod === 'pix' && (!MP_ACCESS_TOKEN || !MP_EXTERNAL_POS_ID)) {
    return res.status(503).json({ error: 'O pagamento online por PIX não está disponível. Escolha pagar presencialmente.' });
  }

  const id = crypto.randomUUID();
  const now = new Date();
  const appointment = {
    id, clientName: String(clientName).trim(), service, date, time,
    paymentMethod,
    requestId: normalizedRequestId,
    paymentStatus: 'pending',
    status: paymentMethod === 'pix' ? 'pending_payment' : 'confirmed',
    createdAt: now.toISOString(),
    paymentExpiresAt: paymentMethod === 'pix' ? new Date(now.getTime() + PAYMENT_HOLD_MINUTES * 60_000).toISOString() : null,
  };
  state.appointments.unshift(appointment);
  rebuildSlots();
  await persist();

  if (paymentMethod === 'onsite') return res.status(201).json(appointment);

  try {
    const response = await fetch('https://api.mercadopago.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': id,
      },
      body: JSON.stringify({
        type: 'qr',
        total_amount: Number(service.price).toFixed(2),
        description: service.name,
        external_reference: id,
        expiration_time: `PT${PAYMENT_HOLD_MINUTES}M`,
        config: { qr: { external_pos_id: MP_EXTERNAL_POS_ID, mode: 'dynamic' } },
        transactions: { payments: [{ amount: Number(service.price).toFixed(2) }] },
        items: [{ title: service.name, unit_price: Number(service.price).toFixed(2), unit_measure: 'unit', external_code: service.id, quantity: 1 }],
      }),
    });
    const order = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(order.message || order.cause?.[0]?.description || 'Could not create PIX QR code');
    if (!order.qr_data) throw new Error('Mercado Pago did not return a dynamic QR code. Check the configured POS.');
    appointment.providerOrderId = String(order.id);
    appointment.providerStatus = order.status;
    appointment.pix = { qrData: order.qr_data, expiresAt: appointment.paymentExpiresAt };
    await persist();
    res.status(201).json(appointment);
  } catch (error) {
    state.appointments = state.appointments.filter((item) => item.id !== id);
    rebuildSlots();
    await persist();
    res.status(502).json({ error: error.message || 'Could not create PIX payment' });
  }
});

app.get('/api/appointments/:id/payment-status', async (req, res) => {
  await expirePendingPayments();
  const appointment = state.appointments.find((item) => item.id === req.params.id);
  if (!appointment) return res.status(404).json({ error: 'Agendamento não encontrado.' });
  if (appointment.paymentMethod === 'pix' && appointment.providerOrderId && MP_ACCESS_TOKEN && appointment.status === 'pending_payment') {
    try {
      const order = await getMercadoPagoOrder(appointment.providerOrderId);
      await applyProviderOrderStatus(appointment, order);
    } catch (error) {
      console.error('PIX order status check failed', error.message);
    }
  }
  res.json({ status: appointment.status, paymentStatus: appointment.paymentStatus, expiresAt: appointment.paymentExpiresAt });
});

app.post('/api/payments/webhook', async (req, res) => {
  if (!MP_WEBHOOK_SECRET) return res.status(503).json({ error: 'Webhook do PIX não configurado.' });
  if (!validateWebhookSignature(req)) return res.status(401).json({ error: 'Assinatura do webhook inválida.' });
  const orderId = req.query['data.id'] || req.body?.data?.id;
  if (!orderId || !MP_ACCESS_TOKEN) return res.sendStatus(200);
  try {
    const order = await getMercadoPagoOrder(orderId);
    const appointment = state.appointments.find((item) => item.id === order.external_reference);
    if (appointment) await applyProviderOrderStatus(appointment, order);
    res.sendStatus(200);
  } catch (error) {
    console.error('PIX order webhook processing failed', error.message);
    res.sendStatus(500);
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { password } = req.body || {};
  const ok = await bcrypt.compare(password || '', adminHash);
  if (!ok) return res.status(401).json({ error: 'Senha incorreta.' });
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

app.get('/api/appointments', authMiddleware, async (req, res) => {
  await expirePendingPayments();
  res.json(state.appointments);
});

app.patch('/api/appointments/:id/payment', authMiddleware, async (req, res) => {
  const appointment = state.appointments.find((item) => item.id === req.params.id);
  if (!appointment) return res.status(404).json({ error: 'Agendamento não encontrado.' });
  if (appointment.paymentMethod !== 'onsite' || appointment.paymentStatus !== 'pending' || !isActive(appointment)) {
    return res.status(409).json({ error: 'Apenas pagamentos presenciais ativos podem ser marcados como recebidos.' });
  }
  appointment.paymentStatus = 'paid';
  appointment.paidAt = new Date().toISOString();
  appointment.updatedAt = appointment.paidAt;
  await persist();
  res.json(appointment);
});

app.delete('/api/appointments/:id', authMiddleware, async (req, res) => {
  const appointment = state.appointments.find((item) => item.id === req.params.id);
  if (!appointment) return res.status(404).json({ error: 'Agendamento não encontrado.' });
  if (appointment.paymentStatus === 'paid') {
    return res.status(409).json({ error: 'Este agendamento já foi pago. Estorne no Mercado Pago antes de cancelar.' });
  }
  appointment.status = 'cancelled';
  appointment.paymentStatus = 'cancelled';
  appointment.updatedAt = new Date().toISOString();
  rebuildSlots();
  await persist();
  res.json({ ok: true });
});

app.put('/api/services', authMiddleware, async (req, res) => {
  const { services } = req.body || {};
  if (!Array.isArray(services)) return res.status(400).json({ error: 'Lista de serviços inválida.' });
  state.services = services;
  await persist();
  res.json(state.services);
});

app.put('/api/availability', authMiddleware, async (req, res) => {
  const { dates, template, blocked } = req.body || {};
  if (Array.isArray(dates)) state.availableDates = [...new Set(dates)].sort();
  if (Array.isArray(template)) state.slotTemplate = template;
  if (blocked && typeof blocked === 'object') state.blocked = blocked;
  state.blocked = Object.fromEntries(Object.entries(state.blocked).filter(([date]) => state.availableDates.includes(date)));
  rebuildSlots();
  await persist();
  res.json({ dates: state.availableDates, slots: state.availableSlots, template: state.slotTemplate, blocked: state.blocked });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Sempre responde JSON para o frontend conseguir mostrar uma mensagem útil.
app.use((error, req, res, next) => {
  console.error('API error:', error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: 'Erro interno no servidor. Tente novamente.' });
});

async function initializeDatabase() {
  if (!db) return;
  await db.query(`CREATE TABLE IF NOT EXISTS barbearia_state (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await db.query(
    'INSERT INTO barbearia_state (id, payload) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING',
    [JSON.stringify(stateData)],
  );
  const result = await db.query('SELECT payload FROM barbearia_state WHERE id = 1');
  if (result.rows[0]?.payload) stateData = hydrateState(result.rows[0].payload);
  console.log('PostgreSQL persistence enabled');
}

const databaseReady = initializeDatabase();

if (require.main === module) {
  databaseReady
    .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
    .catch((error) => {
      console.error('Could not initialize PostgreSQL database', error);
      process.exit(1);
    });
} else {
  module.exports = app;
}
