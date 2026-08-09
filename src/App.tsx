import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Appointment, AppointmentStatus, PaymentMethod, StoreSettings, UserRole, VehicleId, WashId } from './types';
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
import { OwnerPasswordModal } from './components/OwnerPasswordModal';
import { OwnerDashboard } from './components/OwnerDashboard';
import { Share2, RotateCcw, HelpCircle, Wrench, User, Link as LinkIcon, Sparkles, Lock } from 'lucide-react';

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

  // Role state: 'funcionario' by default; 'dono' after password unlock
  const [role, setRole] = useState<UserRole>('funcionario');
  const [isOwnerPasswordOpen, setIsOwnerPasswordOpen] = useState(false);
  const [isOwnerDashboardOpen, setIsOwnerDashboardOpen] = useState(false);

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
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          ownerPassword: parsed.ownerPassword ?? DEFAULT_SETTINGS.ownerPassword,
          employees: parsed.employees ?? DEFAULT_SETTINGS.employees,
          expenses: parsed.expenses ?? DEFAULT_SETTINGS.expenses,
        };
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
        const parsed = JSON.parse(saved);
        return parsed.filter((a: Appointment) => !a.id.startsWith('apt_sample_'));
      }
    } catch (e) {
      console.error('Failed to load appointments', e);
    }
    return isSupabaseConfigured ? [] : SAMPLE_APPOINTMENTS;
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
        const next = {
          ...DEFAULT_SETTINGS,
          ...settings,
          ...remoteSettings,
          ownerPassword:
            remoteSettings.ownerPassword ?? settings.ownerPassword ?? DEFAULT_SETTINGS.ownerPassword,
          employees: remoteSettings.employees ?? settings.employees ?? DEFAULT_SETTINGS.employees,
          expenses: remoteSettings.expenses ?? settings.expenses ?? DEFAULT_SETTINGS.expenses,
        };
        setSettings(next);
        try {
          localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(next));
        } catch (e) {
          console.error('Failed to cache settings', e);
        }
      } else {
        upsertSettings(settings);
      }

      if (remoteAppointments) {
        if (remoteAppointments.length === 0) {
          // Remote DB is empty: push up any real local appointments so they persist
          appointments.forEach((apt) => upsertAppointment(apt));
        } else {
          // Merge local-only appointments with the remote list (remote wins on conflicts)
          const merged = [
            ...appointments.filter(
              (a) => !remoteAppointments.some((r) => r.id === a.id)
            ),
            ...remoteAppointments,
          ];
          setAppointments(merged);
          try {
            localStorage.setItem(
              LOCAL_STORAGE_APPOINTMENTS_KEY,
              JSON.stringify(merged)
            );
          } catch (e) {
            console.error('Failed to cache appointments', e);
          }
        }
      } else {
        // Remote fetch failed: keep local data and try to sync it up
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

  const handleUpdateStatus = (
    id: string,
    newStatus: AppointmentStatus,
    paymentMethod?: PaymentMethod,
    completedBy?: string
  ) => {
    let updated = appointments;

    if (role === 'dono') {
      // Owner changes freely
      updated = appointments.map((apt) =>
        apt.id === id
          ? {
              ...apt,
              status: newStatus,
              paymentMethod: paymentMethod ?? apt.paymentMethod,
              paidAt: paymentMethod ? new Date().toISOString() : apt.paidAt,
              completedBy: completedBy ?? apt.completedBy,
              pendingStatusChange: null,
              statusChangeCount: (apt.statusChangeCount || 0) + 1,
            }
          : apt
      );
    } else {
      updated = appointments.map((apt) => {
        if (apt.id !== id) return apt;
        const count = apt.statusChangeCount || 0;
        if (count === 0) {
          // First status change is free
          return {
            ...apt,
            status: newStatus,
            paymentMethod: paymentMethod ?? apt.paymentMethod,
            paidAt: paymentMethod ? new Date().toISOString() : apt.paidAt,
            completedBy: completedBy ?? apt.completedBy,
            pendingStatusChange: null,
            statusChangeCount: 1,
          };
        }
        // Subsequent changes need owner approval
        return {
          ...apt,
          pendingStatusChange: newStatus,
          paymentMethod: paymentMethod ?? apt.paymentMethod,
          paidAt: paymentMethod ? new Date().toISOString() : apt.paidAt,
          completedBy: completedBy ?? apt.completedBy,
        };
      });
    }

    saveAppointmentsToStorage(updated);
    updateAppointmentStatusDb(id, newStatus, {
      paymentMethod: paymentMethod,
      paidAt: paymentMethod ? new Date().toISOString() : undefined,
      completedBy,
      pendingStatusChange:
        updated.find((a) => a.id === id)?.pendingStatusChange ?? null,
      statusChangeCount: updated.find((a) => a.id === id)?.statusChangeCount,
    });
  };

  // Owner approves a pending status change requested by an employee
  const handleApproveStatusChange = (id: string) => {
    const apt = appointments.find((a) => a.id === id);
    if (!apt || !apt.pendingStatusChange) return;
    const updated = appointments.map((a) =>
      a.id === id
        ? {
            ...a,
            status: apt.pendingStatusChange as AppointmentStatus,
            pendingStatusChange: null,
            statusChangeCount: (a.statusChangeCount || 0) + 1,
          }
        : a
    );
    saveAppointmentsToStorage(updated);
    updateAppointmentStatusDb(id, apt.pendingStatusChange as AppointmentStatus, {
      pendingStatusChange: null,
      statusChangeCount: (apt.statusChangeCount || 0) + 1,
    });
  };

  // Owner rejects a pending status change requested by an employee
  const handleRejectStatusChange = (id: string) => {
    const updated = appointments.map((a) =>
      a.id === id ? { ...a, pendingStatusChange: null } : a
    );
    saveAppointmentsToStorage(updated);
    updateAppointmentStatusDb(id, appointments.find((a) => a.id === id)?.status || 'agendado', {
      pendingStatusChange: null,
    });
  };

  // Add products/extras to an appointment
  const handleAddProducts = (id: string, extraIds: string[]) => {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) return;
    const newExtras = settings.extraServices.filter((e) => extraIds.includes(e.id));
    const existingNames = new Set(apt.extraNames || []);
    const newNames = newExtras
      .map((e) => e.name)
      .filter((n) => !existingNames.has(n));
    const addedTotal = newExtras.reduce((s, e) => s + e.price, 0);

    const updated = appointments.map((a) =>
      a.id === id
        ? {
            ...a,
            extraNames: [...(apt.extraNames || []), ...newNames],
            totalPrice: apt.totalPrice + addedTotal,
          }
        : a
    );
    saveAppointmentsToStorage(updated);
    upsertAppointment(updated.find((a) => a.id === id)!);
  };

  const handleOwnerAccessRequest = () => {
    if (role === 'dono') {
      // Lock back to employee mode
      setRole('funcionario');
      setIsOwnerDashboardOpen(false);
      return;
    }
    setIsOwnerPasswordOpen(true);
  };

  const handleOwnerPasswordSuccess = () => {
    setRole('dono');
    setIsOwnerPasswordOpen(false);
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
        role={role}
        onRequestOwnerAccess={handleOwnerAccessRequest}
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
                  {role === 'dono' ? (
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <Lock className="w-3.5 h-3.5" />
                      Modo Dono Desbloqueado
                    </span>
                  ) : (
                    'Modo Atendente / Funcionário Ativo'
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {role === 'dono' && (
                  <button
                    onClick={() => setIsOwnerDashboardOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1 cursor-pointer hover:bg-emerald-500/30 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Painel do Dono</span>
                  </button>
                )}

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
              role={role}
              onUpdateStatus={handleUpdateStatus}
              onDeleteAppointment={handleDeleteAppointment}
              onOpenReceiptModal={(apt) => setSelectedReceiptApt(apt)}
              onCreateNewClick={() => {
                setIsOrderModalOpen(true);
              }}
              onAddProducts={handleAddProducts}
            />
          </div>
        ) : (
          /* Dedicated Client Booking Form */
          <ClientBookingForm
            settings={settings}
            appointments={appointments}
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

      {/* Owner Password Modal */}
      <OwnerPasswordModal
        isOpen={isOwnerPasswordOpen}
        onClose={() => setIsOwnerPasswordOpen(false)}
        onSuccess={handleOwnerPasswordSuccess}
      />

      {/* Owner Dashboard Modal */}
      <OwnerDashboard
        isOpen={isOwnerDashboardOpen}
        onClose={() => setIsOwnerDashboardOpen(false)}
        appointments={appointments}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onApproveStatusChange={handleApproveStatusChange}
        onRejectStatusChange={handleRejectStatusChange}
        onOpenSettings={() => setIsAdminOpen(true)}
      />
    </div>
  );
}
