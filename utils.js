// Funciones auxiliares para el bot
const axios = require('axios');
require('dotenv').config();

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';

/**
 * Envía un mensaje a través de WhatsApp Business Cloud API
 * @param {string} to - Número de teléfono del destinatario
 * @param {object} messageObject - Objeto con el contenido del mensaje
 */
async function sendMessage(to, messageObject) {
  try {
    const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      ...messageObject
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Mensaje enviado a ${to}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Envía un mensaje de texto simple
 * @param {string} to - Número de teléfono del destinatario
 * @param {string} text - Texto del mensaje
 */
async function sendTextMessage(to, text) {
  return sendMessage(to, {
    type: 'text',
    text: { body: text }
  });
}

/**
 * Envía un mensaje con lista interactiva
 * @param {string} to - Número de teléfono del destinatario
 * @param {string} bodyText - Texto principal del mensaje
 * @param {string} buttonText - Texto del botón de la lista
 * @param {array} sections - Array de secciones con items
 */
async function sendListMessage(to, bodyText, buttonText, sections) {
  return sendMessage(to, {
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: buttonText,
        sections: sections
      }
    }
  });
}

/**
 * Envía un mensaje con botones
 * @param {string} to - Número de teléfono del destinatario
 * @param {string} bodyText - Texto principal del mensaje
 * @param {array} buttons - Array de botones (máximo 3)
 */
async function sendButtonMessage(to, bodyText, buttons) {
  return sendMessage(to, {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: { buttons: buttons }
    }
  });
}

/**
 * Formatea una cantidad en pesos mexicanos
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada (ej: "$150.00 MXN")
 */
function formatCurrency(amount) {
  return `$${amount.toFixed(2)} MXN`;
}

/**
 * Calcula el total del carrito más costo de envío
 * @param {array} cart - Array de items en el carrito
 * @param {number} deliveryFee - Costo de envío
 * @returns {object} Objeto con subtotal, deliveryFee y total
 */
function calculateTotal(cart, deliveryFee = 0) {
  const subtotal = cart.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const total = subtotal + deliveryFee;

  return {
    subtotal,
    deliveryFee,
    total
  };
}

/**
 * Formatea el carrito en un string legible
 * @param {array} cartItems - Array de items en el carrito
 * @returns {string} String formateado del carrito
 */
function formatCart(cartItems) {
  if (!cartItems || cartItems.length === 0) {
    return '🛒 Tu carrito está vacío';
  }

  let cartText = '🛒 *Tu carrito:*\n\n';

  cartItems.forEach((item, index) => {
    cartText += `${index + 1}. *${item.name}*\n`;
    cartText += `   Cantidad: ${item.quantity}\n`;
    cartText += `   Precio: ${formatCurrency(item.price)} c/u\n`;
    cartText += `   Subtotal: ${formatCurrency(item.price * item.quantity)}\n\n`;
  });

  const { subtotal } = calculateTotal(cartItems);
  cartText += `💰 *Subtotal: ${formatCurrency(subtotal)}*`;

  return cartText;
}

/**
 * Valida que una dirección no esté vacía y tenga un mínimo de caracteres
 * @param {string} address - Dirección a validar
 * @returns {boolean} True si es válida
 */
function validateAddress(address) {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const trimmedAddress = address.trim();
  return trimmedAddress.length >= 10;
}

/**
 * Formatea un resumen completo de la orden
 * @param {object} session - Sesión del usuario con todos los datos
 * @returns {string} String formateado con el resumen
 */
function formatOrderSummary(session) {
  const { restaurant, cart, deliveryFee, currentAddress, deliveryZone } = session;
  const { subtotal, total } = calculateTotal(cart, deliveryFee);

  let summary = '📋 *RESUMEN DE TU ORDEN*\n\n';

  summary += `🏪 *Restaurante:* ${restaurant.name}\n\n`;

  summary += '🍽️ *Platillos:*\n';
  cart.forEach((item, index) => {
    summary += `${index + 1}. ${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity)}\n`;
  });

  summary += `\n💵 *Subtotal:* ${formatCurrency(subtotal)}\n`;
  summary += `🚚 *Envío (Zona ${deliveryZone}):* ${formatCurrency(deliveryFee)}\n`;
  summary += `💰 *TOTAL:* ${formatCurrency(total)}\n\n`;

  summary += `📍 *Dirección de entrega:*\n${currentAddress}\n\n`;

  summary += '¿Confirmas tu orden? 🤔';

  return summary;
}

/**
 * Extrae el texto de un mensaje de WhatsApp
 * @param {object} message - Objeto mensaje de WhatsApp
 * @returns {string|null} Texto del mensaje o null
 */
function extractMessageText(message) {
  if (message.text && message.text.body) {
    return message.text.body.trim();
  }
  return null;
}

/**
 * Extrae la respuesta de un mensaje interactivo
 * @param {object} message - Objeto mensaje de WhatsApp
 * @returns {object|null} Objeto con type e id de la respuesta
 */
function extractInteractiveResponse(message) {
  if (message.interactive) {
    const interactive = message.interactive;

    if (interactive.type === 'list_reply' && interactive.list_reply) {
      return {
        type: 'list_reply',
        id: interactive.list_reply.id,
        title: interactive.list_reply.title
      };
    }

    if (interactive.type === 'button_reply' && interactive.button_reply) {
      return {
        type: 'button_reply',
        id: interactive.button_reply.id,
        title: interactive.button_reply.title
      };
    }
  }

  return null;
}

module.exports = {
  sendMessage,
  sendTextMessage,
  sendListMessage,
  sendButtonMessage,
  formatCurrency,
  calculateTotal,
  formatCart,
  validateAddress,
  formatOrderSummary,
  extractMessageText,
  extractInteractiveResponse
};
