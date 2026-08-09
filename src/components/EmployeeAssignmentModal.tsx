import React, { useState } from 'react';
import { Appointment, Employee } from '../types';
import { X, UserCheck, Eye, EyeOff, KeyRound, User, Car, CheckCircle2 } from 'lucide-react';
import { formatBRL } from '../utils/whatsapp';

interface EmployeeAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  targetStatus: 'pronto' | 'entregue' | null;
  employees: Employee[];
  defaultEmployeeId?: string;
  onConfirm: (employeeId: string) => void;
}

export const EmployeeAssignmentModal: React.FC<EmployeeAssignmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  targetStatus,
  employees,
  defaultEmployeeId,
  onConfirm,
}) => {
  const [selectedId, setSelectedId] = useState<string>(defaultEmployeeId || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !appointment) return null;

  const activeEmployees = employees.filter((e) => e.active);
  const selectedEmp = employees.find((e) => e.id === selectedId);

  const handleConfirm = () => {
    if (!selectedEmp) {
      setError('Selecione o funcionário que realizou a lavagem.');
      return;
    }
    if (code.trim().toLowerCase() !== selectedEmp.code.trim().toLowerCase()) {
      setError('Código incorreto para este funcionário.');
      return;
    }
    if (password !== selectedEmp.password) {
      setError('Senha incorreta para este funcionário.');
      return;
    }
    setError(null);
    setCode('');
    setPassword('');
    setSelectedId('');
    onConfirm(selectedEmp.id);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#18181c] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-[#182622] to-[#141d1a] border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {targetStatus === 'entregue'
                  ? 'Confirmar Entrega / Conclusão'
                  : 'Confirmar Pronto para Retirada'}
              </h3>
              <p className="text-xs text-emerald-200/80">
                {appointment.customerName} • {appointment.code}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Appointment summary */}
          <div className="p-3 rounded-xl bg-[#121215] border border-gray-800 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-gray-300">
              <Car className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold text-white truncate">{appointment.carModel}</span>
              <span className="text-gray-500 truncate">{appointment.washName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Valor:</span>
              <span className="font-black text-emerald-300">{formatBRL(appointment.totalPrice)}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Confirme <strong>quem lavou o veículo</strong>. Esta informação vai para
              o dono e é a partir deste momento que a <strong>comissão</strong> do
              funcionário é registrada.
            </span>
          </div>

          {/* Employee select */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              Funcionário que lavou o veículo
            </label>
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white text-sm focus:border-emerald-400 focus:outline-none cursor-pointer"
            >
              <option value="">Selecione o funcionário...</option>
              {activeEmployees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.code})
                </option>
              ))}
            </select>
          </div>

          {/* Code & password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                Código
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                placeholder={selectedEmp ? selectedEmp.code : 'Código'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white font-mono text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirm();
                  }}
                  placeholder="••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white font-mono text-sm focus:border-emerald-400 focus:outline-none pr-10"
                />
                <button
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-2.5 p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-semibold">⚠️ {error}</p>
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
            disabled={!selectedEmp || !code.trim() || !password.trim()}
            className="flex-1 max-w-xs px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[3]" />
            <span>Confirmar & Registrar Comissão</span>
          </button>
        </div>
      </div>
    </div>
  );
};
