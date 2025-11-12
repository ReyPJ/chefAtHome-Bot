// Lógica principal del bot y manejo de mensajes
const { getSession, updateSession, clearSession } = require('./userSessions');
const { getAllRestaurants, getRestaurantById, getMenuItem, getDeliveryZone } = require('./restaurants');
const { saveOrder, findSavedAddress } = require('./orders');
const {
  sendTextMessage,
  sendListMessage,
  sendButtonMessage,
  formatCart,
  calculateTotal,
  formatCurrency,
  validateAddress,
  formatOrderSummary,
  extractMessageText,
  extractInteractiveResponse
} = require('./utils');

/**
 * Maneja un mensaje entrante del usuario
 * @param {string} userId - Número de teléfono del usuario
 * @param {object} message - Objeto mensaje de WhatsApp
 */
async function handleMessage(userId, message) {
  try {
    // Extraer texto del mensaje
    const messageText = extractMessageText(message);

    // Verificar si es un mensaje interactivo (botones o listas)
    const interactive = extractInteractiveResponse(message);

    console.log(`📨 Mensaje de ${userId}: ${messageText || 'Respuesta interactiva'}`);

    // Manejar keywords especiales
    if (messageText) {
      const upperText = messageText.toUpperCase();

      if (upperText === 'MENU' || upperText === 'MENÚ') {
        await handleMenuKeyword(userId);
        return;
      }

      if (upperText === 'CARRITO') {
        await handleCartKeyword(userId);
        return;
      }

      if (upperText === 'CANCELAR') {
        await handleCancelKeyword(userId);
        return;
      }

      if (upperText === 'AYUDA') {
        await handleHelpKeyword(userId);
        return;
      }
    }

    // Obtener sesión del usuario
    const session = getSession(userId);

    // Si es respuesta interactiva, manejarla
    if (interactive) {
      await handleInteractiveResponse(userId, interactive, session);
      return;
    }

    // Manejar según el paso actual
    switch (session.step) {
      case 'initial':
        await sendWelcome(userId);
        break;

      case 'waiting_name':
        await handleNameResponse(userId, messageText);
        break;

      case 'waiting_restaurant':
        await sendTextMessage(userId, 'Por favor selecciona un restaurante de la lista 👆');
        break;

      case 'browsing_menu':
        await sendTextMessage(userId, 'Por favor selecciona un platillo de la lista 👆');
        break;

      case 'asking_frequent':
        await handleFrequentCustomerResponse(userId, messageText);
        break;

      case 'waiting_address':
        await handleAddressResponse(userId, messageText);
        break;

      case 'choosing_zone':
        await sendTextMessage(userId, 'Por favor selecciona tu zona de entrega usando los botones 👆');
        break;

      case 'confirming_order':
        await handleOrderConfirmation(userId, messageText);
        break;

      default:
        await sendWelcome(userId);
    }
  } catch (error) {
    console.error('❌ Error manejando mensaje:', error);
    await sendTextMessage(
      userId,
      '❌ Hubo un error procesando tu mensaje. Por favor intenta de nuevo o escribe MENÚ para reiniciar.'
    );
  }
}

/**
 * Maneja respuestas interactivas (botones y listas)
 */
async function handleInteractiveResponse(userId, interactive, session) {
  const { type, id, title } = interactive;

  console.log(`🔘 Respuesta interactiva - Tipo: ${type}, ID: ${id}`);

  // Respuesta de lista de restaurantes
  if (id.startsWith('rest_')) {
    await handleRestaurantSelection(userId, id);
    return;
  }

  // Respuesta de lista de menú
  if (id.startsWith('item_')) {
    await handleMenuItemSelection(userId, id);
    return;
  }

  // Botones del carrito
  if (id === 'add_more') {
    await sendMenu(userId, session.restaurant.id);
    return;
  }

  if (id === 'finish_order') {
    await askFrequentCustomer(userId);
    return;
  }

  // Botones de zonas de delivery
  if (id.startsWith('zone_')) {
    const zoneNumber = parseInt(id.split('_')[1]);
    await handleZoneSelection(userId, zoneNumber);
    return;
  }

  // Botones de confirmación de orden
  if (id === 'confirm_yes') {
    await handleOrderConfirmation(userId, 'SÍ');
    return;
  }

  if (id === 'confirm_no') {
    await handleOrderConfirmation(userId, 'NO');
    return;
  }

  // Botones de dirección guardada
  if (id === 'use_saved_address') {
    await handleUseSavedAddress(userId);
    return;
  }

  if (id === 'new_address') {
    await requestAddress(userId);
    return;
  }
}

/**
 * Envía mensaje de bienvenida y pide nombre
 */
async function sendWelcome(userId) {
  const welcomeMessage = `¡Hola! 👋 Bienvenido a *ChefAtHome* 🍽️

Soy tu asistente virtual y estoy aquí para ayudarte a ordenar deliciosa comida de los mejores restaurantes. 🚀

Para comenzar, ¿cuál es tu nombre? 😊`;

  await sendTextMessage(userId, welcomeMessage);
  updateSession(userId, { step: 'waiting_name' });
}

/**
 * Maneja la respuesta del nombre
 */
async function handleNameResponse(userId, name) {
  if (!name || name.length < 2) {
    await sendTextMessage(userId, 'Por favor ingresa un nombre válido 😊');
    return;
  }

  updateSession(userId, {
    userName: name,
    step: 'waiting_restaurant'
  });

  await sendTextMessage(userId, `¡Mucho gusto, ${name}! 😊`);
  await sendRestaurantList(userId);
}

/**
 * Envía lista interactiva de restaurantes
 */
async function sendRestaurantList(userId) {
  const restaurants = getAllRestaurants();

  const rows = restaurants.map(restaurant => ({
    id: restaurant.id,
    title: restaurant.name,
    description: restaurant.description
  }));

  const sections = [
    {
      title: 'Restaurantes Disponibles',
      rows: rows
    }
  ];

  await sendListMessage(
    userId,
    '🍽️ Tenemos 5 deliciosos restaurantes para ti. ¿Cuál te gustaría explorar?',
    'Ver Restaurantes',
    sections
  );

  updateSession(userId, { step: 'waiting_restaurant' });
}

/**
 * Maneja la selección de restaurante
 */
async function handleRestaurantSelection(userId, restaurantId) {
  const restaurant = getRestaurantById(restaurantId);

  if (!restaurant) {
    await sendTextMessage(userId, '❌ Restaurante no encontrado. Por favor intenta de nuevo.');
    await sendRestaurantList(userId);
    return;
  }

  updateSession(userId, {
    restaurant: restaurant,
    step: 'browsing_menu'
  });

  await sendTextMessage(userId, `¡Excelente elección! ${restaurant.name} 🎉`);
  await sendMenu(userId, restaurantId);
}

/**
 * Envía el menú del restaurante como lista interactiva
 */
async function sendMenu(userId, restaurantId) {
  const restaurant = getRestaurantById(restaurantId);

  if (!restaurant) {
    await sendTextMessage(userId, '❌ Error cargando el menú. Intenta de nuevo.');
    return;
  }

  const rows = restaurant.menu.map(item => ({
    id: item.id,
    title: `${item.name} - $${item.price}`,
    description: item.description.substring(0, 72) // WhatsApp limit
  }));

  const sections = [
    {
      title: 'Menú Disponible',
      rows: rows
    }
  ];

  await sendListMessage(
    userId,
    `🍽️ *Menú de ${restaurant.name}*\n\n¿Qué te gustaría ordenar?`,
    'Ver Menú',
    sections
  );

  updateSession(userId, { step: 'browsing_menu' });
}

/**
 * Maneja la selección de un platillo del menú
 */
async function handleMenuItemSelection(userId, itemId) {
  const session = getSession(userId);

  if (!session.restaurant) {
    await sendRestaurantList(userId);
    return;
  }

  const menuItem = getMenuItem(session.restaurant.id, itemId);

  if (!menuItem) {
    await sendTextMessage(userId, '❌ Platillo no encontrado. Por favor selecciona otro.');
    return;
  }

  // Agregar al carrito o incrementar cantidad
  const existingItem = session.cart.find(item => item.id === itemId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    session.cart.push({
      id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: 1
    });
  }

  updateSession(userId, { cart: session.cart });

  await sendTextMessage(
    userId,
    `✅ *${menuItem.name}* agregado al carrito! 🛒`
  );

  // Mostrar carrito con opciones
  await showCart(userId);
}

/**
 * Muestra el carrito con botones de acción
 */
async function showCart(userId) {
  const session = getSession(userId);

  if (!session.cart || session.cart.length === 0) {
    await sendTextMessage(userId, '🛒 Tu carrito está vacío. Selecciona algo del menú.');
    return;
  }

  const cartText = formatCart(session.cart);

  const buttons = [
    {
      type: 'reply',
      reply: {
        id: 'add_more',
        title: '➕ Agregar más'
      }
    },
    {
      type: 'reply',
      reply: {
        id: 'finish_order',
        title: '✅ Finalizar pedido'
      }
    }
  ];

  await sendButtonMessage(userId, cartText, buttons);
}

/**
 * Pregunta si es cliente frecuente
 */
async function askFrequentCustomer(userId) {
  const session = getSession(userId);

  const buttons = [
    {
      type: 'reply',
      reply: {
        id: 'frequent_yes',
        title: 'Sí, soy cliente'
      }
    },
    {
      type: 'reply',
      reply: {
        id: 'frequent_no',
        title: 'No, soy nuevo'
      }
    }
  ];

  await sendButtonMessage(
    userId,
    '¿Eres cliente frecuente? 🤔',
    buttons
  );

  updateSession(userId, { step: 'asking_frequent' });
}

/**
 * Maneja la respuesta de cliente frecuente
 */
async function handleFrequentCustomerResponse(userId, response) {
  const session = getSession(userId);
  const upperResponse = response.toUpperCase();

  // Manejar respuestas de botones
  if (response === 'frequent_yes' || upperResponse.includes('SI') || upperResponse.includes('SÍ')) {
    updateSession(userId, { isFrequentCustomer: true });

    // Buscar dirección guardada
    const savedAddress = await findSavedAddress(userId, session.userName);

    if (savedAddress) {
      updateSession(userId, { savedAddress: savedAddress });
      await askUseSavedAddress(userId, savedAddress);
    } else {
      await sendTextMessage(
        userId,
        '😊 ¡Qué bien verte de nuevo! Pero no encontré una dirección guardada con tu nombre.'
      );
      await requestAddress(userId);
    }
    return;
  }

  if (response === 'frequent_no' || upperResponse.includes('NO')) {
    updateSession(userId, { isFrequentCustomer: false });
    await sendTextMessage(userId, '¡Bienvenido! 🎉 Vamos a registrar tu dirección.');
    await requestAddress(userId);
    return;
  }

  // Respuesta no reconocida
  await sendTextMessage(userId, 'Por favor responde SÍ o NO 😊');
}

/**
 * Pregunta si quiere usar dirección guardada
 */
async function askUseSavedAddress(userId, savedAddress) {
  const buttons = [
    {
      type: 'reply',
      reply: {
        id: 'use_saved_address',
        title: '✅ Usar guardada'
      }
    },
    {
      type: 'reply',
      reply: {
        id: 'new_address',
        title: '📝 Nueva dirección'
      }
    }
  ];

  await sendButtonMessage(
    userId,
    `Tengo esta dirección guardada:\n\n📍 ${savedAddress}\n\n¿Quieres usarla o prefieres ingresar una nueva?`,
    buttons
  );
}

/**
 * Maneja el uso de dirección guardada
 */
async function handleUseSavedAddress(userId) {
  const session = getSession(userId);

  updateSession(userId, {
    currentAddress: session.savedAddress,
    step: 'choosing_zone'
  });

  await sendTextMessage(userId, '✅ Perfecto, usaremos tu dirección guardada.');
  await askDeliveryZone(userId);
}

/**
 * Solicita la dirección de entrega
 */
async function requestAddress(userId) {
  await sendTextMessage(
    userId,
    '📍 Por favor escribe tu dirección completa de entrega:\n\n' +
    '(Incluye calle, número, colonia, referencias)'
  );

  updateSession(userId, { step: 'waiting_address' });
}

/**
 * Maneja la respuesta de dirección
 */
async function handleAddressResponse(userId, address) {
  if (!validateAddress(address)) {
    await sendTextMessage(
      userId,
      '❌ La dirección parece muy corta. Por favor proporciona una dirección completa (mínimo 10 caracteres).'
    );
    return;
  }

  updateSession(userId, {
    currentAddress: address,
    step: 'choosing_zone'
  });

  await sendTextMessage(userId, '✅ Dirección registrada correctamente.');
  await askDeliveryZone(userId);
}

/**
 * Pregunta la zona de entrega con botones
 */
async function askDeliveryZone(userId) {
  const buttons = [
    {
      type: 'reply',
      reply: {
        id: 'zone_1',
        title: '📍 Zona 1 - $50'
      }
    },
    {
      type: 'reply',
      reply: {
        id: 'zone_2',
        title: '📍 Zona 2 - $80'
      }
    },
    {
      type: 'reply',
      reply: {
        id: 'zone_3',
        title: '📍 Zona 3 - $120'
      }
    }
  ];

  await sendButtonMessage(
    userId,
    '🗺️ Selecciona tu zona de entrega:\n\n' +
    '📍 *Zona 1* - Centro ($50 MXN)\n' +
    '📍 *Zona 2* - Colonias cercanas ($80 MXN)\n' +
    '📍 *Zona 3* - Colonias lejanas ($120 MXN)',
    buttons
  );
}

/**
 * Maneja la selección de zona
 */
async function handleZoneSelection(userId, zoneNumber) {
  const zone = getDeliveryZone(zoneNumber);

  if (!zone) {
    await sendTextMessage(userId, '❌ Zona no válida. Por favor selecciona de nuevo.');
    await askDeliveryZone(userId);
    return;
  }

  updateSession(userId, {
    deliveryZone: zoneNumber,
    deliveryFee: zone.fee,
    step: 'confirming_order'
  });

  await sendTextMessage(userId, `✅ ${zone.name} seleccionada.`);
  await showOrderSummary(userId);
}

/**
 * Muestra el resumen de la orden y pide confirmación
 */
async function showOrderSummary(userId) {
  const session = getSession(userId);
  const summary = formatOrderSummary(session);

  const buttons = [
    {
      type: 'reply',
      reply: {
        id: 'confirm_yes',
        title: '✅ Sí, confirmar'
      }
    },
    {
      type: 'reply',
      reply: {
        id: 'confirm_no',
        title: '❌ No, cancelar'
      }
    }
  ];

  await sendButtonMessage(userId, summary, buttons);
}

/**
 * Maneja la confirmación de la orden
 */
async function handleOrderConfirmation(userId, response) {
  const upperResponse = response.toUpperCase();

  if (response === 'confirm_yes' || upperResponse.includes('SI') || upperResponse.includes('SÍ')) {
    await processOrder(userId);
    return;
  }

  if (response === 'confirm_no' || upperResponse.includes('NO')) {
    await sendTextMessage(
      userId,
      '❌ Orden cancelada. Si quieres hacer un nuevo pedido, escribe MENÚ.'
    );
    clearSession(userId);
    return;
  }

  await sendTextMessage(userId, 'Por favor responde SÍ para confirmar o NO para cancelar.');
}

/**
 * Procesa y guarda la orden
 */
async function processOrder(userId) {
  try {
    const session = getSession(userId);
    const { subtotal, total } = calculateTotal(session.cart, session.deliveryFee);

    const orderData = {
      phone: userId,
      userName: session.userName,
      restaurant: session.restaurant,
      items: session.cart,
      subtotal: subtotal,
      deliveryFee: session.deliveryFee,
      total: total,
      address: session.currentAddress,
      deliveryZone: session.deliveryZone
    };

    const savedOrder = await saveOrder(orderData);

    await sendTextMessage(
      userId,
      `🎉 ¡Orden confirmada exitosamente!\n\n` +
      `📝 *Número de orden:* ${savedOrder.id}\n` +
      `💰 *Total:* ${formatCurrency(total)}\n\n` +
      `Tu orden ha sido registrada con status: *Pendiente de pago*\n\n` +
      `En breve recibirás el link de pago. 💳\n\n` +
      `¡Gracias por tu preferencia! 😊🍽️`
    );

    // Limpiar sesión
    clearSession(userId);

  } catch (error) {
    console.error('❌ Error procesando orden:', error);
    await sendTextMessage(
      userId,
      '❌ Hubo un error procesando tu orden. Por favor intenta de nuevo o contacta soporte.'
    );
  }
}

/**
 * Maneja el keyword MENU
 */
async function handleMenuKeyword(userId) {
  const session = getSession(userId);

  if (session.userName) {
    await sendTextMessage(userId, `Hola de nuevo, ${session.userName}! 👋`);
    await sendRestaurantList(userId);
  } else {
    clearSession(userId);
    await sendWelcome(userId);
  }
}

/**
 * Maneja el keyword CARRITO
 */
async function handleCartKeyword(userId) {
  const session = getSession(userId);

  if (!session.cart || session.cart.length === 0) {
    await sendTextMessage(userId, '🛒 Tu carrito está vacío.\n\nEscribe MENÚ para comenzar a ordenar.');
    return;
  }

  await showCart(userId);
}

/**
 * Maneja el keyword CANCELAR
 */
async function handleCancelKeyword(userId) {
  clearSession(userId);
  await sendTextMessage(
    userId,
    '❌ Sesión cancelada. Todos los datos han sido borrados.\n\nEscribe MENÚ cuando quieras ordenar de nuevo. 😊'
  );
}

/**
 * Maneja el keyword AYUDA
 */
async function handleHelpKeyword(userId) {
  const helpMessage = `🤖 *Comandos disponibles:*\n\n` +
    `📋 *MENÚ* - Ver lista de restaurantes\n` +
    `🛒 *CARRITO* - Ver tu carrito actual\n` +
    `❌ *CANCELAR* - Cancelar orden y limpiar sesión\n` +
    `❓ *AYUDA* - Mostrar este mensaje\n\n` +
    `¿En qué puedo ayudarte? 😊`;

  await sendTextMessage(userId, helpMessage);
}

module.exports = {
  handleMessage
};
