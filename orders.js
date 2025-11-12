// Gestión de órdenes - Guardar y leer desde orders.json
const fs = require('fs').promises;
const path = require('path');

const ORDERS_FILE = path.join(__dirname, 'orders.json');

/**
 * Asegura que el archivo orders.json existe
 */
async function ensureOrdersFile() {
  try {
    await fs.access(ORDERS_FILE);
  } catch (error) {
    // El archivo no existe, crearlo con un array vacío
    await fs.writeFile(ORDERS_FILE, JSON.stringify([], null, 2));
    console.log('📁 Archivo orders.json creado');
  }
}

/**
 * Lee todas las órdenes del archivo
 * @returns {array} Array de órdenes
 */
async function readOrders() {
  try {
    await ensureOrdersFile();
    const data = await fs.readFile(ORDERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error leyendo orders.json:', error);
    return [];
  }
}

/**
 * Escribe órdenes al archivo
 * @param {array} orders - Array de órdenes
 */
async function writeOrders(orders) {
  try {
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
    console.log('💾 Órdenes guardadas en orders.json');
  } catch (error) {
    console.error('❌ Error escribiendo orders.json:', error);
    throw error;
  }
}

/**
 * Genera un ID único para la orden basado en timestamp
 * @returns {string} ID único
 */
function generateOrderId() {
  return `ORD-${Date.now()}`;
}

/**
 * Guarda una nueva orden
 * @param {object} orderData - Datos de la orden
 * @returns {object} Orden guardada con ID
 */
async function saveOrder(orderData) {
  try {
    const orders = await readOrders();

    const newOrder = {
      id: generateOrderId(),
      phone: orderData.phone,
      userName: orderData.userName,
      restaurant: {
        id: orderData.restaurant.id,
        name: orderData.restaurant.name
      },
      items: orderData.items,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      total: orderData.total,
      address: orderData.address,
      deliveryZone: orderData.deliveryZone,
      status: 'pending_payment',
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    await writeOrders(orders);

    console.log(`✅ Orden ${newOrder.id} guardada exitosamente`);
    return newOrder;
  } catch (error) {
    console.error('❌ Error guardando orden:', error);
    throw error;
  }
}

/**
 * Obtiene todas las órdenes de un número de teléfono
 * @param {string} phone - Número de teléfono
 * @returns {array} Array de órdenes del usuario
 */
async function getOrdersByPhone(phone) {
  try {
    const orders = await readOrders();
    return orders.filter(order => order.phone === phone);
  } catch (error) {
    console.error('❌ Error obteniendo órdenes por teléfono:', error);
    return [];
  }
}

/**
 * Obtiene una orden por su ID
 * @param {string} orderId - ID de la orden
 * @returns {object|null} Orden encontrada o null
 */
async function getOrderById(orderId) {
  try {
    const orders = await readOrders();
    return orders.find(order => order.id === orderId) || null;
  } catch (error) {
    console.error('❌ Error obteniendo orden por ID:', error);
    return null;
  }
}

/**
 * Actualiza el status de una orden
 * @param {string} orderId - ID de la orden
 * @param {string} newStatus - Nuevo status
 * @returns {boolean} True si se actualizó exitosamente
 */
async function updateOrderStatus(orderId, newStatus) {
  try {
    const orders = await readOrders();
    const orderIndex = orders.findIndex(order => order.id === orderId);

    if (orderIndex === -1) {
      console.log(`⚠️  Orden ${orderId} no encontrada`);
      return false;
    }

    orders[orderIndex].status = newStatus;
    orders[orderIndex].updatedAt = new Date().toISOString();

    await writeOrders(orders);
    console.log(`✅ Status de orden ${orderId} actualizado a: ${newStatus}`);

    return true;
  } catch (error) {
    console.error('❌ Error actualizando status de orden:', error);
    return false;
  }
}

/**
 * Busca si un usuario tiene dirección guardada en órdenes anteriores
 * @param {string} phone - Número de teléfono
 * @param {string} userName - Nombre del usuario
 * @returns {string|null} Dirección guardada o null
 */
async function findSavedAddress(phone, userName) {
  try {
    const userOrders = await getOrdersByPhone(phone);

    if (userOrders.length === 0) {
      return null;
    }

    // Buscar órdenes del mismo nombre
    const matchingOrders = userOrders.filter(
      order => order.userName.toLowerCase() === userName.toLowerCase()
    );

    if (matchingOrders.length > 0) {
      // Retornar la dirección más reciente
      const latestOrder = matchingOrders.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )[0];

      return latestOrder.address;
    }

    return null;
  } catch (error) {
    console.error('❌ Error buscando dirección guardada:', error);
    return null;
  }
}

/**
 * Obtiene estadísticas de órdenes
 * @returns {object} Estadísticas
 */
async function getOrderStats() {
  try {
    const orders = await readOrders();

    return {
      totalOrders: orders.length,
      pendingPayment: orders.filter(o => o.status === 'pending_payment').length,
      paid: orders.filter(o => o.status === 'paid').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      delivered: orders.filter(o => o.status === 'delivered').length
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return null;
  }
}

module.exports = {
  saveOrder,
  getOrdersByPhone,
  getOrderById,
  updateOrderStatus,
  findSavedAddress,
  getOrderStats
};
