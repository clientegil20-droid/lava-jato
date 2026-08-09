import React, { useState } from 'react';
import { Appointment, ExtraService } from '../types';
import { X, Plus, Check, ShoppingCart } from 'lucide-react';
import { formatBRL } from '../utils/whatsapp';

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  products: ExtraService[];
  onConfirm: (extraIds: string[]) => void;
}

export const ProductPickerModal: React.FC<ProductPickerModalProps> = ({
  isOpen,
  onClose,
  appointment,
  products,
  onConfirm,
}) => {
  const [selected, setSelected] = useState<string[]>([]);

  if (!isOpen || !appointment) return null;

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (selected.length === 0) {
      onClose();
      setSelected([]);
      return;
    }
    onConfirm(selected);
    setSelected([]);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#18181c] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1d2733] to-[#161d26] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Adicionar Produto / Serviço
              </h3>
              <p className="text-xs text-cyan-200/70">
                {appointment.customerName} • {appointment.code}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              setSelected([]);
            }}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-2.5">
          {products.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500">
              Nenhum produto/serviço cadastrado. O dono pode adicionar em
              Configurações → Produtos.
            </div>
          ) : (
            products.map((p) => {
              const isSelected = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className={`w-full flex items-center justify-between gap-2 p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500/10'
                      : 'border-gray-800 bg-[#121215] hover:border-gray-600'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      {p.name}
                      {p.popular && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{p.description}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-emerald-400 text-sm">
                      {formatBRL(p.price)}
                    </span>
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
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
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141418] border-t border-gray-800 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              setSelected([]);
            }}
            className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-400/20 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {selected.length > 0
                ? `Adicionar ${selected.length} item(ns)`
                : 'Fechar'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
