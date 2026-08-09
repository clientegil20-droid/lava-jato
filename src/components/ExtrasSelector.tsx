import React from 'react';
import { ExtraService } from '../types';
import { ShieldAlert, Cpu, Wind, Sun, ShieldCheck, Plus, Check } from 'lucide-react';

interface ExtrasSelectorProps {
  extras: ExtraService[];
  selectedExtras: string[];
  onToggleExtra: (id: string) => void;
}

export const ExtrasSelector: React.FC<ExtrasSelectorProps> = ({
  extras,
  selectedExtras,
  onToggleExtra,
}) => {
  const formatPrice = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getExtraIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-blue-400" />;
      case 'Wind':
        return <Wind className="w-5 h-5 text-cyan-400" />;
      case 'Sun':
        return <Sun className="w-5 h-5 text-orange-400" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <section className="mb-10" id="section-extras">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs">
            3
          </span>
          <h2 className="text-lg font-bold text-white tracking-wide">
            Serviços Adicionais
          </h2>
        </div>
        <span className="text-xs text-gray-400 font-medium bg-gray-800/80 px-2.5 py-1 rounded-full border border-gray-700">
          Opcionais
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {extras.map((extra) => {
          const isSelected = selectedExtras.includes(extra.id);

          return (
            <button
              key={extra.id}
              type="button"
              id={`extra-opt-${extra.id}`}
              onClick={() => onToggleExtra(extra.id)}
              className={`checkbox-option text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isSelected
                  ? 'border-cyan-400 bg-gradient-to-r from-cyan-950/70 to-[#1a2f38] shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                  : 'border-gray-800 bg-[#1d1d22] hover:border-gray-700 hover:bg-[#23232a]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-gray-800/80 shrink-0 border border-gray-700/50 mt-0.5">
                  {getExtraIcon(extra.icon)}
                </div>
                <div>
                  <div className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    {extra.name}
                    {extra.popular && (
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 leading-snug">
                    {extra.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/60">
                <span
                  className={`font-extrabold text-sm sm:text-base ${
                    isSelected ? 'text-cyan-300' : 'text-cyan-400'
                  }`}
                >
                  + {formatPrice(extra.price)}
                </span>

                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500 text-black'
                      : 'border-gray-700 bg-gray-800/50'
                  }`}
                >
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
