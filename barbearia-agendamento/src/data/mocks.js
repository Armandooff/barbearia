// Dados simulados (mocks) para a barbearia.
// Em produção, estes dados viriam de uma API/back-end.

export const SERVICES = [
  { id: 'cut', name: 'Corte de Cabelo', duration: 30, price: 35 },
  { id: 'beard', name: 'Barba', duration: 20, price: 25 },
  { id: 'eyebrow', name: 'Sobrancelha', duration: 15, price: 15 },
  { id: 'combo', name: 'Corte + Barba', duration: 50, price: 55 },
];

// Dias disponíveis (formato ISO YYYY-MM-DD) para o mês atual em diante.
const today = new Date();
export const AVAILABLE_DATES = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(today);
  d.setDate(today.getDate() + i + 1);
  // Evita domingos (0)
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}).filter((v, i, a) => a.indexOf(v) === i);

// Horários livres por dia (mock). Chave = data ISO, valor = array de horários.
export const AVAILABLE_SLOTS = AVAILABLE_DATES.reduce((acc, date) => {
  acc[date] = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
  return acc;
}, {});

export const BARBERS = [
  { id: 'gui', name: 'Gui', specialty: 'Cortes e degradê' },
  { id: 'leo', name: 'Léo', specialty: 'Barba e acabamento' },
  { id: 'rafa', name: 'Rafa', specialty: 'Sobrancelha e design' },
];

export const BARBERSHOP_INFO = {
  name: 'Gui Cortes',
  tagline: 'Seu estilo, nossa arte.',
  welcome: 'Seja bem-vindo à Gui Cortes. Aqui, cada corte é feito com atenção aos detalhes para você sair com a confiança renovada.',
  quote: 'Corte bom é aquele que combina com você.',
  author: 'GUI',
  address: 'AV. Exemplo, 123',
  phone: '(00) 00000-0000',
  whatsapp: '5500000000000',
  instagram: 'https://www.instagram.com/seu_perfil/',
  hours: 'Seg a Sáb',
};