import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface TotalFooterProps {
  total: number;
  itemCount: number;
  selectedVehicleName?: string;
  selectedWashName?: string;
  onOpenOrderModal: () => void;
}

export const TotalFooter: React.FC<TotalFooterProps> = ({
  total,
  itemCount,
  selectedVehicleName,
  selectedWashName,
  onOpenOrderModal,
}) => {
  const formatPrice = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1a1d24]/95 backdrop-blur-md border-t border-cyan-500/30 shadow-2xl shadow-cyan-950/80 px-4 py-3.5">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        {/* Total Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {itemCount > 0
                ? `${itemCount} ${itemCount === 1 ? 'item selecionado' : 'itens selecionados'}`
                : 'Nenhum item'}
            </span>
          </div>

          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-bold text-gray-400 uppercase">Total:</span>
            <span
              id="total-val"
              className="text-xl sm:text-2xl font-black text-cyan-300 tracking-tight"
            >
              {formatPrice(total)}
            </span>
          </div>

          {(selectedVehicleName || selectedWashName) && (
            <div className="text-[11px] text-cyan-400/80 truncate max-w-[180px] sm:max-w-[260px] hidden xs:block">
              {selectedVehicleName && <span>{selectedVehicleName}</span>}
              {selectedVehicleName && selectedWashName && <span> • </span>}
              {selectedWashName && <span>{selectedWashName}</span>}
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={onOpenOrderModal}
          id="btn-order-whatsapp"
          className="btn-order bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold px-5 py-3.5 rounded-xl shadow-lg shadow-cyan-400/20 active:scale-95 transition-all duration-150 flex items-center gap-2 text-sm sm:text-base cursor-pointer border border-cyan-300"
        >
          <span>Avançar / Reservar</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
