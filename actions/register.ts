// actions/register.ts
'use server'

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import nodemailer from 'nodemailer';

export type RegisterState = {
  message: string | null;
  success: boolean;
  fields?: Record<string, string>;
  timestamp?: number;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function submitRegistration(prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const timestamp = Date.now();
  const rawData: Record<string, string> = {};
  
  // 1. Extraemos todo lo que envió el formulario
  formData.forEach((value, key) => {
    if (typeof value === 'string' && !key.startsWith('$')) {
      rawData[key] = value;
    }
  });

  // 2. Extraemos los campos obligatorios para la base de datos
  const event_id = rawData.event_id;
  const full_name = (rawData.full_name || '').toUpperCase();
  const email = rawData.email;
  const rut = (rawData.rut || '').replace(/\./g, '').trim();
  const category = rawData.category_selected;

  if (!event_id || !full_name || !rut || !email || !category) {
    return { success: false, message: 'Faltan campos obligatorios.', fields: rawData, timestamp };
  }

  // 3. Separamos los datos extra para el JSONB
  const fixedKeys = ['event_id', 'full_name', 'rut', 'email', 'category_selected', 'phone', 'birth_date', 'ciudad', 'club', 'instagram', 'terms_accepted'];
  const additional_data: Record<string, string> = {};
  
  Object.keys(rawData).forEach(key => {
    if (!fixedKeys.includes(key)) {
      additional_data[key] = rawData[key];
    }
  });

  try {
    // 4. Guardamos en la base de datos
    const { error: insertError } = await supabase
      .from('registration_requests')
      .insert({
        event_id,
        email,
        full_name,
        rut,
        category, // Guardamos category_selected en la columna category
        phone: rawData.phone || null,
        birth_date: rawData.birth_date || null,
        ciudad: rawData.ciudad?.toUpperCase() || null,
        club: rawData.club?.toUpperCase() || null,
        instagram: rawData.instagram || null,
        additional_data, // Todo lo extra va aquí
        status: 'pending',
        terms_accepted: true
      });

    if (insertError) {
      const msg = insertError.code === '23505' ? 'Este RUT ya tiene una solicitud pendiente para este evento.' : insertError.message;
      return { success: false, message: msg, fields: rawData, timestamp };
    }

    // 5. Enviar correo (Sin bloquear si falla)
    try {
      const { data: eventInfo } = await supabase.from('events').select('name').eq('id', event_id).single();
      await transporter.sendMail({
        from: `"Chaski Riders" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `¡Inscripción Recibida! 🚴‍♂️`,
        html: `<div style="font-family: Arial; padding: 20px;">
                 <h2 style="color: #C64928;">¡HOLA ${full_name}!</h2>
                 <p>Recibimos tu solicitud para <b>${eventInfo?.name || 'el evento'}</b> en la categoría <b>${category}</b>.</p>
                 <p>Recuerda enviar tu comprobante de pago para validar tu inscripción.</p>
               </div>`
      });
    } catch (e) {
      console.error('Error email:', e);
    }

    revalidatePath('/admin/solicitudes');
    return { success: true, message: 'OK', fields: {}, timestamp };

  } catch (error) {
    return { success: false, message: 'Error de conexión con el servidor.', fields: rawData, timestamp };
  }
}