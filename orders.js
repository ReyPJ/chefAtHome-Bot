// Gestión de órdenes - PostgreSQL
const { query, transaction } = require('./database');

/**
 * Genera un ID único para la orden basado en timestamp
 * @returns {string} ID único
 */
function generateOrderId() {
  return `ORD-${Date.now()}`;
}

/**
 * Crea o actualiza un usuario en la base de datos (UPSERT)
 * @param {string} phone - Número de teléfono
 * @param {string} name - Nombre del usuario
 * @param {boolean} isFrequent - Si es cliente frecuente
 * @returns {object} Usuario creado/actualizado
 */
async function createOrUpdateUser(phone, name, isFrequent = false) {
  try {
    const sql = `
      INSERT INTO users (phone, name, is_frequent_customer)
      VALUES ($1, $2, $3)
      ON CONFLICT (phone)
      DO UPDATE SET
        name = EXCLUDED.name,
        is_frequent_customer = EXCLUDED.is_frequent_customer OR users.is_frequent_customer,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await query(sql, [phone, name, isFrequent]);
    console.log(`✅ Usuario ${phone} creado/actualizado`);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error creando/actualizando usuario:', error);
    throw error;
  }
}

/**
 * Guarda una dirección para un usuario
 * @param {number} userId - ID del usuario
 * @param {string} address - Dirección completa
 * @param {number} zone - Zona de entrega (1, 2, 3)
 * @param {boolean} isDefault - Si es la dirección por defecto
 * @returns {object} Dirección guardada
 */
async function saveAddress(userId, address, zone, isDefault = false) {
  try {
    return await transaction(async (client) => {
      // Si es default, quitar default de otras direcciones
      if (isDefault) {
        await client.query(
          'UPDATE addresses SET is_default = false WHERE user_id = $1',
          [userId]
        );
      }

      // Insertar nueva dirección
      const sql = `
        INSERT INTO addresses (user_id, address, delivery_zone, is_default)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await client.query(sql, [userId, address, zone, isDefault]);
      console.log(`✅ Dirección guardada para usuario ${userId}`);
      return result.rows[0];
    });
  } catch (error) {
    console.error('❌ Error guardando dirección:', error);
    throw error;
  }
}

/**
 * Obtiene la dirección por defecto de un usuario
 * @param {number} userId - ID del usuario
 * @returns {object|null} Dirección o null
 */
async function getDefaultAddress(userId) {
  try {
    const sql = `
      SELECT * FROM addresses
      WHERE user_id = $1 AND is_default = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await query(sql, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error obteniendo dirección por defecto:', error);
    return null;
  }
}

/**
 * Guarda una nueva orden en la base de datos
 * @param {object} orderData - Datos de la orden
 * @returns {object} Orden guardada con ID
 */
async function saveOrder(orderData) {
  try {
    return await transaction(async (client) => {
      // 1. Crear o actualizar usuario
      const userSql = `
        INSERT INTO users (phone, name, is_frequent_customer)
        VALUES ($1, $2, false)
        ON CONFLICT (phone)
        DO UPDATE SET
          name = EXCLUDED.name,
          updated_at = NOW()
        RETURNING *
      `;

      const userResult = await client.query(userSql, [
        orderData.phone,
        orderData.userName
      ]);
      const user = userResult.rows[0];

      // 2. Guardar dirección si no existe una igual
      const checkAddressSql = `
        SELECT id FROM addresses
        WHERE user_id = $1 AND address = $2
        LIMIT 1
      `;

      const existingAddress = await client.query(checkAddressSql, [
        user.id,
        orderData.address
      ]);

      if (existingAddress.rows.length === 0) {
        // Contar direcciones del usuario
        const countResult = await client.query(
          'SELECT COUNT(*) as count FROM addresses WHERE user_id = $1',
          [user.id]
        );
        const isFirstAddress = parseInt(countResult.rows[0].count) === 0;

        const addressSql = `
          INSERT INTO addresses (user_id, address, delivery_zone, is_default)
          VALUES ($1, $2, $3, $4)
        `;

        await client.query(addressSql, [
          user.id,
          orderData.address,
          orderData.deliveryZone,
          isFirstAddress
        ]);

        console.log(`✅ Nueva dirección guardada para usuario ${user.id}`);
      }

      // 3. Crear la orden
      const orderId = generateOrderId();

      const orderSql = `
        INSERT INTO orders (
          order_number,
          user_id,
          phone,
          user_name,
          restaurant_id,
          restaurant_name,
          items,
          subtotal,
          delivery_fee,
          total,
          address,
          delivery_zone,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const orderResult = await client.query(orderSql, [
        orderId,
        user.id,
        orderData.phone,
        orderData.userName,
        orderData.restaurant.id,
        orderData.restaurant.name,
        JSON.stringify(orderData.items),
        orderData.subtotal,
        orderData.deliveryFee,
        orderData.total,
        orderData.address,
        orderData.deliveryZone,
        'pending_payment'
      ]);

      const newOrder = orderResult.rows[0];

      // Formatear para compatibilidad con código existente
      const formattedOrder = {
        id: newOrder.order_number,
        phone: newOrder.phone,
        userName: newOrder.user_name,
        restaurant: {
          id: newOrder.restaurant_id,
          name: newOrder.restaurant_name
        },
        items: newOrder.items,
        subtotal: parseFloat(newOrder.subtotal),
        deliveryFee: parseFloat(newOrder.delivery_fee),
        total: parseFloat(newOrder.total),
        address: newOrder.address,
        deliveryZone: newOrder.delivery_zone,
        status: newOrder.status,
        createdAt: newOrder.created_at.toISOString()
      };

      console.log(`✅ Orden ${orderId} guardada exitosamente en PostgreSQL`);
      return formattedOrder;
    });
  } catch (error) {
    console.error('❌ Error guardando orden en PostgreSQL:', error);
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
    const sql = `
      SELECT * FROM orders
      WHERE phone = $1
      ORDER BY created_at DESC
    `;

    const result = await query(sql, [phone]);

    return result.rows.map(order => ({
      id: order.order_number,
      phone: order.phone,
      userName: order.user_name,
      restaurant: {
        id: order.restaurant_id,
        name: order.restaurant_name
      },
      items: order.items,
      subtotal: parseFloat(order.subtotal),
      deliveryFee: parseFloat(order.delivery_fee),
      total: parseFloat(order.total),
      address: order.address,
      deliveryZone: order.delivery_zone,
      status: order.status,
      createdAt: order.created_at.toISOString(),
      updatedAt: order.updated_at ? order.updated_at.toISOString() : null
    }));
  } catch (error) {
    console.error('❌ Error obteniendo órdenes por teléfono:', error);
    return [];
  }
}

/**
 * Obtiene una orden por su ID
 * @param {string} orderId - ID de la orden (order_number)
 * @returns {object|null} Orden encontrada o null
 */
async function getOrderById(orderId) {
  try {
    const sql = `
      SELECT * FROM orders
      WHERE order_number = $1
      LIMIT 1
    `;

    const result = await query(sql, [orderId]);

    if (result.rows.length === 0) {
      return null;
    }

    const order = result.rows[0];

    return {
      id: order.order_number,
      phone: order.phone,
      userName: order.user_name,
      restaurant: {
        id: order.restaurant_id,
        name: order.restaurant_name
      },
      items: order.items,
      subtotal: parseFloat(order.subtotal),
      deliveryFee: parseFloat(order.delivery_fee),
      total: parseFloat(order.total),
      address: order.address,
      deliveryZone: order.delivery_zone,
      status: order.status,
      createdAt: order.created_at.toISOString(),
      updatedAt: order.updated_at ? order.updated_at.toISOString() : null
    };
  } catch (error) {
    console.error('❌ Error obteniendo orden por ID:', error);
    return null;
  }
}

/**
 * Actualiza el status de una orden
 * @param {string} orderId - ID de la orden (order_number)
 * @param {string} newStatus - Nuevo status
 * @returns {boolean} True si se actualizó exitosamente
 */
async function updateOrderStatus(orderId, newStatus) {
  try {
    const validStatuses = [
      'pending_payment',
      'paid',
      'preparing',
      'in_delivery',
      'delivered',
      'cancelled'
    ];

    if (!validStatuses.includes(newStatus)) {
      console.error(`❌ Status inválido: ${newStatus}`);
      return false;
    }

    const sql = `
      UPDATE orders
      SET status = $1, updated_at = NOW()
      WHERE order_number = $2
      RETURNING *
    `;

    const result = await query(sql, [newStatus, orderId]);

    if (result.rows.length === 0) {
      console.log(`⚠️  Orden ${orderId} no encontrada`);
      return false;
    }

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
    // Primero buscar en tabla de direcciones
    const userSql = `
      SELECT id FROM users WHERE phone = $1 LIMIT 1
    `;
    const userResult = await query(userSql, [phone]);

    if (userResult.rows.length === 0) {
      return null;
    }

    const userId = userResult.rows[0].id;

    // Buscar dirección por defecto
    const addressSql = `
      SELECT address FROM addresses
      WHERE user_id = $1 AND is_default = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const addressResult = await query(addressSql, [userId]);

    if (addressResult.rows.length > 0) {
      return addressResult.rows[0].address;
    }

    // Si no hay dirección por defecto, buscar la más reciente
    const recentAddressSql = `
      SELECT address FROM addresses
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const recentResult = await query(recentAddressSql, [userId]);

    if (recentResult.rows.length > 0) {
      return recentResult.rows[0].address;
    }

    // Fallback: buscar en órdenes anteriores
    const orderSql = `
      SELECT address FROM orders
      WHERE phone = $1 AND LOWER(user_name) = LOWER($2)
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const orderResult = await query(orderSql, [phone, userName]);

    if (orderResult.rows.length > 0) {
      return orderResult.rows[0].address;
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
    const sql = `SELECT * FROM get_order_stats()`;
    const result = await query(sql);

    if (result.rows.length === 0) {
      return {
        totalOrders: 0,
        pendingPayment: 0,
        paid: 0,
        preparing: 0,
        delivered: 0,
        cancelled: 0,
        needsSupport: 0
      };
    }

    const stats = result.rows[0];

    return {
      totalOrders: parseInt(stats.total_orders) || 0,
      pendingPayment: parseInt(stats.pending_payment) || 0,
      paid: parseInt(stats.paid) || 0,
      preparing: parseInt(stats.preparing) || 0,
      inDelivery: parseInt(stats.in_delivery) || 0,
      delivered: parseInt(stats.delivered) || 0,
      cancelled: parseInt(stats.cancelled) || 0,
      needsSupport: parseInt(stats.needs_support) || 0
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return null;
  }
}

/**
 * Marca una orden como que necesita soporte humano
 * @param {string} orderId - ID de la orden (order_number)
 * @param {string} reason - Razón o contexto
 * @returns {boolean} True si se marcó exitosamente
 */
async function markOrderNeedsHuman(orderId, reason) {
  try {
    const sql = `
      UPDATE orders
      SET
        needs_human_support = true,
        human_support_reason = $1,
        human_support_requested_at = NOW(),
        updated_at = NOW()
      WHERE order_number = $2
      RETURNING *
    `;

    const result = await query(sql, [reason, orderId]);

    if (result.rows.length === 0) {
      console.log(`⚠️  Orden ${orderId} no encontrada para marcar soporte humano`);
      return false;
    }

    console.log(`✅ Orden ${orderId} marcada para soporte humano`);
    return true;
  } catch (error) {
    console.error('❌ Error marcando orden para soporte humano:', error);
    return false;
  }
}

/**
 * Obtiene todas las órdenes que necesitan soporte humano
 * @returns {array} Array de órdenes que necesitan soporte
 */
async function getOrdersNeedingSupport() {
  try {
    const sql = `
      SELECT * FROM orders
      WHERE needs_human_support = true
        AND status NOT IN ('delivered', 'cancelled')
      ORDER BY human_support_requested_at DESC
    `;

    const result = await query(sql);

    return result.rows.map(order => ({
      id: order.order_number,
      phone: order.phone,
      userName: order.user_name,
      restaurant: {
        id: order.restaurant_id,
        name: order.restaurant_name
      },
      items: order.items,
      total: parseFloat(order.total),
      status: order.status,
      supportReason: order.human_support_reason,
      requestedAt: order.human_support_requested_at
        ? order.human_support_requested_at.toISOString()
        : null
    }));
  } catch (error) {
    console.error('❌ Error obteniendo órdenes que necesitan soporte:', error);
    return [];
  }
}

module.exports = {
  saveOrder,
  getOrdersByPhone,
  getOrderById,
  updateOrderStatus,
  findSavedAddress,
  getOrderStats,
  createOrUpdateUser,
  saveAddress,
  getDefaultAddress,
  markOrderNeedsHuman,
  getOrdersNeedingSupport
};
