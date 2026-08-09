export type VehicleId = 'moto' | 'hatch' | 'seda' | 'suv' | 'picape';

export interface VehicleOption {
  id: VehicleId;
  name: string;
  icon: string;
  badgeText: string;
  description: string;
}

export type WashId = 'simples' | 'completa' | 'detalhada';

export interface WashOption {
  id: WashId;
  name: string;
  icon: string;
  description: string;
}

export interface ExtraService {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  popular?: boolean;
}

export type PriceMatrix = Record<VehicleId, Record<WashId, number>>;

export interface CustomerData {
  name: string;
  phone: string;
  carModel: string;
  carColor: string;
  carPlate: string;
  date: string;
  timeSlot: string;
  deliveryOption: boolean;
  address: string;
  notes: string;
}

export type AppointmentStatus = 'agendado' | 'aprovado' | 'em_lavagem' | 'pronto' | 'entregue' | 'cancelado';

export type PaymentMethod = 'dinheiro' | 'pix' | 'credito' | 'debito';

export interface Appointment {
  id: string;
  code: string; // e.g. #101
  createdAt: string;
  customerName: string;
  customerPhone: string;
  carModel: string;
  carColor?: string;
  carPlate?: string;
  vehicleName: string;
  washName: string;
  extraNames: string[];
  totalPrice: number;
  date: string;
  timeSlot: string;
  deliveryOption: boolean;
  address?: string;
  notes?: string;
  status: AppointmentStatus;
  createdBy: 'cliente' | 'funcionario';
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  completedBy?: string; // employee name/phone
  statusChangeCount?: number; // how many times the status was changed
  pendingStatusChange?: AppointmentStatus | null; // status requested by employee, awaiting owner approval
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  // Compensation model
  payModel: 'salario' | 'comissao' | 'porcentagem';
  // salario: monthly or daily fixed
  salaryType?: 'mensal' | 'diario';
  salaryValue?: number;
  // comissao: value per wash
  perWashValue?: number;
  // porcentagem: percentage of total sales
  percentValue?: number;
  active: boolean;
}

export interface Expense {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  category: string;
  amount: number;
}

export type UserRole = 'funcionario' | 'dono';

export interface StoreSettings {
  whatsappPhone: string;
  storeName: string;
  subtitle: string;
  address: string;
  openingHours: string;
  priceMatrix: PriceMatrix;
  extraServices: ExtraService[];
  ownerPassword: string;
  employees: Employee[];
  expenses: Expense[];
}
