// Informações da barbearia usadas na landing page e nas telas de confirmação.
// Os serviços, datas e horários vêm da API (barbearia-api).

export const BARBERSHOP_INFO = {
  name: 'PH Barbearia',
  wordmark: 'PH BARBEARIA',
  nickname: 'PH do Corte',
  tagline: 'Estilo • Precisão • Atitude',
  welcome:
    'Seja bem-vindo à PH Barbearia. Aqui, cada corte é uma obra de arte e cada cliente sai com a confiança renovada.',
  quote: 'Onde o cuidado masculino é levado a sério.',
  author: 'Pedro Henrique',
  address: 'Av. Sabino Monte, 4306',
  phone: '(85) 9203-7211',
  whatsapp: '558592037211',
  instagram: 'https://www.instagram.com/ophdocorte._/',
  hours: 'Seg a Sáb',
};

export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const PAYMENT_METHODS = [
  { id: 'onsite', label: 'Presencial', hint: 'Pagar na barbearia' },
  { id: 'pix', label: 'PIX', hint: 'Pagar agora online' },
];
