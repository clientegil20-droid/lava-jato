import React from 'react';
import { Employee, StoreSettings, UserRole } from '../types';
import { Settings, MapPin, PhoneCall, User, Wrench, Link, Lock, Unlock, LogOut, UserCircle } from 'lucide-react';

interface HeaderProps {
  settings: StoreSettings;
  appMode: 'cliente' | 'funcionario';
  onChangeMode: (mode: 'cliente' | 'funcionario') => void;
  appointmentCount: number;
  onOpenSettings: () => void;
  onOpenShareLink?: () => void;
  isClientOnly?: boolean;
  role?: UserRole;
  onRequestOwnerAccess?: () => void;
  currentEmployee?: Employee | null;
  onLogoutEmployee?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  appMode,
  onChangeMode,
  appointmentCount,
  onOpenSettings,
  onOpenShareLink,
  isClientOnly = false,
  role = 'funcionario',
  onRequestOwnerAccess,
  currentEmployee,
  onLogoutEmployee,
}) => {
  const isOwner = role === 'dono';

  return (
    <header className="relative bg-gradient-to-b from-[#1a232e] via-[#121214] to-[#121214] pt-6 pb-6 px-4 border-b border-cyan-500/20">
      <div className="max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto text-center relative">
        {/* Top bar with mode switcher & settings (hidden for client-only link) */}
        {!isClientOnly && (
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-gray-800/60">
          {/* Mode Switcher Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-[#18181d] border border-gray-800 shadow-sm">
            <button
              onClick={() => onChangeMode('cliente')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                appMode === 'cliente'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Agendamento Cliente</span>
            </button>

            <button
              onClick={() => onChangeMode('funcionario')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                appMode === 'funcionario'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Painel da Loja</span>
              {appointmentCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-950 text-cyan-300 font-extrabold">
                  {appointmentCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {onOpenShareLink && (
              <button
                onClick={onOpenShareLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold text-emerald-300 transition-colors shadow-sm cursor-pointer"
                title="Copiar ou enviar link de agendamento para o cliente"
              >
                <Link className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Enviar Link p/ Cliente</span>
                <span className="sm:hidden">Link</span>
              </button>
            )}

            {currentEmployee && !isOwner && (
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-300"
                title="Funcionário logado"
              >
                <UserCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">{currentEmployee.name}</span>
                <span className="sm:hidden">{currentEmployee.code}</span>
                {onLogoutEmployee && (
                  <button
                    onClick={onLogoutEmployee}
                    className="p-0.5 ml-0.5 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
                    title="Sair da conta do funcionário"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                )}
              </span>
            )}

            {isOwner ? (
              <button
                onClick={onRequestOwnerAccess}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-xs font-bold text-emerald-300 transition-colors shadow-sm cursor-pointer"
                title="Painel do Dono desbloqueado. Clique para bloquear."
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Dono</span>
              </button>
            ) : (
              <button
                onClick={onRequestOwnerAccess}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/40 text-xs font-bold text-violet-300 transition-colors shadow-sm cursor-pointer"
                title="Área do Dono (exige senha)"
              >
                <Lock className="w-3.5 h-3.5 text-violet-400" />
                <span className="hidden sm:inline">Dono</span>
              </button>
            )}

            {isOwner && (
              <button
                onClick={onOpenSettings}
                id="admin-settings-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1d1d22] hover:bg-[#282830] border border-gray-700 text-xs font-semibold text-gray-300 transition-colors shadow-sm cursor-pointer"
                title="Configurações do Lava Jato (Preços e WhatsApp) - só do dono"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Editar Preços</span>
              </button>
            )}
          </div>
        </div>
        )}

        {/* Brand Icon & Name */}
        <div className="inline-flex items-center justify-center p-1.5 rounded-full bg-gradient-to-br from-cyan-500/30 via-blue-600/20 to-cyan-400/30 border-2 border-cyan-400/50 mb-3 shadow-xl shadow-cyan-500/20 ring-4 ring-cyan-500/10">
          <img
            src="/lava_jato_logo.jpg"
            alt="Lava Jato Redenção Logo"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-inner"
            referrerPolicy="no-referrer"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
          {settings.storeName}
        </h1>

        <p className="text-xs sm:text-sm text-cyan-200/80 max-w-md mx-auto mb-3 font-medium">
          {settings.subtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-400">
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(settings.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200 hover:underline transition-colors"
            title="Abrir localização no Google Maps"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{settings.address}</span>
          </a>
          <span className="text-gray-600">•</span>
          <a
            href={`https://wa.me/${settings.whatsappPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition-colors"
            title="Abrir WhatsApp da Loja"
          >
            <PhoneCall className="w-3.5 h-3.5 shrink-0" />
            <span>WhatsApp: {settings.whatsappPhone}</span>
          </a>
        </div>
      </div>
    </header>
  );
};
