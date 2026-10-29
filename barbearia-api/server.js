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

const defaultServices = [
  { id: 'cut', name: 'Corte de Cabelo', duration: 30, price: 35 },
  { id: 'beard', name: 'Barba', duration: 20, price: 25 },
  { id: 'eyebrow', name: 'Sobrancelha', duration: 15, price: 15 },
  { id: 'combo', name: 'Corte + Barba', duration: 50, price: 55 },
];

function defaultDates() {
  const today = new Date();
  const dates = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    dates.push(d.toISOString().split('T')[0]);
  }
  return [...new Set(dates)].sort();
}

const defaultTemplate = ['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];
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
            args = [JSON.stringify({ error: 'Could not save appointment data. Please retry.' })];
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
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
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
  const { clientName, serviceId, date, time, paymentMethod } = req.body || {};
  if (!clientName || !serviceId || !date || !time || !['pix', 'onsite'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Incomplete appointment details' });
  }
  const service = state.services.find((item) => item.id === serviceId);
  if (!service) return res.status(400).json({ error: 'Invalid service' });
  if (!state.availableDates.includes(date) || !(state.availableSlots[date] || []).includes(time)) {
    return res.status(409).json({ error: 'This time is no longer available. Please choose another.' });
  }
  if (paymentMethod === 'pix' && (!MP_ACCESS_TOKEN || !MP_EXTERNAL_POS_ID)) {
    return res.status(503).json({ error: 'Online PIX is not configured. Set the Mercado Pago access token and POS ID, or choose payment in person.' });
  }

  const id = crypto.randomUUID();
  const now = new Date();
  const appointment = {
    id, clientName: String(clientName).trim(), service, date, time,
    paymentMethod,
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
  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
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
  if (!MP_WEBHOOK_SECRET) return res.status(503).json({ error: 'Webhook secret is not configured' });
  if (!validateWebhookSignature(req)) return res.status(401).json({ error: 'Invalid webhook signature' });
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
  if (!ok) return res.status(401).json({ error: 'Incorrect password' });
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

app.get('/api/appointments', authMiddleware, async (req, res) => {
  await expirePendingPayments();
  res.json(state.appointments);
});

app.patch('/api/appointments/:id/payment', authMiddleware, async (req, res) => {
  const appointment = state.appointments.find((item) => item.id === req.params.id);
  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
  if (appointment.paymentMethod !== 'onsite' || appointment.paymentStatus !== 'pending' || !isActive(appointment)) {
    return res.status(409).json({ error: 'Only active in-person payments can be marked as received here' });
  }
  appointment.paymentStatus = 'paid';
  appointment.paidAt = new Date().toISOString();
  appointment.updatedAt = appointment.paidAt;
  await persist();
  res.json(appointment);
});

app.delete('/api/appointments/:id', authMiddleware, async (req, res) => {
  const appointment = state.appointments.find((item) => item.id === req.params.id);
  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
  if (appointment.paymentStatus === 'paid') {
    return res.status(409).json({ error: 'This appointment has a confirmed payment. Refund it in Mercado Pago before cancelling.' });
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
  if (!Array.isArray(services)) return res.status(400).json({ error: 'Invalid service list' });
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
