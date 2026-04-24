'use server'

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { formatChileanPhone, cleanInstagramHandle } from '@/lib/utils';
import { sendEmail } from '@/lib/email-service';

export type RegisterState = {
  message: string | null;
  success: boolean;
  fields?: Record<string, string>;
  timestamp?: number;
}

interface EventFormConfig {
  categories?: string[];
  payment_contact?: string;
  poster_url?: string;
}

export async function submitRegistration(prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const timestamp = Date.now();
  const rawData: Record<string, string> = {};
  
  formData.forEach((value, key) => {
    if (typeof value === 'string' && !key.startsWith('$')) {
      rawData[key] = value;
    }
  });

  const event_id = rawData.event_id;
  const full_name = (rawData.full_name || '').toUpperCase();
  const email = rawData.email;
  const rut = (rawData.rut || '').replace(/\./g, '').trim();
  const category = rawData.category_selected;

  if (!event_id || !full_name || !rut || !email || !category) {
    return { success: false, message: 'Faltan campos obligatorios.', fields: rawData, timestamp };
  }

  const fixedKeys = ['event_id', 'full_name', 'rut', 'email', 'category_selected', 'phone', 'birth_date', 'ciudad', 'club', 'instagram', 'terms_accepted'];
  const additional_data: Record<string, string> = {};
  
  Object.keys(rawData).forEach(key => {
    if (!fixedKeys.includes(key)) {
      additional_data[key] = rawData[key];
    }
  });

  try {
    const { error: insertError } = await supabase
      .from('registration_requests')
      .insert({
        event_id,
        email,
        full_name,
        rut,
        category,
        phone: formatChileanPhone(rawData.phone),
        birth_date: rawData.birth_date || null,
        ciudad: rawData.ciudad?.toUpperCase() || null,
        club: rawData.club?.toUpperCase() || null,
        instagram: cleanInstagramHandle(rawData.instagram),
        additional_data,
        status: 'pending',
        terms_accepted: true
      });

    if (insertError) {
      const msg = insertError.code === '23505' ? 'Este RUT ya tiene una solicitud pendiente.' : insertError.message;
      return { success: false, message: msg, fields: rawData, timestamp };
    }

    // ENVIAR EMAIL DE PAGO PENDIENTE
    try {
      const { data: eventInfo } = await supabase.from('events').select('*').eq('id', event_id).single();
      const config = eventInfo?.form_config as EventFormConfig | null;
      const paymentContact = config?.payment_contact || process.env.EMAIL_USER;

      const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8FAFC; border-radius: 24px; overflow: hidden; border: 1px solid #E2E8F0;">
        <div style="background-color: #1A1816; padding: 40px 20px; text-align: center; border-bottom: 6px solid #C64928;">
          <h1 style="color: #FFFFFF; font-size: 24px; margin: 0; text-transform: uppercase; letter-spacing: 2px; font-style: italic;">Inscripción Recibida</h1>
          <p style="color: #94A3B8; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 10px;">Campeonato MTB Tarapacá</p>
        </div>
      
        <div style="padding: 40px 30px;">
          <p style="color: #1E293B; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Hola <strong>${full_name}</strong>,</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">Confirmamos la recepción de tus datos para participar en <strong>${eventInfo?.name || 'el evento'}</strong>.</p>
          
          <div style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 30px; margin: 32px 0; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <span style="color: #94A3B8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Monto de Inscripción</span>
            <div style="color: #1A1816; font-size: 42px; font-weight: 800; margin: 10px 0 25px 0;">$${eventInfo?.price || '20.000'}</div>
            
            <div style="text-align: left; background-color: #F8FAFC; padding: 20px; border-radius: 12px; font-size: 14px; color: #334155; border: 1px solid #F1F5F9;">
              <p style="margin: 0 0 10px 0; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px;"><strong>Titular:</strong> ${eventInfo?.bank_owner || 'No especificado'}</p>
              <p style="margin: 10px 0;"><strong>Banco:</strong> ${eventInfo?.bank_name || 'No especificado'}</p>
              <p style="margin: 10px 0;"><strong>Tipo:</strong> ${eventInfo?.bank_account?.split(' - ')[0] || 'Cuenta Vista/Corriente'}</p>
              <p style="margin: 10px 0; font-family: monospace; font-size: 16px;"><strong>RUT:</strong> ${eventInfo?.bank_rut || 'No especificado'}</p>
              <p style="margin: 10px 0 0 0; font-family: monospace; font-size: 18px; color: #C64928;"><strong>N° Cuenta:</strong> ${eventInfo?.bank_account?.split(' - ')[1] || eventInfo?.bank_account}</p>
            </div>
          </div>
      
          <div style="text-align: center; margin-top: 32px;">
            <p style="color: #64748B; font-size: 13px; margin-bottom: 20px;">Una vez realizado el pago, envía tu comprobante a:</p>
            <a href="mailto:${paymentContact}" style="background-color: #C64928; color: #FFFFFF; text-decoration: none; padding: 18px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; display: inline-block; letter-spacing: 1px;">
              ✉️ Enviar Comprobante
            </a>
            <p style="color: #1A1816; font-size: 14px; font-weight: 700; margin-top: 20px;">${paymentContact}</p>
          </div>
        </div>
      
        <div style="background-color: #F1F5F9; padding: 25px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #94A3B8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0;">© 2026 Campeonato MTB Tarapacá</p>
        </div>
      </div>
      `;

      await sendEmail({
        to: email,
        subject: `Pago pendiente: ${eventInfo?.name || 'Inscripción MTB'}`,
        html: emailHtml
      });
    } catch (e) {
      console.error('Error al enviar email:', e);
    }

    revalidatePath('/admin/solicitudes');
    return { success: true, message: 'OK', fields: {}, timestamp };

  } catch (error) {
    return { success: false, message: 'Error de conexión.', fields: rawData, timestamp };
  }
}