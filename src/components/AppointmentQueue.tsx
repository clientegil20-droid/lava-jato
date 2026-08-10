import React, { useState } from 'react';
import { Appointment, AppointmentStatus, Employee, PaymentMethod, StoreSettings, UserRole } from '../types';
import { formatBRL, buildReadyMessage, buildApprovalMessage, openWhatsApp } from '../utils/whatsapp';
import {
  Calendar,
  Clock,
  Car,
  CheckCircle2,
  AlertCircle,
  Play,
  Sparkles,
  Phone,
  Search,
  Plus,
  Receipt,
  MessageCircle,
  Trash2,
  Filter,
  History,
  X,
  ShoppingCart,
  Lock,
  LockOpen,
  Banknote,
  QrCode,
  CreditCard,
  Landmark,
  UserCheck,
  ListTodo,
} from 'lucide-react';
import { PaymentMethodModal } from './PaymentMethodModal';
import { ProductPickerModal } from './ProductPickerModal';
import { EmployeeAssignmentModal } from './EmployeeAssignmentModal';

interface AppointmentQueueProps {
  appointments: Appointment[];
  settings: StoreSettings;
  role: UserRole;
  currentEmployee?: Employee | null;
  onUpdateStatus: (
    id: string,
    newStatus: AppointmentStatus,
    paymentMethod?: PaymentMethod,
    completedBy?: string
  ) => void;
  onDeleteAppointment: (id: string) => void;
  onOpenReceiptModal: (apt: Appointment) => void;
  onCreateNewClick: () => void;
  onAddProducts: (id: string, extraIds: string[]) => void;
}

export const AppointmentQueue: React.FC<AppointmentQueueProps> = ({
  appointments,
  settings,
  role,
  currentEmployee,
  onUpdateStatus,
  onDeleteAppointment,
  onOpenReceiptModal,
  onCreateNewClick,
  onAddProducts,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentApt, setPaymentApt] = useState<Appointment | null>(null);
  const [productApt, setProductApt] = useState<Appointment | null>(null);
  const [assignApt, setAssignApt] = useState<Appointment | null>(null);
  const [assignTarget, setAssignTarget] = useState<'pronto' | 'entregue' | null>(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Record<string, AppointmentStatus>>({});
  const [view, setView] = useState<'fila' | 'historico'>('fila');

  const isOwner = role === 'dono';

  const PENDING_STATUSES: AppointmentStatus[] = ['agendado', 'aprovado', 'em_lavagem'];
  const HISTORY_STATUSES: AppointmentStatus[] = ['pronto', 'entregue'];

  const METHOD_LABELS: Record<PaymentMethod, string> = {
    dinheiro: 'Dinheiro',
    pix: 'Pix',
    credito: 'Cartão de Crédito',
    debito: 'Cartão de Débito',
  };

  const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
    dinheiro: <Banknote className="w-3 h-3" />,
    pix: <QrCode className="w-3 h-3" />,
    credito: <CreditCard className="w-3 h-3" />,
    debito: <Landmark className="w-3 h-3" />,
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'agendado':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm shadow-amber-500/10">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Agendado
          </span>
        );
      case 'aprovado':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-violet-500/20 text-violet-300 border border-violet-500/40 flex items-center gap-1.5 shadow-sm shadow-violet-500/10">
            <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" /> Aprovado
          </span>
        );
      case 'em_lavagem':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5 animate-pulse shadow-sm shadow-blue-500/10">
            <Play className="w-3.5 h-3.5 fill-current text-blue-400" /> Em Lavagem
          </span>
        );
      case 'pronto':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 shadow-sm shadow-cyan-500/10">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Pronto para Retirada
          </span>
        );
      case 'entregue':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Entregue / Concluído
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 shadow-sm shadow-rose-500/10">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Cancelado
          </span>
        );
    }
  };

  const getCardBorderAccent = (status: AppointmentStatus) => {
    switch (status) {
      case 'agendado':
        return 'border-l-4 border-l-amber-500';
      case 'aprovado':
        return 'border-l-4 border-l-violet-500';
      case 'em_lavagem':
        return 'border-l-4 border-l-blue-500';
      case 'pronto':
        return 'border-l-4 border-l-cyan-400';
      case 'entregue':
        return 'border-l-4 border-l-emerald-500';
      default:
        return 'border-l-4 border-l-rose-500';
    }
  };

  const cleanSearch = searchTerm.trim().toLowerCase().replace(/[\s-]/g, '');
  const rawSearch = searchTerm.trim().toLowerCase();

  const visibleStatuses =
    view === 'fila' ? PENDING_STATUSES : HISTORY_STATUSES;

  const filtered = appointments.filter((apt) => {
    if (!visibleStatuses.includes(apt.status)) return false;
    const matchesStatus = filterStatus === 'todos' || apt.status === filterStatus;
    if (!rawSearch) return matchesStatus;

    const cleanPlate = apt.carPlate ? apt.carPlate.toLowerCase().replace(/[\s-]/g, '') : '';
    const matchesPlate = cleanPlate && cleanPlate.includes(cleanSearch);

    const matchesSearch =
      matchesPlate ||
      apt.customerName.toLowerCase().includes(rawSearch) ||
      apt.carModel.toLowerCase().includes(rawSearch) ||
      (apt.carPlate && apt.carPlate.toLowerCase().includes(rawSearch)) ||
      apt.code.toLowerCase().includes(rawSearch);

    return matchesStatus && matchesSearch;
  });

  const switchView = (next: 'fila' | 'historico') => {
    setView(next);
    setFilterStatus('todos');
    setSearchTerm('');
    setSelectedStatus({});
  };

  const handleNotifyCarReady = (apt: Appointment) => {
    const msg = buildReadyMessage(apt, settings.storeName);
    openWhatsApp(apt.customerPhone || settings.whatsappPhone, msg);
  };

  const handleApprove = (apt: Appointment) => {
    onUpdateStatus(apt.id, 'aprovado');
    const msg = buildApprovalMessage(apt, settings.storeName);
    openWhatsApp(apt.customerPhone || settings.whatsappPhone, msg);
  };

  const handleStatusChange = (apt: Appointment, newStatus: AppointmentStatus) => {
    // "Pronto" and "Entregue" require confirming who washed the vehicle
    if (newStatus === 'pronto' || newStatus === 'entregue') {
      setAssignApt(apt);
      setAssignTarget(newStatus);
      setAssignEmployeeId(currentEmployee?.id ?? null);
      return;
    }
    onUpdateStatus(apt.id, newStatus);
  };

  const handleAssignConfirm = (employeeId: string) => {
    if (!assignApt || !assignTarget) return;
    // If the target is "entregue", also ask for the payment method
    if (assignTarget === 'entregue') {
      setPaymentApt(assignApt);
      setAssignEmployeeId(employeeId);
      setAssignApt(null);
      setAssignTarget(null);
      return;
    }
    onUpdateStatus(assignApt.id, 'pronto', undefined, employeeId);
    setAssignApt(null);
    setAssignTarget(null);
  };

  const handlePaymentConfirm = (method: PaymentMethod, completedBy?: string) => {
    if (paymentApt) {
      const responsibleId = completedBy || assignEmployeeId || undefined;
      onUpdateStatus(paymentApt.id, 'entregue', method, responsibleId);
    }
    setPaymentApt(null);
    setAssignEmployeeId(null);
  };

  const isStatusChangeFree = (apt: Appointment, newStatus: AppointmentStatus) => {
    if (isOwner) return true;
    const STATUS_RANK: Record<AppointmentStatus, number> = {
      agendado: 0,
      aprovado: 1,
      em_lavagem: 2,
      pronto: 3,
      entregue: 4,
      cancelado: -1,
    };
    return STATUS_RANK[newStatus] > STATUS_RANK[apt.status];
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Add for Employee */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-[#16212b] to-[#121820] border border-cyan-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-400 text-black font-extrabold text-[10px] uppercase">
              Painel do Funcionário
            </span>
            <span className="text-xs text-cyan-300 font-medium">
              {appointments.length} lavagens registradas
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">
            Fila de Agendamentos & Controle de Lavagens
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {isOwner
              ? view === 'fila'
                ? 'Modo dono: fila de lavagens pendentes'
                : 'Histórico: lavagens prontas e concluídas'
              : 'Funcionário: avançar no fluxo da lavagem é livre; voltar ou cancelar exige aprovação do dono'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isOwner && (
            <button
              onClick={() => switchView(view === 'fila' ? 'historico' : 'fila')}
              className={`w-full sm:w-auto px-4 py-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shrink-0 ${
                view === 'historico'
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-400/20'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {view === 'historico' ? (
                <>
                  <ListTodo className="w-4 h-4 stroke-[3]" />
                  <span>Voltar para a Fila</span>
                </>
              ) : (
                <>
                  <History className="w-4 h-4 stroke-[3]" />
                  <span>Histórico</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onCreateNewClick}
            id="btn-new-appointment-staff"
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20 cursor-pointer active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Agendamento Balcão</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-[#1d1d22] p-3 rounded-2xl border border-gray-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-cyan-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por placa (ex: QDA-1A23), cliente ou carro..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#121215] border border-gray-700 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 p-0.5 text-gray-400 hover:text-white rounded-md bg-gray-800 hover:bg-gray-700 transition-colors"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
          {view === 'fila'
            ? [
                { id: 'todos', label: 'Todos' },
                { id: 'agendado', label: 'Agendados' },
                { id: 'aprovado', label: 'Aprovados' },
                { id: 'em_lavagem', label: 'Em Lavagem' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    filterStatus === f.id
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))
            : [
                { id: 'todos', label: 'Todos' },
                { id: 'pronto', label: 'Prontos' },
                { id: 'entregue', label: 'Concluídos' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    filterStatus === f.id
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
        </div>
      </div>

      {/* Appointment Cards List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-[#1d1d22] border border-gray-800/80 space-y-3">
          <Calendar className="w-10 h-10 text-gray-600 mx-auto" />
          <p className="text-sm text-gray-400 font-medium">
            {view === 'fila'
              ? 'Nenhuma lavagem pendente. Quando um serviço for marcado como Pronto ou Concluído, ele sai daqui e vai para o Histórico.'
              : 'Nenhuma lavagem pronta ou concluída no histórico ainda.'}
          </p>
          <button
            onClick={onCreateNewClick}
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-bold hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Cadastrar primeiro agendamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5 xl:grid-cols-3">
          {filtered.map((apt) => {
            if (view === 'historico') {
              return (
                <div
                  key={apt.id}
                  className={`p-4 sm:p-5 rounded-2xl bg-[#18181c] border border-gray-800 ${getCardBorderAccent(
                    apt.status
                  )} space-y-4 shadow-lg relative overflow-hidden`}
                >
                  {/* Top Row: Code, Status & Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-gray-800 text-cyan-300 border border-gray-700">
                        {apt.code}
                      </span>
                      {getStatusBadge(apt.status)}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{apt.date.split('-').reverse().join('/')}</span>
                      <Clock className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                      <span>{apt.timeSlot}</span>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div>
                    <div className="text-gray-400 text-[11px] font-semibold uppercase">
                      Cliente
                    </div>
                    <div className="font-bold text-white text-sm sm:text-base mt-0.5">
                      {apt.customerName}
                    </div>
                    {apt.customerPhone && (
                      <div className="text-cyan-400 font-mono mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {apt.customerPhone}
                      </div>
                    )}
                    {(apt.employeeName || apt.completedBy) && (
                      <div className="text-gray-500 text-[11px] mt-0.5 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-400" />
                        Responsável:{' '}
                        {apt.completedBy
                          ? settings.employees.find((e) => e.id === apt.completedBy)?.name ??
                            apt.employeeName
                          : apt.employeeName}
                      </div>
                    )}
                  </div>

                  {/* Vehicle info */}
                  <div>
                    <div className="text-gray-400 text-[11px] font-semibold uppercase">
                      Veículo
                    </div>
                    <div className="font-bold text-white text-sm mt-0.5 flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-cyan-400" />
                      <span>
                        {apt.vehicleName} ({apt.carModel})
                      </span>
                    </div>
                    {apt.carPlate && (
                      <div className="text-amber-300 font-mono font-bold text-xs mt-0.5">
                        Placa: {apt.carPlate.toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Services details */}
                  <div className="p-3 rounded-xl bg-[#141418] border border-gray-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-gray-400">Serviço: </span>
                      <span className="font-bold text-white">{apt.washName}</span>
                      {apt.extraNames && apt.extraNames.length > 0 && (
                        <span className="text-[11px] text-cyan-300 block mt-0.5">
                          Adicionais: {apt.extraNames.join(', ')}
                        </span>
                      )}
                      {apt.materialNames && apt.materialNames.length > 0 && (
                        <span className="text-[11px] text-amber-300 block mt-0.5">
                          🛍️ Lojinha: {apt.materialNames.join(', ')}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-gray-400 block">Valor Total</span>
                      <span className="font-black text-emerald-400 text-sm sm:text-base">
                        {formatBRL(apt.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Payment info */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {apt.paymentMethod && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        {METHOD_ICONS[apt.paymentMethod]}
                        {METHOD_LABELS[apt.paymentMethod]}
                      </span>
                    )}
                    {apt.deliveryOption && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                        🚚 Leva e Traz
                      </span>
                    )}
                    <span className="ml-auto text-[10px] text-gray-600 font-medium">
                      Registrado: {new Date(apt.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              );
            }
            return (
            <div
              key={apt.id}
              className={`p-4 sm:p-5 rounded-2xl bg-[#1d1d22] border border-gray-800 hover:border-gray-700 ${getCardBorderAccent(
                apt.status
              )} transition-all space-y-4 shadow-lg relative overflow-hidden`}
            >
              {/* Pending approval banner */}
              {!isOwner && apt.pendingStatusChange && (
                <div className="absolute top-0 left-0 right-0 py-1.5 px-4 bg-amber-500/20 border-b border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Aguardando aprovação do dono: mudar para{' '}
                  {apt.pendingStatusChange === 'entregue'
                    ? 'Concluído'
                    : apt.pendingStatusChange === 'em_lavagem'
                    ? 'Em Lavagem'
                    : apt.pendingStatusChange === 'pronto'
                    ? 'Pronto'
                    : apt.pendingStatusChange === 'aprovado'
                    ? 'Aprovado'
                    : 'Cancelado'}
                </div>
              )}

              {/* Top Row: Code, Status & Date */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-gray-800 text-cyan-300 border border-gray-700">
                    {apt.code}
                  </span>
                  {getStatusBadge(apt.status)}
                  {apt.paymentMethod && apt.status === 'entregue' && (
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      {METHOD_ICONS[apt.paymentMethod]}
                      {METHOD_LABELS[apt.paymentMethod]}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{apt.date.split('-').reverse().join('/')}</span>
                  <Clock className="w-3.5 h-3.5 text-cyan-400 ml-1" />
                  <span>{apt.timeSlot}</span>
                </div>
              </div>

              {/* Main Content: Customer & Vehicle details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-gray-400 text-[11px] font-semibold uppercase">
                    Cliente & Contato
                  </div>
                  <div className="font-bold text-white text-sm sm:text-base mt-0.5">
                    {apt.customerName}
                  </div>
                  {apt.customerPhone && (
                    <div className="text-cyan-400 font-mono mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {apt.customerPhone}
                    </div>
                  )}
                  {(apt.employeeName || apt.completedBy) && (
                    <div className="text-gray-500 text-[11px] mt-0.5 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-400" />
                      Responsável: {apt.completedBy ? settings.employees.find((e) => e.id === apt.completedBy)?.name ?? apt.employeeName : apt.employeeName}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-gray-400 text-[11px] font-semibold uppercase">
                    Veículo & Placa
                  </div>
                  <div className="font-bold text-white text-sm sm:text-base mt-0.5 flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-cyan-400" />
                    <span>
                      {apt.vehicleName} ({apt.carModel})
                    </span>
                  </div>
                  {apt.carPlate && (
                    <div className="text-amber-300 font-mono font-bold text-xs mt-0.5">
                      Placa: {apt.carPlate.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Services details */}
              <div className="p-3 rounded-xl bg-[#141418] border border-gray-800/80 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-gray-400">Serviço: </span>
                  <span className="font-bold text-white">{apt.washName}</span>
                  {apt.extraNames && apt.extraNames.length > 0 && (
                    <span className="text-[11px] text-cyan-300 block mt-0.5">
                      Adicionais: {apt.extraNames.join(', ')}
                    </span>
                  )}
                  {apt.materialNames && apt.materialNames.length > 0 && (
                    <span className="text-[11px] text-amber-300 block mt-0.5">
                      🛍️ Lojinha: {apt.materialNames.join(', ')}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-gray-400 block">Valor Total</span>
                  <span className="font-black text-emerald-400 text-sm sm:text-base">
                    {formatBRL(apt.totalPrice)}
                  </span>
                </div>
              </div>

              {/* Staff Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                {/* Status selector dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 hidden sm:inline">Mudar Status:</span>
                  <select
                    value={selectedStatus[apt.id] ?? apt.status}
                    onChange={(e) => {
                      const next = e.target.value as AppointmentStatus;
                      setSelectedStatus((prev) => ({ ...prev, [apt.id]: next }));
                      handleStatusChange(apt, next);
                    }}
                    disabled={!isOwner && !!apt.pendingStatusChange}
                    className="px-2.5 py-1.5 rounded-lg bg-[#121215] border border-gray-700 text-white text-xs font-semibold focus:border-cyan-400 focus:outline-none cursor-pointer disabled:opacity-40"
                  >
                    <option value="agendado">🕒 Agendado</option>
                    <option value="aprovado">✅ Aprovado</option>
                    <option value="em_lavagem">🧼 Em Lavagem</option>
                    <option value="pronto">✨ Pronto para Retirada</option>
                    <option value="entregue">✅ Entregue / Concluído</option>
                    <option value="cancelado">❌ Cancelado</option>
                  </select>

                  {!isOwner && !apt.pendingStatusChange && (
                    <span className="text-[10px] text-gray-500 font-semibold">
                      {isStatusChangeFree(
                        apt,
                        selectedStatus[apt.id] ?? apt.status
                      ) ? (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <LockOpen className="w-3 h-3" /> livre
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-0.5">
                          <Lock className="w-3 h-3" /> precisa aprovação
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* Buttons: Approve, Send Comprovante & Send Ready Notification */}
                <div className="flex items-center gap-2">
                  {apt.status === 'agendado' && (
                    <button
                      onClick={() => handleApprove(apt)}
                      className="px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-black text-xs flex items-center gap-1 shadow-md shadow-violet-500/20 cursor-pointer transition-all"
                      title="Aprovar este agendamento e enviar confirmação ao cliente no WhatsApp"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aprovar</span>
                    </button>
                  )}

                  {apt.status === 'pronto' && (
                    <button
                      onClick={() => handleNotifyCarReady(apt)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 cursor-pointer transition-all"
                      title="Notificar cliente no WhatsApp que o carro está pronto"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-current" />
                      <span>Avisar Carro Pronto</span>
                    </button>
                  )}

                  <button
                    onClick={() => setProductApt(apt)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                    title="Adicionar produto/serviço adicional a este agendamento"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>+ Produto</span>
                  </button>

                  <button
                    onClick={() => onOpenReceiptModal(apt)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                    title="Ver e Enviar Comprovante do Agendamento ao Cliente"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Ver Comprovante</span>
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => {
                        if (confirm('Deseja excluir este agendamento da lista?')) {
                          onDeleteAppointment(apt.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Excluir Agendamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Payment method modal when finalizing */}
      <PaymentMethodModal
        isOpen={paymentApt !== null}
        onClose={() => {
          setPaymentApt(null);
          setAssignEmployeeId(null);
        }}
        appointment={paymentApt}
        employees={settings.employees.filter((e) => e.active)}
        defaultEmployeeId={assignEmployeeId ?? currentEmployee?.id}
        onConfirm={handlePaymentConfirm}
      />

      {/* Employee assignment modal (who washed the vehicle) */}
      <EmployeeAssignmentModal
        isOpen={assignApt !== null}
        onClose={() => {
          setAssignApt(null);
          setAssignTarget(null);
          setAssignEmployeeId(null);
          if (assignApt) {
            setSelectedStatus((prev) => ({ ...prev, [assignApt.id]: assignApt.status }));
          }
        }}
        appointment={assignApt}
        targetStatus={assignTarget}
        employees={settings.employees.filter((e) => e.active)}
        defaultEmployeeId={assignEmployeeId ?? currentEmployee?.id}
        onConfirm={handleAssignConfirm}
      />

      {/* Product picker modal */}
      <ProductPickerModal
        isOpen={productApt !== null}
        onClose={() => setProductApt(null)}
        appointment={productApt}
        products={settings.extraServices}
        onConfirm={(extraIds) => {
          if (productApt) onAddProducts(productApt.id, extraIds);
          setProductApt(null);
        }}
      />
    </div>
  );
};
