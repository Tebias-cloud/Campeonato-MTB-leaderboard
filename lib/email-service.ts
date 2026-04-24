import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailData) {
  try {
    const info = await transporter.sendMail({
      from: `"Campeonato MTB Tarapacá" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

export function getApprovalEmailHtml(fullName: string, eventName: string, category: string) {
  return `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8FAFC; border-radius: 24px; overflow: hidden; border: 1px solid #E2E8F0;">
    <div style="background-color: #1A1816; padding: 40px 20px; text-align: center; border-bottom: 6px solid #10B981;">
      <h1 style="color: #FFFFFF; font-size: 24px; margin: 0; text-transform: uppercase; letter-spacing: 2px; font-style: italic;">¡Inscripción Confirmada!</h1>
      <p style="color: #94A3B8; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 10px;">Campeonato MTB Tarapacá 2026</p>
    </div>
  
    <div style="padding: 40px 30px;">
      <p style="color: #1E293B; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">¡Hola, <strong>${fullName}</strong>!</p>
      
      <p style="color: #475569; font-size: 15px; line-height: 1.6;">Tu pago ha sido validado exitosamente. Ya tienes tu cupo asegurado para el desafío que se viene.</p>
      
      <div style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 30px; margin: 32px 0; text-align: left; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <p style="margin: 0 0 15px 0; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px; color: #1E293B;"><strong>Evento:</strong> ${eventName}</p>
        <p style="margin: 0; color: #1E293B;"><strong>Categoría:</strong> ${category}</p>
      </div>

      <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 25px; border-radius: 12px; margin-bottom: 32px; text-align: center;">
        <p style="color: #064E3B; font-size: 15px; font-weight: 700; margin-bottom: 5px;">🔥 ¡LA COMPETENCIA YA EMPEZÓ!</p>
        <p style="color: #065F46; font-size: 13px; margin-bottom: 20px; opacity: 0.8;">Revisa quiénes son tus rivales y cómo vas en la tabla general de la temporada.</p>
        <a href="https://campeonato-mtb-leaderboard.vercel.app/ranking" style="background-color: #1A1816; color: #FFFFFF; text-decoration: none; padding: 16px 28px; border-radius: 10px; font-size: 13px; font-weight: 800; text-transform: uppercase; display: inline-block; letter-spacing: 1px; transition: all 0.2s;">
          📊 Ver Ranking Oficial
        </a>
      </div>

      <p style="color: #94A3B8; font-size: 13px; text-align: center; font-style: italic;">"El barro se quita, la gloria permanece."</p>
    </div>
  
    <div style="background-color: #F1F5F9; padding: 25px; text-align: center; border-top: 1px solid #E2E8F0;">
      <p style="color: #94A3B8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0;">© 2026 Campeonato MTB Tarapacá</p>
    </div>
  </div>
  `;
}
