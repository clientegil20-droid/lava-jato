import React, { useState } from 'react';
import { ExtraService, PriceMatrix, StoreSettings, VehicleId, WashId } from '../types';
import { DEFAULT_VEHICLES, DEFAULT_WASHES } from '../data/defaultData';
import { X, Save, RotateCcw, Phone, DollarSign, Store, Plus, Trash2, Check, Lock } from 'lucide-react';

interface AdminSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onSaveSettings: (newSettings: StoreSettings) => void;
  onResetDefaults: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetDefaults,
}) => {
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'matrix' | 'extras' | 'security'>('general');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleMatrixPriceChange = (
    vehicleId: VehicleId,
    washId: WashId,
    value: string
  ) => {
    const numericValue = parseFloat(value) || 0;
    setFormData((prev) => ({
      ...prev,
      priceMatrix: {
        ...prev.priceMatrix,
        [vehicleId]: {
          ...prev.priceMatrix[vehicleId],
          [washId]: numericValue,
        },
      },
    }));
  };

  const handleExtraChange = (index: number, field: keyof ExtraService, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.extraServices];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, extraServices: updated };
    });
  };

  const handleAddExtra = () => {
    const newExtra: ExtraService = {
      id: `custom_extra_${Date.now()}`,
      name: 'Novo Serviço Adicional',
      description: 'Descrição do serviço',
      price: 50,
      icon: 'ShieldCheck',
    };
    setFormData((prev) => ({
      ...prev,
      extraServices: [...prev.extraServices, newExtra],
    }));
  };

  const handleDeleteExtra = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      extraServices: prev.extraServices.filter((e) => e.id !== id),
    }));
  };

  const handleSave = () => {
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#18181c] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1c2733] to-[#121921] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">
                Painel do Proprietário - Lava Jato
              </h3>
              <p className="text-xs text-cyan-200/70">
                Ajuste os preços, WhatsApp e serviços do seu estabelecimento
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-800 bg-[#121215] px-4">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'general'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Geral & WhatsApp
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'matrix'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Tabela de Preços de Lavagem
          </button>
          <button
            onClick={() => setActiveTab('extras')}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'extras'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Produtos & Serviços
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'security'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Segurança
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 max-h-[65vh] overflow-y-auto space-y-4 custom-scrollbar">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-200">
                📱 <strong>Número do WhatsApp:</strong> Quando o cliente clicar em "Reservar", a mensagem de agendamento será enviada para o número configurado aqui.
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  Número do WhatsApp (com DDD e 55 do Brasil) *
                </label>
                <input
                  type="text"
                  value={formData.whatsappPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsappPhone: e.target.value })
                  }
                  placeholder="Ex: 5594999999999"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white font-mono text-sm focus:border-cyan-400 focus:outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Exemplo para Redenção-PA (DDD 94): <code className="text-cyan-400">5594991234567</code>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Nome do Estabelecimento
                  </label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) =>
                      setFormData({ ...formData, storeName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Subtítulo / Slogan
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Cidade / Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Horário de Funcionamento
                  </label>
                  <input
                    type="text"
                    value={formData.openingHours}
                    onChange={(e) =>
                      setFormData({ ...formData, openingHours: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-200">
                💡 <strong>Matriz Inteligente:</strong> Altere o preço base de cada combinação de veículo e tipo de lavagem em Reais (R$).
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#121215] text-cyan-400 uppercase font-bold text-[11px] border-b border-gray-800">
                    <tr>
                      <th className="py-2.5 px-3">Veículo</th>
                      <th className="py-2.5 px-3">Simples</th>
                      <th className="py-2.5 px-3">Completa</th>
                      <th className="py-2.5 px-3">Detalhada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {DEFAULT_VEHICLES.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-800/30">
                        <td className="py-3 px-3 font-bold text-white flex items-center gap-1.5">
                          <span>{v.badgeText}</span>
                          <span>{v.name}</span>
                        </td>
                        {DEFAULT_WASHES.map((w) => (
                          <td key={w.id} className="py-2 px-3">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">R$</span>
                              <input
                                type="number"
                                step="1"
                                value={formData.priceMatrix[v.id][w.id]}
                                onChange={(e) =>
                                  handleMatrixPriceChange(v.id, w.id, e.target.value)
                                }
                                className="w-20 px-2 py-1.5 rounded-lg bg-[#121215] border border-gray-700 text-white font-mono font-bold text-xs focus:border-cyan-400 focus:outline-none"
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'extras' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Adicione, remova ou modifique os valores dos adicionais.
                </p>

                <button
                  onClick={handleAddExtra}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-500/30 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Novo
                </button>
              </div>

              <div className="space-y-3">
                {formData.extraServices.map((extra, idx) => (
                  <div
                    key={extra.id}
                    className="p-3.5 rounded-xl bg-[#121215] border border-gray-800 space-y-2 relative"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-gray-400 block mb-0.5">
                          Nome do Serviço Adicional
                        </label>
                        <input
                          type="text"
                          value={extra.name}
                          onChange={(e) =>
                            handleExtraChange(idx, 'name', e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#1a1a20] border border-gray-700 text-white text-xs font-semibold focus:border-cyan-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-gray-400 block mb-0.5">
                          Preço Adicional (R$)
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={extra.price}
                          onChange={(e) =>
                            handleExtraChange(
                              idx,
                              'price',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#1a1a20] border border-gray-700 text-white font-mono font-bold text-xs focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <input
                        type="text"
                        value={extra.description}
                        onChange={(e) =>
                          handleExtraChange(idx, 'description', e.target.value)
                        }
                        placeholder="Descrição curta do serviço"
                        className="flex-1 px-2.5 py-1 rounded-lg bg-[#1a1a20] border border-gray-800 text-gray-300 text-xs focus:border-cyan-400 focus:outline-none"
                      />

                      <button
                        onClick={() => handleDeleteExtra(extra.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Excluir adicional"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-violet-950/40 border border-violet-500/20 text-xs text-violet-200">
                🔒 <strong>Segurança:</strong> A senha abaixo protege o acesso ao
                Painel do Dono (ganhos, comissões, despesas, aprovações e esta
                tela de configurações). Funcionários não a veem.
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-violet-400" />
                  Senha do Dono
                </label>
                <input
                  type="text"
                  value={formData.ownerPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerPassword: e.target.value })
                  }
                  placeholder="Digite a senha do dono"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white font-mono text-sm focus:border-violet-400 focus:outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Padrão: <code className="text-violet-400">G9491</code>. Troque por uma senha forte.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141418] border-t border-gray-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              if (
                confirm('Deseja restaurar as configurações e preços padrões de Redenção-PA?')
              ) {
                onResetDefaults();
                onClose();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Padrão
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-400/20 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
