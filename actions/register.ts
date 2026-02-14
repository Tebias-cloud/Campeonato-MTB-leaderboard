'use server'

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import nodemailer from 'nodemailer'; // <-- NUEVO: Importamos la herramienta de correos

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

// Configuración del "Cartero" (Nodemailer) usando tu Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Tu correo de Gmail
    pass: process.env.EMAIL_PASS, // Tu Contraseña de Aplicación de Gmail
  },
});

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

    // 5. ENVIAR CORREO AUTOMÁTICO AL COMPETIDOR
    try {
      await transporter.sendMail({
        from: `"Campeonato MTB Tarapacá" <${process.env.EMAIL_USER}>`,
        to: fields.email, // El correo que puso el corredor en el formulario
        subject: "¡Solicitud Recibida! Pasos para confirmar tu pago 🚴‍♂️",
        html: `
          <div style="font-family: Arial, sans-serif; color: #1A1816; max-w: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #C64928; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-style: italic;">¡HOLA ${fields.full_name.toUpperCase()}!</h1>
            </div>
            <div style="padding: 30px; background-color: #ffffff;">
              <p style="font-size: 16px;">Hemos recibido tu solicitud de inscripción para el <strong>XCM Pampa y Mar</strong> en la categoría <strong>${fields.category}</strong>.</p>
              
              <div style="background-color: #fff7ed; border-left: 4px solid #C64928; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #C64928;">Siguiente paso obligatorio:</h3>
                <p style="margin-bottom: 0;">Para validar tu inscripción, debes enviar el comprobante de transferencia por WhatsApp al <strong>+56 9 2633 6663</strong>.</p>
              </div>

              <p style="font-size: 16px;"><strong>Apenas la organización confirme tu pago, entrarás oficialmente al Ranking de la carrera.</strong></p>
              
              <br/>
              <p style="font-size: 14px; color: #64748b;">Nos vemos en la meta,</p>
              <p style="font-size: 14px; font-weight: bold; margin-top: 5px;">Team Cycles Franklin</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Error enviando el correo de confirmación:', emailError);
      // No retornamos error aquí para que la inscripción no falle si el correo falla
    }

    // 6. ÉXITO
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