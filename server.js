// Servidor Express con webhooks de WhatsApp Business Cloud API
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { handleMessage } = require('./bot');
const { checkConnection, getPoolStats } = require('./database');
const { getSessionStats } = require('./userSessions');
const { verifyWebhookSignature, handleWebhookEvent } = require('./stripe');

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Webhook de Stripe - IMPORTANTE: debe estar ANTES del bodyParser.json()
// Stripe necesita el raw body para verificar la firma del webhook
app.post('/webhook/stripe', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      console.error('❌ No se recibió stripe-signature header');
      return res.status(400).send('Missing stripe-signature header');
    }

    console.log('🔔 Webhook de Stripe recibido');

    // Verificar la firma del webhook
    let event;
    try {
      event = verifyWebhookSignature(req.body, signature);
    } catch (verificationError) {
      console.error('❌ Verificación de firma falló:', verificationError.message);
      return res.status(400).send(`Webhook signature verification failed: ${verificationError.message}`);
    }

    // Responder rápidamente a Stripe (200 OK)
    res.status(200).json({ received: true });

    // Procesar el evento de forma asíncrona
    console.log(`📨 Procesando evento: ${event.type}`);
    await handleWebhookEvent(event);
    console.log(`✅ Evento ${event.type} procesado exitosamente`);

  } catch (error) {
    console.error('❌ Error en webhook de Stripe:', error);
    // Ya respondimos 200, así que solo loggeamos el error
  }
});

// Middleware - después del webhook de Stripe
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ruta de verificación del webhook (GET)
// Meta usa esto para verificar tu servidor
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('📞 Verificación de webhook recibida');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificado exitosamente');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Verificación de webhook falló');
    res.sendStatus(403);
  }
});

// Ruta para recibir mensajes (POST)
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Verificar que sea una notificación de WhatsApp
    if (body.object !== 'whatsapp_business_account') {
      res.sendStatus(404);
      return;
    }

    // Responder rápidamente a WhatsApp (200 OK)
    res.sendStatus(200);

    // Procesar los mensajes
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value;

        // Verificar que haya mensajes
        if (!value.messages || value.messages.length === 0) {
          continue;
        }

        const messages = value.messages;

        for (const message of messages) {
          const from = message.from; // Número de teléfono del usuario
          const messageId = message.id;
          const timestamp = message.timestamp;

          console.log(`\n📩 Nuevo mensaje recibido`);
          console.log(`De: ${from}`);
          console.log(`ID: ${messageId}`);
          console.log(`Timestamp: ${timestamp}`);

          // Ignorar mensajes de status y otros tipos no deseados
          if (message.type === 'unknown' || !message.type) {
            console.log('⚠️  Tipo de mensaje desconocido, ignorando');
            continue;
          }

          // Manejar el mensaje con el bot
          await handleMessage(from, message);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error en webhook POST:', error);
    // Ya respondimos 200, así que no enviamos otra respuesta
  }
});

// Ruta de health check mejorada
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    const dbConnected = await checkConnection();
    const poolStats = getPoolStats();
    const sessionStats = getSessionStats();

    const health = {
      status: dbConnected ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      service: 'WhatsApp Restaurant Bot',
      version: '2.0.0',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      },
      database: {
        connected: dbConnected,
        pool: {
          total: poolStats.total,
          idle: poolStats.idle,
          waiting: poolStats.waiting
        }
      },
      sessions: {
        active: sessionStats.totalSessions
      },
      environment: process.env.NODE_ENV || 'development'
    };

    const statusCode = dbConnected ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('❌ Error en health check:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>WhatsApp Restaurant Bot</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 { color: #25D366; }
          .status { color: #128C7E; font-weight: bold; }
          code {
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🤖 WhatsApp Restaurant Bot</h1>
          <p class="status">✅ Servidor funcionando correctamente</p>
          <h2>Endpoints disponibles:</h2>
          <ul>
            <li><code>GET /webhook</code> - Verificación de webhook de WhatsApp</li>
            <li><code>POST /webhook</code> - Recibir mensajes de WhatsApp</li>
            <li><code>POST /webhook/stripe</code> - Webhook de Stripe para pagos</li>
            <li><code>GET /health</code> - Health check</li>
          </ul>
          <h2>Configuración:</h2>
          <p>Asegúrate de configurar el webhook en Meta for Developers apuntando a:</p>
          <code>https://tu-dominio.com/webhook</code>
          <p style="margin-top: 20px; color: #666;">
            <small>ChefAtHome Bot v1.0.0 - 2024</small>
          </p>
        </div>
      </body>
    </html>
  `);
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('❌ Error del servidor:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log('🤖 WhatsApp Restaurant Bot INICIADO');
  console.log('🚀 ========================================');
  console.log(`📡 Servidor escuchando en puerto: ${PORT}`);
  console.log(`🔗 URL local: http://localhost:${PORT}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('🚀 ========================================\n');

  // Verificar variables de entorno críticas
  if (!process.env.WHATSAPP_TOKEN) {
    console.warn('⚠️  WARNING: WHATSAPP_TOKEN no configurado');
  }
  if (!process.env.WHATSAPP_PHONE_ID) {
    console.warn('⚠️  WARNING: WHATSAPP_PHONE_ID no configurado');
  }
  if (!process.env.VERIFY_TOKEN) {
    console.warn('⚠️  WARNING: VERIFY_TOKEN no configurado');
  }

  console.log('✅ Bot listo para recibir mensajes\n');
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;
