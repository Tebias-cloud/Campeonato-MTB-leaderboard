const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim().replace(/"/g, '');
});

async function checkEmail() {
  console.log('\n======================================');
  console.log('🔍 PRUEBA DE DIAGNÓSTICO DE CORREO');
  console.log('======================================');
  console.log('Usuario configurado:', env.EMAIL_USER ? env.EMAIL_USER : 'FALTA');
  console.log('Clave configurada:', env.EMAIL_PASS ? '******** (Oculta por seguridad)' : 'FALTA');
  console.log('--------------------------------------');

  if (!env.EMAIL_USER || !env.EMAIL_PASS) {
    console.log('❌ ERROR: Faltan las credenciales en el archivo .env.local');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
    // Opciones adicionales para ayudar a diagnosticar
    connectionTimeout: 10000, // 10 segundos de espera
  });

  console.log('⏳ Conectando con los servidores de Google (Puerto 465)...');
  
  try {
    await transporter.verify();
    console.log('\n✅ ¡ÉXITO TOTAL!');
    console.log('La conexión a Google funcionó y tu Clave de Aplicación es 100% CORRECTA.');
  } catch (error) {
    console.log('\n❌ DETALLE DEL ERROR:');
    
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.log('👉 PROBLEMA DE CONTRASEÑA (EAUTH):');
      console.log('La conexión funcionó, pero Google RECHAZÓ tu contraseña.');
      console.log('Solución: Debes generar una nueva "Contraseña de Aplicación" en tu cuenta de Google y ponerla en tu .env.local.');
    } 
    else if (error.code === 'ETIMEDOUT') {
      console.log('👉 PROBLEMA DE RED / BLOQUEO (ETIMEDOUT):');
      console.log('Tu computador ni siquiera pudo llegar a Google. Tu red Wi-Fi, tu proveedor de internet o tu antivirus (ej. Avast) está bloqueando la salida de correos (Puerto 465).');
      console.log('Solución: Desactiva el escudo de correo de tu antivirus o prueba compartiendo internet desde tu celular.');
    }
    else {
      console.log('👉 OTRO ERROR:', error.message);
    }
  }
  console.log('======================================\n');
}

checkEmail();
