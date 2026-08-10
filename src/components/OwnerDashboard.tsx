import React, { useMemo, useState } from 'react';
import { Appointment, Employee, EmployeePayment, Expense, Material, PaymentMethod, StoreSettings } from '../types';
import { formatBRL } from '../utils/whatsapp';
import { EmployeePaymentModal } from './EmployeePaymentModal';
import {
  X,
  TrendingUp,
  TrendingDown,
  Wallet,
  Car,
  Users,
  CalendarDays,
  Banknote,
  QrCode,
  CreditCard,
  Landmark,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Pencil,
  Plus,
  Trash2,
  Settings,
  History,
  BarChart3,
  PiggyBank,
  Banknote as BanknoteIcon,
  Store,
  ImagePlus,
  Gauge,
  BadgeDollarSign,
} from 'lucide-react';

interface OwnerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  onApproveStatusChange: (id: string) => void;
  onRejectStatusChange: (id: string) => void;
  onOpenSettings: () => void;
}

type Tab = 'resumo' | 'aprovacoes' | 'funcionarios' | 'despesas' | 'materiais';

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  dinheiro: <Banknote className="w-4 h-4" />,
  pix: <QrCode className="w-4 h-4" />,
  credito: <CreditCard className="w-4 h-4" />,
  debito: <Landmark className="w-4 h-4" />,
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  credito: 'Cartão de Crédito',
  debito: 'Cartão de Débito',
};

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  isOpen,
  onClose,
  appointments,
  settings,
  onSaveSettings,
  onApproveStatusChange,
  onRejectStatusChange,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('resumo');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [employeeForm, setEmployeeForm] = useState<Employee | null>(null);
  const [expenseForm, setExpenseForm] = useState<Expense | null>(null);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [payingEmployee, setPayingEmployee] = useState<Employee | null>(null);
  const [materialForm, setMaterialForm] = useState<Material | null>(null);

  const delivered = appointments.filter((a) => a.status === 'entregue');

  const filtered = useMemo(() => {
    if (dateFilter === 'all') return delivered;
    return delivered.filter((a) => a.date === dateFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivered, dateFilter]);

  const totalRevenue = filtered.reduce((sum, a) => sum + a.totalPrice, 0);
  const totalCars = filtered.length;
  const totalClients = new Set(filtered.map((a) => a.customerName.toLowerCase().trim())).size;

  const expensesInRange = settings.expenses.filter((e) => {
    if (dateFilter === 'all') return true;
    return e.date === dateFilter;
  });
  const totalExpenses = expensesInRange.reduce((sum, e) => sum + e.amount, 0);
  const profit = totalRevenue - totalExpenses;
  const capitalScore =
    totalRevenue > 0 ? Math.max(0, Math.min(100, (profit / totalRevenue) * 100)) : 0;

  // Payment method breakdown
  const methodTotals: Record<PaymentMethod, { count: number; total: number }> = {
    dinheiro: { count: 0, total: 0 },
    pix: { count: 0, total: 0 },
    credito: { count: 0, total: 0 },
    debito: { count: 0, total: 0 },
  };
  filtered.forEach((a) => {
    const m = a.paymentMethod || 'dinheiro';
    methodTotals[m].count += 1;
    methodTotals[m].total += a.totalPrice;
  });

  // Last 7 days bar chart
  const last7Days = useMemo(() => {
    const days: { label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const dayRevenue = delivered
        .filter((a) => a.date === dateStr)
        .reduce((s, a) => s + a.totalPrice, 0);
      days.push({ label: dayLabel, total: dayRevenue });
    }
    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivered]);
  const maxDay = Math.max(...last7Days.map((d) => d.total), 1);

  // Pending approvals
  const pendingApprovals = appointments.filter((a) => a.pendingStatusChange);

  // Employee calculations
  const computeEmployeeEarnings = (emp: Employee) => {
    const cutoff = emp.lastPaymentAt ? new Date(emp.lastPaymentAt).getTime() : 0;
    const empWashes = delivered.filter(
      (a) =>
        a.completedBy === emp.id &&
        new Date(a.paidAt || a.createdAt).getTime() > cutoff
    );
    const washCount = empWashes.length;
    const empRevenue = empWashes.reduce((s, a) => s + a.totalPrice, 0);
    let value = 0;
    let label = '';
    switch (emp.payModel) {
      case 'salario':
        value = emp.salaryValue || 0;
        label = emp.salaryType === 'diario' ? 'por dia' : 'por mês';
        break;
      case 'comissao':
        value = (emp.perWashValue || 0) * washCount;
        label = `${washCount} lavagens × ${formatBRL(emp.perWashValue || 0)}`;
        break;
      case 'porcentagem':
        value = (empRevenue * (emp.percentValue || 0)) / 100;
        label = `${emp.percentValue || 0}% de ${formatBRL(empRevenue)}`;
        break;
    }
    return { washCount, empRevenue, value, label };
  };

  const handleSaveEmployee = () => {
    if (!employeeForm) return;
    if (!employeeForm.name.trim() || !employeeForm.code.trim() || !employeeForm.password.trim()) {
      alert('Preencha nome, código e senha do funcionário.');
      return;
    }
    const exists = settings.employees.some((e) => e.id === employeeForm.id);
    const next = exists
      ? settings.employees.map((e) => (e.id === employeeForm.id ? employeeForm : e))
      : [...settings.employees, employeeForm];
    onSaveSettings({ ...settings, employees: next });
    setEmployeeForm(null);
  };

  const handleDeleteEmployee = (id: string) => {
    if (!confirm('Excluir este funcionário?')) return;
    onSaveSettings({
      ...settings,
      employees: settings.employees.filter((e) => e.id !== id),
    });
  };

  const handleSaveExpense = () => {
    if (!expenseForm) return;
    const exists = settings.expenses.some((e) => e.id === expenseForm.id);
    const next = exists
      ? settings.expenses.map((e) => (e.id === expenseForm.id ? expenseForm : e))
      : [...settings.expenses, expenseForm];
    onSaveSettings({ ...settings, expenses: next });
    setExpenseForm(null);
  };

  const handleDeleteExpense = (id: string) => {
    if (!confirm('Excluir esta despesa?')) return;
    onSaveSettings({
      ...settings,
      expenses: settings.expenses.filter((e) => e.id !== id),
    });
  };

  const handlePayEmployee = (
    payment: EmployeePayment,
    _format: 'pdf' | 'excel'
  ) => {
    const now = new Date().toISOString();
    const employees = settings.employees.map((e) =>
      e.id === payment.employeeId ? { ...e, lastPaymentAt: now } : e
    );
    const paymentExpense: Expense = {
      id: `exp_pay_${Date.now()}`,
      date: now.split('T')[0],
      description: `Pagamento - ${payment.employeeName}`,
      category: 'Funcionários',
      amount: payment.amount,
    };
    onSaveSettings({
      ...settings,
      employees,
      employeePayments: [...(settings.employeePayments || []), payment],
      expenses: [...(settings.expenses || []), paymentExpense],
    });
    setPayingEmployee(null);
  };

  const handleSaveMaterial = () => {
    if (!materialForm) return;
    if (!materialForm.name.trim()) {
      alert('Preencha o nome do material.');
      return;
    }
    const exists = settings.materials.some((m) => m.id === materialForm.id);
    const next = exists
      ? settings.materials.map((m) => (m.id === materialForm.id ? materialForm : m))
      : [...settings.materials, materialForm];
    let expenses = settings.expenses;
    if (!exists && (materialForm.costPrice || 0) > 0) {
      const costExpense: Expense = {
        id: `exp_mat_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: `Compra de material - ${materialForm.name}`,
        category: 'Produtos',
        amount: materialForm.costPrice || 0,
      };
      expenses = [...expenses, costExpense];
    }
    onSaveSettings({ ...settings, materials: next, expenses });
    setMaterialForm(null);
  };

  const handleDeleteMaterial = (id: string) => {
    if (!confirm('Excluir este material da lojinha?')) return;
    onSaveSettings({
      ...settings,
      materials: settings.materials.filter((m) => m.id !== id),
    });
  };

  const handleClearPayments = () => {
    if (
      !confirm(
        'Limpar todo o Histórico de Pagamentos?\n\nOs pagamentos serão removidos permanentemente. Essa ação não pode ser desfeita.'
      )
    )
      return;
    onSaveSettings({ ...settings, employeePayments: [] });
  };

  const handleDeletePayment = (id: string) => {
    if (
      !confirm(
        'Excluir este pagamento do histórico?\n\nO registro será removido permanentemente. Essa ação não pode ser desfeita.'
      )
    )
      return;
    onSaveSettings({
      ...settings,
      employeePayments: settings.employeePayments.filter((p) => p.id !== id),
    });
  };

  const handleMaterialPhoto = (file: File | undefined) => {
    if (!file || !materialForm) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMaterialForm({ ...materialForm, photoUrl: String(reader.result) });
    };
    reader.readAsDataURL(file);
  };

  const inputCls =
    'w-full px-3 py-2 rounded-lg bg-[#121215] border border-gray-700 text-white text-xs focus:border-cyan-400 focus:outline-none';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl md:max-w-5xl lg:max-w-6xl bg-[#18181c] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1c2733] to-[#121921] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">
                Painel do Dono - {settings.storeName}
              </h3>
              <p className="text-xs text-emerald-200/70">
                Ganhos, lucro, comissões e controle da empresa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors cursor-pointer"
              title="Editar preços, produtos e configurações"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-[#121215] px-4 overflow-x-auto custom-scrollbar">
          {[
            { id: 'resumo' as Tab, label: 'Resumo & Gráficos', icon: BarChart3 },
            { id: 'aprovacoes' as Tab, label: `Aprovações (${pendingApprovals.length})`, icon: History },
            { id: 'funcionarios' as Tab, label: 'Funcionários & Comissões', icon: Users },
            { id: 'despesas' as Tab, label: 'Despesas', icon: Wallet },
            { id: 'materiais' as Tab, label: 'Lojinha & Materiais', icon: Store },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === t.id
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto space-y-5 custom-scrollbar">
          {/* ============ RESUME ============ */}
          {activeTab === 'resumo' && (
            <div className="space-y-5">
              {/* Date filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#121215] p-3 rounded-xl border border-gray-800">
                <div className="flex items-center gap-2 text-xs text-gray-300 font-semibold">
                  <CalendarDays className="w-4 h-4 text-emerald-400" />
                  <span>Período analisado:</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[#121215] border border-gray-700 text-white text-xs font-semibold focus:border-emerald-400 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Todas as datas</option>
                    <option value="today">Hoje</option>
                  </select>
                  <input
                    type="date"
                    value={dateFilter === 'all' || dateFilter === 'today' ? '' : dateFilter}
                    onChange={(e) => setDateFilter(e.target.value || 'all')}
                    className="px-3 py-1.5 rounded-lg bg-[#121215] border border-gray-700 text-white text-xs font-semibold focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#121215] border border-emerald-500/30">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold uppercase">
                    <TrendingUp className="w-3.5 h-3.5" /> Ganhos
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1.5">
                    {formatBRL(totalRevenue)}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    {totalCars} lavagens concluídas
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#121215] border border-rose-500/30">
                  <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-bold uppercase">
                    <TrendingDown className="w-3.5 h-3.5" /> Despesas
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-rose-300 mt-1.5">
                    {formatBRL(totalExpenses)}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    {expensesInRange.length} registros
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#121215] border border-amber-500/30">
                  <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold uppercase">
                    <PiggyBank className="w-3.5 h-3.5" /> Lucro
                  </div>
                  <div
                    className={`text-xl sm:text-2xl font-black mt-1.5 ${
                      profit >= 0 ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {formatBRL(profit)}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Ganhos - Despesas
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#121215] border border-cyan-500/30">
                  <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-bold uppercase">
                    <Car className="w-3.5 h-3.5" /> Veículos
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white mt-1.5">
                    {totalCars}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {totalClients} clientes
                  </div>
                </div>
              </div>

              {/* Capital Panel */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#131c18] to-[#121215] border border-emerald-500/40">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    Painel do Capital
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                    Giro • Líquido • Bruto
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* Score gauge */}
                  <div className="flex flex-col items-center justify-center py-2">
                    <div className="relative">
                      <svg width="200" height="120" viewBox="0 0 200 120">
                        <path
                          d="M 20 105 A 80 80 0 0 1 180 105"
                          fill="none"
                          stroke="#1f2937"
                          strokeWidth="14"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 20 105 A 80 80 0 0 1 180 105"
                          fill="none"
                          stroke="url(#capitalGrad)"
                          strokeWidth="14"
                          strokeLinecap="round"
                          strokeDasharray={`${capitalScore * 2.513} 251.3`}
                          style={{ transition: 'stroke-dasharray 0.8s ease' }}
                        />
                        <defs>
                          <linearGradient id="capitalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f43f5e" />
                            <stop offset="50%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pt-3">
                        <span
                          className={`text-3xl font-black ${
                            capitalScore >= 60
                              ? 'text-emerald-300'
                              : capitalScore >= 30
                              ? 'text-amber-300'
                              : 'text-rose-300'
                          }`}
                        >
                          {capitalScore.toFixed(0)}
                        </span>
                        <span className="text-[9px] text-gray-500 uppercase tracking-wide">
                          Pontuação
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-400" /> 0
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400" /> 50
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> 100
                      </span>
                    </div>
                  </div>

                  {/* Capital values */}
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-[#121215] border border-emerald-500/30 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1.5">
                        <BadgeDollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        Giro (vendas)
                      </span>
                      <span className="font-black text-emerald-300 text-lg">
                        {formatBRL(totalRevenue)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#121215] border border-emerald-500/30 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1.5">
                        <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
                        Valor Líquido
                      </span>
                      <span
                        className={`font-black text-lg ${
                          profit >= 0 ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {formatBRL(profit)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#121215] border border-gray-800 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                        Valor Bruto
                      </span>
                      <span className="font-black text-white text-lg">
                        {formatBRL(totalRevenue)}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-600 leading-snug">
                      Giro = todo o valor movimentado. Líquido = o que sobra após os
                      gastos (despesas + funcionários). Bruto = valor total sem descontos.
                      A pontuação reflete sua margem: quanto maior, melhor.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="p-4 rounded-2xl bg-[#121215] border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    Ganhos - Últimos 7 Dias
                  </div>
                </div>
                <div className="flex items-end gap-2 h-32">
                  {last7Days.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[9px] text-emerald-300 font-bold">
                        {d.total > 0 ? formatBRL(d.total) : ''}
                      </span>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-cyan-400 transition-all"
                        style={{
                          height: `${Math.max((d.total / maxDay) * 100, d.total > 0 ? 4 : 2)}%`,
                          opacity: d.total > 0 ? 1 : 0.25,
                        }}
                      />
                      <span className="text-[10px] text-gray-500 font-semibold">
                        {d.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment method breakdown */}
              <div className="p-4 rounded-2xl bg-[#121215] border border-gray-800">
                <div className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  Formas de Pagamento
                </div>
                <div className="space-y-3">
                  {(Object.keys(methodTotals) as PaymentMethod[]).map((m) => {
                    const data = methodTotals[m];
                    const pct = totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0;
                    if (data.count === 0) return null;
                    return (
                      <div key={m}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-300 font-semibold flex items-center gap-1.5">
                            {METHOD_ICONS[m]} {METHOD_LABELS[m]}
                            <span className="text-gray-500">({data.count})</span>
                          </span>
                          <span className="font-black text-white">
                            {formatBRL(data.total)} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {Object.values(methodTotals).every((m) => m.count === 0) && (
                    <p className="text-xs text-gray-500">
                      Nenhuma venda registrada no período. As formas de pagamento
                      aparecem aqui quando o funcionário conclui lavagens.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============ APPROVALS ============ */}
          {activeTab === 'aprovacoes' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  O funcionário pode mudar o status <strong>1 vez</strong>. Qualquer
                  nova alteração precisa da sua autorização aqui.
                </span>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-500">
                  Nenhuma alteração de status aguardando sua aprovação. ✓
                </div>
              ) : (
                pendingApprovals.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-2xl bg-[#121215] border border-amber-500/40 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs px-2 py-1 rounded-lg bg-gray-800 text-amber-300 border border-gray-700">
                          {apt.code}
                        </span>
                        <div>
                          <div className="font-bold text-white text-sm">{apt.customerName}</div>
                          <div className="text-[11px] text-gray-400">
                            {apt.carModel} • {apt.date.split('-').reverse().join('/')} às {apt.timeSlot}
                          </div>
                        </div>
                      </div>
                      <span className="font-black text-emerald-400 text-sm">
                        {formatBRL(apt.totalPrice)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                        {apt.status === 'entregue'
                          ? 'Concluído'
                          : apt.status === 'em_lavagem'
                          ? 'Em Lavagem'
                          : apt.status === 'pronto'
                          ? 'Pronto'
                          : apt.status === 'aprovado'
                          ? 'Aprovado'
                          : apt.status === 'cancelado'
                          ? 'Cancelado'
                          : 'Agendado'}
                      </span>
                      <span className="text-amber-400">→</span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {apt.pendingStatusChange === 'entregue'
                          ? 'Concluído / Pago'
                          : apt.pendingStatusChange === 'em_lavagem'
                          ? 'Em Lavagem'
                          : apt.pendingStatusChange === 'pronto'
                          ? 'Pronto'
                          : apt.pendingStatusChange === 'aprovado'
                          ? 'Aprovado'
                          : apt.pendingStatusChange === 'cancelado'
                          ? 'Cancelado'
                          : 'Agendado'}
                      </span>
                    </div>

                    {apt.paymentMethod && (
                      <div className="text-[11px] text-emerald-300 flex items-center gap-1.5">
                        {METHOD_ICONS[apt.paymentMethod]}
                        Pago via {METHOD_LABELS[apt.paymentMethod]}
                        {apt.completedBy &&
                          ` • finalizado por ${settings.employees.find((e) => e.id === apt.completedBy)?.name || 'funcionário'}`}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onApproveStatusChange(apt.id)}
                        className="flex-1 px-3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                        Aprovar Mudança
                      </button>
                      <button
                        onClick={() => onRejectStatusChange(apt.id)}
                        className="px-3 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <XCircle className="w-4 h-4 stroke-[3]" />
                        Recusar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ============ EMPLOYEES ============ */}
          {activeTab === 'funcionarios' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    Cadastre funcionários e defina a comissão (salário fixo, valor
                    por lavagem ou porcentagem). O sistema calcula automaticamente.
                  </span>
                </div>
                <button
                  onClick={() =>
                    setEmployeeForm({
                      id: `emp_${Date.now()}`,
                      name: '',
                      phone: '',
                      code: '',
                      password: '',
                      payModel: 'comissao',
                      salaryType: 'mensal',
                      salaryValue: 0,
                      perWashValue: 0,
                      percentValue: 0,
                      active: true,
                    })
                  }
                  className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo Funcionário
                </button>
              </div>

              {/* Employee Form */}
              {employeeForm && (
                <div className="p-4 rounded-2xl bg-[#121215] border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5" />
                      {settings.employees.some((e) => e.id === employeeForm.id)
                        ? 'Editar Funcionário'
                        : 'Novo Funcionário'}
                    </span>
                    <button
                      onClick={() => setEmployeeForm(null)}
                      className="text-gray-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">Nome *</label>
                      <input
                        type="text"
                        value={employeeForm.name}
                        onChange={(e) =>
                          setEmployeeForm({ ...employeeForm, name: e.target.value })
                        }
                        placeholder="Ex: João Souza"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">Telefone</label>
                      <input
                        type="text"
                        value={employeeForm.phone}
                        onChange={(e) =>
                          setEmployeeForm({ ...employeeForm, phone: e.target.value })
                        }
                        placeholder="(94) 99999-9999"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">
                        Código de Login *
                      </label>
                      <input
                        type="text"
                        value={employeeForm.code}
                        onChange={(e) =>
                          setEmployeeForm({ ...employeeForm, code: e.target.value })
                        }
                        placeholder="Ex: FUN001"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">
                        Senha de Login *
                      </label>
                      <input
                        type="text"
                        value={employeeForm.password}
                        onChange={(e) =>
                          setEmployeeForm({ ...employeeForm, password: e.target.value })
                        }
                        placeholder="Senha para entrar no Painel"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">
                      Modelo de Pagamento
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'salario' as const, label: 'Salário Fixo' },
                        { id: 'comissao' as const, label: 'Por Lavagem' },
                        { id: 'porcentagem' as const, label: 'Porcentagem' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() =>
                            setEmployeeForm({ ...employeeForm, payModel: m.id })
                          }
                          className={`px-2 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                            employeeForm.payModel === m.id
                              ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                              : 'border-gray-700 bg-[#121215] text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {employeeForm.payModel === 'salario' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Período</label>
                        <select
                          value={employeeForm.salaryType}
                          onChange={(e) =>
                            setEmployeeForm({
                              ...employeeForm,
                              salaryType: e.target.value as 'mensal' | 'diario',
                            })
                          }
                          className={inputCls}
                        >
                          <option value="mensal">Mensal</option>
                          <option value="diario">Por Dia</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">
                          Valor (R$)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={employeeForm.salaryValue || ''}
                          onChange={(e) =>
                            setEmployeeForm({
                              ...employeeForm,
                              salaryValue: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={inputCls}
                        />
                      </div>
                    </div>
                  )}

                  {employeeForm.payModel === 'comissao' && (
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">
                        Valor por Lavagem (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={employeeForm.perWashValue || ''}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            perWashValue: parseFloat(e.target.value) || 0,
                          })
                        }
                        className={inputCls}
                      />
                    </div>
                  )}

                  {employeeForm.payModel === 'porcentagem' && (
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">
                        Porcentagem sobre as vendas (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={employeeForm.percentValue || ''}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            percentValue: parseFloat(e.target.value) || 0,
                          })
                        }
                        className={inputCls}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={employeeForm.active}
                        onChange={(e) =>
                          setEmployeeForm({ ...employeeForm, active: e.target.checked })
                        }
                        className="w-4 h-4 accent-emerald-400 cursor-pointer"
                      />
                      Funcionário ativo
                    </label>
                    <button
                      onClick={handleSaveEmployee}
                      disabled={
                        !employeeForm.name.trim() ||
                        !employeeForm.code.trim() ||
                        !employeeForm.password.trim()
                      }
                      className="px-4 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs cursor-pointer disabled:opacity-40"
                    >
                      Salvar Funcionário
                    </button>
                  </div>
                </div>
              )}

              {/* Employee list */}
              {settings.employees.length === 0 && !employeeForm ? (
                <div className="text-center py-8 text-xs text-gray-500">
                  Nenhum funcionário cadastrado ainda.
                </div>
              ) : (
                settings.employees.map((emp) => {
                  const earnings = computeEmployeeEarnings(emp);
                  return (
                    <div
                      key={emp.id}
                      className={`p-4 rounded-2xl bg-[#121215] border space-y-3 ${
                        emp.active ? 'border-gray-800' : 'border-gray-800/40 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm border border-emerald-500/30">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              {emp.name}
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-800 text-cyan-300 border border-gray-700 font-mono">
                                {emp.code || 'sem código'}
                              </span>
                              {!emp.active && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700">
                                  Inativo
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {emp.payModel === 'salario'
                                ? `Salário ${emp.salaryType === 'diario' ? 'por dia' : 'mensal'}: ${formatBRL(emp.salaryValue || 0)}`
                                : emp.payModel === 'comissao'
                                ? `Comissão: ${formatBRL(emp.perWashValue || 0)} por lavagem`
                                : `Comissão: ${emp.percentValue || 0}% das vendas`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEmployeeForm({ ...emp })}
                            className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                            title="Editar funcionário"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Excluir funcionário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-800/70">
                        <div className="text-center">
                          <div className="text-[10px] text-gray-500 uppercase">Lavagens</div>
                          <div className="font-black text-white text-sm mt-0.5">
                            {earnings.washCount}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-gray-500 uppercase">Vendas</div>
                          <div className="font-black text-white text-sm mt-0.5">
                            {formatBRL(earnings.empRevenue)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-gray-500 uppercase">A Receber</div>
                          <div className="font-black text-emerald-300 text-sm mt-0.5">
                            {formatBRL(earnings.value)}
                          </div>
                          <div className="text-[9px] text-gray-600">{earnings.label}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => setPayingEmployee(emp)}
                        disabled={earnings.value <= 0}
                        className="w-full px-3 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        title={
                          earnings.value <= 0
                            ? 'Nenhum valor pendente para este funcionário'
                            : 'Gerar comprovante (PDF/Excel) e registrar o pagamento'
                        }
                      >
                        <BanknoteIcon className="w-3.5 h-3.5" />
                        Pagar Funcionário
                        <span className="text-[10px] font-bold text-emerald-400/80">
                          ({formatBRL(earnings.value)})
                        </span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Payment history */}
          {activeTab === 'funcionarios' && (settings.employeePayments?.length || 0) > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wide">
                    Histórico de Pagamentos
                  </span>
                </div>
                <button
                  onClick={handleClearPayments}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Limpar todo o histórico de pagamentos"
                >
                  <Trash2 className="w-3 h-3" />
                  Limpar Histórico
                </button>
              </div>
              <div className="space-y-2">
                {[...settings.employeePayments]
                  .sort((a, b) => b.paidAt.localeCompare(a.paidAt))
                  .map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-[#121215] border border-gray-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-500/30 shrink-0">
                          {p.employeeName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs truncate">
                            {p.employeeName}
                            {p.employeeCode && (
                              <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-gray-800 text-cyan-300 border border-gray-700 font-mono">
                                {p.employeeCode}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {new Date(p.paidAt).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(p.paidAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {' • '}
                            {p.washes} lavagens • {p.format === 'pdf' ? 'PDF' : 'Excel'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <div className="font-black text-emerald-300 text-sm">
                            {formatBRL(p.amount)}
                          </div>
                          <div className="text-[9px] text-gray-600">
                            vendas {formatBRL(p.revenue)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePayment(p.id)}
                          className="p-1.5 rounded-lg text-red-400/70 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Excluir este pagamento do histórico"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ============ EXPENSES ============ */}
          {activeTab === 'despesas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-xs text-rose-200 flex items-start gap-2.5">
                  <Wallet className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    Registre os gastos da empresa (shampoo, cera, produtos, água,
                    energia...). Eles são abatidos dos ganhos para calcular o lucro.
                  </span>
                </div>
                <button
                  onClick={() =>
                    setExpenseForm({
                      id: `exp_${Date.now()}`,
                      date: new Date().toISOString().split('T')[0],
                      description: '',
                      category: 'Produtos',
                      amount: 0,
                    })
                  }
                  className="px-3 py-2 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova Despesa
                </button>
              </div>

              {/* Expense Form */}
              {expenseForm && (
                <div className="p-4 rounded-2xl bg-[#121215] border border-rose-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5" />
                      {settings.expenses.some((e) => e.id === expenseForm.id)
                        ? 'Editar Despesa'
                        : 'Nova Despesa'}
                    </span>
                    <button
                      onClick={() => setExpenseForm(null)}
                      className="text-gray-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">Data</label>
                      <input
                        type="date"
                        value={expenseForm.date}
                        onChange={(e) =>
                          setExpenseForm({ ...expenseForm, date: e.target.value })
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">Categoria</label>
                      <select
                        value={expenseForm.category}
                        onChange={(e) =>
                          setExpenseForm({ ...expenseForm, category: e.target.value })
                        }
                        className={inputCls}
                      >
                        <option>Produtos</option>
                        <option>Água / Energia</option>
                        <option>Aluguel</option>
                        <option>Equipamentos</option>
                        <option>Funcionários</option>
                        <option>Outros</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">
                        Valor (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={expenseForm.amount || ''}
                        onChange={(e) =>
                          setExpenseForm({
                            ...expenseForm,
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={expenseForm.description}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, description: e.target.value })
                      }
                      placeholder="Ex: Galão de shampoo automotivo"
                      className={inputCls}
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveExpense}
                      disabled={!expenseForm.description.trim() || expenseForm.amount <= 0}
                      className="px-4 py-2 rounded-lg bg-rose-400 hover:bg-rose-300 text-slate-950 font-extrabold text-xs cursor-pointer disabled:opacity-40"
                    >
                      Salvar Despesa
                    </button>
                  </div>
                </div>
              )}

              {/* Expense total & list */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#121215] border border-rose-500/30">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  Total de Despesas
                </span>
                <span className="font-black text-rose-300 text-lg">
                  {formatBRL(settings.expenses.reduce((s, e) => s + e.amount, 0))}
                </span>
              </div>

              {settings.expenses.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500">
                  Nenhuma despesa registrada ainda.
                </div>
              ) : (
                <div className="space-y-2">
                  {[...settings.expenses]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((exp) => (
                      <div
                        key={exp.id}
                        className="p-3.5 rounded-xl bg-[#121215] border border-gray-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                            <Wallet className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate">
                              {exp.description}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {exp.category} • {exp.date.split('-').reverse().join('/')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-rose-300 text-sm">
                            - {formatBRL(exp.amount)}
                          </span>
                          <button
                            onClick={() => setExpenseForm({ ...exp })}
                            className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                            title="Editar despesa"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Excluir despesa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ============ MATERIAIS / LOJINHA ============ */}
          {activeTab === 'materiais' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-2.5">
                  <Store className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Cadastre itens de venda da lojinha (cheirinho, perfume Síria,
                    acessórios...). Eles aparecem no formulário do cliente com foto,
                    descrição e valor para ele escolher na hora do agendamento.
                  </span>
                </div>
                <button
                  onClick={() =>
                    setMaterialForm({
                      id: `mat_${Date.now()}`,
                      name: '',
                      description: '',
                      price: 0,
                      costPrice: 0,
                      active: true,
                    })
                  }
                  className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo Material
                </button>
              </div>

              {/* Material Form */}
              {materialForm && (
                <div className="p-4 rounded-2xl bg-[#121215] border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5" />
                      {settings.materials.some((m) => m.id === materialForm.id)
                        ? 'Editar Material'
                        : 'Novo Material'}
                    </span>
                    <button
                      onClick={() => setMaterialForm(null)}
                      className="text-gray-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Photo upload */}
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">
                        Foto do material
                      </label>
                      <div className="flex items-center gap-3">
                        {materialForm.photoUrl ? (
                          <img
                            src={materialForm.photoUrl}
                            alt={materialForm.name || 'Material'}
                            className="w-16 h-16 rounded-xl object-cover border border-gray-700"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500">
                            <ImagePlus className="w-5 h-5" />
                          </div>
                        )}
                        <label className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] font-bold border border-gray-700 cursor-pointer">
                          {materialForm.photoUrl ? 'Trocar foto' : 'Enviar foto'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleMaterialPhoto(e.target.files?.[0])}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Name & price */}
                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">
                          Nome do material *
                        </label>
                        <input
                          type="text"
                          value={materialForm.name}
                          onChange={(e) =>
                            setMaterialForm({ ...materialForm, name: e.target.value })
                          }
                          placeholder="Ex: Cheirinho de Coco, Perfume Síria..."
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">
                          Valor de venda (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={materialForm.price || ''}
                          onChange={(e) =>
                            setMaterialForm({
                              ...materialForm,
                              price: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">
                          Valor pago (custo) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={materialForm.costPrice || ''}
                          onChange={(e) =>
                            setMaterialForm({
                              ...materialForm,
                              costPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={inputCls}
                        />
                        <p className="text-[10px] text-gray-600 mt-1">
                          Vai direto para as despesas ao salvar.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">
                      Descrição / Informações
                    </label>
                    <textarea
                      rows={2}
                      value={materialForm.description}
                      onChange={(e) =>
                        setMaterialForm({ ...materialForm, description: e.target.value })
                      }
                      placeholder="Ex: Aroma de caramelo que dura até 30 dias..."
                      className="w-full px-3 py-2 rounded-lg bg-[#121215] border border-gray-700 text-white text-xs focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={materialForm.active}
                        onChange={(e) =>
                          setMaterialForm({ ...materialForm, active: e.target.checked })
                        }
                        className="w-4 h-4 accent-emerald-400 cursor-pointer"
                      />
                      Ativo na lojinha
                    </label>
                    <button
                      onClick={handleSaveMaterial}
                      disabled={!materialForm.name.trim()}
                      className="px-4 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs cursor-pointer disabled:opacity-40"
                    >
                      Salvar Material
                    </button>
                  </div>
                </div>
              )}

              {/* Material list */}
              {settings.materials.length === 0 && !materialForm ? (
                <div className="text-center py-8 text-xs text-gray-500">
                  Nenhum material cadastrado ainda. Clique em "Novo Material" para começar.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {settings.materials.map((mat) => (
                    <div
                      key={mat.id}
                      className={`p-3.5 rounded-2xl bg-[#121215] border space-y-3 ${
                        mat.active ? 'border-gray-800' : 'border-gray-800/40 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {mat.photoUrl ? (
                          <img
                            src={mat.photoUrl}
                            alt={mat.name}
                            className="w-14 h-14 rounded-xl object-cover border border-gray-700"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500">
                            <Store className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white text-sm truncate">
                            {mat.name}
                          </div>
                          <div className="font-black text-emerald-300 text-sm">
                            {formatBRL(mat.price)}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            custo {formatBRL(mat.costPrice || 0)}
                          </div>
                          {!mat.active && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700">
                              Inativo
                            </span>
                          )}
                        </div>
                      </div>
                      {mat.description && (
                        <p className="text-[11px] text-gray-400 leading-snug">
                          {mat.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 justify-end pt-1 border-t border-gray-800/70">
                        <button
                          onClick={() => setMaterialForm({ ...mat })}
                          className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                          title="Editar material"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(mat.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Excluir material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============ PAY EMPLOYEE MODAL ============ */}
      {payingEmployee && (
        <EmployeePaymentModal
          isOpen
          onClose={() => setPayingEmployee(null)}
          employee={payingEmployee}
          washes={delivered
            .filter((a) => {
              const cutoff = payingEmployee.lastPaymentAt
                ? new Date(payingEmployee.lastPaymentAt).getTime()
                : 0;
              return (
                a.completedBy === payingEmployee.id &&
                new Date(a.paidAt || a.createdAt).getTime() > cutoff
              );
            })
            .map((a) => ({
              carModel: a.carModel,
              washName: a.washName,
              date: a.paidAt || a.createdAt,
              totalPrice: a.totalPrice,
            }))}
          amount={computeEmployeeEarnings(payingEmployee).value}
          washCount={computeEmployeeEarnings(payingEmployee).washCount}
          revenue={computeEmployeeEarnings(payingEmployee).empRevenue}
          periodStart={
            payingEmployee.lastPaymentAt || delivered[0]?.createdAt || new Date().toISOString()
          }
          periodEnd={new Date().toISOString()}
          storeName={settings.storeName}
          onConfirm={handlePayEmployee}
        />
      )}
    </div>
  );
};
