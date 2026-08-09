import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Appointment, AppointmentStatus, VehicleId, WashId, StoreSettings } from './types';
import { DEFAULT_SETTINGS, DEFAULT_VEHICLES, DEFAULT_WASHES } from './data/defaultData';
import { buildReceiptMessage, openWhatsApp } from './utils/whatsapp';
import {
  fetchAppointments,
  fetchSettings,
  upsertAppointment,
  updateAppointmentStatus as updateAppointmentStatusDb,
  deleteAppointment as deleteAppointmentDb,
  upsertSettings,
  LOCAL_STORAGE_SETTINGS_KEY,
  LOCAL_STORAGE_APPOINTMENTS_KEY,
} from './lib/db';
import { isSupabaseConfigured } from './lib/supabase';
import { Header } from './components/Header';
import { VehicleSelector } from './components/VehicleSelector';
import { WashSelector } from './components/WashSelector';
import { ExtrasSelector } from './components/ExtrasSelector';
import { TotalFooter } from './components/TotalFooter';
import { OrderModal } from './components/OrderModal';
import { AdminSettings } from './components/AdminSettings';
import { ShareMenuModal } from './components/ShareMenuModal';
import { ReceiptModal } from './components/ReceiptModal';
import { AppointmentQueue } from './components/AppointmentQueue';
import { ClientBookingForm } from './components/ClientBookingForm';
import { Share2, RotateCcw, HelpCircle, Wrench, User, Link as LinkIcon, Sparkles } from 'lucide-react';

const SAMPLE_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt_sample_0',
    code: '#101',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    customerName: 'Roberto Alves',
    customerPhone: '5594991112233',
    carModel: 'Corolla Preto',
    carColor: 'Preto',
    carPlate: 'JXA-5544',
    vehicleName: 'Carro Médio / Sedan',
    washName: 'Lavagem Americana (Cera de Carnaúba)',
    extraNames: ['Pretinho Especial de Longa Duração'],
    totalPrice: 120,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    timeSlot: '16:00',
    deliveryOption: false,
    notes: 'Cliente satisfeito',
    status: 'entregue',
    createdBy: 'funcionario',
  },
  {
    id: 'apt_sample_1',
    code: '#102',
    createdAt: new Date().toISOString(),
    customerName: 'Carlos Eduardo',
    customerPhone: '5594991234567',
    carModel: 'Hilux SW4 Prata',
    carColor: 'Prata',
    carPlate: 'QDA-1A23',
    vehicleName: 'Carro Grande / SUV',
    washName: 'Lavagem Técnica / Detalhada',
    extraNames: ['Taxa de Barro Pesado / Terra Vermelha', 'Higienização de Ar-Condicionado'],
    totalPrice: 295,
    date: new Date().toISOString().split('T')[0],
    timeSlot: '09:00',
    deliveryOption: true,
    address: 'Av. Brasil, Nº 1450, Redenção',
    notes: 'Atenção especial na limpeza dos bancos e tapetes',
    status: 'em_lavagem',
    createdBy: 'cliente',
  },
  {
    id: 'apt_sample_2',
    code: '#103',
    createdAt: new Date().toISOString(),
    customerName: 'Mariana Lima',
    customerPhone: '5594998765432',
    carModel: 'Onix Vermelho',
    carColor: 'Vermelho',
    carPlate: 'JVY-9876',
    vehicleName: 'Carro Pequeno / Hatch',
    washName: 'Lavagem Completa',
    extraNames: ['Revitalização de Plásticos'],
    totalPrice: 110,
    date: new Date().toISOString().split('T')[0],
    timeSlot: '14:00',
    deliveryOption: false,
    notes: '',
    status: 'agendado',
    createdBy: 'funcionario',
  },
];

export default function App() {
  // Mode state
  const [appMode, setAppMode] = useState<'cliente' | 'funcionario'>('cliente');

  // Load saved settings or use default
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.whatsappPhone === '5594999999999' || !parsed.whatsappPhone) {
          parsed.whatsappPhone = '5594993057676';
        }
        if (!parsed.address || parsed.address === 'Redenção - PA') {
          parsed.address = 'R. Olga Lustosa, 66 - Aripuanã, Redenção - PA, 68554-133';
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Load appointments
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_APPOINTMENTS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load appointments', e);
    }
    return SAMPLE_APPOINTMENTS;
  });

  // User Selections for Orçamento
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleId | null>('hatch');
  const [selectedWash, setSelectedWash] = useState<WashId | null>('completa');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedReceiptApt, setSelectedReceiptApt] = useState<Appointment | null>(null);

  // Section ref for smooth scrolling
  const washSectionRef = useRef<HTMLDivElement>(null);

  // Client-only mode when opened via the shared customer link
  const isClientLink = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'cliente' || params.get('agendar') === 'true';
  }, []);

  // Sync settings & appointments with Supabase on mount (falls back to localStorage)
  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      if (!isSupabaseConfigured) return;

      const [remoteSettings, remoteAppointments] = await Promise.all([
        fetchSettings(),
        fetchAppointments(),
      ]);

      if (cancelled) return;

      if (remoteSettings) {
        setSettings((prev) => {
          const next = { ...DEFAULT_SETTINGS, ...prev, ...remoteSettings };
          try {
            localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(next));
          } catch (e) {
            console.error('Failed to cache settings', e);
          }
          return next;
        });
      } else {
        upsertSettings(settings);
      }

      if (remoteAppointments) {
        setAppointments((prev) => {
          if (remoteAppointments.length === 0 && prev.length > 0) {
            remoteAppointments.forEach((apt) => upsertAppointment(apt));
            return prev;
          }
          const merged = [...prev.filter((a) => !remoteAppointments.some((r) => r.id === a.id)), ...remoteAppointments];
          try {
            localStorage.setItem(LOCAL_STORAGE_APPOINTMENTS_KEY, JSON.stringify(merged));
          } catch (e) {
            console.error('Failed to cache appointments', e);
          }
          return merged;
        });
      } else {
        appointments.forEach((apt) => upsertAppointment(apt));
      }
    };

    sync();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check URL parameters for customer mode link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'cliente' || params.get('agendar') === 'true') {
      setAppMode('cliente');
    }
  }, []);

  // Save settings handler
  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
    upsertSettings(newSettings);
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(LOCAL_STORAGE_SETTINGS_KEY);
    } catch (e) {
      console.error('Failed to clear settings', e);
    }
    upsertSettings(DEFAULT_SETTINGS);
  };

  // Appointments persistence
  const saveAppointmentsToStorage = (updated: Appointment[]) => {
    setAppointments(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_APPOINTMENTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save appointments', e);
    }
  };

  const handleConfirmAppointment = (newApt: Appointment) => {
    const updated = [newApt, ...appointments];
    saveAppointmentsToStorage(updated);
    upsertAppointment(newApt);
    setSelectedReceiptApt(newApt); // Open receipt modal

    // Automatically send message to company WhatsApp when appointment is created by client
    if (newApt.createdBy === 'cliente' || appMode === 'cliente') {
      const msg = buildReceiptMessage(newApt, settings.storeName, settings.whatsappPhone);
      openWhatsApp(settings.whatsappPhone, msg);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: AppointmentStatus) => {
    const updated = appointments.map((apt) =>
      apt.id === id ? { ...apt, status: newStatus } : apt
    );
    saveAppointmentsToStorage(updated);
    updateAppointmentStatusDb(id, newStatus);
  };

  const handleDeleteAppointment = (id: string) => {
    const updated = appointments.filter((apt) => apt.id !== id);
    saveAppointmentsToStorage(updated);
    deleteAppointmentDb(id);
  };

  // Toggle selection handlers
  const handleSelectVehicle = (id: VehicleId) => {
    setSelectedVehicle(id);
    if (!selectedWash) {
      setSelectedWash('completa');
    }

    // Smooth scroll to Wash Selector (Step 2)
    setTimeout(() => {
      washSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 50);
  };

  const handleSelectWash = (id: WashId) => {
    setSelectedWash(id);
  };

  const handleToggleExtra = (id: string) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Calculate Running Total
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

  const itemCount = (selectedWash ? 1 : 0) + selectedExtras.length;

  const currentVehicleObj = DEFAULT_VEHICLES.find((v) => v.id === selectedVehicle);
  const currentWashObj = DEFAULT_WASHES.find((w) => w.id === selectedWash);
  const currentExtrasObjs = settings.extraServices.filter((e) =>
    selectedExtras.includes(e.id)
  );

  return (
    <div className="min-h-screen bg-[#121214] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Header */}
      <Header
        settings={settings}
        appMode={appMode}
        onChangeMode={setAppMode}
        appointmentCount={appointments.length}
        onOpenSettings={() => setIsAdminOpen(true)}
        onOpenShareLink={() => setIsShareOpen(true)}
        isClientOnly={isClientLink}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-6 pb-32">
        {/* Mode Switch Navigation Banner */}
        {appMode === 'funcionario' ? (
          /* Staff View */
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1d1d22] border border-gray-800">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-gray-200">
                  Modo Atendente / Funcionário Ativo
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsShareOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1 cursor-pointer hover:bg-emerald-500/30 transition-colors"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Enviar Link ao Cliente</span>
                </button>

                <button
                  onClick={() => setAppMode('cliente')}
                  className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Ver Cardápio</span>
                </button>
              </div>
            </div>

            <AppointmentQueue
              appointments={appointments}
              settings={settings}
              onUpdateStatus={handleUpdateStatus}
              onDeleteAppointment={handleDeleteAppointment}
              onOpenReceiptModal={(apt) => setSelectedReceiptApt(apt)}
              onCreateNewClick={() => {
                setIsOrderModalOpen(true);
              }}
            />
          </div>
        ) : (
          /* Dedicated Client Booking Form */
          <ClientBookingForm
            settings={settings}
            onConfirmAppointment={handleConfirmAppointment}
            onSwitchToStaff={() => setAppMode('funcionario')}
            isClientOnly={isClientLink}
          />
        )}
      </main>

      {/* Customer / Staff Reservation Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        selectedVehicle={currentVehicleObj || null}
        selectedWash={currentWashObj || null}
        selectedExtras={currentExtrasObjs}
        totalPrice={total}
        whatsappPhone={settings.whatsappPhone}
        storeName={settings.storeName}
        isStaffMode={appMode === 'funcionario'}
        onConfirmAppointment={handleConfirmAppointment}
      />

      {/* Comprovante / Receipt Modal */}
      <ReceiptModal
        isOpen={selectedReceiptApt !== null}
        onClose={() => setSelectedReceiptApt(null)}
        appointment={selectedReceiptApt}
        settings={settings}
      />

      {/* Owner / Admin Settings Modal */}
      <AdminSettings
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onResetDefaults={handleResetDefaults}
      />

      {/* Share Link Modal */}
      <ShareMenuModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        whatsappPhone={settings.whatsappPhone}
        storeName={settings.storeName}
      />
    </div>
  );
}
