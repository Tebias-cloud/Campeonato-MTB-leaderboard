const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim().replace(/"/g, '');
});

async function testSend() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });

  const testEmail = 'esteban.vidal.valencia@gmail.com'; // Try to send to the user's email
  
  console.log(`Intentando enviar correo de prueba a: ${testEmail}`);
  console.log(`Usando remitente: ${env.EMAIL_USER}`);

  try {
    const info = await transporter.sendMail({
      from: `"Campeonato MTB Tarapacá" <${env.EMAIL_USER}>`,
      to: testEmail,
      subject: 'Prueba de Sistema de Correos - Campeonato MTB',
      html: '<h1>Si estás leyendo esto, los correos funcionan a nivel SMTP.</h1><p>Revisa la carpeta de SPAM por si acaso.</p>',
    });
    
    console.log('✅ Correo enviado exitosamente!');
    console.log('Message ID:', info.messageId);
    console.log('Respuesta del servidor:', info.response);
  } catch (error) {
    console.log('❌ Falló el envío del correo.');
    console.error(error);
  }
}

testSend();
