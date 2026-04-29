const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim().replace(/"/g, '');
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function testV2() {
  console.log('--- BUSCANDO REGISTROS DE ESTEBAN EN BD ---');
  const { data: reqs } = await supabase.from('registration_requests').select('email, full_name').ilike('email', '%esteban%');
  console.log('Requests:', reqs);

  console.log('\n--- ENVIANDO CORREO DE PRUEBA PLANO ---');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });

  const emails = ['esteban.contacto14@gmail.com', 'esteban.vidal.valencia@gmail.com'];
  
  for (const to of emails) {
    try {
      console.log(`Enviando a ${to}...`);
      const info = await transporter.sendMail({
        from: `"Prueba MTB" <${env.EMAIL_USER}>`,
        to: to,
        subject: 'Prueba de Texto Plano - MTB',
        text: 'Hola Esteban. Este es un correo de prueba en texto plano, sin HTML. Si te llega este, significa que el formato HTML de los correos anteriores estaba siendo bloqueado por el filtro de spam de Google.',
      });
      console.log(`✅ OK. ID: ${info.messageId}`);
    } catch (e) {
      console.log(`❌ Error enviando a ${to}:`, e.message);
    }
  }
}

testV2();
