import React, { useState, useEffect } from 'react';
import { Appointment, ExtraService, Material, PriceMatrix, StoreSettings, VehicleId, VehicleOption, WashId, WashOption } from '../types';
import { DEFAULT_VEHICLES, DEFAULT_WASHES } from '../data/defaultData';
import { buildReceiptMessage, openWhatsApp, formatBRL } from '../utils/whatsapp';
import { MaterialsShopDrawer } from './MaterialsShopDrawer';
import {
  Car,
  Droplets,
  Sparkles,
  Gem,
  Plus,
  Check,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  MessageCircle,
  Truck,
  Send,
  FileText,
  Lock,
  ChevronRight,
  ShieldCheck,
  CalendarX2,
} from 'lucide-react';

interface ClientBookingFormProps {
  settings: StoreSettings;
  onConfirmAppointment: (appointment: Appointment) => void;
  onSwitchToStaff: () => void;
  isClientOnly?: boolean;
  appointments?: Appointment[];
}

export const ClientBookingForm: React.FC<ClientBookingFormProps> = ({
  settings,
  onConfirmAppointment,
  onSwitchToStaff,
  isClientOnly = false,
  appointments = [],
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Selection states
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleId>('hatch');
  const [selectedWash, setSelectedWash] = useState<WashId>('completa');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  // Customer form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [date, setDate] = useState(todayStr);
  const [timeSlot, setTimeSlot] = useState('09:00');
  const [deliveryOption, setDeliveryOption] = useState(false);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);

  // Time Slot Options
  const timeSlots = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '13:30',
    '14:30',
    '15:30',
    '16:30',
    '17:30',
  ];

  // Statuses that occupy a slot (approved and beyond blocks it for new clients)
  const BLOCKING_STATUSES: Appointment['status'][] = ['aprovado', 'em_lavagem', 'pronto', 'entregue'];

  // A slot is blocked when there's an approved/active wash OR a counter booking
  const blockedTimeSlots = appointments
    .filter(
      (apt) =>
        apt.date === date &&
        (apt.isCounterBooking || BLOCKING_STATUSES.includes(apt.status))
    )
    .map((apt) => apt.timeSlot);

  const isSlotBlocked = (slot: string) => blockedTimeSlots.includes(slot);

  // Automatically move to the first available slot if the selected one is blocked
  useEffect(() => {
    if (isSlotBlocked(timeSlot)) {
      const firstAvailable = timeSlots.find((slot) => !isSlotBlocked(slot));
      if (firstAvailable) {
        setTimeSlot(firstAvailable);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, appointments]);

  const isDateFullyBooked = timeSlots.every((slot) => isSlotBlocked(slot));

  // Calculate Total
  let total = 0;
  if (selectedVehicle && selectedWash && settings.priceMatrix[selectedVehicle]) {
    total += settings.priceMatrix[selectedVehicle][selectedWash] || 0;
  }

  selectedExtras.forEach((extraId) => {
    const extraObj = settings.extraServices.find((e) => e.id === extraId);
    if (extraObj) {
      total += extraObj.price;
    }
  });

  selectedMaterials.forEach((materialId) => {
    const matObj = settings.materials?.find((m) => m.id === materialId);
    if (matObj) {
      total += matObj.price;
    }
  });

  const currentVehicleObj = DEFAULT_VEHICLES.find((v) => v.id === selectedVehicle);
  const currentWashObj = DEFAULT_WASHES.find((w) => w.id === selectedWash);
  const currentExtrasObjs = settings.extraServices.filter((e) =>
    selectedExtras.includes(e.id)
  );
  const currentMaterialsObjs = (settings.materials || []).filter((m) =>
    selectedMaterials.includes(m.id)
  );

  const handleToggleExtra = (id: string) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleMaterial = (id: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
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

  const validate = () => {
    if (!customerName.trim()) {
      setValidationError('Por favor, informe seu Nome Completo.');
      return false;
    }

    if (!customerPhone.trim()) {
      setValidationError('Por favor, informe seu número do WhatsApp.');
      return false;
    }

    if (!carModel.trim()) {
      setValidationError('Por favor, informe o Modelo e Cor do seu veículo (ex: Hilux Prata).');
      return false;
    }

    if (deliveryOption && !address.trim()) {
      setValidationError('Por favor, informe o Endereço para busca no Leva e Traz.');
      return false;
    }

    if (isSlotBlocked(timeSlot)) {
      setValidationError('Infelizmente este horário acabou de ser reservado. Por favor, escolha outro horário disponível.');
      return false;
    }

    setValidationError(null);
    return true;
  };

  const buildAppointment = (isCounter: boolean): Appointment => {
    const codeNum = Math.floor(100 + Math.random() * 900);
    return {
      id: `apt_${Date.now()}`,
      code: `#${codeNum}`,
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      carModel: carModel.trim(),
      carColor: carColor.trim(),
      carPlate: carPlate.trim().toUpperCase(),
      vehicleName: currentVehicleObj?.name || 'Veículo',
      washName: currentWashObj?.name || 'Lavagem',
      extraNames: currentExtrasObjs.map((e) => e.name),
      materialNames: currentMaterialsObjs.map((m) => m.name),
      totalPrice: total,
      date,
      timeSlot,
      deliveryOption,
      address: address.trim(),
      notes: notes.trim(),
      status: 'agendado',
      createdBy: isCounter ? 'funcionario' : 'cliente',
      isCounterBooking: isCounter ? true : undefined,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onConfirmAppointment(buildAppointment(false));
  };

  const handleCounterConfirm = () => {
    if (!validate()) return;
    onConfirmAppointment(buildAppointment(true));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto pb-24">
      {/* Welcome Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1c2836] via-[#141d27] to-[#121215] border border-cyan-500/30 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
            <img
              src="/lava_jato_logo.jpg"
              alt="Lava Jato Redenção"
              className="w-12 h-12 rounded-xl object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              Agendamento Online
            </h2>
            <p className="text-xs text-cyan-200/80 font-medium">
              Escolha seu veículo, a lavagem e confirme direto no WhatsApp!
            </p>
          </div>
        </div>

        {/* Location badge */}
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(settings.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#121215]/80 hover:bg-cyan-950/40 border border-cyan-500/30 text-xs font-semibold text-cyan-300 transition-all shadow-sm hover:border-cyan-400 cursor-pointer shrink-0"
          title="Abrir no Google Maps"
        >
          <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="text-left">
            <div className="text-[10px] text-gray-400 font-medium">Endereço da Loja</div>
            <div className="text-xs text-cyan-200 font-bold max-w-[200px] truncate">{settings.address}</div>
          </div>
        </a>
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-2.5 animate-bounce">
          <div className="p-1 rounded-full bg-rose-500/20 text-rose-400 shrink-0">!</div>
          <span>{validationError}</span>
        </div>
      )}

      {/* STEP 1: VEÍCULO */}
      <section className="p-5 sm:p-6 rounded-3xl bg-[#18181c] border border-gray-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-800">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 font-black text-xs border border-cyan-500/30">
            1
          </span>
          <h3 className="font-extrabold text-white text-base">Qual é o seu veículo?</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DEFAULT_VEHICLES.map((v) => {
            const isSelected = selectedVehicle === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVehicle(v.id)}
                className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-cyan-400 bg-gradient-to-r from-cyan-950/80 to-[#1a2f38] shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                    : 'border-gray-800 bg-[#121215] hover:border-gray-700 hover:bg-[#1b1b20]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl select-none">{v.badgeText}</span>
                  <div>
                    <div className="font-bold text-white text-sm">{v.name}</div>
                    <div className="text-[11px] text-gray-400">{v.description}</div>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500 text-black'
                      : 'border-gray-700 bg-gray-800'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* STEP 2: LAVAGEM */}
      <section className="p-5 sm:p-6 rounded-3xl bg-[#18181c] border border-gray-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-800">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 font-black text-xs border border-cyan-500/30">
            2
          </span>
          <h3 className="font-extrabold text-white text-base">Escolha o tipo de lavagem</h3>
        </div>

        <div className="space-y-3">
          {DEFAULT_WASHES.map((w) => {
            const isSelected = selectedWash === w.id;
            const price = settings.priceMatrix[selectedVehicle]?.[w.id] || 0;

            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setSelectedWash(w.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-cyan-400 bg-gradient-to-r from-cyan-950/80 to-[#1a2f38] shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                    : 'border-gray-800 bg-[#121215] hover:border-gray-700 hover:bg-[#1b1b20]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-gray-800/80 shrink-0 border border-gray-700/50 mt-0.5">
                    {getWashIcon(w.id)}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                      {w.name}
                      {w.id === 'completa' && (
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Recomendada
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 leading-snug">
                      {w.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/80">
                  <span className="text-xs font-semibold text-gray-400 sm:hidden">Valor:</span>
                  <span className="font-black text-cyan-300 text-base sm:text-lg">
                    {formatBRL(price)}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-500 text-black'
                        : 'border-gray-700 bg-gray-800'
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

      {/* STEP 3: EXTRAS (OPCIONAL) */}
      <section className="p-5 sm:p-6 rounded-3xl bg-[#18181c] border border-gray-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-800 justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 font-black text-xs border border-cyan-500/30">
              3
            </span>
            <h3 className="font-extrabold text-white text-base">Serviços Adicionais</h3>
          </div>
          <span className="text-[11px] text-gray-400 font-medium">(Opcional)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {settings.extraServices.map((extra) => {
            const isSelected = selectedExtras.includes(extra.id);
            return (
              <button
                key={extra.id}
                type="button"
                onClick={() => handleToggleExtra(extra.id)}
                className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                  isSelected
                    ? 'border-cyan-400/80 bg-cyan-950/40 text-white'
                    : 'border-gray-800 bg-[#121215] text-gray-300 hover:border-gray-700'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold">{extra.name}</div>
                  <div className="text-[11px] text-cyan-400 font-semibold">
                    + {formatBRL(extra.price)}
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500 text-black'
                      : 'border-gray-700 bg-gray-800'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* STEP 4: SEUS DADOS & DATA */}
      <section className="p-5 sm:p-6 rounded-3xl bg-[#18181c] border border-gray-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-800">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 font-black text-xs border border-cyan-500/30">
            4
          </span>
          <h3 className="font-extrabold text-white text-base">Seus Dados e Horário</h3>
        </div>

        <div className="space-y-4 text-xs">
          {/* Nome e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-bold mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Seu Nome Completo *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: Carlos Eduardo"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-bold mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Seu WhatsApp (com DDD) *
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Ex: (94) 99123-4567"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Carro e Placa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-bold mb-1 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-cyan-400" />
                Modelo e Cor do Veículo *
              </label>
              <input
                type="text"
                required
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                placeholder="Ex: Hilux Prata, Gol Branco, Honda Civic"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-bold mb-1 flex items-center justify-between">
                <span>Placa do Veículo (Opcional)</span>
                <span className="text-[10px] text-gray-500 font-normal">Opcional</span>
              </label>
              <input
                type="text"
                value={carPlate}
                onChange={(e) => setCarPlate(e.target.value)}
                placeholder="Ex: QDA-1A23"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none uppercase"
              />
            </div>
          </div>

          {/* Data e Horário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-bold mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Data Desejada
              </label>
              <input
                type="date"
                value={date}
                min={todayStr}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-bold mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Horário Preferido
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {timeSlots.map((slot) => {
                  const isSelected = timeSlot === slot;
                  const isBlocked = isSlotBlocked(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isBlocked}
                      onClick={() => setTimeSlot(slot)}
                      className={`py-1.5 px-2 rounded-lg font-mono text-[11px] font-bold text-center border transition-all cursor-pointer ${
                        isBlocked
                          ? 'border-gray-900 bg-gray-950/80 text-gray-600 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'border-cyan-400 bg-cyan-500 text-slate-950 shadow-sm'
                          : 'border-gray-800 bg-[#121215] text-gray-300 hover:border-gray-700'
                      }`}
                      title={isBlocked ? 'Horário reservado / indisponível' : slot}
                    >
                      {isBlocked ? (
                        <span className="flex flex-col items-center leading-tight">
                          <span className="line-through">{slot}</span>
                          <span className="text-[8px] font-semibold not-italic normal-case text-rose-400/80">
                            Reservado
                          </span>
                        </span>
                      ) : (
                        slot
                      )}
                    </button>
                  );
                })}
              </div>

              {isDateFullyBooked && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-semibold">
                  <CalendarX2 className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Esta data está totalmente reservada. Escolha outra data ou entre em contato pelo WhatsApp.</span>
                </div>
              )}
            </div>
          </div>

          {/* Leva e Traz */}
          <div className="p-3.5 rounded-2xl bg-[#121215] border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-xs">Precisa do Serviço Leva e Traz?</span>
              </div>
              <div className="inline-flex p-0.5 rounded-lg bg-gray-800">
                <button
                  type="button"
                  onClick={() => setDeliveryOption(false)}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    !deliveryOption ? 'bg-cyan-500 text-black' : 'text-gray-400'
                  }`}
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryOption(true)}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    deliveryOption ? 'bg-cyan-500 text-black' : 'text-gray-400'
                  }`}
                >
                  Sim
                </button>
              </div>
            </div>

            {deliveryOption && (
              <div className="pt-2 border-t border-gray-800 space-y-1">
                <label className="block text-gray-300 font-semibold text-[11px]">
                  Endereço para buscar o veículo:
                </label>
                <input
                  type="text"
                  required={deliveryOption}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro e Ponto de Referência"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181c] border border-gray-700 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CONFIRMAÇÃO & TOTAL */}
      <section className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#1c2836] to-[#121215] border border-cyan-500/40 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div>
              <span className="text-xs text-gray-400 font-semibold block">Valor Total Previsto:</span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-300">
                {formatBRL(total)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-gray-400 block font-medium">Veículo: {currentVehicleObj?.name}</span>
              <span className="text-[11px] text-cyan-400 font-bold block">{currentWashObj?.name}</span>
              {currentMaterialsObjs.length > 0 && (
                <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
                  🛍️ {currentMaterialsObjs.map((m) => m.name).join(', ')}
                </span>
              )}
            </div>
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="submit"
            id="btn-client-submit-whatsapp"
            className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 transition-all duration-200 cursor-pointer active:scale-95"
          >
            <MessageCircle className="w-5 h-5 fill-current shrink-0" />
            <span>CONFIRMAR E ENVIAR NO WHATSAPP</span>
          </button>

          <button
            type="button"
            onClick={handleCounterConfirm}
            id="btn-client-submit-counter"
            className="w-full py-4 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-500/25 transition-all duration-200 cursor-pointer active:scale-95"
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>CONFIRMAR NO BALCÃO</span>
          </button>
        </div>

        <p className="text-center text-[11px] text-gray-400 leading-relaxed">
          <strong>WhatsApp:</strong> salva o agendamento e abre a conversa com o{' '}
          {settings.storeName} ({settings.whatsappPhone}). <strong>Balcão:</strong>{' '}
          confirma aqui na loja (relatório do balcão) e reserva o horário sem enviar
          mensagem.
        </p>
      </section>

      {/* Hidden Staff Link at the very bottom (hidden for client-only link) */}
      {!isClientOnly && (
      <div className="pt-6 text-center border-t border-gray-800/60">
        <button
          type="button"
          onClick={onSwitchToStaff}
          className="text-xs text-gray-500 hover:text-cyan-400 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-3 rounded-lg hover:bg-gray-800/50"
        >
          <Lock className="w-3 h-3 text-gray-500" />
          <span>Área Interna do Funcionário / Painel da Loja</span>
        </button>
      </div>
      )}

      {/* Lojinha de Materiais - floating drawer */}
      <MaterialsShopDrawer
        materials={settings.materials || []}
        selectedIds={selectedMaterials}
        onToggle={handleToggleMaterial}
      />
    </form>
  );
};
