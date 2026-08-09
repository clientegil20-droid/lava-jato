import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';

interface OwnerPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OwnerPasswordModal: React.FC<OwnerPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (password.trim().toUpperCase() === 'G9491') {
      setError(null);
      setPassword('');
      onSuccess();
    } else {
      setError('Senha incorreta. Acesso negado.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-[#18181c] border border-violet-500/40 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#2a1c3d] to-[#1c1226] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Área do Dono
              </h3>
              <p className="text-xs text-violet-200/70">
                Digite a senha para acessar o painel privado
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
          <div className="p-3.5 rounded-xl bg-violet-950/40 border border-violet-500/20 text-xs text-violet-200 flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <span>
              Apenas o <strong>proprietário</strong> pode acessar: ganhos, gráficos, aprovações,
              comissões de funcionários, despesas e edição de preços/produtos.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Senha do Proprietário
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
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white font-mono text-sm focus:border-violet-400 focus:outline-none pr-10"
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
            {error && (
              <p className="text-xs text-rose-400 font-semibold mt-1.5">⚠️ {error}</p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 cursor-pointer active:scale-95 transition-all"
          >
            <Lock className="w-4 h-4" />
            <span>Desbloquear Painel do Dono</span>
          </button>

          <p className="text-[11px] text-gray-500 text-center">
            Funcionários não têm acesso a esta área.
          </p>
        </div>
      </div>
    </div>
  );
};
