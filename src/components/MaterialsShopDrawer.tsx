import React, { useState } from 'react';
import { Material } from '../types';
import { formatBRL } from '../utils/whatsapp';
import { ChevronLeft, ChevronRight, ShoppingBag, Plus, Check } from 'lucide-react';

interface MaterialsShopDrawerProps {
  materials: Material[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export const MaterialsShopDrawer: React.FC<MaterialsShopDrawerProps> = ({
  materials,
  selectedIds,
  onToggle,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeMaterials = materials.filter((m) => m.active);

  if (activeMaterials.length === 0) return null;

  return (
    <>
      {/* Floating arrow button (setinha) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed top-1/2 right-0 -translate-y-1/2 z-40 flex items-center gap-1.5 pl-2.5 pr-3 py-3 rounded-l-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-xl shadow-cyan-500/30 cursor-pointer transition-all active:scale-95 border-l border-cyan-300/50"
        title="Abrir Lojinha de Materiais"
      >
        <ShoppingBag className="w-4 h-4 stroke-[3]" />
        <ChevronLeft className="w-4 h-4 stroke-[3]" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-in drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 bg-[#15151a] border-l border-cyan-500/40 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1c2733] to-[#121921] border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Lojinha do Lava Jato</h3>
              <p className="text-xs text-cyan-200/80">
                Escolha produtos para adicionar ao seu pedido
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {activeMaterials.map((mat) => {
            const isSelected = selectedIds.includes(mat.id);
            return (
              <button
                key={mat.id}
                type="button"
                onClick={() => onToggle(mat.id)}
                className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40'
                    : 'border-gray-800 bg-[#121215] hover:border-gray-700'
                }`}
              >
                {mat.photoUrl ? (
                  <img
                    src={mat.photoUrl}
                    alt={mat.name}
                    className="w-14 h-14 rounded-xl object-cover border border-gray-700 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500 shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white text-sm leading-tight">
                    {mat.name}
                  </div>
                  {mat.description && (
                    <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                      {mat.description}
                    </div>
                  )}
                  <div className="font-black text-cyan-300 text-sm mt-1">
                    {formatBRL(mat.price)}
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500 text-black'
                      : 'border-gray-700 bg-gray-800'
                  }`}
                >
                  {isSelected ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141418] border-t border-gray-800 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-gray-500 uppercase block">Selecionados</span>
            <span className="font-black text-white text-sm">{selectedIds.length} item(ns)</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs cursor-pointer transition-all active:scale-95"
          >
            Concluir ({selectedIds.length})
          </button>
        </div>
      </div>
    </>
  );
};
