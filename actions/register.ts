'use server'

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export interface RegisterFields {
  email?: string;
  full_name?: string;
  club?: string;
  ciudad?: string;
  phone?: string;
  birth_date?: string;
  rut?: string;
  category?: string;
  instagram?: string;
  terms_accepted?: string;
}

export type RegisterState = {
  message: string | null;
  success: boolean;
  fields?: RegisterFields;
  timestamp?: number; // <--- ESTA ES LA CLAVE DE LA SOLUCIÓN
}

export async function submitRegistration(prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  
  // Generamos una marca de tiempo para forzar la actualización en el cliente
  const timestamp = Date.now();

  // 1. CAPTURAR DATOS
  const fields: RegisterFields = {
    email: (formData.get('email') as string) || '',
    full_name: (formData.get('full_name') as string) || '',
    club: (formData.get('club') as string) || '',
    ciudad: (formData.get('ciudad') as string) || '',
    phone: (formData.get('phone') as string) || '',
    birth_date: (formData.get('birth_date') as string) || '',
    rut: (formData.get('rut') as string || '').replace(/\./g, '').trim(),
    category: (formData.get('category') as string) || '',
    instagram: (formData.get('instagram') as string) || '',
    terms_accepted: (formData.get('terms_accepted') as string) || '',
  };

  // 2. VALIDACIÓN BÁSICA
  if (!fields.full_name || !fields.rut || !fields.email || !fields.category) {
    return { 
      success: false, 
      message: 'Faltan campos obligatorios. Revisa el formulario.', 
      fields,
      timestamp // Devolvemos timestamp para forzar el repintado
    };
  }

  try {
    // 3. BUSCAR EVENTO ACTIVO
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('status', 'pending')
      .order('date', { ascending: true })
      .limit(1)
      .single();

    if (eventError || !eventData) {
      return { 
        success: false, 
        message: 'No hay eventos activos para inscripción.', 
        fields,
        timestamp
      };
    }

    // 4. GUARDAR EN BASE DE DATOS
    const { error: insertError } = await supabase
      .from('registration_requests')
      .insert({
        event_id: eventData.id,
        email: fields.email,
        full_name: fields.full_name.toUpperCase(),
        club: fields.club?.toUpperCase(),
        ciudad: fields.ciudad?.toUpperCase(),
        phone: fields.phone,
        birth_date: fields.birth_date,
        rut: fields.rut,
        category: fields.category,
        instagram: fields.instagram,
        terms_accepted: true,
        status: 'pending'
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return { 
          success: false, 
          message: 'Error: Ya existe una solicitud registrada con este RUT.', 
          fields, // Devolvemos los datos escritos
          timestamp 
        };
      }
      return { 
        success: false, 
        message: 'Error técnico: ' + insertError.message, 
        fields,
        timestamp 
      };
    }

    // 5. ÉXITO
    revalidatePath('/admin/solicitudes');
    
    // Aquí NO devolvemos fields para que el formulario se limpie al tener éxito
    return { success: true, message: 'OK', fields: {}, timestamp };

  } catch (error) {
    return { 
      success: false, 
      message: 'Error de conexión con el servidor.', 
      fields,
      timestamp 
    };
  }
}