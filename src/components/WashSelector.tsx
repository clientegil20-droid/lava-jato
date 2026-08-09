import React from 'react';
import { PriceMatrix, VehicleId, WashId, WashOption } from '../types';
import { Droplets, Sparkles, Gem, Check, Info } from 'lucide-react';

interface WashSelectorProps {
  washes: WashOption[];
  selectedVehicle: VehicleId | null;
  selectedWash: WashId | null;
  priceMatrix: PriceMatrix;
  onSelectWash: (id: WashId) => void;
}

export const WashSelector: React.FC<WashSelectorProps> = ({
  washes,
  selectedVehicle,
  selectedWash,
  priceMatrix,
  onSelectWash,
}) => {
  const formatPrice = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getWashIcon = (id: WashId) => {
    switch (id) {
      case 'simples':
        return <Droplets className="w-5 h-5 text-cyan-400" />;
      case 'completa':
        return <Sparkles className="w-5 h-5 text-cyan-300" />;
      case 'detalhada':
        return <Gem className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <section className="mb-8" id="section-washes">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-800">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs">
          2
        </span>
        <h2 className="text-lg font-bold text-white tracking-wide">
          Escolha o Tipo de Lavagem
        </h2>
      </div>

      {!selectedVehicle && (
        <div className="p-3.5 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
          <Info className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Selecione primeiro o tipo do seu veículo no Passo 1 para visualizar os valores exatos da lavagem.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3" id="wash-group">
        {washes.map((w) => {
          const isSelected = selectedWash === w.id;
          const price = selectedVehicle ? priceMatrix[selectedVehicle][w.id] : null;

          return (
            <button
              key={w.id}
              type="button"
              id={`wash-opt-${w.id}`}
              onClick={() => onSelectWash(w.id)}
              className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isSelected
                  ? 'border-cyan-400 bg-gradient-to-r from-cyan-950/70 to-[#1a2f38] shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                  : 'border-gray-800 bg-[#1d1d22] hover:border-gray-700 hover:bg-[#23232a]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-gray-800/80 shrink-0 border border-gray-700/50 mt-0.5">
                  {getWashIcon(w.id)}
                </div>
                <div>
                  <div className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    {w.name}
                    {w.id === 'completa' && (
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Mais Pedida
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 leading-snug">
                    {w.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/60">
                <div className="text-right">
                  <span className="text-xs text-gray-400 block sm:hidden">Valor</span>
                  <span
                    className={`font-black text-base sm:text-lg ${
                      isSelected ? 'text-cyan-300' : 'text-cyan-400'
                    }`}
                    id={`p-${w.id}`}
                  >
                    {price !== null ? formatPrice(price) : 'Selecione Veículo'}
                  </span>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500 text-black'
                      : 'border-gray-700 bg-gray-800/50'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
