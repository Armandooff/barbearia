const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'barber123';

const DATA_FILE = path.join(__dirname, 'data.json');

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

function rebuildSlots(dates, template) {
  const obj = {};
  dates.forEach((d) => { obj[d] = [...template]; });
  return obj;
}

let state = {
  services: defaultServices,
  availableDates: defaultDates(),
  slotTemplate: defaultTemplate,
  blocked: {},
  availableSlots: null,
  appointments: [],
};

function computeSlots(dates, template, blocked) {
  const obj = {};
  dates.forEach((d) => {
    const blockedTimes = (blocked && blocked[d]) || [];
    obj[d] = (template || []).filter((t) => !blockedTimes.includes(t));
  });
  return obj;
}

// ensure availableSlots initialized
if (!state.availableSlots) {
  state.availableSlots = computeSlots(state.availableDates, state.slotTemplate, state.blocked);
}

state.availableSlots = rebuildSlots(state.availableDates, state.slotTemplate);

// Load persisted data if exists
if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    state = { ...state, ...raw };
    if (!state.blocked) state.blocked = {};
    state.availableSlots = computeSlots(state.availableDates, state.slotTemplate, state.blocked);
  } catch (e) {
    console.error('Failed to load data.json', e);
  }
}

function persist() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('Failed to persist data', e);
  }
}

// Pre-hash admin password
const adminHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token ausente' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Public routes
app.get('/api/services', (req, res) => res.json(state.services));

app.get('/api/availability', (req, res) => {
  res.json({
    dates: state.availableDates,
    slots: state.availableSlots,
    template: state.slotTemplate,
    blocked: state.blocked,
  });
});

app.post('/api/appointments', (req, res) => {
  const { clientName, serviceId, date, time } = req.body || {};
  if (!clientName || !serviceId || !date || !time) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) return res.status(400).json({ error: 'Serviço inválido' });
  if (!state.availableDates.includes(date)) return res.status(400).json({ error: 'Data indisponível' });
  if (!(state.availableSlots[date] || []).includes(time)) {
    return res.status(400).json({ error: 'Horário indisponível' });
  }
  const appointment = {
    id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
    clientName,
    service,
    date,
    time,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
  };
  state.appointments.unshift(appointment);
  state.availableSlots[date] = state.availableSlots[date].filter((t) => t !== time);
  persist();
  res.status(201).json(appointment);
});

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { password } = req.body || {};
  const ok = await bcrypt.compare(password || '', adminHash);
  if (!ok) return res.status(401).json({ error: 'Senha incorreta' });
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// Admin routes
app.get('/api/appointments', authMiddleware, (req, res) => {
  res.json(state.appointments);
});

app.delete('/api/appointments/:id', authMiddleware, (req, res) => {
  const before = state.appointments.length;
  state.appointments = state.appointments.filter((a) => a.id !== req.params.id);
  if (state.appointments.length === before) return res.status(404).json({ error: 'Não encontrado' });
  persist();
  res.json({ ok: true });
});

app.put('/api/services', authMiddleware, (req, res) => {
  const { services } = req.body || {};
  if (!Array.isArray(services)) return res.status(400).json({ error: 'Lista inválida' });
  state.services = services;
  persist();
  res.json(state.services);
});

app.put('/api/availability', authMiddleware, (req, res) => {
  const { dates, template, blocked } = req.body || {};
  if (Array.isArray(dates)) state.availableDates = [...new Set(dates)].sort();
  if (Array.isArray(template)) state.slotTemplate = template;
  if (blocked && typeof blocked === 'object') state.blocked = blocked;
  // prune blocked for removed dates
  state.blocked = Object.fromEntries(
    Object.entries(state.blocked).filter(([d]) => state.availableDates.includes(d))
  );
  state.availableSlots = computeSlots(state.availableDates, state.slotTemplate, state.blocked);
  persist();
  res.json({ dates: state.availableDates, slots: state.availableSlots, template: state.slotTemplate, blocked: state.blocked });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});