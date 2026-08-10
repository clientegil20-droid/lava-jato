import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Appointment, AppointmentStatus, Employee, PaymentMethod, StoreSettings, UserRole, LOCAL_STORAGE_EMPLOYEE_KEY } from './types';

const STATUS_RANK: Record<AppointmentStatus, number> = {
  agendado: 0,
  aprovado: 1,
  em_lavagem: 2,
  pronto: 3,
  entregue: 4,
  cancelado: -1,
};

const isForwardStatusChange = (from: AppointmentStatus, to: AppointmentStatus) =>
  STATUS_RANK[to] > STATUS_RANK[from];
import { DEFAULT_SETTINGS } from './data/defaultData';
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
import { AdminSettings } from './components/AdminSettings';
import { ShareMenuModal } from './components/ShareMenuModal';
import { ReceiptModal } from './components/ReceiptModal';
import { AppointmentQueue } from './components/AppointmentQueue';
import { ClientBookingForm } from './components/ClientBookingForm';
import { OwnerPasswordModal } from './components/OwnerPasswordModal';
import { OwnerDashboard } from './components/OwnerDashboard';
import { EmployeeLoginModal } from './components/EmployeeLoginModal';
import { Share2, RotateCcw, HelpCircle, Wrench, User, Sparkles, X } from 'lucide-react';

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
  const [isEmployeeLoginOpen, setIsEmployeeLoginOpen] = useState(false);

  // Currently logged in employee (persisted)
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_EMPLOYEE_KEY);
      return saved ? (JSON.parse(saved) as Employee) : null;
    } catch (e) {
      return null;
    }
  });

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
          employeePayments: parsed.employeePayments ?? DEFAULT_SETTINGS.employeePayments,
          materials: parsed.materials ?? DEFAULT_SETTINGS.materials,
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

  // Modals state
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedReceiptApt, setSelectedReceiptApt] = useState<Appointment | null>(null);

  // New appointment alert (sound + notification) for the store panel
  const [newAppointmentAlert, setNewAppointmentAlert] = useState<Appointment | null>(null);
  const knownApptIds = useRef<Set<string> | null>(null);
  const alertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playNewAppointmentSound = () => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const notes = [880, 1108, 1318];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = ctx.currentTime + i * 0.18;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.25, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.18);
      });
      setTimeout(() => ctx.close().catch(() => {}), 1200);
    } catch (e) {
      console.error('Falha ao tocar som de novo agendamento', e);
    }
  };

  const handleNewAppointmentDetected = (apt: Appointment) => {
    setNewAppointmentAlert(apt);
    playNewAppointmentSound();
    if (alertTimer.current) clearTimeout(alertTimer.current);
    alertTimer.current = setTimeout(() => setNewAppointmentAlert(null), 15000);
  };

  // Poll for new appointments so the store panel gets notified in real time
  useEffect(() => {
    if (!isSupabaseConfigured || appMode !== 'funcionario') return;

    const poll = async () => {
      const remote = await fetchAppointments();
      if (!remote) return;

      if (knownApptIds.current === null) {
        knownApptIds.current = new Set(remote.map((a) => a.id));
      }

      const fresh = remote.filter((a) => !knownApptIds.current!.has(a.id));
      if (fresh.length > 0) {
        fresh.forEach((a) => knownApptIds.current!.add(a.id));
        fresh.forEach(handleNewAppointmentDetected);

        setAppointments((prev) => {
          const merged = [
            ...prev.filter((a) => !remote.some((r) => r.id === a.id)),
            ...remote,
          ];
          try {
            localStorage.setItem(LOCAL_STORAGE_APPOINTMENTS_KEY, JSON.stringify(merged));
          } catch (e) {
            console.error('Failed to cache appointments', e);
          }
          return merged;
        });
      }
    };

    poll();
    const interval = setInterval(poll, 15000);

    return () => {
      clearInterval(interval);
      if (alertTimer.current) clearTimeout(alertTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appMode]);


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
          employeePayments:
            remoteSettings.employeePayments ??
            settings.employeePayments ??
            DEFAULT_SETTINGS.employeePayments,
          materials:
            remoteSettings.materials ?? settings.materials ?? DEFAULT_SETTINGS.materials,
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
    const enriched = {
      ...newApt,
      ...(currentEmployee
        ? { employeeId: currentEmployee.id, employeeName: currentEmployee.name }
        : {}),
    };
    const updated = [enriched, ...appointments];
    saveAppointmentsToStorage(updated);
    upsertAppointment(enriched);
    setSelectedReceiptApt(enriched);

    // Automatically send message to company WhatsApp when appointment is created by client
    // (counter bookings reserve the slot without sending any message)
    if (
      !enriched.isCounterBooking &&
      (enriched.createdBy === 'cliente' || appMode === 'cliente')
    ) {
      const msg = buildReceiptMessage(enriched, settings.storeName, settings.whatsappPhone);
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

    const actingEmployeeId = completedBy ?? currentEmployee?.id;
    const actingEmployeeName =
      settings.employees.find((e) => e.id === actingEmployeeId)?.name ??
      currentEmployee?.name;

    if (role === 'dono') {
      // Owner changes freely
      updated = appointments.map((apt) =>
        apt.id === id
          ? {
              ...apt,
              status: newStatus,
              paymentMethod: paymentMethod ?? apt.paymentMethod,
              paidAt: paymentMethod ? new Date().toISOString() : apt.paidAt,
              completedBy: actingEmployeeId ?? apt.completedBy,
              employeeName: actingEmployeeName ?? apt.employeeName,
              pendingStatusChange: null,
              statusChangeCount: (apt.statusChangeCount || 0) + 1,
            }
          : apt
      );
    } else {
      updated = appointments.map((apt) => {
        if (apt.id !== id) return apt;
        if (isForwardStatusChange(apt.status, newStatus)) {
          // Forward progress in the wash flow is always free
          return {
            ...apt,
            status: newStatus,
            paymentMethod: paymentMethod ?? apt.paymentMethod,
            paidAt: paymentMethod ? new Date().toISOString() : apt.paidAt,
            completedBy: actingEmployeeId ?? apt.completedBy,
            employeeName: actingEmployeeName ?? apt.employeeName,
            pendingStatusChange: null,
            statusChangeCount: (apt.statusChangeCount || 0) + 1,
          };
        }
        // Backward/repeated changes need owner approval
        return {
          ...apt,
          pendingStatusChange: newStatus,
          paymentMethod: paymentMethod ?? apt.paymentMethod,
          paidAt: paymentMethod ? new Date().toISOString() : apt.paidAt,
          completedBy: actingEmployeeId ?? apt.completedBy,
          employeeName: actingEmployeeName ?? apt.employeeName,
        };
      });
    }

    saveAppointmentsToStorage(updated);
    updateAppointmentStatusDb(id, newStatus, {
      paymentMethod: paymentMethod,
      paidAt: paymentMethod ? new Date().toISOString() : undefined,
      completedBy: actingEmployeeId ?? undefined,
      employeeName: actingEmployeeName ?? undefined,
      pendingStatusChange:
        updated.find((a) => a.id === id)?.pendingStatusChange ?? null,
      statusChangeCount: updated.find((a) => a.id === id)?.statusChangeCount,
    });
  };

  // Owner approves a pending status change requested by an employee
  const handleApproveStatusChange = (id: string) => {
    const apt = appointments.find((a) => a.id === id);
    if (!apt || !apt.pendingStatusChange) return;
    const actingEmployeeName =
      settings.employees.find((e) => e.id === apt.completedBy)?.name ??
      apt.employeeName;
    const updated = appointments.map((a) =>
      a.id === id
        ? {
            ...a,
            status: apt.pendingStatusChange as AppointmentStatus,
            pendingStatusChange: null,
            employeeName: actingEmployeeName ?? a.employeeName,
            statusChangeCount: (a.statusChangeCount || 0) + 1,
          }
        : a
    );
    saveAppointmentsToStorage(updated);
    updateAppointmentStatusDb(id, apt.pendingStatusChange as AppointmentStatus, {
      pendingStatusChange: null,
      employeeName: actingEmployeeName ?? undefined,
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

  const handleChangeMode = (mode: 'cliente' | 'funcionario') => {
    if (mode === 'cliente') {
      setAppMode('cliente');
      return;
    }
    // Entering the Store Panel requires an employee login (unless owner unlocked)
    if (role === 'dono' || currentEmployee) {
      setAppMode('funcionario');
      return;
    }
    setIsEmployeeLoginOpen(true);
  };

  const handleOwnerPasswordSuccess = () => {
    setRole('dono');
    setIsOwnerPasswordOpen(false);
  };

  const handleEmployeeLogin = (emp: Employee) => {
    setCurrentEmployee(emp);
    setIsEmployeeLoginOpen(false);
    setAppMode('funcionario');
    try {
      localStorage.setItem(LOCAL_STORAGE_EMPLOYEE_KEY, JSON.stringify(emp));
    } catch (e) {
      console.error('Failed to persist employee login', e);
    }
  };

  const handleEmployeeLogout = () => {
    setCurrentEmployee(null);
    setRole('funcionario');
    setIsOwnerDashboardOpen(false);
    try {
      localStorage.removeItem(LOCAL_STORAGE_EMPLOYEE_KEY);
    } catch (e) {
      console.error('Failed to clear employee login', e);
    }
  };

  const handleDeleteAppointment = (id: string) => {
    const updated = appointments.filter((apt) => apt.id !== id);
    saveAppointmentsToStorage(updated);
    deleteAppointmentDb(id);
  };

  return (
    <div className="min-h-screen bg-[#121214] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Header */}
      <Header
        settings={settings}
        appMode={appMode}
        onChangeMode={handleChangeMode}
        appointmentCount={appointments.filter((a) =>
          ['agendado', 'aprovado', 'em_lavagem'].includes(a.status)
        ).length}
        onOpenSettings={() => setIsAdminOpen(true)}
        onOpenShareLink={() => setIsShareOpen(true)}
        isClientOnly={isClientLink}
        role={role}
        onRequestOwnerAccess={handleOwnerAccessRequest}
        currentEmployee={currentEmployee}
        onLogoutEmployee={handleEmployeeLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-2xl md:max-w-4xl lg:max-w-6xl w-full mx-auto px-4 pt-6 pb-32">
        {/* Mode Switch Navigation Banner */}
        {appMode === 'funcionario' ? (
          /* Staff View */
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#1d1d22] border border-gray-800">
              <div className="flex items-center gap-1.5 min-w-0">
                <Wrench className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-xs font-bold text-gray-200 truncate">
                  {settings.storeName}
                </span>
                {role === 'dono' ? (
                  <span className="text-[11px] font-bold text-emerald-300 shrink-0">• Dono</span>
                ) : (
                  <span className="text-[11px] font-bold text-cyan-300 shrink-0">
                    • {currentEmployee?.name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
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
                  onClick={() => setAppMode('cliente')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 text-xs font-bold border border-cyan-500/30 flex items-center gap-1 cursor-pointer hover:bg-cyan-500/25 transition-colors"
                >
                  <User className="w-3 h-3" />
                  <span>Ver Cardápio</span>
                </button>
              </div>
            </div>

            {newAppointmentAlert && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-600/30 to-cyan-500/20 border border-emerald-400/50 shadow-xl shadow-emerald-500/10 animate-pulse">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                    Novo Agendamento Recebido!
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {newAppointmentAlert.customerName} • {newAppointmentAlert.code}
                  </div>
                  <div className="text-[11px] text-emerald-100/80 mt-0.5">
                    {newAppointmentAlert.vehicleName} - {newAppointmentAlert.washName} •{' '}
                    {new Date(newAppointmentAlert.date).toLocaleDateString('pt-BR')} às{' '}
                    {newAppointmentAlert.timeSlot}
                  </div>
                </div>
                <button
                  onClick={() => setNewAppointmentAlert(null)}
                  className="ml-auto p-1.5 rounded-lg text-emerald-200 hover:bg-emerald-500/20 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <AppointmentQueue
              appointments={appointments}
              settings={settings}
              role={role}
              currentEmployee={currentEmployee}
              onUpdateStatus={handleUpdateStatus}
              onDeleteAppointment={handleDeleteAppointment}
              onOpenReceiptModal={(apt) => setSelectedReceiptApt(apt)}
              onAddProducts={handleAddProducts}
            />
          </div>
        ) : (
          /* Dedicated Client Booking Form */
          <ClientBookingForm
            settings={settings}
            appointments={appointments}
            onConfirmAppointment={handleConfirmAppointment}
            onSwitchToStaff={() => handleChangeMode('funcionario')}
            isClientOnly={isClientLink}
          />
        )}
      </main>

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

      {/* Employee Login Modal */}
      <EmployeeLoginModal
        isOpen={isEmployeeLoginOpen}
        onClose={() => setIsEmployeeLoginOpen(false)}
        employees={settings.employees}
        onLogin={handleEmployeeLogin}
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
