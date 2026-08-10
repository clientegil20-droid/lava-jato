import { StoreSettings, VehicleOption, WashOption } from '../types';

export const DEFAULT_VEHICLES: VehicleOption[] = [
  {
    id: 'moto',
    name: 'Moto',
    badgeText: '🏍️',
    description: 'Biz, Titan, Bros, CB 300, Fazer, etc.',
    icon: 'Bike',
  },
  {
    id: 'hatch',
    name: 'Carro Pequeno / Hatch',
    badgeText: '🚗',
    description: 'Onix, HB20, Gol, Mobi, Ka, Argo',
    icon: 'Car',
  },
  {
    id: 'seda',
    name: 'Carro Médio / Sedã',
    badgeText: '🚘',
    description: 'Corolla, Civic, Voyage, Virtus, Cronos',
    icon: 'Car',
  },
  {
    id: 'suv',
    name: 'Carro Grande / SUV',
    badgeText: '🚙',
    description: 'Compass, Hilux SW4, Creta, HR-V, Renegade',
    icon: 'CarFront',
  },
  {
    id: 'picape',
    name: 'Extra G. / Picapes Rural',
    badgeText: '🛻',
    description: 'Hilux, S10, Ranger, Toro, Amarok, L200',
    icon: 'Truck',
  },
];

export const DEFAULT_WASHES: WashOption[] = [
  {
    id: 'simples',
    name: 'Lavagem Simples',
    description: 'Apenas ducha externa, secagem e pretinho nos pneus',
    icon: 'Droplets',
  },
  {
    id: 'completa',
    name: 'Lavagem Completa',
    description: 'Externa + aspiração interna detalhada, painel, consoles e vidros',
    icon: 'Sparkles',
  },
  {
    id: 'detalhada',
    name: 'Lavagem Técnica / Detalhada',
    description: 'Completa + cera protetora de alto brilho + limpeza técnica do motor',
    icon: 'Gem',
  },
];

export const DEFAULT_SETTINGS: StoreSettings = {
  whatsappPhone: '5594993057676',
  storeName: 'Lava Jato Redenção',
  subtitle: 'Monte seu serviço e faça seu agendamento em segundos',
  address: 'R. Olga Lustosa, 66 - Aripuanã, Redenção - PA, 68554-133',
  openingHours: 'Seg a Sáb: 07:30 - 18:00',
  ownerPassword: 'G9491',
  employees: [],
  expenses: [],
  employeePayments: [],
  materials: [],
  priceMatrix: {
    moto: { simples: 22, completa: 35, detalhada: 55 },
    hatch: { simples: 40, completa: 55, detalhada: 105 },
    seda: { simples: 48, completa: 65, detalhada: 125 },
    suv: { simples: 60, completa: 82, detalhada: 160 },
    picape: { simples: 72, completa: 110, detalhada: 215 },
  },
  extraServices: [
    {
      id: 'barro_pesado',
      name: 'Taxa de Barro Pesado / Terra Vermelha',
      description: 'Uso de desengraxante e desincrustante extra para veículos rurais',
      price: 35,
      icon: 'ShieldAlert',
      popular: true,
    },
    {
      id: 'lavagem_motor',
      name: 'Lavagem de Motor Avulsa',
      description: 'Limpeza técnica segura do cofre do motor com revitalizador',
      price: 65,
      icon: 'Cpu',
    },
    {
      id: 'higienizacao_ar',
      name: 'Higienização de Ar-Condicionado',
      description: 'Odonização por oxigênio ativo, elimina fungos e mau cheiro',
      price: 100,
      icon: 'Wind',
      popular: true,
    },
    {
      id: 'revitalizacao_plasticos',
      name: 'Revitalização de Plásticos',
      description: 'Restauração e proteção UV contra o sol forte da região',
      price: 55,
      icon: 'Sun',
    },
    {
      id: 'cera_resina',
      name: 'Aplicação de Cera Resina Hidrofóbica',
      description: 'Proteção extra contra água, poeira e lama por até 30 dias',
      price: 45,
      icon: 'ShieldCheck',
    },
  ],
};
