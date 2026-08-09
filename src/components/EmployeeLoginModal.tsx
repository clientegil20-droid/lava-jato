import React, { useState } from 'react';
import { Employee } from '../types';
import { X, LogIn, Eye, EyeOff, User, KeyRound, ShieldAlert } from 'lucide-react';

interface EmployeeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onLogin: (employee: Employee) => void;
}

export const EmployeeLoginModal: React.FC<EmployeeLoginModalProps> = ({
  isOpen,
  onClose,
  employees,
  onLogin,
}) => {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!code.trim() || !password.trim()) {
      setError('Informe o código e a senha do funcionário.');
      return;
    }
    const emp = employees.find(
      (e) =>
        e.active &&
        e.code.trim().toLowerCase() === code.trim().toLowerCase() &&
        e.password === password
    );
    if (!emp) {
      setError('Código ou senha incorretos. Acesso negado.');
      return;
    }
    setCode('');
    setPassword('');
    setError(null);
    onLogin(emp);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-[#18181c] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1d2733] to-[#161d26] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Login do Funcionário
              </h3>
              <p className="text-xs text-cyan-200/70">
                Acesso ao Painel da Loja
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
        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Digite seu código e senha. Cada lavagem e alteração de status será
              registrada no seu nome para o cálculo da sua comissão.
            </span>
          </div>

          {employees.filter((e) => e.active).length === 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              ⚠️ Nenhum funcionário cadastrado. O dono deve cadastrar os
              funcionários com código e senha no Painel do Dono primeiro.
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              Código do Funcionário
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              placeholder="Ex: FUN001 ou 001"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white font-mono text-sm focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
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
                  if (e.key === 'Enter') handleSubmit();
                }}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white font-mono text-sm focus:border-cyan-400 focus:outline-none pr-10"
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

          {error && (
            <p className="text-xs text-rose-400 font-semibold">⚠️ {error}</p>
          )}

          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20 cursor-pointer active:scale-95 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Entrar no Painel da Loja</span>
          </button>
        </div>
      </div>
    </div>
  );
};
