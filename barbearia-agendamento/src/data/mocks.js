// Informações extraídas do perfil @gduscortes_ e do link da bio.
// Os serviços exibidos no agendamento vêm da API (barbearia-api).

export const BARBERSHOP_INFO = {
  name: 'G dos Cortes',
  wordmark: 'G DOS CORTES',
  shortName: 'G dos Cortes',
  tagline: 'Estilo • Qualidade • Respeito',
  subtitle: 'Barbearia • Estilo • Precisão',
  slogan: 'Seu corte. Sua marca.',
  bio: 'Especialista em cortes degradê e tesoura.',
  welcome:
    'Barbearia de Guilherme, especialista em cortes degradê e tesoura. Atendimento aos fins de semana com estilo, qualidade e respeito.',
  quote: 'Estilo, qualidade e respeito em cada detalhe.',
  quoteHighlight: 'qualidade e respeito',
  quoteAuthor: 'Guilherme',
  address: 'Rua José Buson — Alto da Balança, Fortaleza/CE',
  addressShort: 'Rua José Buson',
  neighborhood: 'Alto da Balança, Fortaleza/CE',
  phone: '(85) 99191-7574',
  whatsapp: '5585991917574',
  instagram: 'https://www.instagram.com/gduscortes_/',
  instagramHandle: '@gduscortes_',
  link: 'https://bit.ly/3WAvgLP',
  hours: 'Qui, Sáb e Dom • 08h às 18h',
  scheduleDays: 'Quinta, Sábado e Domingo',
  scheduleHours: '08h às 18h',
  slotDuration: '50 minutos por atendimento',
  logo: '/brand/gd-logo.jpg',
  highlights: [
    { label: 'Valores', href: 'https://www.instagram.com/stories/highlights/18072746852651472/' },
    { label: 'Cortes', href: 'https://www.instagram.com/stories/highlights/18100778102593328/' },
    { label: 'Agendamento', href: 'https://www.instagram.com/stories/highlights/18094390520528686/' },
  ],
  features: [
    'Atendimento de qualidade',
    'Sempre com respeito',
    'Agende já seu horário',
  ],
};

export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const PAYMENT_METHODS = [
  { id: 'onsite', label: 'Presencial', hint: 'Pagar na barbearia' },
  { id: 'pix', label: 'PIX', hint: 'Em desenvolvimento' },
];

export const GALLERY = [
  {
    src: '/gallery/tabela-precos.jpg',
    alt: 'Tabela de preços oficial da G dos Cortes',
    label: 'Tabela de preços',
    caption: 'Valores atualizados',
    href: 'https://www.instagram.com/gduscortes_/p/DfzbJF0AXsK/',
    featured: true,
  },
  {
    src: '/gallery/corte-1.jpg',
    alt: 'Corte degradê finalizado por Guilherme',
    label: 'Degradê',
    caption: 'Acabamento na régua',
    href: 'https://www.instagram.com/gduscortes_/p/DfwyDBaFgLE/',
  },
  {
    src: '/gallery/corte-2.jpg',
    alt: 'Detalhe de corte com tesoura',
    label: 'Tesoura',
    caption: 'Precisão em cada detalhe',
    href: 'https://www.instagram.com/gduscortes_/reel/DfvJPPpA4zr/',
  },
];
