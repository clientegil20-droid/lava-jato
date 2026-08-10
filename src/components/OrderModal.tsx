import React, { useState } from 'react';
import { Appointment, CustomerData, ExtraService, Material, VehicleOption, WashOption } from '../types';
import { X, MessageCircle, Calendar, Clock, Car, MapPin, Receipt, User, Phone, ShoppingBag } from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVehicle: VehicleOption | null;
  selectedWash: WashOption | null;
  selectedExtras: ExtraService[];
  selectedMaterials?: Material[];
  totalPrice: number;
  whatsappPhone: string;
  storeName: string;
  isStaffMode?: boolean;
  onConfirmAppointment: (appointment: Appointment) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  selectedVehicle,
  selectedWash,
  selectedExtras,
  selectedMaterials = [],
  totalPrice,
  whatsappPhone,
  storeName,
  isStaffMode = false,
  onConfirmAppointment,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [customer, setCustomer] = useState<CustomerData>({
    name: '',
    phone: '',
    carModel: '',
    carColor: '',
    carPlate: '',
    date: todayStr,
    timeSlot: '08:30',
    deliveryOption: false,
    address: '',
    notes: '',
  });

  const [materialIds, setMaterialIds] = useState<string[]>([]);

  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const chosenMaterials = selectedMaterials.filter((m) => materialIds.includes(m.id));
  const materialsTotal = chosenMaterials.reduce((s, m) => s + m.price, 0);
  const effectiveTotal = totalPrice + materialsTotal;

  const toggleMaterial = (id: string) => {
    setMaterialIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const formatPrice = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleSubmitAppointment = () => {
    if (!selectedVehicle || !selectedWash) {
      setValidationError('Por favor, selecione o veículo e o tipo de lavagem no cardápio!');
      return;
    }

    if (!customer.name.trim()) {
      setValidationError('Por favor, informe o Nome do cliente.');
      return;
    }

    if (!customer.carModel.trim()) {
      setValidationError('Por favor, informe o Modelo do veículo (ex: Hilux Prata).');
      return;
    }

    setValidationError(null);

    // Create Appointment Object
    const codeNum = Math.floor(100 + Math.random() * 900);
    const newAppointment: Appointment = {
      id: `apt_${Date.now()}`,
      code: `#${codeNum}`,
      createdAt: new Date().toISOString(),
      customerName: customer.name.trim(),
      customerPhone: customer.phone.trim(),
      carModel: customer.carModel.trim(),
      carColor: customer.carColor.trim(),
      carPlate: customer.carPlate.trim().toUpperCase(),
      vehicleName: selectedVehicle.name,
      washName: selectedWash.name,
      extraNames: selectedExtras.map((e) => e.name),
      materialNames: chosenMaterials.map((m) => m.name),
      totalPrice: effectiveTotal,
      date: customer.date,
      timeSlot: customer.timeSlot,
      deliveryOption: customer.deliveryOption,
      address: customer.address.trim(),
      notes: customer.notes.trim(),
      status: 'agendado',
      createdBy: isStaffMode ? 'funcionario' : 'cliente',
    };

    onConfirmAppointment(newAppointment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#18181c] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1d2733] to-[#161d26] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">
                Finalizar Agendamento
              </h3>
              <p className="text-xs text-cyan-200/70">
                Preencha os dados abaixo para enviar direto para o WhatsApp
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Selected Summary Card */}
          <div className="p-3.5 rounded-xl bg-[#121215] border border-cyan-500/20 space-y-2">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
              <span>Resumo do Pedido</span>
              <span className="text-white text-sm font-black">
                {formatPrice(effectiveTotal)}
              </span>
            </div>

            <div className="text-xs text-gray-300 space-y-1">
              {selectedVehicle && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Veículo:</span>
                  <span className="font-semibold text-white">{selectedVehicle.name}</span>
                </div>
              )}
              {selectedWash && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Lavagem:</span>
                  <span className="font-semibold text-white">{selectedWash.name}</span>
                </div>
              )}
              {selectedExtras.length > 0 && (
                <div className="pt-1 border-t border-gray-800">
                  <span className="text-gray-400 block mb-0.5">Adicionais:</span>
                  <ul className="list-disc list-inside text-gray-300 space-y-0.5">
                    {selectedExtras.map((e) => (
                      <li key={e.id} className="text-[11px]">
                        {e.name} (+ {formatPrice(e.price)})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {chosenMaterials.length > 0 && (
                <div className="pt-1 border-t border-gray-800">
                  <span className="text-gray-400 block mb-0.5">Materiais (Lojinha):</span>
                  <ul className="list-disc list-inside text-gray-300 space-y-0.5">
                    {chosenMaterials.map((m) => (
                      <li key={m.id} className="text-[11px]">
                        {m.name} (+ {formatPrice(m.price)})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Materials picker (Lojinha) */}
          {selectedMaterials.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[#121215] border border-amber-500/20 space-y-2">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" />
                Lojinha do Lava Jato (Opcional)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedMaterials.map((m) => {
                  const isSelected = materialIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleMaterial(m.id)}
                      className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'border-amber-400/80 bg-amber-950/30'
                          : 'border-gray-800 bg-[#18181c] hover:border-gray-700'
                      }`}
                    >
                      {m.photoUrl ? (
                        <img
                          src={m.photoUrl}
                          alt={m.name}
                          className="w-9 h-9 rounded-lg object-cover border border-gray-700 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500 shrink-0">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-white truncate">{m.name}</div>
                        <div className="text-[11px] text-amber-300 font-bold">
                          + {formatPrice(m.price)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {validationError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              ⚠️ {validationError}
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Seu Nome Completo *
              </label>
              <input
                type="text"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                placeholder="Ex: João da Silva"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white placeholder-gray-500 text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="(94) 99999-9999"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white placeholder-gray-500 text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-cyan-400" />
                  Modelo & Cor do Veículo *
                </label>
                <input
                  type="text"
                  value={customer.carModel}
                  onChange={(e) => setCustomer({ ...customer, carModel: e.target.value })}
                  placeholder="Ex: Hilux SW4 Prata"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white placeholder-gray-500 text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  Data Desejada
                </label>
                <input
                  type="date"
                  value={customer.date}
                  onChange={(e) => setCustomer({ ...customer, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Horário Desejado
                </label>
                <select
                  value={customer.timeSlot}
                  onChange={(e) => setCustomer({ ...customer, timeSlot: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                >
                  <option value="08:00">08:00 (Manhã)</option>
                  <option value="09:00">09:00 (Manhã)</option>
                  <option value="10:30">10:30 (Manhã)</option>
                  <option value="13:30">13:30 (Tarde)</option>
                  <option value="15:00">15:00 (Tarde)</option>
                  <option value="16:30">16:30 (Final de Tarde)</option>
                </select>
              </div>
            </div>

            {/* Leva e traz toggle */}
            <div className="p-3.5 rounded-xl bg-[#121215] border border-gray-800 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Precisa do serviço Leva e Traz? (Buscar veículo em casa)
                </span>
                <input
                  type="checkbox"
                  checked={customer.deliveryOption}
                  onChange={(e) =>
                    setCustomer({ ...customer, deliveryOption: e.target.checked })
                  }
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </label>

              {customer.deliveryOption && (
                <div className="pt-2">
                  <input
                    type="text"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    placeholder="Endereço para buscar o veículo em Redenção"
                    className="w-full px-3 py-2 rounded-lg bg-[#1a1a20] border border-gray-700 text-white placeholder-gray-500 text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Observações Especiais (Opcional)
              </label>
              <textarea
                rows={2}
                value={customer.notes}
                onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                placeholder="Ex: Cuidado com o retrovisor esquerdo, focar na mancha do banco..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#121215] border border-gray-700 text-white placeholder-gray-500 text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* WhatsApp Direct Notice */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-200">
              <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-300 block">
                  Envio Automático para o Lava Jato:
                </span>
                <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                  Ao confirmar, seu agendamento será registrado e abrirá a mensagem preenchida direto no WhatsApp do <strong>{storeName}</strong> ({whatsappPhone}).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-[#141418] border-t border-gray-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Voltar
          </button>

          <button
            onClick={handleSubmitAppointment}
            id="modal-confirm-whatsapp-btn"
            className="flex-1 max-w-sm px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current shrink-0" />
            <span>Confirmar & Enviar para WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
