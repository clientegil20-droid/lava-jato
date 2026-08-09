import { Appointment, AppointmentStatus, StoreSettings } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const SETTINGS_KEY = 'store';
const LOCAL_STORAGE_SETTINGS_KEY = 'lava_jato_redencao_settings_v1';
const LOCAL_STORAGE_APPOINTMENTS_KEY = 'lava_jato_redencao_appointments_v1';

export type AppointmentRow = {
  id: string;
  created_at: string;
  status: string;
  data: Appointment;
};

export async function fetchAppointments(): Promise<Appointment[] | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase!
    .from('appointments')
    .select('data')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetch appointments error', error);
    return null;
  }

  return (data as AppointmentRow[] | null)?.map((row) => row.data) ?? [];
}

export async function upsertAppointment(appointment: Appointment): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase!
    .from('appointments')
    .upsert(
      {
        id: appointment.id,
        created_at: appointment.createdAt,
        status: appointment.status,
        data: appointment,
      },
      { onConflict: 'id' }
    );

  if (error) console.error('Supabase upsert appointment error', error);
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase!
    .from('appointments')
    .update({ status })
    .eq('id', id);

  if (error) console.error('Supabase update status error', error);
}

export async function deleteAppointment(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase!.from('appointments').delete().eq('id', id);

  if (error) console.error('Supabase delete appointment error', error);
}

export async function fetchSettings(): Promise<StoreSettings | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase!
    .from('settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .single();

  if (error) {
    console.error('Supabase fetch settings error', error);
    return null;
  }

  return (data?.value as StoreSettings) ?? null;
}

export async function upsertSettings(settings: StoreSettings): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase!.from('settings').upsert(
    {
      key: SETTINGS_KEY,
      value: settings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) console.error('Supabase upsert settings error', error);
}

export {
  LOCAL_STORAGE_SETTINGS_KEY,
  LOCAL_STORAGE_APPOINTMENTS_KEY,
};
