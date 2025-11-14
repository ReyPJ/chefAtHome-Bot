// Stripe integration - Payment Links y Webhooks
require('dotenv').config();
const Stripe = require('stripe');
const { pool } = require('./database');
const { sendTextMessage } = require('./utils');

// Inicializar Stripe con la API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Crea un Payment Link de Stripe para una orden
 * @param {Object} orderData - Datos de la orden
 * @param {number} orderData.orderId - ID de la orden en la base de datos
 * @param {string} orderData.orderNumber - Número de orden único
 * @param {number} orderData.total - Total a pagar en MXN
 * @param {string} orderData.phone - Teléfono del cliente
 * @param {string} orderData.userName - Nombre del cliente
 * @param {string} orderData.restaurantName - Nombre del restaurante
 * @returns {Promise<Object>} - { paymentLink, sessionId }
 */
async function createPaymentLink(orderData) {
  try {
    const { orderId, orderNumber, total, phone, userName, restaurantName } = orderData;

    console.log(`💳 Creando Payment Link de Stripe para orden ${orderNumber}...`);
    console.log(`📊 Total: $${total} MXN`);

    // Convertir el total a centavos (Stripe usa centavos)
    const amountInCents = Math.round(total * 100);

    // Crear un producto temporal para esta orden
    const product = await stripe.products.create({
      name: `Orden ${orderNumber} - ${restaurantName}`,
      description: `Pedido de ${userName} en ${restaurantName}`,
      metadata: {
        order_id: orderId.toString(),
        order_number: orderNumber,
        phone: phone,
        restaurant_name: restaurantName
      }
    });

    console.log(`✅ Producto creado en Stripe: ${product.id}`);

    // Crear un precio para el producto
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amountInCents,
      currency: 'mxn',
      metadata: {
        order_id: orderId.toString(),
        order_number: orderNumber
      }
    });

    console.log(`✅ Precio creado en Stripe: ${price.id}`);

    // Crear el Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1
        }
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: process.env.STRIPE_SUCCESS_URL || 'https://chefathome.com/success'
        }
      },
      metadata: {
        order_id: orderId.toString(),
        order_number: orderNumber,
        phone: phone,
        user_name: userName,
        restaurant_name: restaurantName
      },
      phone_number_collection: {
        enabled: false
      },
      custom_text: {
        submit: {
          message: `Orden #${orderNumber} - ${restaurantName}`
        }
      }
    });

    console.log(`✅ Payment Link creado: ${paymentLink.url}`);

    // Guardar el payment link ID en la base de datos
    await pool.query(
      `UPDATE orders
       SET stripe_payment_link_id = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [paymentLink.id, orderId]
    );

    console.log(`✅ Payment Link ID guardado en la base de datos`);

    return {
      paymentLinkUrl: paymentLink.url,
      paymentLinkId: paymentLink.id,
      productId: product.id,
      priceId: price.id
    };

  } catch (error) {
    console.error('❌ Error creando Payment Link de Stripe:', error);
    throw new Error(`Error creando Payment Link: ${error.message}`);
  }
}

/**
 * Maneja eventos de webhook de Stripe
 * @param {Object} event - Evento de Stripe verificado
 * @returns {Promise<void>}
 */
async function handleWebhookEvent(event) {
  try {
    console.log(`🔔 Evento de Stripe recibido: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'payment_intent.succeeded':
        console.log(`✅ Payment Intent succeeded: ${event.data.object.id}`);
        // Este evento se maneja principalmente con checkout.session.completed
        break;

      default:
        console.log(`⚠️  Evento no manejado: ${event.type}`);
    }

  } catch (error) {
    console.error('❌ Error manejando webhook event:', error);
    throw error;
  }
}

/**
 * Maneja el evento checkout.session.completed
 * Se dispara cuando el cliente completa el pago exitosamente
 */
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log(`✅ Checkout session completed: ${session.id}`);
    console.log(`💰 Monto pagado: ${session.amount_total / 100} ${session.currency.toUpperCase()}`);

    // Extraer metadata
    const metadata = session.metadata || {};
    const orderId = metadata.order_id;
    const orderNumber = metadata.order_number;
    const phone = metadata.phone;

    if (!orderId) {
      console.error('❌ No se encontró order_id en la metadata del session');
      return;
    }

    console.log(`📝 Actualizando orden ${orderNumber} (ID: ${orderId})`);

    // Actualizar la orden en la base de datos
    const result = await pool.query(
      `UPDATE orders
       SET stripe_session_id = $1,
           payment_status = 'completed',
           status = 'paid',
           payment_completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [session.id, orderId]
    );

    if (result.rows.length === 0) {
      console.error(`❌ No se encontró la orden con ID ${orderId}`);
      return;
    }

    const order = result.rows[0];

    console.log(`✅ Orden ${orderNumber} actualizada a estado: paid`);
    console.log(`✅ Payment status: completed`);

    // Notificar al usuario por WhatsApp
    if (phone) {
      const confirmationMessage =
        `✅ *¡Pago Confirmado!* 💳\n\n` +
        `Tu pago de *$${(session.amount_total / 100).toFixed(2)} MXN* ha sido procesado exitosamente.\n\n` +
        `📝 *Orden #${orderNumber}*\n` +
        `🍽️ *${order.restaurant_name}*\n\n` +
        `Tu orden está siendo preparada y pronto será enviada. 🚀\n\n` +
        `¡Gracias por tu preferencia! 😊`;

      await sendTextMessage(phone, confirmationMessage);
      console.log(`📱 Notificación de pago enviada a WhatsApp: ${phone}`);
    }

    // Log detallado para auditoría
    console.log(`📊 PAGO COMPLETADO - Detalles:`);
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Order Number: ${orderNumber}`);
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Amount: ${session.amount_total / 100} ${session.currency.toUpperCase()}`);
    console.log(`   Customer: ${metadata.user_name || 'N/A'}`);
    console.log(`   Phone: ${phone || 'N/A'}`);
    console.log(`   Restaurant: ${metadata.restaurant_name || 'N/A'}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log(`=======================================`);

  } catch (error) {
    console.error('❌ Error en handleCheckoutSessionCompleted:', error);
    throw error;
  }
}

/**
 * Maneja el evento checkout.session.expired
 * Se dispara cuando la sesión de pago expira sin completarse
 */
async function handleCheckoutSessionExpired(session) {
  try {
    console.log(`⏰ Checkout session expired: ${session.id}`);

    const metadata = session.metadata || {};
    const orderId = metadata.order_id;
    const orderNumber = metadata.order_number;
    const phone = metadata.phone;

    if (!orderId) {
      console.error('❌ No se encontró order_id en la metadata del session');
      return;
    }

    console.log(`📝 Orden ${orderNumber} - Sesión de pago expirada`);

    // Notificar al usuario
    if (phone) {
      const expirationMessage =
        `⏰ *Sesión de Pago Expirada*\n\n` +
        `Tu sesión de pago para la orden #${orderNumber} ha expirado.\n\n` +
        `Si aún deseas realizar este pedido, por favor contacta a soporte escribiendo *HUMANO*.\n\n` +
        `¡Estamos aquí para ayudarte! 😊`;

      await sendTextMessage(phone, expirationMessage);
      console.log(`📱 Notificación de expiración enviada a WhatsApp: ${phone}`);
    }

  } catch (error) {
    console.error('❌ Error en handleCheckoutSessionExpired:', error);
  }
}

/**
 * Maneja el evento payment_intent.payment_failed
 * Se dispara cuando un pago falla
 */
async function handlePaymentFailed(paymentIntent) {
  try {
    console.log(`❌ Payment failed: ${paymentIntent.id}`);

    const metadata = paymentIntent.metadata || {};
    const orderId = metadata.order_id;
    const orderNumber = metadata.order_number;
    const phone = metadata.phone;

    if (!orderId) {
      console.error('❌ No se encontró order_id en la metadata del payment intent');
      return;
    }

    // Actualizar la orden en la base de datos
    await pool.query(
      `UPDATE orders
       SET payment_status = 'failed',
           needs_human_support = true,
           human_support_reason = 'Payment failed - ' || $1,
           human_support_requested_at = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [paymentIntent.last_payment_error?.message || 'Unknown error', orderId]
    );

    console.log(`✅ Orden ${orderNumber} marcada como payment_failed`);

    // Notificar al usuario
    if (phone) {
      const failureMessage =
        `❌ *Pago No Procesado*\n\n` +
        `Hubo un problema procesando tu pago para la orden #${orderNumber}.\n\n` +
        `Por favor contacta a soporte escribiendo *HUMANO* para recibir asistencia.\n\n` +
        `¡Estamos aquí para ayudarte! 😊`;

      await sendTextMessage(phone, failureMessage);
      console.log(`📱 Notificación de fallo enviada a WhatsApp: ${phone}`);
    }

  } catch (error) {
    console.error('❌ Error en handlePaymentFailed:', error);
  }
}

/**
 * Verifica la firma del webhook de Stripe
 * @param {string} payload - Raw body del request
 * @param {string} signature - Header stripe-signature
 * @returns {Object} - Evento verificado de Stripe
 */
function verifyWebhookSignature(payload, signature) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET no está configurado');
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    console.log(`✅ Webhook signature verificada correctamente`);
    return event;

  } catch (error) {
    console.error('❌ Error verificando webhook signature:', error.message);
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
}

module.exports = {
  createPaymentLink,
  handleWebhookEvent,
  verifyWebhookSignature
};
