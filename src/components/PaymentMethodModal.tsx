import React, { useState } from 'react';
import { Appointment, Employee, PaymentMethod } from '../types';
import { X, Banknote, QrCode, CreditCard, Landmark, Check, User } from 'lucide-react';
import { formatBRL } from '../utils/whatsapp';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  employees: Employee[];
  defaultEmployeeId?: string;
  onConfirm: (method: PaymentMethod, completedBy?: string) => void;
}

const METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: 'dinheiro', label: 'Dinheiro', icon: <Banknote className="w-6 h-6" /> },
  { id: 'pix', label: 'Pix', icon: <QrCode className="w-6 h-6" /> },
  { id: 'credito', label: 'Cartão de Crédito', icon: <CreditCard className="w-6 h-6" /> },
  { id: 'debito', label: 'Cartão de Débito', icon: <Landmark className="w-6 h-6" /> },
];

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  appointment,
  employees,
  defaultEmployeeId,
  onConfirm,
}) => {
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [completedBy, setCompletedBy] = useState<string>(defaultEmployeeId || '');

  if (!isOpen || !appointment) return null;

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected, completedBy || undefined);
    setSelected(null);
    setCompletedBy('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-[#18181c] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 via-[#182622] to-[#141d1a] border-b border-emerald-500/30 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Registrar Pagamento</h3>
            <p className="text-xs text-emerald-200/80">
              {appointment.customerName} • {appointment.code} •{' '}
              <span className="font-bold text-emerald-300">
                {formatBRL(appointment.totalPrice)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-3">
          <p className="text-xs text-gray-400 font-medium">
            Como o cliente pagou a lavagem? Este registro alimenta os ganhos do dono.
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                className={`p-3.5 rounded-xl border transition-all flex flex-col items-center gap-2 cursor-pointer ${
                  selected === m.id
                    ? 'border-emerald-400 bg-emerald-500/15 ring-1 ring-emerald-400/50'
                    : 'border-gray-700 bg-[#121215] hover:border-gray-500'
                }`}
              >
                <span
                  className={`${selected === m.id ? 'text-emerald-400' : 'text-gray-300'}`}
                >
                  {m.icon}
                </span>
                <span
                  className={`text-xs font-bold ${
                    selected === m.id ? 'text-emerald-300' : 'text-gray-200'
                  }`}
                >
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          {employees.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Funcionário que finalizou a lavagem
              </label>
              <select
                value={completedBy}
                onChange={(e) => setCompletedBy(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white text-sm focus:border-emerald-400 focus:outline-none cursor-pointer"
              >
                <option value="">Selecione o funcionário...</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141418] border-t border-gray-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="flex-1 max-w-xs px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Confirmar Pagamento & Concluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
