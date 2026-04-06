'use server'

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type EventSaveState = {
  error?: string;
  success?: boolean;
} | null;

export async function saveEvent(prevState: EventSaveState, formData: FormData): Promise<EventSaveState> {
  // ... (aquí mantienes todo tu código actual de saveEvent intacto)
  const id = formData.get('id') as string;
  const isNew = !id || id === 'new';

  const name = formData.get('name') as string;
  const date = formData.get('date') as string;
  const status = formData.get('status') as string;
  const subtitle = formData.get('subtitle') as string;
  const description = formData.get('description') as string;
  const price = formData.get('price') as string;
  const bank_owner = formData.get('bank_owner') as string;
  const bank_rut = formData.get('bank_rut') as string;
  const bank_name = formData.get('bank_name') as string;
  const bank_account = formData.get('bank_account') as string;
  const terms_conditions = formData.get('terms_conditions') as string;
  const form_config_str = formData.get('form_config') as string;

  let form_config;
  try {
    form_config = JSON.parse(form_config_str);
  } catch (e) {
    return { error: 'El código JSON de la configuración tiene un error de sintaxis. Revísalo.' };
  }

  const payload = {
    name, date, status, subtitle, description, price, 
    bank_owner, bank_rut, bank_name, bank_account, 
    terms_conditions, form_config
  };

  if (isNew) {
    const { error } = await supabase.from('events').insert(payload);
    if (error) return { error: `Error al crear: ${error.message}` };
  } else {
    const { error } = await supabase.from('events').update(payload).eq('id', id);
    if (error) return { error: `Error al actualizar: ${error.message}` };
  }

  revalidatePath('/admin/events');
  revalidatePath('/');
  redirect('/admin/events');
}

// ✅ NUEVA FUNCIÓN PARA BORRAR EVENTOS
export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) {
    console.error("Error borrando evento:", error);
    throw new Error('No se pudo eliminar el evento');
  }
  
  // Refrescamos las vistas para que desaparezca al instante
  revalidatePath('/admin/events');
  revalidatePath('/');
}